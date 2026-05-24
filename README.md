# Swaralipi Lab

> AI-powered detection and classification of Indian Classical music notation (Swaralipi) from handwritten manuscripts using YOLOv8 object detection.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)

---

## Overview

Swaralipi Lab is a full-stack application that digitizes handwritten Hindustani Classical music notation. Users upload or photograph a manuscript, select a region of interest, and the system identifies individual swara symbols using a custom-trained YOLOv8 model with multi-stage post-processing for disambiguation.

**Key Features:**
- Real-time swara detection from manuscript images (12 classes)
- Interactive ROI selection with bounding-box crop tool
- Multi-stage inference pipeline (YOLO + template bank + shape analysis)
- Export to PDF, MusicXML, and plain text
- MusicXML import with Western → Indian notation conversion
- Scan history with confidence tracking
- PWA-ready with mobile camera support

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                          │
│  React 18 · TypeScript · Vite · TailwindCSS                  │
│                                                             │
│  Pages: Home → Scanner → Result → History → Import           │
│  Services: api/client.ts (Axios)                             │
│  Utils: exportNotation.ts, device.ts                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (/api proxy)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Render)                           │
│  FastAPI · Gunicorn · Uvicorn                                │
│                                                             │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  main.py    │→ │ inference/     │→ │ mapping/        │  │
│  │  (routes)   │  │ engine.py      │  │ swara_map.py    │  │
│  └──────┬──────┘  │ (5-stage ML)   │  │ (ID → symbol)  │  │
│         │         └────────────────┘  └─────────────────┘  │
│  ┌──────▼──────┐  ┌────────────────┐                       │
│  │ database.py │  │ import_parser  │                       │
│  │ (SQLite)    │  │ (MusicXML)     │                       │
│  └─────────────┘  └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
swaralipi-interactive/
├── backend/
│   ├── main.py                 # FastAPI routes (thin controllers)
│   ├── database.py             # SQLite persistence layer
│   ├── import_parser.py        # MusicXML → Swara conversion
│   ├── inference/
│   │   ├── __init__.py
│   │   └── engine.py           # YOLOv8 inference + post-processing
│   ├── mapping/
│   │   ├── __init__.py
│   │   └── swara_map.py        # Class ID → notation mapping
│   ├── models/
│   │   └── brain.pt            # Trained YOLOv8 weights
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile                # Render process definition
│   └── runtime.txt             # Python version
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # Axios HTTP client + types
│   │   ├── pages/              # Route-level components
│   │   ├── components/         # Reusable UI components
│   │   └── utils/              # Export helpers, device detection
│   ├── vite.config.ts          # Build config + dev proxy
│   ├── tailwind.config.js      # Design system
│   ├── vercel.json             # Production API rewrites
│   └── package.json            # Node dependencies
│
├── ml_pipeline/
│   ├── data.yaml               # YOLOv8 dataset config (12 classes)
│   ├── train.py                # Training script
│   ├── setup_datasets.py       # Dataset preparation utility
│   └── datasets/               # Training/validation data
│
└── app.py                      # Local dev orchestrator
```

---

## Detection Pipeline

The inference engine uses a 5-stage pipeline for maximum accuracy:

| Stage | Purpose | Method |
|-------|---------|--------|
| 1. Segmentation | Split wide rows into symbols | Connected-component analysis |
| 2. Detection | Identify swara bounding boxes | YOLOv8 object detection |
| 3. Template Refinement | Second opinion for confusable pairs | Cosine similarity vs. class prototypes |
| 4. Shape Analysis | Ma/Pa/Tivra Ma disambiguation | Hole detection + density features |
| 5. Deduplication | Remove overlapping detections | IoU threshold + center proximity |

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd swaralipi-interactive/backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd swaralipi-interactive/frontend
npm install
npm run dev
```

Open `http://localhost:5173` — API requests proxy to the backend automatically.

### Quick Start (Both)
```bash
cd swaralipi-interactive
python app.py
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SWARALIPI_DB_PATH` | `./swaralipi.db` | SQLite database file path |
| `PORT` | `8000` | Backend server port (Render) |
| `VITE_API_URL` | `/api` | Frontend API base URL |

---

## API Documentation

### `GET /` — Health Check
```json
{"status": "success", "message": "Swaralipi Backend API is running."}
```

### `POST /analyze` — Detect Swaras
**Input:** `multipart/form-data` with `file` field (PNG image)

**Response:**
```json
{
  "success": true,
  "class_id": 10,
  "class_name": "Sa",
  "hindi_symbol": "स",
  "confidence": 0.9234,
  "detections": [
    {"class_id": 10, "class_name": "Sa", "hindi_symbol": "स", "confidence": 0.9234, "bbox": [12, 8, 45, 52]}
  ],
  "timestamp": "2026-05-24T10:30:00+00:00"
}
```

### `GET /history` — Scan Archive
Returns the 100 most recent scans with metadata and base64 image crops.

### `POST /import` — MusicXML Conversion
**Input:** `{"format": "musicxml", "content": "<score-partwise>...</score-partwise>"}`

**Response:** List of swaras with class_id, english_name, and hindi_symbol.

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero-config for single-instance free tier deployment |
| Single Gunicorn worker | YOLOv8 model is ~500MB; multiple workers exceed free RAM |
| Base64 image storage | Avoids S3 complexity; acceptable at prototype scale |
| PNG-only uploads | Lossless format preserves thin handwriting strokes |
| Client-side ROI crop | User defines exactly what to analyze; more accurate than full-page |
| Confidence capped at 0.99 | No model should claim 100% certainty |

---

## Assumptions

1. Manuscripts have reasonable contrast (dark ink on light paper)
2. Single octave — upper/lower octave markers not yet classified
3. Left-to-right reading order for swara sequences
4. Model weights (`brain.pt`) must be present locally
5. Render free tier may have 30-60s cold start on first request

---

## Future Improvements

- [ ] Multi-octave detection (dots above/below swaras)
- [ ] Full-page batch processing with automatic row segmentation
- [ ] Raga identification from detected swara sequences
- [ ] Audio synthesis (MIDI playback of detected notation)
- [ ] User authentication with per-user scan history
- [ ] ONNX model export for faster CPU inference
- [ ] Docker containerization for consistent deployment
- [ ] Annotation tool for user-contributed training data

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS, react-image-crop |
| Backend | FastAPI, Uvicorn, Gunicorn, Python 3.11 |
| ML/AI | YOLOv8 (Ultralytics), OpenCV, Pillow, NumPy, PyTorch |
| Database | SQLite |
| Deployment | Vercel (frontend), Render (backend) |

---

## License

Open source. See individual dependency licenses for third-party components.
