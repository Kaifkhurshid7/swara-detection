"""
Swaralipi YOLOv8 training script.
Train for 150 epochs with augmentation suited to ~40 images per class.
Run from anywhere: python ml/train.py
Outputs go to ml/runs/swaralipi/. Copy weights/best.pt to backend/models/brain.pt to deploy.
"""
from pathlib import Path
from ultralytics import YOLO

def main():
    # Use YOLOv8n for small dataset; use YOLOv8s/m if you have more data later
    model = YOLO("yolov8n.pt")
    ml_dir = Path(__file__).resolve().parent
    data_yaml = ml_dir / "data.yaml"

    model.train(
        data=str(data_yaml),
        epochs=150,
        imgsz=640,
        batch=16,
        patience=30,
        save=True,
        project=str(ml_dir / "runs"),
        name="swaralipi",
        exist_ok=True,
        # Augmentation for robust learning from 40 images per class
        augment=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=15,
        translate=0.1,
        scale=0.5,
        shear=5,
        perspective=0.0,
        fliplr=0.0,   # No horizontal flip (notation may be directional)
        flipud=0.0,
        mosaic=1.0,
        mixup=0.1,
    )

if __name__ == "__main__":
    main()
