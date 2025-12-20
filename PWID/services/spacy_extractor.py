import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# -------------------------
# Keyword Definitions
# -------------------------

MOOD_KEYWORDS = {
    "Anxious": {"anxious", "restless", "nervous", "scared"},
    "Irritable": {"angry", "irritated", "annoyed"},
    "Aggressive": {"aggressive", "hit", "hitting", "shout", "shouting"},
    "Sad": {"sad", "cry", "crying", "upset"},
    "Happy": {"happy", "smile", "smiling", "laugh", "laughing", "excited", "good", "great"},
    "Calm": {"calm", "quiet", "relaxed", "okay", "fine", "peaceful"}
}

SLEEP_KEYWORDS = {
    "Good": {"sleep", "slept", "rested"},
    "Poor": {"awake", "insomnia"},
    "Disturbed": {"restless", "wake", "woke"}
}

MEAL_KEYWORDS = {
    "Skipped": {"skip", "refuse"},
    "Reduced": {"less", "little", "partial"},
    "Normal": {"eat", "ate", "finish", "meal"}
}

INCIDENT_KEYWORDS = {
    "Minor": {"shout", "argue", "fell", "fall", "slip", "trip"},
    "Concerning": {"hit", "throw", "injury", "bruise"},
    "Critical": {"attack", "emergency"}
}

MEDICATION_KEYWORDS = {
    "Yes": {"took", "given"},
    "Missed": {"miss"},
    "Refused": {"refuse", "spit"}
}

ACTIVITY_KEYWORDS = {
    "Yes": {"play", "walk", "exercise", "participate", "draw", "game"},
    "No": {"refuse", "stay", "inactive"}
}

# -------------------------
# Helper Functions
# -------------------------

def is_negated(token):
    """
    Detect negation using dependency parsing.
    Example: 'did not sleep', 'never hit'
    """
    for child in token.children:
        if child.dep_ == "neg":
            return True
    return False


def extract_category(doc, keyword_map, default="Unknown"):
    """
    Extract category value using lemma matching,
    sentence awareness, and negation handling.
    """
    detected = []

    for sent in doc.sents:
        for token in sent:
            lemma = token.lemma_.lower()

            for label, keywords in keyword_map.items():
                if lemma in keywords and not is_negated(token):
                    detected.append(label)

    # If multiple detected, return the last (strongest contextually)
    if detected:
        return detected[-1]

    return default


# -------------------------
# Main Extraction Function
# -------------------------

def extract_with_spacy(text: str):
    """
    Convert caregiver free-text into structured fields.
    Conservative, explainable, NGO-safe.
    """
    if not text or not text.strip():
        return {
            "mood": "Unknown",
            "sleep": "Unknown",
            "meals": "Unknown",
            "incident": "Unknown",
            "medication": "Unknown",
            "activity": "Unknown"
        }

    doc = nlp(text.lower())

    return {
        "mood": extract_category(doc, MOOD_KEYWORDS),
        "sleep": extract_category(doc, SLEEP_KEYWORDS),
        "meals": extract_category(doc, MEAL_KEYWORDS),
        "incident": extract_category(doc, INCIDENT_KEYWORDS),
        "medication": extract_category(doc, MEDICATION_KEYWORDS),
        "activity": extract_category(doc, ACTIVITY_KEYWORDS)
    }
