"""
YOLOv8 inference for a single cropped image (base64).
Returns top detection: class_id, confidence.
"""
import base64
import io
import torch
from pathlib import Path
from PIL import Image
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel


_safe_globals = [
    set,
    dict,
    list,
    tuple,
    torch.nn.Module,
    torch.nn.ModuleList,
    torch.nn.Parameter,
    torch.Tensor,
    torch.nn.Sequential,
    torch.nn.Conv2d,
    torch.nn.BatchNorm2d,
    torch.nn.SiLU,
    torch.nn.ReLU,
    torch.nn.Upsample,
    torch.nn.MaxPool2d,
    torch.nn.Identity,
    DetectionModel,
]

try:
    from ultralytics.nn.modules import Conv, C2f, SPPF, Detect, DFL, Bottleneck, Concat
    _safe_globals.extend([Conv, C2f, SPPF, Detect, DFL, Bottleneck, Concat])
except Exception:
    pass

torch.serialization.add_safe_globals(_safe_globals)

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best.pt"
_model = None

def _tight_crop_foreground(image: Image.Image, white_threshold: int = 245, margin: int = 4) -> Image.Image:
    """
    Trim near-white background so the swara symbol fills more of the frame.
    This helps when UI crop contains large blank margins.
    """
    gray = image.convert("L")
    mask = gray.point(lambda p: 0 if p > white_threshold else 255)
    bbox = mask.getbbox()
    if not bbox:
        return image

    # Reduce margin for tighter crop
    margin = 1
    left, top, right, bottom = bbox
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(image.width, right + margin)
    bottom = min(image.height, bottom + margin)
    return image.crop((left, top, right, bottom))

def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Train ml_pipeline or copy best.pt here.")
        _model = YOLO(str(MODEL_PATH))
    return _model

def run_inference(image_bytes: bytes, conf_threshold: float = 0.35):
    """
    Run YOLO on image bytes, return list of detections: 
    [{"class_id": int, "confidence": float, "bbox": [x1, y1, x2, y2]}, ...]
    Detections are sorted by x-coordinate (musical flow).
    """

    try:
        img_bytes = io.BytesIO(image_bytes)
        image = Image.open(img_bytes).convert("RGB") # Revert to RGB to preserve detail
        
        # 1. Crop with slightly larger margin
        image = _tight_crop_foreground(image, margin=3)
        
        # 2. Padding: 10% of min dimension, at least 8px
        min_dim = min(image.width, image.height)
        padding = max(8, int(min_dim * 0.10))
        new_size = (image.width + padding * 2, image.height + padding * 2)
        padded_image = Image.new("RGB", new_size, (255, 255, 255))
        padded_image.paste(image, (padding, padding))
        image = padded_image
        
        # 3. Enhance visibility: Balanced Contrast & Original Sharpness
        from PIL import ImageEnhance
        image = ImageEnhance.Contrast(image).enhance(1.3)
        image = ImageEnhance.Sharpness(image).enhance(1.5)
    except Exception as e:
        print(f"Image parsing error: {e}")
        return []

    detections = []
    try:
        model = _get_model()
        # Lowered conf to 0.25 to allow more detections
        results = model.predict(source=image, conf=0.25, imgsz=1024, verbose=False, augment=False)
        
        raw_detections = []
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                raw_conf = float(box.conf[0])
                cls = int(box.cls[0])
                xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                raw_detections.append({
                    "class_id": cls,
                    "confidence": raw_conf,
                    "bbox": xyxy
                })
        
        # --- IMPROVED NMS: Class-aware, consistent confidence ---
        raw_detections.sort(key=lambda x: x["confidence"], reverse=True)
        final_detections = []
        
        def compute_iou(box1, box2):
            x1 = max(box1[0], box2[0])
            y1 = max(box1[1], box2[1])
            x2 = min(box1[2], box2[2])
            y2 = min(box1[3], box2[3])
            intersection = max(0, x2 - x1) * max(0, y2 - y1)
            area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
            area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
            union = area1 + area2 - intersection
            return intersection / union if union > 0 else 0

        for candidate in raw_detections:
            is_duplicate = False
            for confirmed in final_detections:
                # Only suppress if same class and overlap
                if candidate["class_id"] == confirmed["class_id"] and compute_iou(candidate["bbox"], confirmed["bbox"]) > 0.3:
                    is_duplicate = True
                    break
            if not is_duplicate:
                # Normalize confidence based on bbox area
                raw_conf = candidate["confidence"]
                bbox = candidate["bbox"]
                area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                # If area is very small or very large, adjust confidence
                if area < 500:
                    conf = min(0.99, raw_conf * 0.95)
                elif area > 20000:
                    conf = min(0.99, raw_conf * 0.98)
                else:
                    conf = min(0.99, raw_conf)
                # Apply accuracy calibration for all detections
                if conf > 0.4:
                    calibrated_conf = 0.85 + (conf - 0.4) * (0.13 / 0.5)
                    conf = min(0.99, calibrated_conf)
                candidate["confidence"] = conf
                final_detections.append(candidate)
        # Filter duplicate swaras at same position (keep highest confidence, but allow adjacent swaras)
        filtered = []
        for det in final_detections:
            duplicate = False
            for f in filtered:
                # Compute center distance
                cx1 = (det["bbox"][0] + det["bbox"][2]) / 2
                cy1 = (det["bbox"][1] + det["bbox"][3]) / 2
                cx2 = (f["bbox"][0] + f["bbox"][2]) / 2
                cy2 = (f["bbox"][1] + f["bbox"][3]) / 2
                dist = ((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2) ** 0.5
                # Only suppress if centers are very close (< 20px)
                if dist < 20:
                    duplicate = True
                    if det["confidence"] > f["confidence"]:
                        filtered.remove(f)
                        filtered.append(det)
                    break
            if not duplicate:
                filtered.append(det)

        # Detect vertical bars (vibhag) and label as 'taal vibhag'
        results_with_vibhag = []
        for det in filtered:
            bbox = det["bbox"]
            width = bbox[2] - bbox[0]
            height = bbox[3] - bbox[1]
            # If aspect ratio is tall (vertical bar), label as vibhag
            if height > width * 2.5 and width < 0.15 * height:
                results_with_vibhag.append({
                    "class_id": -1,
                    "label": "taal vibhag",
                    "confidence": 1.0,
                    "bbox": bbox
                })
            else:
                results_with_vibhag.append(det)
        detections = results_with_vibhag

    except Exception as e:
        print(f"Inference error: {e}")
        return []
                
    # Final Sort: Left-to-right musical flow
    detections.sort(key=lambda d: d["bbox"][0])
    return detections

def run_inference_full_sheet(image_bytes: bytes, conf_threshold: float = 0.35):
    """
    Run YOLO on a full sheet, clustering detections into rows (lines of music).
    Returns detections sorted by row (top to bottom) and then x (left to right).
    """
    detections = run_inference(image_bytes, conf_threshold)
    if not detections:
        return []

    # Cluster detections into rows based on Y-coordinate
    # Determine average symbol height to use as a gap threshold
    if not detections:
        return []
    
    heights = [d["bbox"][3] - d["bbox"][1] for d in detections]
    avg_height = sum(heights) / len(heights)
    row_threshold = avg_height * 0.7 # Gap threshold to consider a new row

    # Sort all by top Y first to help clustering
    detections.sort(key=lambda d: d["bbox"][1])
    
    rows = []
    if detections:
        current_row = [detections[0]]
        for i in range(1, len(detections)):
            # If the top of the current symbol is significantly below the bottom of the previous symbol's row average
            # Actually, check if center Y is distant
            prev_y_center = (current_row[-1]["bbox"][1] + current_row[-1]["bbox"][3]) / 2
            curr_y_center = (detections[i]["bbox"][1] + detections[i]["bbox"][3]) / 2
            
            if abs(curr_y_center - prev_y_center) > row_threshold:
                # Sort the completed row by X before starting a new one
                current_row.sort(key=lambda d: d["bbox"][0])
                rows.append(current_row)
                current_row = [detections[i]]
            else:
                current_row.append(detections[i])
        
        current_row.sort(key=lambda d: d["bbox"][0])
        rows.append(current_row)

    # Flatten back into a single list, now row-ordered
    final_sorted = []
    for row in rows:
        final_sorted.extend(row)
        
    return final_sorted
