from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

from app import app
from models import db, PWID, Caretaker, Task, Event


def seed_caretakers():
    caretakers = [
        {
            "name": "Primary Caregiver",
            "email": "caregiver@ngo.test",
            "password": "password123",
            "ngo_name": "Sunrise NGO",
            "role": "admin"
        },
        {
            "name": "Alex Morgan",
            "email": "alex@ngo.test",
            "password": "password123",
            "ngo_name": "CareConnect NGO",
            "role": "Senior Caregiver"
        },
        {
            "name": "Sarah Connor",
            "email": "sarah@ngo.test",
            "password": "password123",
            "ngo_name": "Sunrise NGO",
            "role": "Coordinator"
        }
    ]

    for c in caretakers:
        exists = Caretaker.query.filter_by(email=c["email"]).first()
        if exists:
            continue

        caretaker = Caretaker(
            name=c["name"],
            email=c["email"],
            password_hash=generate_password_hash(c["password"]),
            ngo_name=c["ngo_name"],
            role=c["role"],
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(caretaker)

    db.session.commit()


def seed_pwid():
    pwids = [
        ("Aarav Sharma", 10, "child", "high", "Sunrise NGO", "calm", "A12", "Autism", ["Risperidone"], ["None"]),
        ("Meera Joshi", 14, "adolescent", "medium", "Sunrise NGO", "anxious", "B07", "Down Syndrome", ["Levothyroxine"], ["Penicillin"]),
        ("Rohan Kulkarni", 22, "adult", "low", "HopeCare", "calm", "C03", "Intellectual Disability", ["Multivitamin"], ["None"]),
        ("Kiran Patil", 18, "adolescent", "medium", "HopeCare", "irritable", "D21", "Cerebral Palsy", ["Baclofen"], ["Peanuts"]),
        ("Neha Verma", 30, "adult", "high", "Sahara Foundation", "calm", "E11", "Autism", ["Risperidone"], ["None"]),
        ("Amit Nair", 8, "child", "high", "Sahara Foundation", "anxious", "F09", "Down Syndrome", ["Levothyroxine"], ["None"]),
        ("Pooja Choudhary", 16, "adolescent", "medium", "Sunrise NGO", "calm", "A05", "Intellectual Disability", ["Multivitamin"], ["None"]),
        ("Rahul Singh", 25, "adult", "low", "HopeCare", "calm", "B02", "Cerebral Palsy", ["Baclofen"], ["None"]),
        ("Snehal Deshpande", 12, "child", "high", "Sahara Foundation", "irritable", "C12", "Autism", ["Risperidone"], ["None"]),
        ("Vikas Malhotra", 35, "adult", "medium", "HopeCare", "calm", "D04", "Down Syndrome", ["Levothyroxine"], ["None"]),
        ("Ananya Rao", 9, "child", "high", "Sunrise NGO", "anxious", "E08", "Intellectual Disability", ["Multivitamin"], ["None"]),
        ("Manoj Kulkarni", 28, "adult", "low", "Sahara Foundation", "calm", "F01", "Cerebral Palsy", ["Baclofen"], ["None"]),
    ]

    for p in pwids:
        exists = PWID.query.filter_by(full_name=p[0]).first()
        if exists:
            continue

        pwid = PWID(
            full_name=p[0],
            age=p[1],
            age_group=p[2],
            support_level=p[3],
            ngo_name=p[4],
            location_type="NGO",
            baseline_mood=p[5],
            room_number=p[6],
            primary_diagnosis=p[7],
            medications_json=p[8],
            allergies_json=p[9],
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(pwid)

    db.session.commit()


def seed_tasks():
    pwids = PWID.query.all()
    if not pwids:
        return

    tasks_data = [
        ("Morning medication", "Administer prescribed medication with water", "medication", "normal", "08:00 AM"),
        ("Physiotherapy session", "Assist with daily stretching routine", "therapy", "urgent", "10:30 AM"),
        ("Lunch assistance", "Ensure balanced diet and hydration", "meal", "high", "12:30 PM"),
        ("Routine check-up", "Record vitals and general well-being", "checkup", "normal", "03:00 PM"),
    ]

    for pwid in pwids:
        for t in tasks_data:
            exists = Task.query.filter_by(pwid_id=pwid.id, title=t[0]).first()
            if exists:
                continue
            
            task = Task(
                pwid_id=pwid.id,
                title=t[0],
                description=t[1],
                category=t[2],
                priority=t[3],
                due_time=t[4],
                status='pending'
            )
            db.session.add(task)
    
    db.session.commit()


def seed_events():
    pwids = PWID.query.all()
    if not pwids:
        return

    for pwid in pwids:
        events = [
            Event(
                pwid_id=pwid.id,
                type='incident',
                title='Fall reported near bed',
                description='Minor slip; no visible injury. Monitoring for 24h.',
                timestamp=datetime.now(timezone.utc),
                caregiver_id='c001',
                caregiver_name='Alex Morgan'
            ),
            Event(
                pwid_id=pwid.id,
                type='vitals',
                title='Vitals recorded',
                description='Routine vitals check',
                timestamp=datetime.now(timezone.utc),
                caregiver_id='c001',
                caregiver_name='Alex Morgan',
                vitals_json={'temperature': 98.4, 'heartRate': 72, 'bloodPressure': '120/80', 'weight': 150}
            ),
            Event(
                pwid_id=pwid.id,
                type='voice',
                title='Voice note',
                description='Daily behavior summary',
                timestamp=datetime.now(timezone.utc),
                caregiver_id='c001',
                caregiver_name='Alex Morgan',
                voice_transcription='Patient was calm during morning activities.'
            ),
        ]
        db.session.add_all(events)
    
    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        print("🌱 Refreshing database schema...")
        db.drop_all()
        db.create_all()
        print("🌱 Seeding database...")
        seed_caretakers()
        seed_pwid()
        seed_tasks()
        seed_events()
        print("✅ Seeding complete.")
