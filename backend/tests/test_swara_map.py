from app.mapping.swara_map import SWARA_MAP, get_swara_info


def test_all_twelve_classes_are_mapped():
    assert sorted(SWARA_MAP) == list(range(12))


def test_known_class_lookup():
    assert get_swara_info(10)["english_name"] == "Sa"
    assert get_swara_info(11)["english_name"] == "Tivra Ma"


def test_unknown_class_falls_back():
    assert get_swara_info(99) == {"english_name": "Unknown", "hindi_symbol": "?"}
