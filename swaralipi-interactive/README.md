# Swaralipi Interactive

Interactive Swaralipi OCR: capture notation, drag to crop a symbol, and get instant Hindi swara detection with neural feedback.

---

## Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **Model**: The project includes `backend/models/best.pt` (from the provided zip). No extra download needed.

---

## Running the app (scripts)

All scripts are in the `swaralipi-interactive` folder. Use **two terminals** (backend + frontend), or run both at once.

### Option A: Run both in one go (Windows)

Double-click or run from the project root:

```batch
swaralipi-interactive\run-all.bat
```

This opens two command windows: **Backend** (port 8000) and **Frontend** (port 5173). Wait for both to start, then open **http://localhost:5173** in your browser.

### Option B: Run backend and frontend separately

**Backend** (from `swaralipi-interactive`):

```batch
run-backend.bat
```

Or from inside `backend`:

```batch
cd swaralipi-interactive\backend
run.bat
```

**Frontend** (in a second terminal, from `swaralipi-interactive`):

```batch
run-frontend.bat
```

Or from inside `frontend`:

```batch
cd swaralipi-interactive\frontend
run.bat
```

### Option C: PowerShell

From `swaralipi-interactive`:

```powershell
# Terminal 1 – backend
cd backend; .\run.ps1

# Terminal 2 – frontend
cd frontend; .\run.ps1
```

### What the scripts do

| Script | Location | What it does |
|--------|----------|----------------|
| `run-all.bat` | Project root | Starts backend and frontend in two new windows |
| `run-backend.bat` | Project root | Starts only the backend |
| `run-frontend.bat` | Project root | Starts only the frontend |
| `run.bat` / `run.ps1` | `backend/` | Creates venv (if missing), installs deps, runs `uvicorn` on port 8000 |
| `run.bat` / `run.ps1` | `frontend/` | Runs `npm install` if needed, then `npm run dev` (port 5173) |

---

## URLs

| Service | URL |
|---------|-----|
| **Frontend (app)** | http://localhost:5173 |
| **Backend API** | http://127.0.0.1:8000 |
| **API docs (Swagger)** | http://127.0.0.1:8000/docs |

**Important:** Start the **backend first** (port 8000), then the frontend. The frontend calls the backend at `http://127.0.0.1:8000` (see `frontend/.env.development`). If you see "Backend not reachable", run `run-backend.bat` and leave that window open.

---

## Project structure

```
swaralipi-interactive/
├── run-all.bat          # Start backend + frontend (two windows)
├── run-backend.bat      # Start backend only
├── run-frontend.bat     # Start frontend only
├── README.md
│
├── ml_pipeline/         # YOLOv8 training (optional)
│   ├── data.yaml        # 12 swara classes
│   ├── train.py         # Train 150 epochs
│   ├── setup_datasets.py # Copy data from zip into datasets/
│   └── datasets/        # train/val images and labels
│
├── backend/             # FastAPI + SQLite
│   ├── run.bat / run.ps1
│   ├── main.py          # POST /analyze, GET /history
│   ├── database.py      # SQLite scans table
│   ├── requirements.txt
│   ├── models/
│   │   └── best.pt      # YOLO weights (included)
│   ├── inference/
│   │   └── engine.py    # Run model on cropped image
│   └── mapping/
│       └── swara_map.py # Class ID → Hindi symbol, English name
│
└── frontend/            # React PWA (Vite, Tailwind)
    ├── run.bat / run.ps1
    ├── package.json
    ├── vite.config.ts   # PWA + proxy /api → backend
    ├── public/
    │   └── manifest.json
    └── src/
        ├── App.tsx
        ├── api/client.ts    # analyzeCrop(), getHistory()
        ├── utils/device.ts  # isMobile()
        ├── components/      # Navbar, NeuralTooltip
        └── pages/           # Home, Scanner, Result, History
```

---

## How to use the app

1. **Scan** – On desktop: drag-and-drop or choose an image. On mobile: use the camera and tap **Capture**.
2. **Result** – Draw a box around **one** swara symbol on the image. When you release, the crop is sent to the backend. The **left panel** shows the detected Hindi symbol, English name, and confidence.
3. **History** – View past scans (timestamp, crop thumbnail, symbol, confidence).

---

## Retraining the model (optional)

1. Extract `swara_model_and_data.zip` so that `swara_extracted/data` exists (images + labels).
2. From repo root:
   ```batch
   cd swaralipi-interactive\ml_pipeline
   python setup_datasets.py
   python train.py
   ```
3. Copy the new weights into the backend:
   ```batch
   copy ml_pipeline\runs\swaralipi\exp\weights\best.pt backend\models\best.pt
   ```
4. Restart the backend.

---

## PWA icons (optional)

For a proper installable PWA, add:

- `frontend/public/icons/icon-192.png` (192×192)
- `frontend/public/icons/icon-512.png` (512×512)

The app runs without these; the manifest will use defaults where possible.

---

## Troubleshooting

- **Backend won’t start** – Ensure port 8000 is free. Install deps: `cd backend && pip install -r requirements.txt`
- **Frontend won’t start** – Ensure port 5173 is free. Run `cd frontend && npm install` then `npm run dev`
- **“Request failed” on crop** – Backend must be running at http://127.0.0.1:8000; frontend proxies `/api` to it.
- **No symbol detected** – Crop tightly around a single swara; avoid very small or blurred crops.
