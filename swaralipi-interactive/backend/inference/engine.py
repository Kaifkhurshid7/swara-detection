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

def run_inference(base64_image: str, conf_threshold: float = 0.45):
    """
    Decode base64 image, run YOLO, return list of detections: 
    [{"class_id": int, "confidence": float, "bbox": [x1, y1, x2, y2]}, ...]
    Detections are sorted by x-coordinate (musical flow).
    """
    try:
        # Strip data URL prefix if present
        if base64_image.startswith("data:image"):
            base64_image = base64_image.split(",", 1)[1].strip()
        raw = base64.b64decode(base64_image)
    except Exception as e:
        print(f"Base64 decoding error: {e}")
        return []

    try:
        img_bytes = io.BytesIO(raw)
        image = Image.open(img_bytes).convert("RGB")
        # For full-line detection, we might want to skip tight cropping or handle it carefully
        # For now, let's keep the image as is to preserve relative positions of multiple symbols
    except Exception as e:
        print(f"Image parsing error: {e}")
        return []

    detections = []
    try:
        model = _get_model()
        results = model.predict(source=image, conf=conf_threshold, verbose=False)
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                detections.append({
                    "class_id": cls,
                    "confidence": conf,
                    "bbox": xyxy
                })
    except Exception as e:
        print(f"Inference error: {e}")
        return []
                
    # Sort detections by x-coordinate (left to right) for musical flow
    detections.sort(key=lambda d: d["bbox"][0])
    return detections
