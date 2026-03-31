"""
YOLOv8 inference for a cropped image.
Supports both single-swara crops and full row / phrase crops.
"""
import base64
import io
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageOps
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

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "brain.pt"
DATASET_ROOT = Path(__file__).resolve().parents[3] / "swara_extracted" / "data"
_model = None
DEFAULT_CONFIDENCE = 0.15
DEFAULT_IMAGE_SIZE = 1536
SAME_SYMBOL_IOU_THRESHOLD = 0.85
SAME_SYMBOL_CENTER_THRESHOLD_PX = 5
TEMPLATE_SIZE = 64
MA_FAMILY = {6, 8, 11}
GA_DHA_FAMILY = {0, 1}
MIN_TEMPLATE_MARGIN = 0.08
MIN_TEMPLATE_CONFIDENCE = 0.84

try:
    RESAMPLE_LANCZOS = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE_LANCZOS = Image.LANCZOS

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

    left, top, right, bottom = bbox
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(image.width, right + margin)
    bottom = min(image.height, bottom + margin)
    return image.crop((left, top, right, bottom))


def _pad_to_square(image: Image.Image, background: int = 255) -> Image.Image:
    size = max(image.width, image.height)
    canvas = Image.new("L", (size, size), background)
    offset_x = (size - image.width) // 2
    offset_y = (size - image.height) // 2
    canvas.paste(image, (offset_x, offset_y))
    return canvas


def _symbol_feature_vector(image: Image.Image) -> np.ndarray:
    """Convert a cropped symbol into a compact normalized feature vector."""
    cropped = _tight_crop_foreground(image, margin=2).convert("L")
    square = _pad_to_square(cropped)
    resized = ImageOps.fit(square, (TEMPLATE_SIZE, TEMPLATE_SIZE), method=RESAMPLE_LANCZOS)
    arr = np.asarray(resized, dtype=np.float32)
    # Invert so foreground ink is high and background is low.
    arr = 255.0 - arr
    arr = arr / 255.0
    vec = arr.reshape(-1)
    norm = float(np.linalg.norm(vec))
    if norm > 0:
        vec = vec / norm
    return vec


@lru_cache(maxsize=1)
def _get_template_bank():
    """
    Build lightweight class prototypes from the bundled dataset.
    This gives the engine a second opinion when the detector confuses similar swaras.
    """
    image_dirs = [
        DATASET_ROOT / "images" / "train",
        DATASET_ROOT / "images" / "val",
    ]

    label_dirs = {
        "train": DATASET_ROOT / "labels" / "train",
        "val": DATASET_ROOT / "labels" / "val",
    }

    samples: dict[int, list[np.ndarray]] = {}

    for image_dir in image_dirs:
        split = image_dir.name
        label_dir = label_dirs.get(split)
        if not image_dir.exists() or label_dir is None or not label_dir.exists():
            continue

        for image_path in image_dir.glob("*.png"):
            label_path = label_dir / f"{image_path.stem}.txt"
            if not label_path.exists():
                continue

            try:
                label_line = label_path.read_text(encoding="utf-8").strip().splitlines()[0]
                class_id = int(label_line.split()[0])
                image = Image.open(image_path).convert("RGB")
                vec = _symbol_feature_vector(image)
            except Exception:
                continue

            samples.setdefault(class_id, []).append(vec)

    prototypes: dict[int, np.ndarray] = {}
    for class_id, vectors in samples.items():
        if not vectors:
            continue
        proto = np.mean(np.stack(vectors, axis=0), axis=0)
        norm = float(np.linalg.norm(proto))
        if norm > 0:
            proto = proto / norm
        prototypes[class_id] = proto

    return prototypes if prototypes else None


def _template_similarity_scores(image: Image.Image, prototypes: dict[int, np.ndarray]):
    if not prototypes:
        return []

    vec = _symbol_feature_vector(image)
    scores = []
    for class_id, proto in prototypes.items():
        score = float(np.dot(vec, proto))
        scores.append((class_id, score))

    scores.sort(key=lambda item: item[1], reverse=True)
    return scores


def _shape_features(image_pil: Image.Image):
    """
    Extract a few simple geometry cues that help separate Ma, Pa, and Tivra Ma.
    """
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    foreground = binary > 0
    coords = np.argwhere(foreground)
    if coords.size == 0:
        return {
            "has_foreground": False,
            "hole_count": 0,
            "left_density": 0.0,
            "top_density": 0.0,
            "accent_density": 0.0,
            "component_count": 0,
        }

    top, left = coords.min(axis=0)
    bottom, right = coords.max(axis=0) + 1
    cropped = binary[top:bottom, left:right]
    if cropped.size == 0:
        cropped = binary

    crop_h, crop_w = cropped.shape
    body_density = float(np.mean(cropped > 0))

    left_band = cropped[:, : max(1, int(crop_w * 0.28))]
    top_band = cropped[: max(1, int(crop_h * 0.25)), :]
    accent_band = cropped[: max(1, int(crop_h * 0.18)), :]

    left_density = float(np.mean(left_band > 0))
    top_density = float(np.mean(top_band > 0))
    accent_density = float(np.mean(accent_band > 0))

    contours, hierarchy = cv2.findContours(cropped, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    hole_count = 0
    if hierarchy is not None:
        for idx, contour_info in enumerate(hierarchy[0]):
            if contour_info[3] != -1:
                area = cv2.contourArea(contours[idx])
                if 10 < area < (cropped.size * 0.25):
                    hole_count += 1

    return {
        "has_foreground": True,
        "hole_count": hole_count,
        "left_density": left_density,
        "top_density": top_density,
        "accent_density": accent_density,
        "body_density": body_density,
        "component_count": len(contours),
    }


def _resolve_ma_family(model_class_id: int, image_pil: Image.Image, template_scores):
    """
    Decide between Ma, Pa, and Tivra Ma using both template similarity and shape cues.
    This path is intentionally conservative so Pa does not get promoted to Tivra Ma
    from a weak or noisy top mark.
    """
    scores = {class_id: score for class_id, score in template_scores}
    features = _shape_features(image_pil)

    ma_score = scores.get(6, 0.0)
    pa_score = scores.get(8, 0.0)
    tivra_score = scores.get(11, 0.0)

    # Tivra Ma should show a visible mark above the main body.
    accent_present = features["accent_density"] > 0.11 and features["top_density"] > 0.14
    if accent_present:
        tivra_score += 0.30
    else:
        tivra_score -= 0.12

    # If the template bank already leans hard toward one class, respect that.
    ranked = sorted(
        [(6, ma_score), (8, pa_score), (11, tivra_score)],
        key=lambda item: item[1],
        reverse=True,
    )

    best_id, best_score = ranked[0]
    second_score = ranked[1][1]
    if best_id == 11 and best_score - second_score >= 0.08 and (accent_present or features["hole_count"] > 0):
        return best_id

    if best_id in (6, 8) and best_score - second_score >= 0.04:
        return best_id

    if model_class_id == 11 and (accent_present or features["hole_count"] > 0):
        return 11

    if model_class_id in (6, 8):
        return model_class_id

    # In ambiguous cases, stay with the non-Tivra winner instead of inventing a sharp note.
    return 6 if ma_score >= pa_score else 8


def _choose_with_template_bank(model_class_id: int, image_pil: Image.Image, template_scores):
    if not template_scores:
        return model_class_id

    top_class, top_score = template_scores[0]
    second_score = template_scores[1][1] if len(template_scores) > 1 else -1.0

    if model_class_id in MA_FAMILY or top_class in MA_FAMILY:
        return _resolve_ma_family(model_class_id, image_pil, template_scores)

    if model_class_id in GA_DHA_FAMILY or top_class in GA_DHA_FAMILY:
        if top_score >= MIN_TEMPLATE_CONFIDENCE and (top_score - second_score) >= 0.05:
            return top_class

    # For the other confusable pairs, only override when the prototype bank is decisive.
    if top_score >= MIN_TEMPLATE_CONFIDENCE and (top_score - second_score) >= MIN_TEMPLATE_MARGIN:
        return top_class

    # If the model and template agree, keep it.
    if top_class == model_class_id:
        return model_class_id

    return model_class_id

def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Train ml_pipeline or copy best.pt here.")
        _model = YOLO(str(MODEL_PATH))
    return _model

import cv2

def _segment_wide_image(image_pil):
    """
    Split a wide crop into symbol-sized boxes using connected components.
    This is more stable than pure vertical projection for nearby swaras,
    upper/lower marks, and punctuation-like dashes.
    """
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)

    kernel = np.ones((2, 2), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    components = []
    img_h, img_w = binary.shape
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if area < 20 or w < 4 or h < 8:
            continue
        components.append((x, y, x + w, y + h))

    if not components:
        return []

    components.sort(key=lambda box: box[0])

    merged = []
    merge_gap = 8
    cur_left, cur_top, cur_right, cur_bottom = components[0]
    for left, top, right, bottom in components[1:]:
        if left <= cur_right + merge_gap:
            cur_left = min(cur_left, left)
            cur_top = min(cur_top, top)
            cur_right = max(cur_right, right)
            cur_bottom = max(cur_bottom, bottom)
        else:
            merged.append((cur_left, cur_top, cur_right, cur_bottom))
            cur_left, cur_top, cur_right, cur_bottom = left, top, right, bottom
    merged.append((cur_left, cur_top, cur_right, cur_bottom))

    final_segments = []
    for left, top, right, bottom in merged:
        width = right - left
        height = bottom - top
        if width < 10 or height < 12:
            continue

        # Ignore long flat dash-like marks that are not swaras.
        if height < img_h * 0.18 and width > height * 1.8:
            continue

        margin_x = 10
        margin_y = 8
        left = max(0, left - margin_x)
        top = max(0, top - margin_y)
        right = min(img_w, right + margin_x)
        bottom = min(img_h, bottom + margin_y)
        final_segments.append((left, top, right, bottom))

    return final_segments


def _crop_bbox_with_margin(image: Image.Image, bbox, margin: int = 4) -> Image.Image:
    left, top, right, bottom = bbox
    left = max(0, int(left) - margin)
    top = max(0, int(top) - margin)
    right = min(image.width, int(right) + margin)
    bottom = min(image.height, int(bottom) + margin)
    if right <= left or bottom <= top:
        return image
    return image.crop((left, top, right, bottom))


def _filter_duplicate_detections(detections):
    if not detections:
        return []

    kept = []
    for det in sorted(detections, key=lambda d: d["confidence"], reverse=True):
        left, top, right, bottom = det["bbox"]
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2
        duplicate = False
        for existing in kept:
            ex_left, ex_top, ex_right, ex_bottom = existing["bbox"]
            ex_center_x = (ex_left + ex_right) / 2
            ex_center_y = (ex_top + ex_bottom) / 2

            inter_left = max(left, ex_left)
            inter_top = max(top, ex_top)
            inter_right = min(right, ex_right)
            inter_bottom = min(bottom, ex_bottom)
            inter_w = max(0, inter_right - inter_left)
            inter_h = max(0, inter_bottom - inter_top)
            inter_area = inter_w * inter_h
            area = max(1, (right - left) * (bottom - top))
            ex_area = max(1, (ex_right - ex_left) * (ex_bottom - ex_top))
            iou = inter_area / float(area + ex_area - inter_area)

            if iou > SAME_SYMBOL_IOU_THRESHOLD:
                duplicate = True
                break
            if abs(center_x - ex_center_x) <= SAME_SYMBOL_CENTER_THRESHOLD_PX and abs(center_y - ex_center_y) <= SAME_SYMBOL_CENTER_THRESHOLD_PX:
                duplicate = True
                break

        if not duplicate:
            kept.append(det)

    kept.sort(key=lambda d: d["bbox"][0])
    return kept

def _is_pa_physically(image_pil):
    """
    Advanced physical check for Pa (प) vs Ma (म).
    Uses 'Hole Detection' (contours) to find the characteristic loop of Ma.
    """
    # Use higher contrast for reliable contouring
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
    
    h, w = binary.shape
    # Focus on the left 60% of the symbol where the loop resides
    left_half = binary[:, :int(w*0.6)]
    
    # 1. HOLE DETECTION: Ma (म) has a closed loop/circle on the left
    # findContours with RETR_TREE allows us to find internal 'holes'
    contours, hierarchy = cv2.findContours(left_half, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    has_hole = False
    if hierarchy is not None:
        # Hierarchy: [Next, Previous, First_Child, Parent]
        # An internal hole means a contour has a parent
        for i, h_info in enumerate(hierarchy[0]):
            parent_idx = h_info[3]
            if parent_idx != -1:
                # Potential hole found, check its size to avoid noise
                area = cv2.contourArea(contours[i])
                if 20 < area < (left_half.size * 0.2): # Realistic loop size
                    has_hole = True
                    break
                    
    if has_hole:
        return False # Definitely Ma (not Pa)
        
    # 2. DENSITY FALLBACK: If no hole, check if the left side is sparse (Pa)
    edge_roi = left_half[:, :int(left_half.shape[1]*0.3)]
    density = np.sum(edge_roi > 0) / edge_roi.size
    # Pa is very open on the left edge
    return density < 0.07

def run_inference(image_bytes: bytes, conf_threshold: float = 0.15):
    """
    Run YOLO on image bytes. Improved scale, confidence, and Ma/Pa differentiation.
    Handles surgical segmentation for row crops.
    """
    original_image = None
    try:
        img_bytes = io.BytesIO(image_bytes)
        original_image = Image.open(img_bytes).convert("RGB")
    except Exception as e:
        print(f"Image parsing error: {e}")
        return []

    # SOLUTION: If it's a wide row, use Surgical Segmentation
    is_wide_row = original_image.width > 2.0 * original_image.height
    
    if is_wide_row:
        segments = _segment_wide_image(original_image)
        # If no segments found, fallback to full image
        if not segments:
            is_wide_row = False
    
    all_detections = []
    model = _get_model()
    template_bank = _get_template_bank()

    if is_wide_row:
        # PROCESS EACH SEGMENT INDEPENDENTLY
        for s_left, s_top, s_right, s_bottom in segments:
            # Crop segment
            segment_img = original_image.crop((s_left, s_top, s_right, s_bottom))
            
            # Pad and Enhance segment for Ma/Pa differentiation
            padding = 24
            pad_img = Image.new("RGB", (segment_img.width + 2*padding, segment_img.height + 2*padding), (255, 255, 255))
            pad_img.paste(segment_img, (padding, padding))
            
            from PIL import ImageEnhance
            pad_img = ImageEnhance.Contrast(pad_img).enhance(1.25)
            pad_img = ImageEnhance.Sharpness(pad_img).enhance(2.0)

            # RESOLUTION INCREASE (1024) for maximum detail recognition
            results = model.predict(source=pad_img, conf=conf_threshold, imgsz=1024, verbose=False)
            
            segment_dets = []
            for r in results:
                if r.boxes is not None:
                    for box in r.boxes:
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        xyxy = box.xyxy[0].tolist()
                        
                        symbol_crop = _crop_bbox_with_margin(pad_img, xyxy, margin=2)
                        cls_id = _choose_with_template_bank(
                            cls_id,
                            symbol_crop,
                            _template_similarity_scores(symbol_crop, template_bank) if template_bank else [],
                        )
                        
                        segment_dets.append({
                            "class_id": cls_id,
                            "confidence": conf,
                            "bbox": [
                                xyxy[0] - padding + s_left,
                                xyxy[1] - padding + s_top,
                                xyxy[2] - padding + s_left,
                                xyxy[3] - padding + s_top
                            ]
                        })
            # Keep only the single BEST result for this segment to eliminate "random guesses"
            if segment_dets:
                best = max(segment_dets, key=lambda x: x["confidence"])
                all_detections.append(best)
    else:
        # FALLBACK: Full image inference (for single swara or short blocks)
        padding = 32
        pad_img = Image.new("RGB", (original_image.width + 2*padding, original_image.height + 2*padding), (255, 255, 255))
        pad_img.paste(original_image, (padding, padding))
        
        from PIL import ImageEnhance
        pad_img = ImageEnhance.Contrast(pad_img).enhance(1.2)
        pad_img = ImageEnhance.Sharpness(pad_img).enhance(1.2)
        
        results = model.predict(source=pad_img, conf=conf_threshold, imgsz=640, verbose=False)
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    xyxy = box.xyxy[0].tolist()

                    symbol_crop = _crop_bbox_with_margin(pad_img, xyxy, margin=2)
                    cls_id = _choose_with_template_bank(
                        cls_id,
                        symbol_crop,
                        _template_similarity_scores(symbol_crop, template_bank) if template_bank else [],
                    )
                            
                    all_detections.append({
                        "class_id": cls_id,
                        "confidence": conf,
                        "bbox": [
                            xyxy[0] - padding,
                            xyxy[1] - padding,
                            xyxy[2] - padding,
                            xyxy[3] - padding
                        ]
                    })
    
    # Keep the detector honest. The UI can still render confidence as a percentage.
    for det in all_detections:
        det["confidence"] = round(max(0.0, min(0.99, det["confidence"])), 4)

    all_detections = _filter_duplicate_detections(all_detections)

    # Detect vertical bars (vibhag)
    results_final = []
    for det in all_detections:
        bbox = det["bbox"]
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        # Vertical bar detection
        if h > w * 2.5 and w < 0.25 * h:
            results_final.append({
                "class_id": -1,
                "label": "taal vibhag",
                "confidence": 0.99,
                "bbox": bbox
            })
        else:
            results_final.append(det)
                
    # Final Sort: Left-to-right musical flow
    results_final.sort(key=lambda d: d["bbox"][0])
    return results_final

