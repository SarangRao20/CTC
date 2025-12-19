import os
import io
import json
import wave
from vosk import Model, KaldiRecognizer

# Configuration
MODEL_PATH = "model-hi"  # Assuming we look for this folder in root or PWID/
SAMPLE_RATE = 16000

# Global variable for lazy loading
vosk_model = None

def get_model():
    global vosk_model
    if vosk_model:
        return vosk_model
    
    if not os.path.exists(MODEL_PATH):
        # Fallback to check relative to this file if needed, or cwd
        if os.path.exists(os.path.join(os.getcwd(), MODEL_PATH)):
             vosk_model = Model(os.path.join(os.getcwd(), MODEL_PATH))
             return vosk_model
             
        raise FileNotFoundError(f"Vosk model not found at '{MODEL_PATH}'. Please ensure the model directory exists.")
    
    print("Loading Vosk Model...")
    vosk_model = Model(MODEL_PATH)
    return vosk_model

def transcribe_audio(audio_data):
    """
    Transcribes audio bytes to text using Vosk.
    Expects audio_data to be a WAV file (bytes) with 16kHz Mono format.
    """
    try:
        model = get_model()
    except FileNotFoundError as e:
        return {"error": str(e)}

    rec = KaldiRecognizer(model, SAMPLE_RATE)

    # Read WAV headers to verify format
    try:
        wf = wave.open(io.BytesIO(audio_data), "rb")
    except wave.Error as e:
        return {"error": f"Invalid WAV file: {e}"}

    if wf.getnchannels() != 1 or wf.getframerate() != SAMPLE_RATE:
        return {
            "error": f"Audio must be {SAMPLE_RATE}Hz Mono WAV. Got {wf.getframerate()}Hz {wf.getnchannels()}ch."
        }

    result_text = ""
    
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            # Vosk returns JSON strings for intermediate results (we ignore them here)
            pass
    
    # Get final result
    final_res = json.loads(rec.FinalResult())
    result_text = final_res.get("text", "")
    
    return {"text": result_text}
