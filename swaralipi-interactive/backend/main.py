"""
FastAPI backend: /analyze (POST cropped base64), /history (GET).
"""
import re
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, insert_scan, get_history
from inference.engine import run_inference
from mapping.swara_map import get_swara_info

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

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"status": "success", "message": "Swaralipi Backend API is running!"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        b64 = normalize_base64(req.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    try:
        class_id, confidence = run_inference(b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    if class_id is None:
        return {
            "success": True,
            "class_id": None,
            "class_name": None,
            "hindi_symbol": None,
            "confidence": 0.0,
            "message": "No symbol detected",
        }
    info = get_swara_info(class_id)
    class_name = info["english_name"]
    hindi_symbol = info["hindi_symbol"]
    timestamp = datetime.utcnow().isoformat() + "Z"

    try:
        insert_scan(timestamp, class_name, class_id, confidence, b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save scan: {e}")

    return {
        "success": True,
        "class_id": class_id,
        "class_name": class_name,
        "hindi_symbol": hindi_symbol,
        "confidence": round(confidence, 4),
        "timestamp": timestamp,
    }

@app.get("/history")
def history():
    rows = get_history()
    for r in rows:
        r["hindi_symbol"] = get_swara_info(r["class_id"])["hindi_symbol"]
    return {"success": True, "scans": rows}
