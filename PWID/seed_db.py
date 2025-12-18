from datetime import datetime
from werkzeug.security import generate_password_hash

from app import app
from models import db, PWID, Caretaker


def seed_caretakers():
    caretakers = [
        {
            "name": "Primary Caregiver",
            "email": "caregiver@ngo.test",
            "password": "password123",
            "ngo_name": "Sunrise NGO",
            "role": "admin"
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
            created_at=datetime.utcnow()
        )
        db.session.add(caretaker)

    db.session.commit()


def seed_pwid():
    pwids = [
        ("Aarav Sharma", 10, "child", "high", "Sunrise NGO", "calm"),
        ("Meera Joshi", 14, "adolescent", "medium", "Sunrise NGO", "anxious"),
        ("Rohan Kulkarni", 22, "adult", "low", "HopeCare", "calm"),
        ("Kiran Patil", 18, "adolescent", "medium", "HopeCare", "irritable"),
        ("Neha Verma", 30, "adult", "high", "Sahara Foundation", "calm"),
        ("Amit Nair", 8, "child", "high", "Sahara Foundation", "anxious"),
        ("Pooja Choudhary", 16, "adolescent", "medium", "Sunrise NGO", "calm"),
        ("Rahul Singh", 25, "adult", "low", "HopeCare", "calm"),
        ("Snehal Deshpande", 12, "child", "high", "Sahara Foundation", "irritable"),
        ("Vikas Malhotra", 35, "adult", "medium", "HopeCare", "calm"),
        ("Ananya Rao", 9, "child", "high", "Sunrise NGO", "anxious"),
        ("Manoj Kulkarni", 28, "adult", "low", "Sahara Foundation", "calm"),
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
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.session.add(pwid)

    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        print("🌱 Seeding database...")
        seed_caretakers()
        seed_pwid()
        print("✅ Seeding complete.")
