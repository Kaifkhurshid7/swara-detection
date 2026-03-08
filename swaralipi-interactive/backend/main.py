from fastapi import FastAPI, HTTPException, File, UploadFile
import base64
import re
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, insert_scan, get_history
from inference.engine import run_inference
from mapping.swara_map import get_swara_info
import os

app = FastAPI(title="Swaralipi OCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Strip data URL prefix if present
def normalize_base64(s: str) -> str:
    if not s or not s.strip():
        raise ValueError("Empty image data")
    s = s.strip()
    if s.startswith("data:image"):
        m = re.match(r"data:image/[^;]+;base64,(.+)", s, re.DOTALL)
        if m:
            return m.group(1).strip()
    return s

class AnalyzeRequest(BaseModel):
    image_base64: str

class ImportRequest(BaseModel):
    format: str
    content: str

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"status": "success", "message": "Swaralipi Backend API is running!"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if file.content_type != "image/png":
        raise HTTPException(status_code=400, detail="Only PNG images are supported for maximum accuracy.")

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise ValueError("Empty image file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    try:
        detections_raw = run_inference(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    if not detections_raw:
        return {
            "success": True,
            "class_id": None,
            "class_name": None,
            "hindi_symbol": None,
            "confidence": 0.0,
            "detections": [],
            "message": "No symbol detected",
        }

    # Process all detections
    processed_detections = []
    for det in detections_raw:
        cls_id = det["class_id"]
        conf = det["confidence"]

        # Special case: taal vibhag (vertical bar separator) detected by engine
        if cls_id == -1:
            info = {"english_name": "Taal Vibhag", "hindi_symbol": "|"}
        else:
            info = get_swara_info(cls_id)

        processed_detections.append({
            "class_id": cls_id,
            "class_name": info["english_name"],
            "hindi_symbol": info["hindi_symbol"],
            "confidence": round(conf, 4),
            "bbox": det["bbox"]
        })

    # For backward compatibility and history, use the first/highest confidence detection
    primary = max(processed_detections, key=lambda d: d["confidence"])
    
    # Uncertainty detection: Check if the top 2 detections are very close in confidence
    warning = None
    if len(processed_detections) > 1:
        sorted_dets = sorted(processed_detections, key=lambda d: d["confidence"], reverse=True)
        # Only warn if the top two are extremely close and imply a classification flip
        conf_gap = sorted_dets[0]["confidence"] - sorted_dets[1]["confidence"]
        if conf_gap < 0.10: # Narrow 10% gap
            warning = f"UNCERTAINTY DETECTED: Similar patterns detected ({sorted_dets[0]['class_name']} vs {sorted_dets[1]['class_name']})."

    timestamp = datetime.utcnow().isoformat() + "Z"

    try:
        # Convert to base64 for history storage (keeping existing DB schema)
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        insert_scan(timestamp, primary["class_name"], primary["class_id"], primary["confidence"], b64)
    except Exception as e:
        print(f"Failed to save scan to history: {e}")

    return {
        "success": True,
        "class_id": primary["class_id"],
        "class_name": primary["class_name"],
        "hindi_symbol": primary["hindi_symbol"],
        "confidence": primary["confidence"],
        "detections": processed_detections,
        "timestamp": timestamp,
        "message": warning
    }

@app.get("/history")
def history():
    rows = get_history()
    for r in rows:
        r["hindi_symbol"] = get_swara_info(r["class_id"])["hindi_symbol"]
    return {"success": True, "scans": rows}

@app.post("/import")
async def import_notation(req: ImportRequest):
    from import_parser import parse_musicxml
    
    swaras = []
    if req.format == "musicxml":
        swaras = parse_musicxml(req.content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
        
    return {
        "success": True,
        "swaras": swaras
    }

