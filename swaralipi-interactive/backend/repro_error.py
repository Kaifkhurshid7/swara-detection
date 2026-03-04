import base64
import os
from inference.engine import run_inference

# Create a small blank image base64
def create_dummy_b64():
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

if __name__ == "__main__":
    print("Testing run_inference...")
    try:
        b64 = create_dummy_b64()
        results = run_inference(b64)
        print(f"Success! Detections: {results}")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
