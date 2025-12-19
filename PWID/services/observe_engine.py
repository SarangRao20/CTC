from services.spacy_extractor import extract_with_spacy
from services.llm_client import call_llm

def calculate_confidence(data):
    unknowns = list(data.values()).count("Unknown")
    if unknowns == 0:
        return "High"
    if unknowns <= 2:
        return "Medium"
    return "Low"

def process_observation(text: str):
    base = extract_with_spacy(text)
    confidence = calculate_confidence(base)

    if confidence != "Low":
        return {
            "mood": base.get("mood", "Unknown"),
            "sleep": base.get("sleep", "Unknown"),
            "meals": base.get("meals", "Unknown"),
            "medication": base.get("medication", "Unknown"),
            "activity": base.get("activity", "Unknown"),
            "incident": base.get("incident", "Unknown"),
            "notes": text.strip(),
            "confidence": confidence,
            "source": "rule-based",
            "explanation": "Observation extracted using rule-based analysis."
        }

    # Low confidence → LLM fallback
    llm_output = call_llm(text)

    # Normalize & protect schema
    return {
        "mood": llm_output.get("mood", "Unknown"),
        "sleep": llm_output.get("sleep", "Unknown"),
        "meals": llm_output.get("meals", "Unknown"),
        "medication": llm_output.get("medication", "Unknown"),
        "activity": llm_output.get("activity", "Unknown"),
        "incident": llm_output.get("incident", "Unknown"),
        "notes": llm_output.get("notes", text.strip()),
        "confidence": "Low",
        "source": "llm-fallback",
        "explanation": "Observation inferred with AI assistance due to unclear input."
    }
