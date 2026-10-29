import os
import sys
from pathlib import Path

# Make `app` importable and keep tests from touching the real scan history.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("SWARALIPI_DB_PATH", str(Path(__file__).resolve().parent / "test.db"))
