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

def run_inference(base64_image: str, conf_threshold: float = 0.25):
    """
    Decode base64 image, run YOLO, return best box: (class_id, confidence) or (None, 0.0).
    """
    try:
        # Strip data URL prefix if present
        if base64_image.startswith("data:image"):
            base64_image = base64_image.split(",", 1)[1].strip()
        raw = base64.b64decode(base64_image)
    except Exception as e:
        print(f"Base64 decoding error: {e}")
        return None, 0.0

    try:
        img_bytes = io.BytesIO(raw)
        image = Image.open(img_bytes).convert("RGB")
        image = _tight_crop_foreground(image)
    except Exception as e:
        print(f"Image parsing error: {e}")
        return None, 0.0

    try:
        model = _get_model()
        tight = _tight_crop_foreground(image)
        sources = [tight]
        if tight.size != image.size:
            sources.append(image)
    except Exception as e:
        print(f"Inference prep error: {e}")
        return None, 0.0

    best_id, best_conf = None, 0.0
    try:
        for src in sources:
            results = model.predict(source=src, conf=conf_threshold, verbose=False)
            for r in results:
                if r.boxes is None:
                    continue
                for box in r.boxes:
                    conf = float(box.conf[0])
                    if conf > best_conf:
                        best_conf = conf
                        best_id = int(box.cls[0])
    except Exception as e:
        print(f"Inference error: {e}")
        return None, 0.0
                
    return best_id, best_conf
