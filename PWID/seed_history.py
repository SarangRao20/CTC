import random
from datetime import datetime, timedelta
from app import app
from models import db, PWID, Routinelog, Caretaker, Task

def seed_history():
    with app.app_context():
        print("Seeding realistic history...")

        # Ensure we have a caretaker
        caretaker = Caretaker.query.first()
        if not caretaker:
            print("No caretaker found. Please run seed_db.py first or register one.")
            return

        pwids = PWID.query.all()
        if not pwids:
            print("No PWIDs found. Please run seed_db.py first.")
            return

        # Clear existing logs to avoid duplicates if re-run (optional, but good for clean state)
        # db.session.query(Routinelog).delete()
        # db.session.commit()

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)

        moods = ["Calm", "Happy", "Anxious", "Irritable", "Aggressive"]
        sleeps = ["Good", "Disturbed", "Poor"]
        meals = ["Normal", "Reduced", "Skipped"]
        incidents = ["None", "Minor", "Concerning"] # "None" usually maps to "no" in some logic, let's stick to consistent values
        # In risk_engine: None, Minor, Concerning
        # In old seed: yes/no. Let's align with risk engine for better charts.
        
        # Adjust probabilities for "realistic" data (mostly stable, occasional issues)
        mood_weights = [0.6, 0.2, 0.1, 0.05, 0.05]
        sleep_weights = [0.7, 0.2, 0.1]
        meal_weights = [0.8, 0.15, 0.05]
        incident_weights = [0.9, 0.08, 0.02]

        for pwid in pwids:
            print(f"Generating logs for {pwid.full_name}...")
            
            # Simulate a trend for specific patients to make charts interesting
            # e.g., if ID is even, they are deeper in "Anxious" lately
            is_anxious_patient = (pwid.id % 2 == 0)

            curr = start_date
            while curr <= end_date:
                # Base random choices
                mood = random.choices(moods, weights=mood_weights if not is_anxious_patient else [0.4, 0.1, 0.3, 0.1, 0.1])[0]
                sleep = random.choices(sleeps, weights=sleep_weights)[0]
                meal = random.choices(meals, weights=meal_weights)[0]
                incident = random.choices(incidents, weights=incident_weights)[0]

                # If incident occurred, mood likely bad
                if incident in ["Minor", "Concerning"]:
                    mood = random.choice(["Irritable", "Aggressive", "Anxious"])
                    if incident == "Concerning":
                        sleep = "Poor"

                log = Routinelog(
                    pwid_id=pwid.id,
                    sleep_quality=sleep,
                    meals=meal,
                    medication_given="Yes", # Assume mostly compliant
                    mood=mood,
                    activity_done=random.choice(["Yes", "No"]),
                    incident=incident,
                    notes=f"Routine check at {curr.strftime('%H:%M')}. Observed {mood.lower()} mood.",
                    created_at=curr,
                    created_by=caretaker.id
                )
                db.session.add(log)
                
                # Advance 1 day (maybe varying times)
                curr += timedelta(days=1, hours=random.randint(-2, 2))
        
        db.session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_history()
