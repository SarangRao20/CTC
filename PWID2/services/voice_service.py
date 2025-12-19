import os
import io
import speech_recognition as sr
from vosk import Model, KaldiRecognizer
import json
import wave

# Configuration
MODEL_PATH = "model-hi"
SAMPLE_RATE = 16000

# Global variable for lazy loading Vosk
vosk_model = None

def get_vosk_model():
    global vosk_model
    if vosk_model:
        return vosk_model
    
    if os.path.exists(MODEL_PATH):
        print("Loading Vosk Model (Fallback)...")
        vosk_model = Model(MODEL_PATH)
        return vosk_model
    return None

def transcribe_with_vosk(audio_data):
    """Fallback offline transcription using Vosk (Hindi only)"""
    model = get_vosk_model()
    if not model:
        return {"error": "Vosk model not found and online transcription failed."}

    rec = KaldiRecognizer(model, SAMPLE_RATE)
    try:
        wf = wave.open(io.BytesIO(audio_data), "rb")
    except Exception:
        return {"error": "Invalid WAV data for Vosk"}

    if wf.getnchannels() != 1 or wf.getframerate() != SAMPLE_RATE:
        return {"error": "Audio format mismatch for Vosk (Need 16kHz Mono)"}

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)
    
    final_res = json.loads(rec.FinalResult())
    return {"text": final_res.get("text", "")}

def transcribe_audio(audio_data):
    """
    Intelligently switches between English and Hindi using Google Speech Recognition (Online).
    Falls back to Vosk (Offline - Hindi) if internet fails.
    """
    recognizer = sr.Recognizer()
    
    # Convert bytes to AudioFile compatible format
    try:
        # We need a file-like object
        audio_file = io.BytesIO(audio_data)
        with sr.AudioFile(audio_file) as source:
            audio = recognizer.record(source)
    except Exception as e:
        return {"error": f"Failed to process audio file: {str(e)}"}

    # Strategy 1: Try English (IN) - handles Indian English well
    try:
        text = recognizer.recognize_google(audio, language="en-IN")
        return {"text": text, "language": "en-IN"}
    except sr.UnknownValueError:
        # Audio not clear in English, try Hindi
        print("English recognition failed, trying Hindi...")
    except sr.RequestError:
        # Internet issue, fallback to Vosk
        print("Google API unreachable, switching to offline Vosk...")
        return transcribe_with_vosk(audio_data)

    # Strategy 2: Try Hindi
    try:
        text = recognizer.recognize_google(audio, language="hi-IN")
        return {"text": text, "language": "hi-IN"}
    except sr.UnknownValueError:
        return {"text": "", "error": "Could not understand audio in English or Hindi"}
    except sr.RequestError:
        return transcribe_with_vosk(audio_data)
