"""
Run the Swaralipi backend and frontend together for local development.

    python scripts/dev.py

Works on Windows, macOS and Linux. Uses backend/venv when present, otherwise
the current interpreter. Press Ctrl+C to stop both servers.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
IS_WINDOWS = os.name == "nt"


def backend_python() -> str:
    venv_python = BACKEND / "venv" / ("Scripts/python.exe" if IS_WINDOWS else "bin/python")
    return str(venv_python) if venv_python.exists() else sys.executable


def main() -> int:
    npm = "npm.cmd" if IS_WINDOWS else "npm"

    if not (FRONTEND / "node_modules").exists():
        print("[dev] Installing frontend dependencies...")
        subprocess.run([npm, "install"], cwd=FRONTEND, check=True)

    print("[dev] Backend  -> http://127.0.0.1:8000  (docs at /docs)")
    print("[dev] Frontend -> URL printed by Vite (usually http://localhost:5173)")

    procs = [
        subprocess.Popen(
            [backend_python(), "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
            cwd=BACKEND,
        ),
        subprocess.Popen([npm, "run", "dev"], cwd=FRONTEND),
    ]
    try:
        for proc in procs:
            proc.wait()
    except KeyboardInterrupt:
        print("\n[dev] Shutting down...")
    finally:
        for proc in procs:
            if proc.poll() is None:
                proc.terminate()
    return 0


if __name__ == "__main__":
    sys.exit(main())
