# Swaralipi Lab

> A full-stack AI-powered application for detecting and classifying Indian Classical music notation (Swaralipi) from manuscript images using YOLOv8 object detection.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Async Workflow](#async-workflow)
- [Swara Matching Logic](#swara-matching-logic)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Sample Requests & Responses](#sample-requests--responses)
- [Testing Instructions](#testing-instructions)
- [Trade-offs](#trade-offs)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)

---

## Project Overview

**Swaralipi Lab** is a specialized computational environment for the extraction and classification of Hindustani Classical music notation from handwritten manuscripts. The system:

1. Accepts an image (upload or camera capture) of a musical manuscript
2. Allows the user to select a Region of Interest (ROI) via bounding-box crop
3. Runs YOLOv8 inference to detect and classify individual swara symbols
4. Maps detected class IDs to Devanagari symbols with proper diacritics (Komal/Tivra)
5. Stores scan history in SQLite and supports export to PDF, MusicXML, and plain text
6. Supports MusicXML import for converting Western notation to Indian swaras

The model recognizes **12 swara classes**:

| ID | Swara | Hindi Symbol | Type |
|----|-------|-------------|------|
| 0 | Dha | ध | Shuddha |
| 1 | Ga | ग | Shuddha |
| 2 | Komal Dha | ध॒ | Komal (flat) |
| 3 | Komal Ga | ग॒ | Komal (flat) |
| 4 | Komal Ni | नि॒ | Komal (flat) |
| 5 | Komal Re | र॒ | Komal (flat) |
| 6 | Ma | म | Shuddha |
| 7 | Ni | नि | Shuddha |
| 8 | Pa | प | Shuddha |
| 9 | Re | र | Shuddha |
| 10 | Sa | स | Shuddha |
| 11 | Tivra Ma | म॑ | Tivra (sharp) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser / PWA)                       │
│  React 18 + TypeScript + Vite + TailwindCSS + react-image-crop      │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐ │
│  │   Home   │  │ Scanner  │  │  Result  │  │History │  │ Import │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  └────────┘ │
│         │              │             │            │           │      │
│         └──────────────┴─────────────┴────────────┴───────────┘     │
│                              │                                       │
│                     Axios API Client                                 │
│                     (POST /api/analyze, GET /api/history, etc.)      │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  HTTP (Vite proxy in dev / Vercel rewrite in prod)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Gunicorn)                      │
│                                                                     │
│  ┌────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
│  │  main.py       │   │ inference/       │   │  mapping/        │  │
│  │  (API routes)  │──▶│ engine.py        │──▶│  swara_map.py    │  │
│  │                │   │ (YOLOv8 + post-  │   │  (ID → symbol)   │  │
│  │                │   │  processing)     │   │                  │  │
│  └────────┬───────┘   └──────────────────┘   └──────────────────┘  │
│           │                                                         │
│  ┌────────▼───────┐   ┌──────────────────┐                         │
│  │  database.py   │   │ import_parser.py │                         │
│  │  (SQLite)      │   │ (MusicXML → Swara)│                        │
│  └────────────────┘   └──────────────────┘                         │
│                                                                     │
│  Model: models/brain.pt (YOLOv8 weights)                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Deployment Topology:**
- **Frontend**: Vercel (static SPA with `/api` rewrite to backend)
- **Backend**: Render free tier (gunicorn + uvicorn ASGI worker)
- **Database**: SQLite file on Render persistent disk

---

## Folder Structure

```
swara_detection-main/
├── swaralipi-interactive/
│   ├── app.py                          # Local dev orchestrator (runs both services)
│   │
│   ├── backend/
│   │   ├── main.py                     # FastAPI application & route definitions
│   │   ├── database.py                 # SQLite connection, schema, CRUD operations
│   │   ├── import_parser.py            # MusicXML → Swara conversion parser
│   │   ├── Procfile                    # Render/Heroku process definition
│   │   ├── requirements.txt            # Python dependencies
│   │   ├── runtime.txt                 # Python version for deployment
│   │   ├── run.bat / run.ps1           # Local dev startup scripts (Windows)
│   │   ├── swaralipi.db                # SQLite database (auto-created)
│   │   ├── NotoSansDevanagari-Regular.ttf  # Font for PDF generation
│   │   │
│   │   ├── inference/
│   │   │   ├── __init__.py
│   │   │   └── engine.py              # YOLOv8 inference, segmentation, template bank
│   │   │
│   │   ├── mapping/
│   │   │   ├── __init__.py
│   │   │   └── swara_map.py           # Class ID → Hindi symbol + English name
│   │   │
│   │   ├── models/
│   │   │   ├── brain.pt               # Primary YOLOv8 model weights
│   │   │   ├── best.pt                # Alternative trained weights
│   │   │   └── best_backup.pt         # Backup weights
│   │   │
│   │   └── data/
│   │       └── swaralipi.db           # Alternate DB location
│   │
│   ├── frontend/
│   │   ├── index.html                  # SPA entry point
│   │   ├── package.json                # Node dependencies & scripts
│   │   ├── vite.config.ts              # Vite config with dev proxy & PWA plugin
│   │   ├── tailwind.config.js          # TailwindCSS configuration
│   │   ├── tsconfig.json               # TypeScript configuration
│   │   ├── vercel.json                 # Vercel deployment rewrites
│   │   ├── run.bat / run.ps1           # Local dev startup scripts (Windows)
│   │   │
│   │   ├── src/
│   │   │   ├── main.tsx                # React entry point
│   │   │   ├── App.tsx                 # Router & layout
│   │   │   ├── index.css               # Global styles (Tailwind directives)
│   │   │   │
│   │   │   ├── api/
│   │   │   │   └── client.ts          # Axios client, API functions, types
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx            # Landing page with navigation
│   │   │   │   ├── Scanner.tsx         # Image upload / camera capture
│   │   │   │   ├── Result.tsx          # ROI crop, inference, transcription
│   │   │   │   ├── History.tsx         # Past scan archive
│   │   │   │   └── Import.tsx          # MusicXML parser interface
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx          # Navigation bar
│   │   │   │   └── NeuralTooltip.tsx   # Swara display tooltip
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── device.ts           # Mobile detection utility
│   │   │       └── exportNotation.ts   # PDF, MusicXML, TXT export functions
│   │   │
│   │   └── public/
│   │       └── manifest.json           # PWA manifest
│   │
│   └── ml_pipeline/
│       ├── data.yaml                   # YOLOv8 dataset configuration
│       └── datasets/                   # Training/validation images & labels
│           ├── images/
│           │   ├── train/
│           │   └── val/
│           └── labels/
│               ├── train/
│               └── val/
│
├── render.yaml                         # Render deployment blueprint
├── package-lock.json                   # Root lock file
└── .gitignore
```

---

## Async Workflow

The application follows an asynchronous request-response pattern:

```
┌──────────┐         ┌──────────┐         ┌──────────────┐
│  Browser │         │  FastAPI │         │ YOLOv8 Engine│
└────┬─────┘         └────┬─────┘         └──────┬───────┘
     │                     │                      │
     │  1. Upload image    │                      │
     │  (multipart/form)   │                      │
     │────────────────────▶│                      │
     │                     │                      │
     │                     │  2. Read bytes        │
     │                     │  3. run_inference()   │
     │                     │─────────────────────▶│
     │                     │                      │
     │                     │     4. Segment if     │
     │                     │        wide image     │
     │                     │     5. YOLO predict   │
     │                     │     6. Template bank  │
     │                     │        refinement     │
     │                     │     7. Dedup & sort   │
     │                     │◀─────────────────────│
     │                     │                      │
     │                     │  8. Map class IDs     │
     │                     │     to swara info     │
     │                     │  9. Save to SQLite    │
     │                     │                      │
     │  10. JSON response  │                      │
     │  (detections array) │                      │
     │◀────────────────────│                      │
     │                     │                      │
     │  11. Render results │                      │
     │  12. Export options  │                      │
     │                     │                      │
```

**Key async behaviors:**
- The frontend uses `async/await` with Axios for non-blocking API calls
- FastAPI's `async def` endpoints handle file uploads without blocking the event loop
- A warmup mechanism pings the backend on first load (Render free tier cold starts)
- The inference engine uses `@lru_cache` for the template bank to avoid recomputation
- Image processing (segmentation, enhancement) runs synchronously within the request but is optimized for single-worker deployment

---

## Swara Matching Logic

The detection pipeline uses a multi-stage approach to maximize accuracy:

### Stage 1: YOLOv8 Object Detection
- Model predicts bounding boxes with class IDs and confidence scores
- Wide images (width > 2× height) are segmented into individual symbol regions using connected-component analysis before inference

### Stage 2: Template Bank Refinement
- A prototype bank is built from the training dataset (mean feature vectors per class)
- Each detection's cropped image is compared against prototypes via cosine similarity
- For confusable pairs (Ma/Pa/Tivra Ma, Ga/Dha), the template score can override the model's prediction

### Stage 3: Shape Feature Analysis (Ma Family)
- For Ma (म), Pa (प), and Tivra Ma (म॑), additional geometric cues are extracted:
  - **Hole detection**: Ma has a closed loop; Pa does not
  - **Accent density**: Tivra Ma has a visible mark above the main body
  - **Left-edge density**: Pa is open on the left side
- These features resolve the most common confusion triplet

### Stage 4: Duplicate Filtering
- Overlapping detections (IoU > 0.85 or centers within 5px) are deduplicated
- Only the highest-confidence detection survives per spatial region

### Stage 5: Vertical Bar Detection
- Tall, narrow detections (height > 2.5× width) are classified as "Taal Vibhag" (rhythmic separators)

### Final Output
- Detections are sorted left-to-right to preserve musical reading order
- Confidence is clamped to [0.0, 0.99] for honest reporting

---

## Setup Instructions

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Git**

### Quick Start (Windows)

```bash
# Clone the repository
git clone https://github.com/your-username/swara_detection.git
cd swara_detection/swaralipi-interactive

# Run both backend and frontend
python app.py
```

### Manual Setup

#### Backend

```bash
cd swaralipi-interactive/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd swaralipi-interactive/frontend

# Install dependencies
npm install

# Run dev server (proxies /api to localhost:8000)
npm run dev
```

#### ML Pipeline (Training)

```bash
cd swaralipi-interactive/ml_pipeline

# Place training data in datasets/images/train and datasets/labels/train
# Place validation data in datasets/images/val and datasets/labels/val

# Train with YOLOv8
yolo detect train data=data.yaml model=yolov8n.pt epochs=100 imgsz=640

# Copy best weights to backend
cp runs/detect/train/weights/best.pt ../backend/models/brain.pt
```

---

## Environment Variables

| Variable | Location | Default | Description |
|----------|----------|---------|-------------|
| `SWARALIPI_DB_PATH` | Backend | `./swaralipi.db` | Absolute path to SQLite database file |
| `PORT` | Backend (Render) | `8000` | Port for gunicorn to bind |
| `VITE_API_URL` | Frontend | `/api` | API base URL (proxied in dev, rewritten in prod) |

### Frontend `.env.development`

```env
VITE_API_URL=/api
```

### Render Environment (Production)

```env
SWARALIPI_DB_PATH=/opt/render/project/src/backend/swaralipi.db
```

---

## API Documentation

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "status": "success",
  "message": "Swaralipi Backend API is running!"
}
```

---

### `POST /analyze`

Analyze an image crop for swara detection.

**Content-Type:** `multipart/form-data`

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File (PNG) | Yes | PNG image of the manuscript crop |

**Response:**
```json
{
  "success": true,
  "class_id": 10,
  "class_name": "Sa",
  "hindi_symbol": "स",
  "confidence": 0.9234,
  "detections": [
    {
      "class_id": 10,
      "class_name": "Sa",
      "hindi_symbol": "स",
      "confidence": 0.9234,
      "bbox": [12.5, 8.3, 45.2, 52.1]
    },
    {
      "class_id": 9,
      "class_name": "Re",
      "hindi_symbol": "र",
      "confidence": 0.8712,
      "bbox": [55.0, 7.1, 88.4, 51.8]
    }
  ],
  "timestamp": "2026-05-24T10:30:00.000000Z",
  "message": null
}
```

**Error Responses:**
- `400`: Invalid file type or empty image
- `500`: Inference engine failure

---

### `GET /history`

Retrieve past scan results.

**Query Parameters:** None (returns last 100 scans)

**Response:**
```json
{
  "success": true,
  "scans": [
    {
      "id": 42,
      "timestamp": "2026-05-24T10:30:00.000000Z",
      "class_name": "Sa",
      "class_id": 10,
      "confidence": 0.9234,
      "image_crop_base64": "iVBORw0KGgo...",
      "hindi_symbol": "स"
    }
  ]
}
```

---

### `POST /import`

Parse MusicXML content and convert Western notation to Indian swaras.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "format": "musicxml",
  "content": "<score-partwise>...</score-partwise>"
}
```

**Response:**
```json
{
  "success": true,
  "swaras": [
    { "class_id": 10, "english_name": "Sa", "hindi_symbol": "स" },
    { "class_id": 5, "english_name": "Komal Re", "hindi_symbol": "र॒" },
    { "class_id": 1, "english_name": "Ga", "hindi_symbol": "ग" },
    { "class_id": 11, "english_name": "Tivra Ma", "hindi_symbol": "म॑" }
  ]
}
```

**Supported Mappings (MusicXML → Swara):**

| Western Note | Alter | Swara |
|-------------|-------|-------|
| C | 0 | Sa |
| D | -1 | Komal Re |
| D | 0 | Re |
| E | -1 | Komal Ga |
| E | 0 | Ga |
| F | 0 | Ma |
| F | +1 | Tivra Ma |
| G | 0 | Pa |
| A | -1 | Komal Dha |
| A | 0 | Dha |
| B | -1 | Komal Ni |
| B | 0 | Ni |

---

## Sample Requests & Responses

### Analyze a Manuscript Crop

```bash
# Using curl
curl -X POST http://localhost:8000/analyze \
  -F "file=@manuscript_crop.png"
```

**Success Response (multiple swaras detected):**
```json
{
  "success": true,
  "class_id": 6,
  "class_name": "Ma",
  "hindi_symbol": "म",
  "confidence": 0.8845,
  "detections": [
    {
      "class_id": 6,
      "class_name": "Ma",
      "hindi_symbol": "म",
      "confidence": 0.8845,
      "bbox": [10.2, 5.1, 48.7, 55.3]
    },
    {
      "class_id": 8,
      "class_name": "Pa",
      "hindi_symbol": "प",
      "confidence": 0.8521,
      "bbox": [60.1, 4.8, 95.2, 54.9]
    }
  ],
  "timestamp": "2026-05-24T14:22:31.456789Z",
  "message": null
}
```

**Uncertainty Warning Response:**
```json
{
  "success": true,
  "class_id": 6,
  "class_name": "Ma",
  "hindi_symbol": "म",
  "confidence": 0.72,
  "detections": [...],
  "timestamp": "2026-05-24T14:22:31.456789Z",
  "message": "UNCERTAINTY DETECTED: Similar patterns detected (Ma vs Pa)."
}
```

**No Detection Response:**
```json
{
  "success": true,
  "class_id": null,
  "class_name": null,
  "hindi_symbol": null,
  "confidence": 0.0,
  "detections": [],
  "message": "No symbol detected"
}
```

### Fetch History

```bash
curl http://localhost:8000/history
```

### Import MusicXML

```bash
curl -X POST http://localhost:8000/import \
  -H "Content-Type: application/json" \
  -d '{
    "format": "musicxml",
    "content": "<score-partwise><part id=\"P1\"><measure number=\"1\"><note><pitch><step>C</step><alter>0</alter></pitch></note><note><pitch><step>D</step><alter>-1</alter></pitch></note></measure></part></score-partwise>"
  }'
```

---

## Testing Instructions

### Backend Tests

```bash
cd swaralipi-interactive/backend

# Activate virtual environment
venv\Scripts\activate

# Run the test upload script
python test_upload.py

# Run the parser test
python test_parser.py

# Manual API test
python -c "from inference.engine import run_inference; print('Engine loaded OK')"
```

### Frontend Build Verification

```bash
cd swaralipi-interactive/frontend

# Type-check and build
npm run build

# Preview production build
npm run preview
```

### End-to-End Manual Testing

1. Start the backend: `uvicorn main:app --reload --port 8000`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173`
4. Upload a manuscript image on the Scanner page
5. Draw a bounding box on the Result page
6. Verify detected swaras appear with confidence scores
7. Test export buttons (PDF, MusicXML, TXT)
8. Check History page for stored scans

---

## Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| **SQLite over PostgreSQL** | No concurrent write scaling | Simplicity for single-instance deployment on Render free tier; sufficient for scan history |
| **Single Gunicorn worker** | No parallel request handling | YOLOv8 model is memory-heavy (~500MB); multiple workers would exceed free tier RAM |
| **Base64 image storage in DB** | Large DB file size | Avoids external file storage (S3) complexity; acceptable for prototype scale |
| **Client-side ROI cropping** | Requires user interaction | More accurate than full-page detection; user defines exactly what to analyze |
| **Template bank from training data** | Requires dataset on disk | Provides a second opinion for confusable swaras without retraining the model |
| **Confidence clamped to 0.99** | Never shows 100% | Honest uncertainty reporting; no model should claim perfect confidence |
| **PNG-only upload** | Rejects JPEG/WebP | Lossless format preserves handwriting detail critical for thin strokes |
| **Vite proxy in dev** | Different path in dev vs prod | Avoids CORS issues locally while Vercel handles rewrites in production |
| **PWA with `selfDestroying: true`** | No offline support | Avoids stale cache issues during rapid development; can be enabled later |

---

## Assumptions

1. **Input quality**: Manuscripts are photographed/scanned with reasonable contrast (dark ink on light paper)
2. **Single octave**: The model assumes middle-octave swaras; upper/lower octave markers are not yet classified
3. **Left-to-right reading**: Swaras are sorted by x-coordinate, assuming horizontal notation flow
4. **Render cold starts**: The backend may take 30-60 seconds to wake on first request (free tier limitation)
5. **Browser support**: Modern browsers with Canvas API support (Chrome 90+, Firefox 88+, Safari 15+)
6. **Model availability**: `brain.pt` must be present in `backend/models/` — not auto-downloaded
7. **Dataset for template bank**: If `swara_extracted/data/` is not present, the template bank is disabled (model-only inference)
8. **Single user**: No authentication or multi-tenancy; all scans share one history table

---

## Future Improvements

- [ ] **Multi-octave detection** — Classify upper/lower octave markers (dots above/below swaras)
- [ ] **Batch processing** — Upload full manuscript pages and auto-segment all rows
- [ ] **Real-time camera detection** — Stream video frames for live swara recognition
- [ ] **User authentication** — Per-user scan history with JWT/OAuth
- [ ] **PostgreSQL migration** — For production-grade concurrent access
- [ ] **Raga identification** — Analyze detected swara sequences to suggest matching ragas
- [ ] **Taal detection** — Recognize rhythmic cycle patterns from vibhag separators
- [ ] **Audio playback** — Synthesize detected notation as audio (MIDI or Web Audio API)
- [ ] **Model versioning** — MLflow or DVC for tracking model experiments
- [ ] **Confidence calibration** — Post-hoc calibration to make confidence scores more meaningful
- [ ] **ONNX export** — Convert model to ONNX for faster CPU inference and edge deployment
- [ ] **Offline PWA** — Enable service worker caching for full offline functionality
- [ ] **Annotation tool** — Allow users to correct misclassifications and contribute to training data
- [ ] **Multi-format import** — Support ABC notation, LilyPond, and Bhatkhande text formats
- [ ] **Docker deployment** — Containerize for consistent cross-platform deployment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS 3, react-image-crop, react-webcam |
| Backend | FastAPI, Uvicorn, Gunicorn, Python 3.11 |
| ML/AI | YOLOv8 (Ultralytics), OpenCV, Pillow, NumPy, PyTorch |
| Database | SQLite 3 |
| Deployment | Vercel (frontend), Render (backend) |
| PWA | vite-plugin-pwa, Workbox |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/raga-detection`)
3. Commit your changes (`git commit -m "Add raga identification module"`)
4. Push to the branch (`git push origin feature/raga-detection`)
5. Open a Pull Request

---

## License

This project is open source. See individual dependency licenses for third-party components.
