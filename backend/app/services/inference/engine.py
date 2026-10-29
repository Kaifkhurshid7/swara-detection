"""
Swara Detection Engine — YOLOv8 Inference with Multi-Stage Refinement

This module is the core ML inference pipeline. It takes raw image bytes
and returns a list of detected swaras with confidence scores and bounding boxes.

Detection Pipeline (5 stages):
  1. Image Segmentation — Wide rows are split into individual symbol regions
  2. YOLOv8 Prediction — Object detection on each segment
  3. Template Bank Refinement — Cosine similarity against class prototypes
  4. Shape Feature Analysis — Geometric cues for Ma/Pa/Tivra Ma disambiguation
  5. Duplicate Filtering — IoU-based deduplication + left-to-right sorting

Key Design Decisions:
  - Template bank is built lazily and cached (LRU) to avoid repeated I/O
  - Wide images use higher resolution (1024px) for better detail recognition
  - Confidence is clamped to [0, 0.99] for honest uncertainty reporting
  - Vertical bars are detected geometrically as "Taal Vibhag" separators
"""

import io
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageEnhance, ImageOps
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel


# ─────────────────────────────────────────────────────────────
# PyTorch Safe Globals (required for model deserialization)
# ─────────────────────────────────────────────────────────────

_safe_globals = [
    set, dict, list, tuple,
    torch.nn.Module, torch.nn.ModuleList, torch.nn.Parameter,
    torch.Tensor, torch.nn.Sequential, torch.nn.Conv2d,
    torch.nn.BatchNorm2d, torch.nn.SiLU, torch.nn.ReLU,
    torch.nn.Upsample, torch.nn.MaxPool2d, torch.nn.Identity,
    DetectionModel,
]

try:
    from ultralytics.nn.modules import Conv, C2f, SPPF, Detect, DFL, Bottleneck, Concat
    _safe_globals.extend([Conv, C2f, SPPF, Detect, DFL, Bottleneck, Concat])
except Exception:
    pass

torch.serialization.add_safe_globals(_safe_globals)


# ─────────────────────────────────────────────────────────────
# Constants & Configuration
# ─────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).resolve().parents[3] / "models" / "brain.pt"
DATASET_ROOT = Path(__file__).resolve().parents[4] / "ml" / "data"

# Detection thresholds
DEFAULT_CONFIDENCE = 0.15
SAME_SYMBOL_IOU_THRESHOLD = 0.85
SAME_SYMBOL_CENTER_THRESHOLD_PX = 5

# Template matching parameters
TEMPLATE_SIZE = 64
MIN_TEMPLATE_MARGIN = 0.08
MIN_TEMPLATE_CONFIDENCE = 0.84

# Class families for disambiguation logic
MA_FAMILY = {6, 8, 11}      # Ma, Pa, Tivra Ma — visually similar
GA_DHA_FAMILY = {0, 1}      # Dha, Ga — can be confused

# Pillow resampling compatibility
try:
    RESAMPLE_LANCZOS = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE_LANCZOS = Image.LANCZOS

# Singleton model instance
_model = None


# ─────────────────────────────────────────────────────────────
# Model Loading
# ─────────────────────────────────────────────────────────────

def _get_model() -> YOLO:
    """Lazy-load the YOLOv8 model (singleton pattern to avoid repeated disk I/O)."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}. "
                "Train via ml/train.py or copy weights to backend/models/brain.pt."
            )
        _model = YOLO(str(MODEL_PATH))
    return _model


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def run_inference(image_bytes: bytes, conf_threshold: float = DEFAULT_CONFIDENCE) -> list[dict]:
    """
    Run the full detection pipeline on raw image bytes.

    Args:
        image_bytes: PNG image data as bytes.
        conf_threshold: Minimum confidence for YOLO detections.

    Returns:
        List of detection dicts, each containing:
          - class_id: int (-1 for taal vibhag, 0-11 for swaras)
          - confidence: float (0.0 to 0.99)
          - bbox: [left, top, right, bottom] in pixel coordinates

    The list is sorted left-to-right to preserve musical reading order.
    """
    # Parse image
    try:
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        print(f"[ERROR] Image parsing failed: {e}")
        return []

    # Determine processing strategy based on aspect ratio
    is_wide_row = original_image.width > 2.0 * original_image.height
    segments = []

    if is_wide_row:
        segments = _segment_wide_image(original_image)
        if not segments:
            is_wide_row = False  # Fallback to full-image inference

    # Run detection
    model = _get_model()
    template_bank = _get_template_bank()

    if is_wide_row:
        all_detections = _infer_segmented(original_image, segments, model, template_bank, conf_threshold)
    else:
        all_detections = _infer_full_image(original_image, model, template_bank, conf_threshold)

    # Post-processing: clamp confidence, deduplicate, detect vibhag
    for det in all_detections:
        det["confidence"] = round(max(0.0, min(0.99, det["confidence"])), 4)

    all_detections = _filter_duplicate_detections(all_detections)
    results = _detect_taal_vibhag(all_detections)

    # Sort left-to-right for musical reading order
    results.sort(key=lambda d: d["bbox"][0])
    return results


# ─────────────────────────────────────────────────────────────
# Inference Strategies
# ─────────────────────────────────────────────────────────────

def _infer_segmented(image, segments, model, template_bank, conf_threshold):
    """Process each segment independently — used for wide row crops."""
    all_detections = []

    for s_left, s_top, s_right, s_bottom in segments:
        segment_img = image.crop((s_left, s_top, s_right, s_bottom))

        # Pad and enhance for better feature extraction
        padding = 24
        pad_img = Image.new("RGB", (segment_img.width + 2 * padding, segment_img.height + 2 * padding), (255, 255, 255))
        pad_img.paste(segment_img, (padding, padding))
        pad_img = ImageEnhance.Contrast(pad_img).enhance(1.25)
        pad_img = ImageEnhance.Sharpness(pad_img).enhance(2.0)

        # Higher resolution for individual symbols
        results = model.predict(source=pad_img, conf=conf_threshold, imgsz=1024, verbose=False)

        segment_dets = []
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                xyxy = box.xyxy[0].tolist()

                symbol_crop = _crop_bbox_with_margin(pad_img, xyxy, margin=2)
                cls_id = _refine_with_template_bank(cls_id, symbol_crop, template_bank)

                segment_dets.append({
                    "class_id": cls_id,
                    "confidence": conf,
                    "bbox": [
                        xyxy[0] - padding + s_left,
                        xyxy[1] - padding + s_top,
                        xyxy[2] - padding + s_left,
                        xyxy[3] - padding + s_top,
                    ],
                })

        # Keep only the best detection per segment to avoid noise
        if segment_dets:
            best = max(segment_dets, key=lambda x: x["confidence"])
            all_detections.append(best)

    return all_detections


def _infer_full_image(image, model, template_bank, conf_threshold):
    """Process the entire image at once — used for single swaras or short blocks."""
    padding = 32
    pad_img = Image.new("RGB", (image.width + 2 * padding, image.height + 2 * padding), (255, 255, 255))
    pad_img.paste(image, (padding, padding))
    pad_img = ImageEnhance.Contrast(pad_img).enhance(1.2)
    pad_img = ImageEnhance.Sharpness(pad_img).enhance(1.2)

    results = model.predict(source=pad_img, conf=conf_threshold, imgsz=640, verbose=False)
    detections = []

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            xyxy = box.xyxy[0].tolist()

            symbol_crop = _crop_bbox_with_margin(pad_img, xyxy, margin=2)
            cls_id = _refine_with_template_bank(cls_id, symbol_crop, template_bank)

            detections.append({
                "class_id": cls_id,
                "confidence": conf,
                "bbox": [
                    xyxy[0] - padding,
                    xyxy[1] - padding,
                    xyxy[2] - padding,
                    xyxy[3] - padding,
                ],
            })

    return detections


# ─────────────────────────────────────────────────────────────
# Image Segmentation (Wide Row Processing)
# ─────────────────────────────────────────────────────────────

def _segment_wide_image(image_pil: Image.Image) -> list[tuple]:
    """
    Split a wide manuscript row into individual symbol bounding boxes
    using connected-component analysis.

    More robust than vertical projection for handling:
      - Nearby/touching swaras
      - Upper/lower diacritical marks
      - Punctuation-like dashes

    Returns list of (left, top, right, bottom) tuples.
    """
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)

    # Remove noise with morphological opening
    kernel = np.ones((2, 2), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    img_h, img_w = binary.shape

    # Extract bounding boxes, filtering tiny noise
    components = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if cv2.contourArea(contour) < 20 or w < 4 or h < 8:
            continue
        components.append((x, y, x + w, y + h))

    if not components:
        return []

    # Sort left-to-right and merge nearby components
    components.sort(key=lambda box: box[0])
    merged = _merge_nearby_boxes(components, gap=8)

    # Filter out non-swara elements (dashes, tiny marks)
    final_segments = []
    for left, top, right, bottom in merged:
        width, height = right - left, bottom - top
        if width < 10 or height < 12:
            continue
        # Skip long flat dashes that aren't swaras
        if height < img_h * 0.18 and width > height * 1.8:
            continue

        # Add margin for better detection
        margin_x, margin_y = 10, 8
        final_segments.append((
            max(0, left - margin_x),
            max(0, top - margin_y),
            min(img_w, right + margin_x),
            min(img_h, bottom + margin_y),
        ))

    return final_segments


def _merge_nearby_boxes(components: list[tuple], gap: int) -> list[tuple]:
    """Merge horizontally adjacent bounding boxes within `gap` pixels."""
    if not components:
        return []

    merged = []
    cur_left, cur_top, cur_right, cur_bottom = components[0]

    for left, top, right, bottom in components[1:]:
        if left <= cur_right + gap:
            cur_left = min(cur_left, left)
            cur_top = min(cur_top, top)
            cur_right = max(cur_right, right)
            cur_bottom = max(cur_bottom, bottom)
        else:
            merged.append((cur_left, cur_top, cur_right, cur_bottom))
            cur_left, cur_top, cur_right, cur_bottom = left, top, right, bottom

    merged.append((cur_left, cur_top, cur_right, cur_bottom))
    return merged


# ─────────────────────────────────────────────────────────────
# Template Bank — Prototype-Based Refinement
# ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_template_bank() -> dict[int, np.ndarray] | None:
    """
    Build class prototypes from the training dataset for disambiguation.

    Each prototype is the mean normalized feature vector of all training
    samples for that class. Used as a "second opinion" when the YOLO model
    confuses visually similar swaras (Ma/Pa/Tivra Ma, Ga/Dha).

    Returns None if the dataset directory is not available.
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
                img = Image.open(image_path).convert("RGB")
                vec = _symbol_feature_vector(img)
                samples.setdefault(class_id, []).append(vec)
            except Exception:
                continue

    # Compute mean prototype per class
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


def _refine_with_template_bank(model_class_id: int, image_pil: Image.Image, template_bank) -> int:
    """Apply template bank refinement to potentially correct the model's prediction."""
    if not template_bank:
        return model_class_id

    scores = _template_similarity_scores(image_pil, template_bank)
    if not scores:
        return model_class_id

    return _choose_with_template_bank(model_class_id, image_pil, scores)


# ─────────────────────────────────────────────────────────────
# Feature Extraction & Similarity
# ─────────────────────────────────────────────────────────────

def _symbol_feature_vector(image: Image.Image) -> np.ndarray:
    """
    Convert a cropped symbol into a compact normalized feature vector.
    Used for cosine similarity comparison against class prototypes.
    """
    cropped = _tight_crop_foreground(image, margin=2).convert("L")
    square = _pad_to_square(cropped)
    resized = ImageOps.fit(square, (TEMPLATE_SIZE, TEMPLATE_SIZE), method=RESAMPLE_LANCZOS)

    arr = np.asarray(resized, dtype=np.float32)
    arr = (255.0 - arr) / 255.0  # Invert: foreground=high, background=low
    vec = arr.reshape(-1)

    norm = float(np.linalg.norm(vec))
    return vec / norm if norm > 0 else vec


def _template_similarity_scores(image: Image.Image, prototypes: dict[int, np.ndarray]) -> list[tuple]:
    """Compute cosine similarity between a symbol and all class prototypes."""
    vec = _symbol_feature_vector(image)
    scores = [(class_id, float(np.dot(vec, proto))) for class_id, proto in prototypes.items()]
    scores.sort(key=lambda item: item[1], reverse=True)
    return scores


def _choose_with_template_bank(model_class_id: int, image_pil: Image.Image, template_scores: list[tuple]) -> int:
    """
    Decide final class using both model prediction and template similarity.
    Only overrides the model when the template bank is highly confident.
    """
    top_class, top_score = template_scores[0]
    second_score = template_scores[1][1] if len(template_scores) > 1 else -1.0

    # Ma/Pa/Tivra Ma require special shape-based disambiguation
    if model_class_id in MA_FAMILY or top_class in MA_FAMILY:
        return _resolve_ma_family(model_class_id, image_pil, template_scores)

    # Ga/Dha confusion — override only with strong template evidence
    if model_class_id in GA_DHA_FAMILY or top_class in GA_DHA_FAMILY:
        if top_score >= MIN_TEMPLATE_CONFIDENCE and (top_score - second_score) >= 0.05:
            return top_class

    # General case — override only when prototype bank is decisive
    if top_score >= MIN_TEMPLATE_CONFIDENCE and (top_score - second_score) >= MIN_TEMPLATE_MARGIN:
        return top_class

    return model_class_id


# ─────────────────────────────────────────────────────────────
# Ma/Pa/Tivra Ma Disambiguation (Shape Analysis)
# ─────────────────────────────────────────────────────────────

def _resolve_ma_family(model_class_id: int, image_pil: Image.Image, template_scores: list[tuple]) -> int:
    """
    Resolve the Ma/Pa/Tivra Ma confusion using template + shape cues.

    Key visual differences:
      - Ma (म): Has a closed loop on the left side
      - Pa (प): Open on the left, no loop
      - Tivra Ma (म॑): Same as Ma but with a visible accent mark above

    Strategy is intentionally conservative — Pa should never be promoted
    to Tivra Ma from a weak or noisy top mark.
    """
    scores = {class_id: score for class_id, score in template_scores}
    features = _extract_shape_features(image_pil)

    ma_score = scores.get(6, 0.0)
    pa_score = scores.get(8, 0.0)
    tivra_score = scores.get(11, 0.0)

    # Tivra Ma requires a visible accent mark above the main body
    accent_present = features["accent_density"] > 0.11 and features["top_density"] > 0.14
    tivra_score += 0.30 if accent_present else -0.12

    # Rank candidates
    ranked = sorted(
        [(6, ma_score), (8, pa_score), (11, tivra_score)],
        key=lambda item: item[1],
        reverse=True,
    )
    best_id, best_score = ranked[0]
    second_score = ranked[1][1]

    # Strong Tivra Ma evidence
    if best_id == 11 and best_score - second_score >= 0.08:
        if accent_present or features["hole_count"] > 0:
            return 11

    # Clear Ma or Pa winner
    if best_id in (6, 8) and best_score - second_score >= 0.04:
        return best_id

    # Fallback: trust the model if it's in the Ma family
    if model_class_id == 11 and (accent_present or features["hole_count"] > 0):
        return 11
    if model_class_id in (6, 8):
        return model_class_id

    # Ambiguous — default to non-Tivra
    return 6 if ma_score >= pa_score else 8


def _extract_shape_features(image_pil: Image.Image) -> dict:
    """
    Extract geometric features that distinguish Ma, Pa, and Tivra Ma.

    Features computed:
      - hole_count: Number of enclosed loops (Ma has one, Pa doesn't)
      - left_density: Ink density in the left 28% (Ma is denser)
      - top_density: Ink density in the top 25%
      - accent_density: Ink density in the top 18% (Tivra Ma accent)
    """
    gray = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    foreground = binary > 0
    coords = np.argwhere(foreground)

    if coords.size == 0:
        return {"has_foreground": False, "hole_count": 0, "left_density": 0.0,
                "top_density": 0.0, "accent_density": 0.0, "component_count": 0}

    # Tight crop to foreground
    top, left = coords.min(axis=0)
    bottom, right = coords.max(axis=0) + 1
    cropped = binary[top:bottom, left:right]
    if cropped.size == 0:
        cropped = binary

    crop_h, crop_w = cropped.shape

    # Regional density measurements
    left_band = cropped[:, :max(1, int(crop_w * 0.28))]
    top_band = cropped[:max(1, int(crop_h * 0.25)), :]
    accent_band = cropped[:max(1, int(crop_h * 0.18)), :]

    # Hole detection via contour hierarchy
    contours, hierarchy = cv2.findContours(cropped, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    hole_count = 0
    if hierarchy is not None:
        for idx, info in enumerate(hierarchy[0]):
            if info[3] != -1:  # Has a parent → it's a hole
                area = cv2.contourArea(contours[idx])
                if 10 < area < (cropped.size * 0.25):
                    hole_count += 1

    return {
        "has_foreground": True,
        "hole_count": hole_count,
        "left_density": float(np.mean(left_band > 0)),
        "top_density": float(np.mean(top_band > 0)),
        "accent_density": float(np.mean(accent_band > 0)),
        "component_count": len(contours),
    }


# ─────────────────────────────────────────────────────────────
# Post-Processing (Deduplication & Vibhag Detection)
# ─────────────────────────────────────────────────────────────

def _filter_duplicate_detections(detections: list[dict]) -> list[dict]:
    """
    Remove overlapping detections using IoU and center-distance thresholds.
    Keeps the highest-confidence detection when duplicates are found.
    """
    if not detections:
        return []

    kept = []
    for det in sorted(detections, key=lambda d: d["confidence"], reverse=True):
        left, top, right, bottom = det["bbox"]
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2

        is_duplicate = False
        for existing in kept:
            ex_l, ex_t, ex_r, ex_b = existing["bbox"]

            # IoU check
            inter_w = max(0, min(right, ex_r) - max(left, ex_l))
            inter_h = max(0, min(bottom, ex_b) - max(top, ex_t))
            inter_area = inter_w * inter_h
            area = max(1, (right - left) * (bottom - top))
            ex_area = max(1, (ex_r - ex_l) * (ex_b - ex_t))
            iou = inter_area / float(area + ex_area - inter_area)

            if iou > SAME_SYMBOL_IOU_THRESHOLD:
                is_duplicate = True
                break

            # Center proximity check
            ex_cx, ex_cy = (ex_l + ex_r) / 2, (ex_t + ex_b) / 2
            if (abs(center_x - ex_cx) <= SAME_SYMBOL_CENTER_THRESHOLD_PX and
                    abs(center_y - ex_cy) <= SAME_SYMBOL_CENTER_THRESHOLD_PX):
                is_duplicate = True
                break

        if not is_duplicate:
            kept.append(det)

    kept.sort(key=lambda d: d["bbox"][0])
    return kept


def _detect_taal_vibhag(detections: list[dict]) -> list[dict]:
    """
    Identify vertical bars as taal vibhag (rhythmic section separators).
    A detection is classified as vibhag if it's tall and narrow.
    """
    results = []
    for det in detections:
        bbox = det["bbox"]
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]

        if h > w * 2.5 and w < 0.25 * h:
            results.append({
                "class_id": -1,
                "label": "taal vibhag",
                "confidence": 0.99,
                "bbox": bbox,
            })
        else:
            results.append(det)

    return results


# ─────────────────────────────────────────────────────────────
# Image Utility Functions
# ─────────────────────────────────────────────────────────────

def _tight_crop_foreground(image: Image.Image, white_threshold: int = 245, margin: int = 4) -> Image.Image:
    """Trim near-white background so the symbol fills more of the frame."""
    gray = image.convert("L")
    mask = gray.point(lambda p: 0 if p > white_threshold else 255)
    bbox = mask.getbbox()

    if not bbox:
        return image

    left, top, right, bottom = bbox
    return image.crop((
        max(0, left - margin),
        max(0, top - margin),
        min(image.width, right + margin),
        min(image.height, bottom + margin),
    ))


def _pad_to_square(image: Image.Image, background: int = 255) -> Image.Image:
    """Pad an image to a square canvas, centering the original content."""
    size = max(image.width, image.height)
    canvas = Image.new("L", (size, size), background)
    offset_x = (size - image.width) // 2
    offset_y = (size - image.height) // 2
    canvas.paste(image, (offset_x, offset_y))
    return canvas


def _crop_bbox_with_margin(image: Image.Image, bbox: list, margin: int = 4) -> Image.Image:
    """Crop a bounding box region from an image with optional margin."""
    left = max(0, int(bbox[0]) - margin)
    top = max(0, int(bbox[1]) - margin)
    right = min(image.width, int(bbox[2]) + margin)
    bottom = min(image.height, int(bbox[3]) + margin)

    if right <= left or bottom <= top:
        return image
    return image.crop((left, top, right, bottom))
