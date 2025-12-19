import os
import json
import queue
import sys
import pyaudio
import pyttsx3
from vosk import Model, KaldiRecognizer

# --- CONFIGURATION ---
# Ensure you have the 'vosk-model-small-hi-0.22' folder in your project directory
MODEL_PATH = "model-hi" 
SAMPLE_RATE = 16000

# 1. Initialize pyttsx3 (TTS)
engine = pyttsx3.init()

def set_english_voice(engine):
    """Force the engine to use an English voice."""
    voices = engine.getProperty('voices')
    for voice in voices:
        # Look for English (US or UK) voices
        if "english" in voice.name.lower() or "en" in voice.id.lower():
            engine.setProperty('voice', voice.id)
            print(f"TTS Voice set to: {voice.name}")
            return
    print("Warning: No English voice found, using system default.")

set_english_voice(engine)

# 2. Initialize Vosk (STT)
if not os.path.exists(MODEL_PATH):
    print(f"Error: Model folder '{MODEL_PATH}' not found. Please download the Hindi model.")
    sys.exit(1)

vosk_model = Model(MODEL_PATH)
rec = KaldiRecognizer(vosk_model, SAMPLE_RATE)

# Audio Queue for non-blocking processing
q = queue.Queue()

def audio_callback(indata, frames, time, status):
    if status: print(status, file=sys.stderr)
    q.put(bytes(indata))

# --- MAIN LOOP ---
try:
    # Open the microphone stream
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=SAMPLE_RATE, 
                    input=True, frames_per_buffer=8000)
    stream.start_stream()

    print("\n--- Chatbot Ready ---")
    print("बोलिए (Speak in Hindi)... I will respond in English.")

    while True:
        data = stream.read(4000, exception_on_overflow=False)
        if len(data) == 0:
            break

        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            user_text = result.get("text", "")

            if user_text:
                print(f"You said (Hindi): {user_text}")
                
                # Logic: Since you want English audio, we create an English response
                # In a real bot, you'd translate or use an LLM here.
                response_text = f"I understood you said: {user_text}"
                print(f"Bot (English): {response_text}")

                # Speak the English text
                engine.say(response_text)
                engine.runAndWait()

except KeyboardInterrupt:
    print("\nStopping...")
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()