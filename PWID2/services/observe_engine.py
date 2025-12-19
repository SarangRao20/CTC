from services.llm_client import call_llm
import logging

def process_observation(text: str):
    """
    Process an observation string using the LLM client to extract structured data.
    """
    if not text or len(text.strip()) < 5:
        return {
            "mood": "Unknown",
            "sleep": "Unknown",
            "meals": "Unknown",
            "medication": "Unknown",
            "activity": "Unknown",
            "incident": "Unknown",
            "notes": text,
            "confidence": "Low",
            "source": "rule-based-fallback",
            "explanation": "Input text too short for analysis."
        }

    # Direct call to LLM for extraction
    try:
        llm_output = call_llm(text)
        
        # Ensure default values if LLM misses keys
        return {
            "mood": llm_output.get("mood", "Unknown"),
            "sleep": llm_output.get("sleep", "Unknown"),
            "meals": llm_output.get("meals", "Unknown"),
            "medication": llm_output.get("medication", "Unknown"),
            "activity": llm_output.get("activity", "Unknown"),
            "incident": llm_output.get("incident", "Unknown"),
            "notes": llm_output.get("notes", text.strip()),
            "confidence": llm_output.get("confidence", "Medium"),
            "source": "llm",
            "explanation": llm_output.get("explanation", "Processed by AI.")
        }
    except Exception as e:
        logging.error(f"Error in process_observation: {e}")
        return {
            "mood": "Unknown",
            "sleep": "Unknown",
            "meals": "Unknown",
            "medication": "Unknown",
            "activity": "Unknown",
            "incident": "Unknown",
            "notes": text,
            "confidence": "Low",
            "source": "error-fallback",
            "explanation": "An error occurred during AI processing."
        }
