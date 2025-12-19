import spacy

nlp = spacy.load("en_core_web_sm")

MOOD_MAP = {
    "anxious": "Anxious",
    "restless": "Anxious",
    "angry": "Irritable",
    "irritated": "Irritable",
    "aggressive": "Aggressive",
    "happy": "Happy",
    "calm": "Calm"
}

SLEEP_MAP = {
    "slept well": "Good",
    "sleep well": "Good",
    "poor sleep": "Poor",
    "didn't sleep": "Poor",
    "did not sleep": "Poor",
    "restless night": "Disturbed",
    "restless sleep": "Disturbed"
}

MEAL_MAP = {
    "skipped lunch": "Skipped",
    "skipped meal": "Skipped",
    "didn't eat": "Skipped",
    "did not eat": "Skipped",
    "ate less": "Reduced",
    "ate little": "Reduced",
    "ate well": "Normal",
    "had meal": "Normal"
}

INCIDENT_MAP = {
    "outburst": "Minor",
    "hit": "Concerning",
    "injury": "Concerning",
    "fell": "Minor"
}

def match_phrase(text, mapping):
    for phrase, value in mapping.items():
        if phrase in text:
            return value
    return "Unknown"

def extract_with_spacy(text: str):
    text = text.lower()

    return {
        "mood": match_phrase(text, MOOD_MAP),
        "sleep": match_phrase(text, SLEEP_MAP),
        "meals": match_phrase(text, MEAL_MAP),
        "incident": match_phrase(text, INCIDENT_MAP)
    }
