import spacy

nlp = spacy.load("en_core_web_sm")

MOOD_MAP = {
    "anxious": "Anxious",
    "restless": "Anxious",
    "nervous": "Anxious",
    "scared": "Anxious",
    "angry": "Irritable",
    "irritated": "Irritable",
    "annoyed": "Irritable",
    "aggressive": "Aggressive",
    "hitting": "Aggressive",
    "shouting": "Aggressive",
    "happy": "Happy",
    "smiling": "Happy",
    "laughing": "Happy",
    "calm": "Calm",
    "quiet": "Calm",
    "relaxed": "Calm",
    "sad": "Sad",
    "crying": "Sad",
    "depressed": "Sad",
    "good": "Happy",
    "fine": "Happy",
    "okay": "Calm",
    "great": "Happy",
    "excited": "Happy",
    "content": "Calm",
    "peaceful": "Calm"
}

SLEEP_MAP = {
    "slept well": "Good",
    "sleep well": "Good",
    "good sleep": "Good",
    "slept through": "Good",
    "poor sleep": "Poor",
    "didn't sleep": "Poor",
    "did not sleep": "Poor",
    "awake all night": "Poor",
    "restless night": "Disturbed",
    "restless sleep": "Disturbed",
    "woke up": "Disturbed"
}

MEAL_MAP = {
    "skipped lunch": "Skipped",
    "skipped dinner": "Skipped",
    "skipped breakfast": "Skipped",
    "skipped meal": "Skipped",
    "didn't eat": "Skipped",
    "did not eat": "Skipped",
    "refused food": "Skipped",
    "ate less": "Reduced",
    "ate little": "Reduced",
    "left food": "Reduced",
    "ate well": "Normal",
    "ate all": "Normal",
    "finished meal": "Normal",
    "had meal": "Normal"
}

INCIDENT_MAP = {
    "outburst": "Minor",
    "shouted": "Minor",
    "argued": "Minor",
    "hit": "Concerning",
    "punched": "Concerning",
    "threw": "Concerning",
    "injury": "Concerning",
    "cut": "Concerning",
    "bruise": "Concerning",
    "fell": "Minor",
    "trip": "Minor",
    "slip": "Minor",
    "attacked": "Critical",
    "emergency": "Critical"
}


MEDICATION_MAP = {
    "took meds": "Yes",
    "meds given": "Yes",
    "tablets given": "Yes",
    "medicine given": "Yes",
    "refused meds": "Refused",
    "spat out meds": "Refused",
    "missed meds": "Missed"
}

ACTIVITY_MAP = {
    "played": "Yes",
    "walked": "Yes",
    "exercise": "Yes",
    "participated": "Yes",
    "activity": "Yes",
    "drawing": "Yes",
    "games": "Yes",
    "refused activity": "No",
    "stayed in room": "No",
    "no activity": "No"
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
        "incident": match_phrase(text, INCIDENT_MAP),
        "medication": match_phrase(text, MEDICATION_MAP),
        "activity": match_phrase(text, ACTIVITY_MAP)
    }
