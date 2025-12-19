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

def calculate_risk(observation):
    score = (
        score_mood(observation["mood"]) +
        score_sleep(observation["sleep"]) +
        score_meals(observation["meals"]) +
        score_incident(observation["incident"])
    )

    if score >= 8:
        level = "High"
    elif score >= 4:
        level = "Medium"
    else:
        level = "Low"

    reason = []
    if observation["mood"] not in ["Calm", "Happy"]:
        reason.append(f"{observation['mood'].lower()} mood")
    if observation["sleep"] in ["Poor", "Disturbed"]:
        reason.append(f"{observation['sleep'].lower()} sleep")
    if observation["meals"] in ["Skipped", "Reduced"]:
        reason.append(f"{observation['meals'].lower()} meals")
    if observation["incident"] != "None":
        reason.append("incident reported")

    explanation = ", ".join(reason).capitalize() + " observed."

    return {
        "risk_level": level,
        "risk_score": score,
        "reason": explanation
    }
