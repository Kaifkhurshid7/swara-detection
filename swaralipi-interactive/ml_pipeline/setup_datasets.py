"""
Copy dataset from extracted zip (swara_extracted/data) into ml_pipeline/datasets.
Run from repo root: python ml_pipeline/setup_datasets.py
Or from ml_pipeline: python setup_datasets.py
"""
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent  # swara_detection
EXTRACTED = REPO_ROOT / "swara_extracted" / "data"
TARGET = SCRIPT_DIR / "datasets"

def main():
    if not EXTRACTED.exists():
        print(f"Extract swara_model_and_data.zip first so that {EXTRACTED} exists.")
        return
    for split in ("train", "val"):
        src_img = EXTRACTED / "images" / split
        src_lbl = EXTRACTED / "labels" / split
        dst_img = TARGET / "images" / split
        dst_lbl = TARGET / "labels" / split
        if src_img.exists():
            dst_img.mkdir(parents=True, exist_ok=True)
            for f in src_img.iterdir():
                if f.is_file():
                    shutil.copy2(f, dst_img / f.name)
            print(f"Copied {len(list(dst_img.iterdir()))} images to {dst_img}")
        if src_lbl.exists():
            dst_lbl.mkdir(parents=True, exist_ok=True)
            for f in src_lbl.iterdir():
                if f.suffix == ".txt":
                    shutil.copy2(f, dst_lbl / f.name)
            print(f"Copied labels to {dst_lbl}")
    print("Done. Run train.py from ml_pipeline to train.")

if __name__ == "__main__":
    main()
