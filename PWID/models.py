from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class PWID(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    age_group = db.Column(db.String(50), nullable=False)
    support_level = db.Column(db.String(50), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False)
    location_type = db.Column(db.String(50), nullable=False)
    baseline_mood = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, nullable=False)

class Caretaker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
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
    created_at = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('caretaker.id'), nullable=False)