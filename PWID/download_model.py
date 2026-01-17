import requests

url = "https://storage.googleapis.com/mediapipe-models/pose/pose_landmarker/float16/1/pose_landmarker_full.task"
output_path = "models/pose_landmarker_full.task"

print(f"Downloading {url} to {output_path}...")
response = requests.get(url)
response.raise_for_status()

with open(output_path, "wb") as f:
    f.write(response.content)

print("Download complete.")
