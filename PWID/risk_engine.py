from datetime import datetime, timedelta


def calculate_risk(logs):
    """
    logs: list of RoutineLog objects (recent first or any order)
    """

    score = 0
    reasons = []

    for log in logs:
        # ---- Mood scoring ----
        if log.mood == "anxious":
            score += 2
            reasons.append("anxious mood observed")
        elif log.mood == "irritable":
            score += 3
            reasons.append("irritable behaviour observed")
        elif log.mood == "aggressive":
            score += 5
            reasons.append("aggressive behaviour observed")

        # ---- Routine disruptions ----
        if log.sleep_quality == "poor":
            score += 2
            reasons.append("poor sleep")

        if log.meals == "skipped":
            score += 2
            reasons.append("skipped meals")

        if log.medication_given == "no":
            score += 4
            reasons.append("missed medication")

        if log.activity_done == "no":
            score += 1
            reasons.append("missed activity")

        # ---- Incidents ----
        if log.incident == "yes":
            score += 5
            reasons.append("incident reported")

    # ---- Risk bucket ----
    if score >= 10:
        level = "High"
    elif score >= 5:
        level = "Medium"
    else:
        level = "Low"

    # ---- Explanation ----
    if not reasons:
        explanation = "No concerning patterns observed."
    else:
        explanation = ", ".join(set(reasons))

    return {
        "risk_level": level,
        "score": score,
        "explanation": explanation
    }
