"""
Notation Import Parser — MusicXML to Indian Swara Conversion

This module converts Western music notation (MusicXML format) into
Hindustani Classical swaras. The mapping follows standard equivalences:

    Western Note  →  Indian Swara
    ─────────────────────────────
    C             →  Sa
    D             →  Re
    E             →  Ga
    F             →  Ma
    G             →  Pa
    A             →  Dha
    B             →  Ni

Accidentals (alter values) map to Komal/Tivra variants:
    - alter = -1 on Re, Ga, Dha, Ni → Komal (flat)
    - alter = +1 on Ma → Tivra (sharp)
"""

import xml.etree.ElementTree as ET

from app.mapping.swara_map import SWARA_MAP

# ─────────────────────────────────────────────────────────────
# Lookup Tables
# ─────────────────────────────────────────────────────────────

# Build reverse lookup: normalized english name → full swara info
_NAME_TO_SWARA: dict[str, dict] = {}
for _cls_id, _data in SWARA_MAP.items():
    _key = _data["english_name"].lower().replace(" ", "")
    _NAME_TO_SWARA[_key] = {"class_id": _cls_id, **_data}

# Western pitch step → base Indian swara name
_STEP_TO_SWARA: dict[str, str] = {
    "C": "sa",
    "D": "re",
    "E": "ga",
    "F": "ma",
    "G": "pa",
    "A": "dha",
    "B": "ni",
}

# Notes that have Komal (flat) variants
_KOMAL_ELIGIBLE = {"re", "ga", "dha", "ni"}


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def parse_musicxml(content: str) -> list[dict]:
    """
    Parse MusicXML content and extract a sequence of swaras.

    Args:
        content: Raw MusicXML string (score-partwise format).

    Returns:
        List of swara dictionaries, each containing:
        - class_id: YOLO class index
        - english_name: Human-readable swara name
        - hindi_symbol: Devanagari representation with diacritics

    Notes:
        - Rests and unpitched notes are silently skipped.
        - Invalid XML returns an empty list (no exception raised).
    """
    swaras: list[dict] = []

    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        print(f"[WARN] MusicXML parse error: {e}")
        return []

    for note in root.iter("note"):
        pitch = note.find("pitch")
        if pitch is None:
            continue  # Skip rests

        step = pitch.findtext("step")
        alter = pitch.findtext("alter")

        if not step or step not in _STEP_TO_SWARA:
            continue

        # Determine the target swara based on accidentals
        base_swara = _STEP_TO_SWARA[step]
        target_name = _resolve_swara_name(base_swara, alter)

        if target_name in _NAME_TO_SWARA:
            swaras.append(_NAME_TO_SWARA[target_name])

    return swaras


# ─────────────────────────────────────────────────────────────
# Private Helpers
# ─────────────────────────────────────────────────────────────

def _resolve_swara_name(base_swara: str, alter: str | None) -> str:
    """
    Apply accidental (alter) to determine the final swara variant.

    Rules:
      - alter = "-1" on eligible notes → Komal prefix
      - alter = "1" on Ma → Tivra prefix
      - Otherwise → Shuddha (plain) form
    """
    if alter == "-1" and base_swara in _KOMAL_ELIGIBLE:
        return f"komal{base_swara}"
    if alter == "1" and base_swara == "ma":
        return "tivrama"
    return base_swara
