import os
import requests
import json
import re
import logging

# Optional LLM Enhancement (HuggingFace)
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

# Rule-based extraction patterns
MOOD_PATTERNS = {
    "Happy": [r"happy", r"cheerful", r"smiling", r"joyful", r"content", r"pleased"],
    "Calm": [r"calm", r"peaceful", r"relaxed", r"settled", r"quiet"],
    "Anxious": [r"anxious", r"worried", r"nervous", r"restless", r"uneasy", r"tense"],
    "Irritable": [r"irritable", r"frustrated", r"annoyed", r"grumpy", r"upset"],
    "Aggressive": [r"aggressive", r"angry", r"hitting", r"violent", r"threw", r"attacked"]
}

SLEEP_PATTERNS = {
    "Good": [r"slept well", r"good sleep", r"rested", r"full night", r"peaceful sleep"],
    "Disturbed": [r"disturbed", r"woke up", r"interrupted", r"restless night"],
    "Poor": [r"poor sleep", r"didn't sleep", r"couldn't sleep", r"no sleep", r"insomnia"]
}

MEALS_PATTERNS = {
    "Normal": [r"ate well", r"finished", r"good appetite", r"normal meal", r"ate everything"],
    "Reduced": [r"ate little", r"reduced", r"half", r"small portion", r"picked at"],
    "Skipped": [r"skipped", r"refused", r"didn't eat", r"no meal", r"rejected"]
}

INCIDENT_PATTERNS = {
    "Concerning": [r"incident", r"emergency", r"fell", r"injury", r"hurt", r"accident"],
    "Minor": [r"small issue", r"minor", r"slight", r"briefly"],
    "None": [r"no incident", r"uneventful", r"routine", r"normal day"]
}

MEDICATION_PATTERNS = {
    "yes": [r"gave medication", r"took meds", r"medication given", r"pills taken"],
    "no": [r"refused medication", r"skipped meds", r"no medication"],
    "partial": [r"some medication", r"partial dose"]
}

ACTIVITY_PATTERNS = {
    "yes": [r"participated", r"did activity", r"engaged", r"active", r"joined"],
    "no": [r"refused activity", r"didn't participate", r"no activity", r"avoided"],
    "partial": [r"some activity", r"briefly"]
}

def extract_with_rules(text: str):
    """Rule-based extraction using keyword patterns"""
    text_lower = text.lower()
    
    # Extract mood
    mood = "Unknown"
    for mood_type, patterns in MOOD_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            mood = mood_type
            break
    
    # Extract sleep
    sleep = "Unknown"
    for sleep_type, patterns in SLEEP_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            sleep = sleep_type
            break
    
    # Extract meals
    meals = "Unknown"
    for meal_type, patterns in MEALS_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            meals = meal_type
            break
    
    # Extract incident
    incident = "Unknown"
    for incident_type, patterns in INCIDENT_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            incident = incident_type
            break
    
    # Extract medication
    medication = "Unknown"
    for med_type, patterns in MEDICATION_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            medication = med_type
            break
    
    # Extract activity
    activity = "Unknown"
    for act_type, patterns in ACTIVITY_PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            activity = act_type
            break
    
    # Determine confidence based on matches
    matches = sum([
        mood != "Unknown",
        sleep != "Unknown",
        meals != "Unknown",
        incident != "Unknown"
    ])
    
    if matches >= 3:
        confidence = "High"
    elif matches >= 1:
        confidence = "Medium"
    else:
        confidence = "Low"
    
    return {
        "mood": mood,
        "sleep": sleep,
        "meals": meals,
        "incident": incident,
        "medication": medication,
        "activity": activity,
        "notes": text.strip(),
        "confidence": confidence,
        "source": "rule-based",
        "explanation": f"Extracted {matches} fields from observation using pattern matching."
    }


def call_llm_optional(text: str):
    """Optional LLM enhancement using HuggingFace (if token available)"""
    if not HUGGINGFACE_TOKEN:
        return None
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""Extract structured data from this caregiver observation. Return ONLY valid JSON.
Observation: "{text}"
Extract: mood (Calm/Happy/Anxious/Irritable/Aggressive/Unknown), sleep (Good/Disturbed/Poor/Unknown), meals (Normal/Reduced/Skipped/Unknown), incident (None/Minor/Concerning/Unknown).
JSON:"""
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "temperature": 0.2,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(
            HUGGINGFACE_API_URL,
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get('generated_text', '')
            # Try to parse JSON from the response
            json_match = re.search(r'\{[^}]+\}', generated_text)
            if json_match:
                parsed = json.loads(json_match.group())
                parsed['source'] = 'llm'
                return parsed
    except Exception as e:
        logging.warning(f"LLM enhancement failed: {e}")
    
    return None


def call_llm(text: str):
    """Main extraction function: tries LLM first, falls back to rules"""
    # Try LLM enhancement if available
    llm_result = call_llm_optional(text)
    if llm_result:
        return llm_result
    
    # Fall back to rule-based extraction (always works)
    return extract_with_rules(text)

