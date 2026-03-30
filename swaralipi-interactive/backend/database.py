"""
SQLite database for Swaralipi scan history.
"""
import sqlite3
import os
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "swaralipi.db"
DB_PATH = Path(os.environ.get("SWARALIPI_DB_PATH", str(DEFAULT_DB_PATH)))

def _ensure_db_parent_exists():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_connection():
    _ensure_db_parent_exists()
    return sqlite3.connect(str(DB_PATH))

def init_db():
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                class_name TEXT NOT NULL,
                class_id INTEGER NOT NULL,
                confidence REAL NOT NULL,
                image_crop_base64 TEXT
            )
        """)
        conn.commit()
    finally:
        conn.close()

def insert_scan(timestamp: str, class_name: str, class_id: int, confidence: float, image_crop_base64: str | None):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO scans (timestamp, class_name, class_id, confidence, image_crop_base64) VALUES (?, ?, ?, ?, ?)",
            (timestamp, class_name, class_id, confidence, image_crop_base64),
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()

def get_history(limit: int = 100):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, class_name, class_id, confidence, image_crop_base64 FROM scans ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r[0],
                "timestamp": r[1],
                "class_name": r[2],
                "class_id": r[3],
                "confidence": r[4],
                "image_crop_base64": r[5],
            }
            for r in rows
        ]
    finally:
        conn.close()
