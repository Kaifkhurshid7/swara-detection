"""
Swara Mapping — YOLO Class ID to Musical Notation

Maps the 12 output classes from the YOLOv8 model to their corresponding
Hindustani Classical music notation in both English and Devanagari.

Diacritic Conventions (standard Swaralipi notation):
  ┌──────────┬────────────────────────────────────────────────────┐
  │ Komal    │ letter + ॒ (U+0952, anudatta — line below)         │
  │ Tivra    │ letter + ॑ (U+0951, udatta — mark above)           │
  │ Shuddha  │ plain letter (no diacritic)                        │
  └──────────┴────────────────────────────────────────────────────┘

Class order matches data.yaml used during YOLOv8 training:
  0:Dha  1:Ga  2:Komal Dha  3:Komal Ga  4:Komal Ni  5:Komal Re
  6:Ma   7:Ni  8:Pa          9:Re        10:Sa        11:Tivra Ma
"""

# ─────────────────────────────────────────────────────────────
# Class ID → Swara Metadata
# ─────────────────────────────────────────────────────────────

SWARA_MAP: dict[int, dict[str, str]] = {
    0:  {"english_name": "Dha",       "hindi_symbol": "ध"},         # Shuddha Dha
    1:  {"english_name": "Ga",        "hindi_symbol": "ग"},         # Shuddha Ga
    2:  {"english_name": "Komal Dha", "hindi_symbol": "ध\u0952"},  # Komal Dha
    3:  {"english_name": "Komal Ga",  "hindi_symbol": "ग\u0952"},  # Komal Ga
    4:  {"english_name": "Komal Ni",  "hindi_symbol": "नि\u0952"}, # Komal Ni
    5:  {"english_name": "Komal Re",  "hindi_symbol": "र\u0952"},  # Komal Re
    6:  {"english_name": "Ma",        "hindi_symbol": "म"},         # Shuddha Ma
    7:  {"english_name": "Ni",        "hindi_symbol": "नि"},        # Shuddha Ni
    8:  {"english_name": "Pa",        "hindi_symbol": "प"},         # Shuddha Pa
    9:  {"english_name": "Re",        "hindi_symbol": "र"},         # Shuddha Re
    10: {"english_name": "Sa",        "hindi_symbol": "स"},         # Shuddha Sa
    11: {"english_name": "Tivra Ma",  "hindi_symbol": "म\u0951"},  # Tivra Ma
}


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def get_swara_info(class_id: int) -> dict[str, str]:
    """
    Look up swara metadata by YOLO class ID.

    Args:
        class_id: Integer class index from the detection model (0-11).

    Returns:
        Dictionary with 'english_name' and 'hindi_symbol' keys.
        Returns {"english_name": "Unknown", "hindi_symbol": "?"} for
        unrecognized class IDs.
    """
    return SWARA_MAP.get(class_id, {"english_name": "Unknown", "hindi_symbol": "?"})
