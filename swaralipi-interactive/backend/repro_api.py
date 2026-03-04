import requests
import base64

def create_dummy_b64():
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

if __name__ == "__main__":
    url = "http://127.0.0.1:8000/analyze"
    print(f"Calling {url}...")
    b64 = "data:image/png;base64," + create_dummy_b64()
    try:
        resp = requests.post(url, json={"image_base64": b64})
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
    except Exception as e:
        print(f"FAILED to call API: {e}")
