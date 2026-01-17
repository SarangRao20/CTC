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
        "level": level,
        "score": score,
        "reason": explanation,
        "factors": {
            "mood": mood,
            "sleep": sleep,
            "meals": meals
        }
    }

def calculate_trend_risk(logs):
    """
    Analyzes a list of routine logs (e.g., last 7 days) to determine trend-based risk.
    Attributes detailed reasons and identifying specific factors.
    """
    if not logs:
        return {
            "level": "Low",
            "score": 0,
            "reason": "No recent logs to analyze.",
            "factors": {"mood": "N/A", "sleep": "N/A"},
            "details": []
        }

    high_risk_count = 0
    medium_risk_count = 0
    total_score = 0
    
    recent_reasons = []
    
    # Frequency analysis
    mood_counts = {}
    sleep_counts = {}

    for log in logs:
        # Calculate risk for each log individually
        result = calculate_single_risk(log)
        score = result["score"]
        level = result["level"]
        
        # Track Factors
        curr_mood = result["factors"]["mood"]
        curr_sleep = result["factors"]["sleep"]
        mood_counts[curr_mood] = mood_counts.get(curr_mood, 0) + 1
        sleep_counts[curr_sleep] = sleep_counts.get(curr_sleep, 0) + 1

        total_score += score
        
        if level == "High":
            high_risk_count += 1
            recent_reasons.append(f"High risk detected on {log.created_at.strftime('%Y-%m-%d')}: {result['reason']}")
        elif level == "Medium":
            medium_risk_count += 1
            recent_reasons.append(f"Medium risk on {log.created_at.strftime('%Y-%m-%d')}: {result['reason']}")

    # Trend logic
    trend_level = "Low"
    trend_reason = "Stable trend over recent logs."

    if high_risk_count >= 2:
        trend_level = "High"
        trend_reason = f"Critical Alert: {high_risk_count} high-risk incidents detected recently."
    elif high_risk_count == 1: 
        trend_level = "Medium"
        trend_reason = "Warning: A high-risk incident was recently recorded."
    elif medium_risk_count >= 3:
        trend_level = "Medium"
        trend_reason = "Caution: Consistent signs of deterioration detected."
    
    avg_score = total_score / len(logs)

    # Determine dominant factors
    dominant_mood = max(mood_counts, key=mood_counts.get) if mood_counts else "Unknown"
    dominant_sleep = max(sleep_counts, key=sleep_counts.get) if sleep_counts else "Unknown"
    
    # Refine factors string
    mood_str = dominant_mood
    if mood_counts.get(dominant_mood, 0) < len(logs) * 0.6: # If less than 60% dominant
        mood_str = "Fluctuating"
        
    sleep_str = dominant_sleep
    if sleep_counts.get(dominant_sleep, 0) < len(logs) * 0.6:
        sleep_str = "Variable"

    return {
        "level": trend_level,
        "score": round(avg_score, 2),
        "reason": trend_reason,
        "details": recent_reasons,
        "factors": {
            "mood": mood_str,
            "sleep": sleep_str 
        }
    }
