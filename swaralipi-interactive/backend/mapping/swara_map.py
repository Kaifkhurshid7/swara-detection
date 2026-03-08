"""
Maps YOLO class IDs to Hindi symbol and English name for UI.

Diacritic conventions (classical Swaralipi notation):
  - Komal (flat)  : letter + ॒  (U+0952, Devanagari stress sign anudatta — renders as a line below)
  - Tivra (sharp) : letter + ॑  (U+0951, Devanagari stress sign udatta — renders as a mark above)
  - Shuddha       : plain letter

Class order matches data.yaml (12 classes):
  0:Dha  1:Ga  2:Komal Dha  3:Komal Ga  4:Komal Ni  5:Komal Re
  6:Ma   7:Ni  8:Pa          9:Re        10:Sa        11:Tivra Ma
"""

SWARA_MAP = {
    #  ID   English name      Hindi symbol (with proper diacritics)
    0:  {"english_name": "Dha",       "hindi_symbol": "ध"},          # Shuddha Dha
    1:  {"english_name": "Ga",        "hindi_symbol": "ग"},          # Shuddha Ga
    2:  {"english_name": "Komal Dha", "hindi_symbol": "ध\u0952"},   # Komal Dha  — line below
    3:  {"english_name": "Komal Ga",  "hindi_symbol": "ग\u0952"},   # Komal Ga   — line below
    4:  {"english_name": "Komal Ni",  "hindi_symbol": "नि\u0952"},  # Komal Ni   — line below
    5:  {"english_name": "Komal Re",  "hindi_symbol": "र\u0952"},   # Komal Re   — line below
    6:  {"english_name": "Ma",        "hindi_symbol": "म"},          # Shuddha Ma
    7:  {"english_name": "Ni",        "hindi_symbol": "नि"},         # Shuddha Ni
    8:  {"english_name": "Pa",        "hindi_symbol": "प"},          # Shuddha Pa
    9:  {"english_name": "Re",        "hindi_symbol": "र"},          # Shuddha Re
    10: {"english_name": "Sa",        "hindi_symbol": "स"},          # Shuddha Sa
    11: {"english_name": "Tivra Ma",  "hindi_symbol": "म\u0951"},   # Tivra Ma   — mark above
}


def get_swara_info(class_id: int) -> dict:
    """Return the mapping entry for a given YOLO class ID.

    Returns a dict with keys ``english_name`` and ``hindi_symbol``.
    Falls back to ``{"english_name": "Unknown", "hindi_symbol": "?"}``
    for any class ID not present in the map.
    """
    return SWARA_MAP.get(class_id, {"english_name": "Unknown", "hindi_symbol": "?"})

