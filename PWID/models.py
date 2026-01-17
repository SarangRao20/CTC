from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class NGO(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    type = db.Column(db.String(50), nullable=False) # 'residential', 'non-residential'
    address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PWID(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    age_group = db.Column(db.String(50), nullable=False)
    support_level = db.Column(db.String(50), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False) # Keep as string for now to avoid breaking existing code, or ideally FK to NGO
    location_type = db.Column(db.String(50), nullable=False)
    baseline_mood = db.Column(db.String(50), nullable=False)
    room_number = db.Column(db.String(50))
    primary_diagnosis = db.Column(db.String(255))
    medications_json = db.Column(db.JSON)  # Store as a list of strings
    allergies_json = db.Column(db.JSON)    # Store as a list of strings
    is_active = db.Column(db.Boolean, default=True)
    home_address = db.Column(db.String(255)) # New field for non-residential
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Parent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    pwid_id = db.Column(db.Integer, db.ForeignKey('pwid.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TrackingLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pwid_id = db.Column(db.Integer, db.ForeignKey('pwid.id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    departure_time = db.Column(db.DateTime)
    estimated_arrival_time = db.Column(db.DateTime)
    actual_arrival_time = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='in_transit') # 'in_transit', 'arrived', 'overdue'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Caretaker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)

class Routinelog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pwid_id = db.Column(db.Integer, db.ForeignKey('pwid.id'), nullable=False)
    sleep_quality = db.Column(db.String(50), nullable=False)        # good / poor
    meals = db.Column(db.String(50), nullable=False)                # taken / skipped
    medication_given = db.Column(db.String(50), nullable=False)     # yes / no
    mood = db.Column(db.String(50), nullable=False)                 # calm / anxious / irritable / aggressive
    activity_done = db.Column(db.String(50), nullable=False)        # yes / no
    incident = db.Column(db.String(50), nullable=False)             # yes / no
    notes = db.Column(db.Text)                                       # free text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('caretaker.id'), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pwid_id = db.Column(db.Integer, db.ForeignKey('pwid.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False) # medication, meal, hygiene, therapy, checkup, other
    priority = db.Column(db.String(50), nullable=False) # urgent, high, normal
    due_time = db.Column(db.String(50), nullable=True) # "10:00 AM"
    status = db.Column(db.String(50), default='pending') # pending, overdue, completed
    completed_at = db.Column(db.DateTime)
    completed_by = db.Column(db.String(100)) # Name of the person who completed it

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pwid_id = db.Column(db.Integer, db.ForeignKey('pwid.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # voice, image, vitals, medication, task-complete, incident, note
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    caregiver_id = db.Column(db.String(50)) # For simplicity, can be id or name
    caregiver_name = db.Column(db.String(100))
    # Optional payloads
    voice_transcription = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    vitals_json = db.Column(db.JSON) # {temperature, heartRate, bloodPressure, weight}