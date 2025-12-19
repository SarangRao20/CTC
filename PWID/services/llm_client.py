import os
import requests
import json

BYTEZ_API_KEY = os.getenv("BYTEZ_API_KEY")

BYTEZ_API_URL = "https://api.bytez.com/v1/chat/completions"
# If Bytez gave you a different endpoint, replace this URL only.

MODEL_NAME = os.getenv("BYTEZ_MODEL", "bytez-default")

SYSTEM_PROMPT = """
You are an Assistive Intelligence Engine for a caregiver support platform for People with Intellectual Disabilities (PWID).

You are NOT a chatbot.
You do NOT provide medical advice.
Your task is to extract structured routine information from caregiver notes.

Objective: Convert informal caregiver observations into structured routine records in a safe and conservat

Extract:
- mood: Calm, Happy, Anxious, Irritable, Aggressive, Unknown
- sleep: Good, Disturbed, Poor, Unknown
- meals: Normal, Skipped, Reduced, Unknown
- incident: None, Minor, Concerning, Unknown
- notes: short neutral summary
- confidence: High, Medium, Low
- explanation (one simple sentence)

If information is unclear, use "Unknown" and set confidence to "Low".

Input
A short caregiver-written observation describing daily behaviour, routine, or health-related changes.

Rules (STRICT)
- Never diagnose or label medical conditions
- Never escalate risk unnecessarily
- If information is missing or ambiguous, mark as "Unknown"
- If interpretation is uncertain, set confidence to "Low"
- Use simple, neutral language

Output Format
Return STRICT JSON only. No markdown. No commentary.

Example
Input:
"Didn’t sleep well and was restless today"

Output:
{
"mood": "Anxious",
"sleep": "Poor",
"meals": "Unknown",
"incident": "None",
"notes": "Had poor sleep and appeared restless.",
"confidence": "High",
"explanation": "Poor sleep can affect daily comfort and routine."
}

Return STRICT JSON ONLY.
"""

def call_llm(text: str):
    headers = {
        "Authorization": f"Bearer {BYTEZ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ],
        "temperature": 0.2
    }

    try:
        response = requests.post(
            BYTEZ_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        return parsed

    except Exception:
        return {
            "mood": "Unknown",
            "sleep": "Unknown",
            "meals": "Unknown",
            "incident": "Unknown",
            "notes": text,
            "confidence": "Low",
            "explanation": "Input requires caregiver review."
        }
