import xml.etree.ElementTree as ET
import re
from mapping.swara_map import SWARA_MAP

# Invert SWARA_MAP for easy lookup by english_name (case insensitive)
NAME_TO_SWARA = {}
for cls_id, data in SWARA_MAP.items():
    name = data["english_name"].lower().replace(" ", "")
    NAME_TO_SWARA[name] = {"class_id": cls_id, **data}

# Mapping from Western notation to Indian Swara
MUSICXML_NOTE_MAP = {
    "C": "sa",
    "D": "re",
    "E": "ga",
    "F": "ma",
    "G": "pa",
    "A": "dha",
    "B": "ni"
}

def parse_musicxml(content: str) -> list:
    """Parses MusicXML content and extracts a list of Swaras."""
    swaras = []
    try:
        root = ET.fromstring(content)
        for note in root.iter('note'):
            pitch = note.find('pitch')
            if pitch is not None:
                step = pitch.findtext('step')
                alter = pitch.findtext('alter')
                
                if step and step in MUSICXML_NOTE_MAP:
                    base_swara = MUSICXML_NOTE_MAP[step]
                    
                    target_name = base_swara
                    if alter == "-1" and base_swara in ["re", "ga", "dha", "ni"]:
                        target_name = "komal" + base_swara
                    elif alter == "1" and base_swara == "ma":
                        target_name = "tivra" + base_swara
                        
                    if target_name in NAME_TO_SWARA:
                        swaras.append(NAME_TO_SWARA[target_name])
    except Exception as e:
        print(f"Failed to parse MusicXML: {e}")
        
    return swaras


