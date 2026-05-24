"""
Database Layer — SQLite persistence for scan history.

Design decisions:
  - SQLite chosen for zero-config deployment on Render free tier.
  - Connection-per-request pattern (no pooling needed for single-worker).
  - Base64 image storage avoids external object storage complexity.
  - Schema is intentionally simple — one table, append-only writes.

For production scaling, migrate to PostgreSQL with connection pooling.
"""

import os
import sqlite3
from pathlib import Path

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "swaralipi.db"
DB_PATH = Path(os.environ.get("SWARALIPI_DB_PATH", str(DEFAULT_DB_PATH)))


# ─────────────────────────────────────────────────────────────
# Connection Management
# ─────────────────────────────────────────────────────────────

def _ensure_db_directory():
    """Create parent directories for the database file if they don't exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Open a new SQLite connection. Caller is responsible for closing it."""
    _ensure_db_directory()
    return sqlite3.connect(str(DB_PATH))


# ─────────────────────────────────────────────────────────────
# Schema Initialization
# ─────────────────────────────────────────────────────────────

def init_db():
    """
    Create the scans table if it doesn't exist.
    Called once on application startup.
    """
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp         TEXT    NOT NULL,
                class_name        TEXT    NOT NULL,
                class_id          INTEGER NOT NULL,
                confidence        REAL    NOT NULL,
                image_crop_base64 TEXT
            )
        """)
        conn.commit()
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────
# CRUD Operations
# ─────────────────────────────────────────────────────────────

def insert_scan(
    timestamp: str,
    class_name: str,
    class_id: int,
    confidence: float,
    image_crop_base64: str | None,
) -> int:
    """
    Insert a new scan record and return its auto-generated ID.

    Args:
        timestamp: ISO 8601 timestamp of the scan.
        class_name: English name of the detected swara.
        class_id: YOLO class index (0-11).
        confidence: Model confidence score (0.0 to 1.0).
        image_crop_base64: Base64-encoded PNG of the cropped region.

    Returns:
        The ID of the newly inserted row.
    """
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO scans (timestamp, class_name, class_id, confidence, image_crop_base64) "
            "VALUES (?, ?, ?, ?, ?)",
            (timestamp, class_name, class_id, confidence, image_crop_base64),
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()


def get_history(limit: int = 100) -> list[dict]:
    """
    Retrieve the most recent scan records, ordered newest-first.

    Args:
        limit: Maximum number of records to return.

    Returns:
        List of scan dictionaries with id, timestamp, class_name,
        class_id, confidence, and image_crop_base64.
    """
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, class_name, class_id, confidence, image_crop_base64 "
            "FROM scans ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()

        return [
            {
                "id": row[0],
                "timestamp": row[1],
                "class_name": row[2],
                "class_id": row[3],
                "confidence": row[4],
                "image_crop_base64": row[5],
            }
            for row in rows
        ]
    finally:
        conn.close()
