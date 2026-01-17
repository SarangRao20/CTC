import os
import requests
import json
import re
import logging

# Optional LLM Enhancement (Groq)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.1-7b-instant" 

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
    """Optional LLM enhancement using Groq (if key available)"""
    if not GROQ_API_KEY:
        return None
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""You are a medical data extractor. Extract structured data from this caregiver observation. 
Return ONLY valid JSON. Do not include any greeting or explanation.

Observation: "{text}"

Fields to extract:
- mood: choose from [Calm, Happy, Anxious, Irritable, Aggressive, Unknown]
- sleep: choose from [Good, Disturbed, Poor, Unknown]
- meals: choose from [Normal, Reduced, Skipped, Unknown]
- incident: choose from [None, Minor, Concerning, Unknown]
- medication: choose from [yes, no, Unknown]
- activity: choose from [yes, no, Unknown]

JSON format:
{{
  "mood": "...",
  "sleep": "...",
  "meals": "...",
  "incident": "...",
  "medication": "...",
  "activity": "...",
  "notes": "Original text summarized if needed",
  "confidence": "High/Medium/Low"
}}"""

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            parsed = json.loads(content)
            parsed['source'] = 'groq'
            return parsed
    except Exception as e:
        logging.warning(f"Groq LLM enhancement failed: {e}")
    
    return None


def call_llm(text: str):
    """Main extraction function: tries LLM first, falls back to rules"""
    # Try LLM enhancement if available
    llm_result = call_llm_optional(text)
    if llm_result:
        return llm_result
    
    # Fall back to rule-based extraction (always works)
    return extract_with_rules(text)

