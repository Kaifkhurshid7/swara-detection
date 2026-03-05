import requests
import base64
import os

# Create a small dummy png if it doesn't exist
dummy_png = "dummy_test.png"
if not os.path.exists(dummy_png):
    # Just a minimal valid PNG header (or just use a real png if you have one)
    # Since we need a valid image for PIL/YOLO, let's create a 1x1 white pixel
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'white')
    img.save(dummy_png)

url = "http://127.0.0.1:8000/analyze"

with open(dummy_png, "rb") as f:
    files = {"file": ("test.png", f, "image/png")}
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
