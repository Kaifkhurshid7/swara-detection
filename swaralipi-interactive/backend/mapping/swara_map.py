"""
Maps YOLO class IDs to Hindi symbol and English name for UI.
"""
# Class order must match data.yaml: Dha, Ga, Komal Dha, Komal Ga, Komal Ni, Komol Re, Ma, Ni, Pa, Re, Sa, Tivra Ma
SWARA_MAP = {
    0: {"english_name": "Dha", "hindi_symbol": "ध"},
    1: {"english_name": "Ga", "hindi_symbol": "ग"},
    2: {"english_name": "Komal Dha", "hindi_symbol": "ध॒"},
    3: {"english_name": "Komal Ga", "hindi_symbol": "ग॒"},
    4: {"english_name": "Komal Ni", "hindi_symbol": "नि॒"},
    5: {"english_name": "Komal Re", "hindi_symbol": "र॒"},
    6: {"english_name": "Ma", "hindi_symbol": "म"},
    7: {"english_name": "Ni", "hindi_symbol": "नि"},
    8: {"english_name": "Pa", "hindi_symbol": "प"},
    9: {"english_name": "Re", "hindi_symbol": "र"},
    10: {"english_name": "Sa", "hindi_symbol": "स"},
    11: {"english_name": "Tivra Ma", "hindi_symbol": "म॑"},
}

def get_swara_info(class_id: int):
    return SWARA_MAP.get(class_id, {"english_name": "Unknown", "hindi_symbol": "?"})
