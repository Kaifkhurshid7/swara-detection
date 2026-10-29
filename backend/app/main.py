"""
Swaralipi OCR API — FastAPI Application Entry Point

This module defines the REST API for the Swaralipi detection system.
It exposes endpoints for:
  - Image-based swara detection (YOLOv8 inference)
  - Scan history retrieval
  - MusicXML notation import/conversion

Architecture:
  Routes are thin controllers that delegate business logic to dedicated
  service modules (inference engine, database, parser). This keeps the
  API layer focused on request validation and response formatting.
"""

import base64
from datetime import datetime, timezone

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import get_history, init_db, insert_scan
from app.services.inference.engine import run_inference
from app.mapping.swara_map import get_swara_info

# ─────────────────────────────────────────────────────────────
# App Configuration
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Swaralipi OCR API",
    description="Detect and classify Hindustani Classical music notation from manuscript images.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────

class ImportRequest(BaseModel):
    """Request body for the /import endpoint."""
    format: str
    content: str


# ─────────────────────────────────────────────────────────────
# Lifecycle Events
# ─────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    """Initialize the database schema on application boot."""
    init_db()


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    """Health check endpoint for uptime monitoring and cold-start warmup."""
    return {"status": "success", "message": "Swaralipi Backend API is running."}


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded manuscript image for swara detection.

    Pipeline:
      1. Validate the uploaded file (PNG only for lossless quality)
      2. Run YOLOv8 inference with template-bank refinement
      3. Map raw class IDs to human-readable swara names
      4. Persist the primary detection to scan history
      5. Return all detections with confidence scores and bounding boxes

    Returns uncertainty warnings when top detections are within 10% confidence.
    """
    # ── Validation ──
    if file.content_type != "image/png":
        raise HTTPException(
            status_code=400,
            detail="Only PNG images are supported for maximum accuracy.",
        )

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise ValueError("Empty image file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    # ── Inference ──
    try:
        raw_detections = run_inference(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    if not raw_detections:
        return {
            "success": True,
            "class_id": None,
            "class_name": None,
            "hindi_symbol": None,
            "confidence": 0.0,
            "detections": [],
            "message": "No symbol detected",
        }

    # ── Post-Processing ──
    detections = _enrich_detections(raw_detections)
    primary = max(detections, key=lambda d: d["confidence"])
    warning = _check_uncertainty(detections)
    timestamp = datetime.now(timezone.utc).isoformat()

    # ── Persistence (non-blocking — failure doesn't break the response) ──
    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        insert_scan(timestamp, primary["class_name"], primary["class_id"], primary["confidence"], b64)
    except Exception as e:
        print(f"[WARN] Failed to save scan to history: {e}")

    return {
        "success": True,
        "class_id": primary["class_id"],
        "class_name": primary["class_name"],
        "hindi_symbol": primary["hindi_symbol"],
        "confidence": primary["confidence"],
        "detections": detections,
        "timestamp": timestamp,
        "message": warning,
    }


@app.get("/history")
def get_scan_history():
    """Retrieve the most recent scan results from the database."""
    rows = get_history()
    for row in rows:
        row["hindi_symbol"] = get_swara_info(row["class_id"])["hindi_symbol"]
    return {"success": True, "scans": rows}


@app.post("/import")
async def import_notation(req: ImportRequest):
    """
    Parse external notation formats and convert to Indian swaras.

    Currently supports: MusicXML
    Maps Western pitch names (C, D, E...) to Hindustani equivalents (Sa, Re, Ga...).
    """
    from app.services.import_parser import parse_musicxml

    if req.format != "musicxml":
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'musicxml'.")

    swaras = parse_musicxml(req.content)
    return {"success": True, "swaras": swaras}


# ─────────────────────────────────────────────────────────────
# Private Helpers
# ─────────────────────────────────────────────────────────────

def _enrich_detections(raw_detections: list[dict]) -> list[dict]:
    """Map raw engine output (class_id + confidence) to full swara metadata."""
    enriched = []
    for det in raw_detections:
        cls_id = det["class_id"]

        # Taal vibhag (vertical bar separator) is a special non-swara detection
        if cls_id == -1:
            info = {"english_name": "Taal Vibhag", "hindi_symbol": "|"}
        else:
            info = get_swara_info(cls_id)

        enriched.append({
            "class_id": cls_id,
            "class_name": info["english_name"],
            "hindi_symbol": info["hindi_symbol"],
            "confidence": round(det["confidence"], 4),
            "bbox": det["bbox"],
        })
    return enriched


def _check_uncertainty(detections: list[dict]) -> str | None:
    """
    Generate a warning when the top two detections are too close in confidence.
    This signals ambiguity to the frontend so the user can re-crop more precisely.
    """
    if len(detections) < 2:
        return None

    sorted_dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    gap = sorted_dets[0]["confidence"] - sorted_dets[1]["confidence"]

    if gap < 0.10:
        return (
            f"UNCERTAINTY DETECTED: Similar patterns detected "
            f"({sorted_dets[0]['class_name']} vs {sorted_dets[1]['class_name']})."
        )
    return None
