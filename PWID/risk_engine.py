def score_mood(mood):
    return {
        "Calm": 0,
        "Happy": 0,
        "Anxious": 2,
        "Irritable": 3,
        "Aggressive": 5,
        "Unknown": 1
    }.get(mood, 1)

def score_sleep(sleep):
    return {
        "Good": 0,
        "Disturbed": 1,
        "Poor": 2,
        "Unknown": 1
    }.get(sleep, 1)

def score_meals(meals):
    return {
        "Normal": 0,
        "Reduced": 1,
        "Skipped": 2,
        "Unknown": 1
    }.get(meals, 1)

def score_incident(incident):
    return {
        "None": 0,
        "Minor": 3,
        "Concerning": 6,
        "Unknown": 2
    }.get(incident, 2)

def calculate_single_risk(observation):
    # Handle both dict and object (SQLAlchemy model) input
    if isinstance(observation, dict):
        mood = observation.get("mood", "Unknown")
        sleep = observation.get("sleep", "Unknown")
        meals = observation.get("meals", "Unknown")
        incident = observation.get("incident", "Unknown")
    else:
        # Assuming it's a Routinelog object
        mood = observation.mood
        sleep = observation.sleep_quality
        meals = observation.meals
        incident = observation.incident

    score = (
        score_mood(mood) +
        score_sleep(sleep) +
        score_meals(meals) +
        score_incident(incident)
    )

    if score >= 8:
        level = "High"
    elif score >= 4:
        level = "Medium"
    else:
        level = "Low"

    reason = []
    if mood not in ["Calm", "Happy"]:
        reason.append(f"{mood.lower()} mood")
    if sleep in ["Poor", "Disturbed"]:
        reason.append(f"{sleep.lower()} sleep")
    if meals in ["Skipped", "Reduced"]:
        reason.append(f"{meals.lower()} meals")
    if incident != "None" and incident != "no":
        reason.append("incident reported")

    explanation = ", ".join(reason).capitalize() + " observed." if reason else "Stable condition."

    return {
        "risk_level": level,
        "risk_score": score,
        "reason": explanation
    }

def calculate_trend_risk(logs):
    """
    Analyzes a list of routine logs (e.g., last 7 days) to determine trend-based risk.
    """
    if not logs:
        return {
            "risk_level": "Low",
            "risk_score": 0,
            "reason": "No recent logs to analyze."
        }

    high_risk_count = 0
    medium_risk_count = 0
    total_score = 0
    
    recent_reasons = []

    for log in logs:
        # Calculate risk for each log individually
        result = calculate_single_risk(log)
        score = result["risk_score"]
        level = result["risk_level"]
        
        total_score += score
        
        if level == "High":
            high_risk_count += 1
            recent_reasons.append(f"High risk on {log.created_at.strftime('%Y-%m-%d')}")
        elif level == "Medium":
            medium_risk_count += 1

    # Trend logic
    trend_level = "Low"
    trend_reason = "Stable trend over recent logs."

    if high_risk_count >= 2:
        trend_level = "High"
        trend_reason = f"Multiple high-risk days ({high_risk_count}) detected recently."
    elif high_risk_count == 1 or medium_risk_count >= 3:
        trend_level = "Medium"
        trend_reason = "Signs of deterioration detected in recent logs."
    
    avg_score = total_score / len(logs)

    return {
        "risk_level": trend_level,
        "risk_score": round(avg_score, 2),
        "reason": trend_reason,
        "details": recent_reasons
    }
