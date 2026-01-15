from flask import jsonify, request, Blueprint
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, PWID, Caretaker, Routinelog, Task, Event, NGO, Parent, TrackingLog
from flasgger import swag_from 
from risk_engine import calculate_single_risk, calculate_trend_risk
from services.observe_engine import process_observation
from services.voice_service import transcribe_audio

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/ngos', methods=['GET'])
def get_ngos():
    # Only return NGOs that have at least one PWID patient
    ngo_names = [n[0] for n in db.session.query(PWID.ngo_name).distinct().all() if n[0]]
    return jsonify(sorted(list(set(ngo_names))))

@routes_bp.route('/pwids', methods=['GET'])
def get_pwids():
    pwids = PWID.query.all()
    pwid_list = [{
        'id': pwid.id,
        'full_name': pwid.full_name,
        'name': pwid.full_name, # Alias for frontend compatibility
        'age': pwid.age,
        'age_group': pwid.age_group,
        'support_level': pwid.support_level,
        'supportLevel': f"{pwid.support_level}-support",
        'functionalSupport': 'moderate' if pwid.support_level == 'medium' else ('extensive' if pwid.support_level == 'high' else 'minimal'),
        'ngo_name': pwid.ngo_name,
        'location_type': pwid.location_type,
        'baseline_mood': pwid.baseline_mood,
        'room_number': pwid.room_number,
        'roomNumber': pwid.room_number, # Alias for frontend
        'primary_diagnosis': pwid.primary_diagnosis,
        'primaryDiagnosis': pwid.primary_diagnosis, # Alias
        'medications': pwid.medications_json or [],
        'allergies': pwid.allergies_json or [],
        'is_active': pwid.is_active,
        'status': 'stable', # Default status for frontend
        'lastCheckDate': pwid.created_at.isoformat(),
        'created_at': pwid.created_at
    } for pwid in pwids]
    return jsonify(pwid_list)

@routes_bp.route('/caretakers', methods=['GET'])
def get_caretakers():
    caretakers = Caretaker.query.all()
    caretaker_list = [{
        'id': caretaker.id,
        'name': caretaker.name,
        'email': caretaker.email,
        'ngo_name': caretaker.ngo_name,
        'role': caretaker.role,
        'created_at': caretaker.created_at,
        'last_login_at': caretaker.last_login_at
    } for caretaker in caretakers]
    return jsonify(caretaker_list)

@routes_bp.route('/caretaker/register', methods=['POST'])
@swag_from({
    "tags": ["Caretaker Auth"],
    "summary": "Register a new caretaker",
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "password": {"type": "string"},
                    "ngo_name": {"type": "string"},
                    "role": {"type": "string"}
                }
            }
        }
    ],
    "responses": {
        201: {"description": "Caretaker registered successfully"},
        400: {"description": "Email already exists or missing fields"}
    }
})
def register_caretaker():
    data = request.get_json()
    if not all(k in data for k in ('name', 'email', 'password', 'ngo_name', 'role')):
        return jsonify({'error': 'Missing fields'}), 400
    
    if Caretaker.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create or Get NGO
    ngo = NGO.query.filter_by(name=data['ngo_name']).first()
    if not ngo:
        # If NGO doesn't exist, create it (assuming data provides type/address for new NGOs)
        ngo_type = data.get('ngo_type', 'residential') # Default to residential if not key
        ngo_address = data.get('ngo_address', '')
        ngo = NGO(name=data['ngo_name'], type=ngo_type, address=ngo_address)
        db.session.add(ngo)
        db.session.commit()

    hashed_password = generate_password_hash(data['password'])
    caretaker = Caretaker(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        ngo_name=data['ngo_name'],
        role=data['role'],
        created_at=datetime.utcnow()
    )
    db.session.add(caretaker)
    db.session.commit()

    # Return the registered caretaker details including NGO name
    return jsonify({
        'message': 'Caretaker registered successfully',
        'caretaker': {
            'id': caretaker.id,
            'name': caretaker.name,
            'email': caretaker.email,
            'role': caretaker.role,
            'ngo_name': caretaker.ngo_name
        }
    }), 201

@routes_bp.route('/caretaker/login', methods=['POST'])
@swag_from({
    "tags": ["Caretaker Auth"],
    "summary": "Login a caretaker",
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "email": {"type": "string"},
                    "password": {"type": "string"}
                }
            }
        }
    ],
    "responses": {
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"}
    }
})
def login_caretaker():
    data = request.get_json()
    caretaker = Caretaker.query.filter_by(email=data.get('email')).first()
    
    if caretaker and check_password_hash(caretaker.password_hash, data.get('password')):
        caretaker.last_login_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'message': 'Login successful',
            'caretaker': {
                'id': caretaker.id,
                'name': caretaker.name,
                'email': caretaker.email,
                'role': caretaker.role,
                'ngo_name': caretaker.ngo_name
            }
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@routes_bp.route('/routinelogs', methods=['POST'])
def create_routinelog():
    data = request.get_json()
    routinelog = Routinelog(
        pwid_id=data['pwid_id'],
        sleep_quality=data['sleep_quality'],
        meals=data['meals'],
        medication_given=data['medication_given'],
        mood=data['mood'],
        activity_done=data['activity_done'],
        incident=data['incident'],
        notes=data.get('notes', ''),
        created_at=datetime.utcnow(),
        created_by=data['created_by']
    )
    db.session.add(routinelog)
    db.session.commit()
    return jsonify({'message': 'Routinelog created successfully'}), 201

@routes_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

@routes_bp.route('/pwids/<int:pwid_id>', methods=['GET'])
def get_pwid(pwid_id):
    pwid = PWID.query.get_or_404(pwid_id)
    pwid_data = {
        'id': pwid.id,
        'full_name': pwid.full_name,
        'name': pwid.full_name,
        'age': pwid.age,
        'age_group': pwid.age_group,
        'support_level': pwid.support_level,
        'supportLevel': f"{pwid.support_level}-support",
        'functionalSupport': 'moderate' if pwid.support_level == 'medium' else ('extensive' if pwid.support_level == 'high' else 'minimal'),
        'ngo_name': pwid.ngo_name,
        'location_type': pwid.location_type,
        'baseline_mood': pwid.baseline_mood,
        'room_number': pwid.room_number,
        'roomNumber': pwid.room_number,
        'primary_diagnosis': pwid.primary_diagnosis,
        'primaryDiagnosis': pwid.primary_diagnosis,
        'medications': pwid.medications_json or [],
        'allergies': pwid.allergies_json or [],
        'is_active': pwid.is_active,
        'status': 'stable',
        'lastCheckDate': pwid.created_at.isoformat(),
        'created_at': pwid.created_at
    }
    return jsonify(pwid_data)

@routes_bp.route('/caretakers/<int:caretaker_id>', methods=['GET'])
def get_caretaker(caretaker_id):
    caretaker = Caretaker.query.get_or_404(caretaker_id)
    caretaker_data = {
        'id': caretaker.id,
        'name': caretaker.name,
        'email': caretaker.email,
        'ngo_name': caretaker.ngo_name,
        'role': caretaker.role,
        'created_at': caretaker.created_at,
        'last_login_at': caretaker.last_login_at
    }
    return jsonify(caretaker_data)

@routes_bp.route('/log', methods=["POST"])
@swag_from({
    "tags": ["Routine Logs"],
    "summary": "Create a routine log for a PWID",
    "description": "Allows a caretaker to submit daily routine and behaviour observations for a PWID.",
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "required": [
                    "pwid_id",
                    "sleep_quality",
                    "meals",
                    "medication_given",
                    "mood",
                    "activity_done",
                    "incident"
                ],
                "properties": {
                    "pwid_id": {"type": "integer", "example": 1},
                    "sleep_quality": {"type": "string", "example": "poor"},
                    "meals": {"type": "string", "example": "skipped"},
                    "medication_given": {"type": "string", "example": "yes"},
                    "mood": {"type": "string", "example": "anxious"},
                    "activity_done": {"type": "string", "example": "no"},
                    "incident": {"type": "string", "example": "no"},
                    "notes": {"type": "string", "example": "Restless and avoided activities"}
                }
            }
        }
    ],
    "responses": {
        201: {
            "description": "Log created successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "log_id": {"type": "integer"}
                }
            }
        },
        400: {"description": "Missing or invalid fields"},
        404: {"description": "PWID not found"}
    }
})
def create_log():
    data = request.get_json()
    required_fields = [
        'pwid_id',
        'sleep_quality',
        'meals',
        'medication_given',
        'mood',
        'activity_done',
        'incident',
    ]

    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
    
    log = Routinelog(
        pwid_id=data['pwid_id'],
        sleep_quality=data['sleep_quality'],
        meals=data['meals'],
        medication_given=data['medication_given'],
        mood=data['mood'],
        activity_done=data['activity_done'],
        incident=data['incident'],
        notes=data.get('notes', ''),
        created_at=datetime.now(),
        created_by=1
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Log created successfully",
        "log_id": log.id
    }), 201

@routes_bp.route('/logs/<pwid_id>', methods=['GET'])
@swag_from({
    "tags": ["Routine Logs"],
    "summary": "Get routine logs for a PWID",
    "description": "Retrieve all routine and behavioural logs associated with a specific PWID chronologically.",
    "produces": ["application/json"],
    "parameters": [
        {
            "name": "pwid_id",
            "in": "path",
            "type": "integer",
            "required": True,
            "description": "ID of the PWID"
        }
    ],
    "responses": {
        200: {
            "description": "List of routine logs",
            "schema": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "sleep_quality": {"type": "string"},
                        "meals": {"type": "string"},
                        "medication_given": {"type": "string"},
                        "mood": {"type": "string"},
                        "activity_done": {"type": "string"},
                        "incident": {"type": "string"},
                        "notes": {"type": "string"},
                        "created_at": {"type": "string", "format": "date-time"},
                    }
                }
            }
        },
        404: {"description": "PWID not found"}
    }
})
def get_logs(pwid_id):
    pwid = PWID.query.get_or_404(pwid_id)
    logs = Routinelog.query.filter_by(pwid_id=pwid.id).order_by(Routinelog.created_at).all()
    log_list = [{
        'id': log.id,
        'sleep_quality': log.sleep_quality,
        'meals': log.meals,
        'medication_given': log.medication_given,
        'mood': log.mood,
        'activity_done': log.activity_done,
        'incident': log.incident,
        'notes': log.notes,
        'created_at': log.created_at
    } for log in logs]
    return jsonify(log_list)

@routes_bp.route('/pwid/list', methods=['GET'])
def list_pwids():
    ngo_filter = request.args.get('ngo')
    if ngo_filter:
        pwids = PWID.query.filter_by(ngo_name=ngo_filter, is_active=True).all()
    else:
        # If no filter, technically return [] or all? 
        # For security, better to return empty if no NGO context, but to keep existing functionality for dev:
        pwids = PWID.query.all()
        
    pwid_list = []
    
    for pwid in pwids:
        # Calculate status based on tasks
        overdue_count = Task.query.filter_by(pwid_id=pwid.id, status='pending').count()
        status = 'stable'
        if overdue_count >= 1: status = 'attention'
        if overdue_count >= 2: status = 'urgent'
        
        pwid_list.append({
            'id': str(pwid.id),
            'name': pwid.full_name,
            'full_name': pwid.full_name,
            'age': pwid.age,
            'roomNumber': pwid.room_number,
            'supportLevel': f"{pwid.support_level}-support",
            'functionalSupport': pwid.support_level.capitalize(),
            'lastCheckDate': pwid.created_at.isoformat(),
            'status': status,
            'primaryDiagnosis': pwid.primary_diagnosis,
            'medications': pwid.medications_json or [],
            'allergies': pwid.allergies_json or []
        })
    return jsonify(pwid_list)

@routes_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats_api():
    ngo_filter = request.args.get('ngo')
    
    # Base PWID query
    pwid_query = PWID.query
    if ngo_filter:
        pwid_query = pwid_query.filter_by(ngo_name=ngo_filter)
    total_patients = pwid_query.count()
    
    # Get IDs for filtering tasks
    pwid_ids = [p.id for p in pwid_query.all()]
    
    if not pwid_ids:
        return jsonify({
        'totalPatients': 0,
        'urgentAlerts': 0,
        'overdueTasks': 0,
        'completedToday': 0,
        'pendingTasks': 0
    })

    # Filter tasks by these PWIDs
    # SQLAlchemy: Task.pwid_id in pwid_ids
    
    # Patients needing immediate attention (at least 1 pending task)
    urgent_patients = db.session.query(Task.pwid_id).filter(Task.status=='pending', Task.pwid_id.in_(pwid_ids)).distinct().count()
    
    overdue_tasks = Task.query.filter(Task.status=='pending', Task.pwid_id.in_(pwid_ids)).count() # Logic: Overdue usually implies pending + time passed, simplifying here as per existing logic
    completed_today = Task.query.filter(Task.status=='completed', Task.pwid_id.in_(pwid_ids)).count() 
    pending_tasks = Task.query.filter(Task.status=='pending', Task.pwid_id.in_(pwid_ids)).count()

    return jsonify({
        'totalPatients': total_patients,
        'urgentAlerts': urgent_patients,
        'overdueTasks': overdue_tasks,
        'completedToday': completed_today,
        'pendingTasks': pending_tasks
    })

@routes_bp.route("/risk/<int:pwid_id>", methods=["GET"])
@swag_from({
    "tags": ["Risk"],
    "summary": "Get risk assessment for a PWID",
    "parameters": [
        {
            "name": "pwid_id",
            "in": "path",
            "type": "integer",
            "required": True
        }
    ],
    "responses": {
        200: {"description": "Risk assessment"},
        404: {"description": "PWID not found"}
    }
})
def get_risk(pwid_id):
    pwid = PWID.query.get(pwid_id)
    if not pwid:
        return {"error": "PWID not found"}, 404

    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    logs = (
        Routinelog.query
        .filter(
            Routinelog.pwid_id == pwid_id,
            Routinelog.created_at >= seven_days_ago
        )
        .all()
    )

    risk = calculate_trend_risk(logs)

    return {
        "pwid_id": pwid_id,
        **risk
    }

@routes_bp.route("/dashboard/summary", methods=["GET"])
@swag_from({
    "tags": ["Dashboard"],
    "summary" : "Get NGO-level dashboard summary",
    "description": "Provides aggregated statistics for the dashboard view at the NGO level.",
    "responses": {
        200: {
            "description" : "Dashboard summary data",
        }
    }
})
def dashboard_summary():
    ngo_filter = request.args.get('ngo')
    query = PWID.query.filter_by(is_active=True)
    if ngo_filter:
        query = query.filter_by(ngo_name=ngo_filter)
        
    pwids = query.all()
    total_pwid = len(pwids)
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    seven_days_ago = now - timedelta(days=7)

    logs_today = Routinelog.query.filter(Routinelog.created_at >= today_start).all()
    incidents_today = [
        log for log in logs_today if log.incident == "yes"
    ]

    risk_summary = {
        "low": 0,
        "medium": 0,
        "high": 0
    }

    for pwid in pwids:
        recent_logs = Routinelog.query.filter(
            Routinelog.pwid_id == pwid.id,
            Routinelog.created_at >= seven_days_ago
        ).all()

        risk = calculate_trend_risk(recent_logs)
        level = risk.get("level")
        if level is not None and level.lower() in risk_summary:
            risk_summary[level.lower()] += 1
        else:
            # Optionally log or handle missing/unknown level
            pass

    return {
        "total_pwid": total_pwid,
        "risk_summary": risk_summary,
        "today": {
            "logs_count": len(logs_today),
            "incidents_count": len(incidents_today)
        }
    }

@routes_bp.route('/events', methods=['GET'])
def get_all_events():
    events = Event.query.order_by(Event.timestamp.desc()).all()
    event_list = [{
        'id': event.id,
        'patientId': event.pwid_id,
        'type': event.type,
        'title': event.title,
        'description': event.description,
        'timestamp': event.timestamp.isoformat(),
        'caregiverId': event.caregiver_id,
        'caregiverName': event.caregiver_name,
        'voiceTranscription': event.voice_transcription,
        'imageUrl': event.image_url,
        'vitals': event.vitals_json
    } for event in events]
    return jsonify(event_list)

@routes_bp.route('/events/<int:pwid_id>', methods=['GET'])
def get_patient_events(pwid_id):
    events = Event.query.filter_by(pwid_id=pwid_id).order_by(Event.timestamp.desc()).all()
    event_list = [{
        'id': event.id,
        'patientId': event.pwid_id,
        'type': event.type,
        'title': event.title,
        'description': event.description,
        'timestamp': event.timestamp.isoformat(),
        'caregiverId': event.caregiver_id,
        'caregiverName': event.caregiver_name,
        'voiceTranscription': event.voice_transcription,
        'imageUrl': event.image_url,
        'vitals': event.vitals_json
    } for event in events]
    return jsonify(event_list)

@routes_bp.route('/events', methods=['POST'])
def create_event():
    data = request.get_json()
    event = Event(
        pwid_id=data['patientId'],
        type=data['type'],
        title=data['title'],
        description=data.get('description', ''),
        caregiver_id=data.get('caregiverId', 'c001'),
        caregiver_name=data.get('caregiverName', 'Alex Morgan'),
        voice_transcription=data.get('voiceTranscription'),
        image_url=data.get('imageUrl'),
        vitals_json=data.get('vitals'),
        timestamp=datetime.utcnow()
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'message': 'Event created successfully', 'id': event.id}), 201

@routes_bp.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    task_list = [{
        'id': task.id,
        'patientId': task.pwid_id,
        'title': task.title,
        'description': task.description,
        'category': task.category,
        'priority': task.priority,
        'dueTime': task.due_time,
        'status': task.status,
        'completedAt': task.completed_at.isoformat() if task.completed_at else None,
        'completedBy': task.completed_by
    } for task in tasks]
    return jsonify(task_list)

@routes_bp.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    
    # Validate required fields
    if not data.get('pwid_id') or not data.get('title'):
        return jsonify({'error': 'Missing required fields: pwid_id and title'}), 400
    
    task = Task(
        pwid_id=data['pwid_id'],
        title=data['title'],
        description=data.get('description', ''),
        category=data.get('category', 'other'),
        priority=data.get('priority', 'medium'),
        due_time=data.get('due_time'),
        status='pending'
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({
        'message': 'Task created successfully',
        'id': task.id,
        'task': {
            'id': task.id,
            'patientId': task.pwid_id,
            'title': task.title,
            'description': task.description,
            'category': task.category,
            'priority': task.priority,
            'dueTime': task.due_time,
            'status': task.status
        }
    }), 201


@routes_bp.route('/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    task.status = 'completed'
    task.completed_at = datetime.utcnow()
    task.completed_by = data.get('completed_by', 'Unknown')
    db.session.commit()
    return jsonify({'message': 'Task marked as complete'})

@routes_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'}), 200

@routes_bp.route('/logs/<int:log_id>', methods=['PATCH'])
def update_log(log_id):
    log = Routinelog.query.get_or_404(log_id)
    data = request.get_json()
    
    if 'mood' in data: log.mood = data['mood']
    if 'sleep' in data: log.sleep_quality = data['sleep']
    if 'sleep_quality' in data: log.sleep_quality = data['sleep_quality']
    if 'meals' in data: log.meals = data['meals']
    if 'medication_given' in data: log.medication_given = data['medication_given']
    if 'activity_done' in data: log.activity_done = data['activity_done']
    if 'incident' in data: log.incident = data['incident']
    if 'notes' in data: log.notes = data['notes']
    
    db.session.commit()
    return jsonify({'message': 'Log updated successfully', 'id': log.id}), 200

@routes_bp.route("/observe", methods=["POST"])
def observe_input():
    data = request.get_json()

    text = data.get("text")
    pwid_id = data.get("pwid_id")
    caregiver_id = data.get("caregiver_id", 1)

    if not text or not pwid_id:
        return jsonify({"error": "Missing text or pwid_id"}), 400

    # 1️⃣ AI extraction
    observation = process_observation(text)

    # 2️⃣ Risk scoring (single day)
    risk = calculate_single_risk({
        "mood": observation.get("mood", "Unknown"),
        "sleep": observation.get("sleep", "Unknown"),
        "meals": observation.get("meals", "Unknown"),
        "incident": observation.get("incident", "Unknown")
    })

    # 3️⃣ Save as routine log
    log = Routinelog(
        pwid_id=pwid_id,
        sleep_quality=observation.get("sleep", "Unknown"),
        meals=observation.get("meals", "Unknown"),
        medication_given=observation.get("medication", "Unknown"), # Now dynamic
        mood=observation.get("mood", "Unknown"),
        activity_done=observation.get("activity", "Unknown"), # Now dynamic
        incident=observation.get("incident", "Unknown"),
        notes=observation.get("notes", text),
        created_at=datetime.utcnow(),
        created_by=caregiver_id
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "structured_observation": observation,
        "risk": risk,
        "log_id": log.id
    }), 201

@routes_bp.route("/api/voice/transcribe", methods=["POST"])
def voice_transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        audio_data = file.read()
        result = transcribe_audio(audio_data)
        
        if "error" in result:
             return jsonify(result), 500
             

@routes_bp.route('/parent/register', methods=['POST'])
def register_parent():
    data = request.get_json()
    if not all(k in data for k in ('name', 'email', 'password', 'pwid_id')):
        return jsonify({'error': 'Missing fields'}), 400
    
    if Parent.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    parent = Parent(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        pwid_id=data['pwid_id'],
        created_at=datetime.utcnow()
    )
    db.session.add(parent)
    db.session.commit()

    return jsonify({
        'message': 'Parent registered successfully',
        'parent': {
            'id': parent.id,
            'name': parent.name,
            'email': parent.email,
            'pwid_id': parent.pwid_id,
            'role': 'Parent'
        }
    }), 201

@routes_bp.route('/parent/login', methods=['POST'])
def login_parent():
    data = request.get_json()
    parent = Parent.query.filter_by(email=data.get('email')).first()
    
    if parent and check_password_hash(parent.password_hash, data.get('password')):
        return jsonify({
            'message': 'Login successful',
            'parent': {
                'id': parent.id,
                'name': parent.name,
                'email': parent.email,
                'pwid_id': parent.pwid_id,
                'role': 'Parent'
            }
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@routes_bp.route('/api/track/depart', methods=['POST'])
def track_depart():
    data = request.get_json()
    pwid_id = data.get('pwid_id')
    
    if not pwid_id:
        return jsonify({'error': 'Missing pwid_id'}), 400
        
    pwid = PWID.query.get_or_404(pwid_id)
    
    # Mock ETA Calculation: random between 20-40 minutes
    import random
    travel_time_minutes = random.randint(20, 40)
    departure_time = datetime.utcnow()
    estimated_arrival_time = departure_time + timedelta(minutes=travel_time_minutes)
    
    log = TrackingLog(
        pwid_id=pwid_id,
        date=departure_time.date(),
        departure_time=departure_time,
        estimated_arrival_time=estimated_arrival_time,
        status='in_transit'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Departure logged',
        'estimated_arrival': estimated_arrival_time.isoformat(),
        'minutes': travel_time_minutes
    }), 201

@routes_bp.route('/api/track/status/<int:pwid_id>', methods=['GET'])
def track_status(pwid_id):
    # Get the latest log for today
    today = datetime.utcnow().date()
    log = TrackingLog.query.filter_by(pwid_id=pwid_id, date=today).order_by(TrackingLog.created_at.desc()).first()
    
    if not log:
        return jsonify({'status': 'no_record', 'message': 'No travel logged for today.'})
    
    # Check for overdue
    if log.status == 'in_transit' and log.estimated_arrival_time:
         # Add 10 minutes buffer as per requirement (5-10 min)
         if datetime.utcnow() > (log.estimated_arrival_time + timedelta(minutes=10)):
             log.status = 'overdue'
             db.session.commit()
             # Ideally trigger notification here (email/sms)
        
    return jsonify({
        'status': log.status,
        'departure_time': log.departure_time.isoformat() if log.departure_time else None,
        'estimated_arrival_time': log.estimated_arrival_time.isoformat() if log.estimated_arrival_time else None,
        'actual_arrival_time': log.actual_arrival_time.isoformat() if log.actual_arrival_time else None,
        'log_id': log.id
    })

@routes_bp.route('/api/track/confirm', methods=['POST'])
def track_confirm():
    data = request.get_json()
    log_id = data.get('log_id')
    
    if not log_id:
        return jsonify({'error': 'Missing log_id'}), 400
        
    log = TrackingLog.query.get_or_404(log_id)
    log.status = 'arrived'
    log.actual_arrival_time = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Arrival confirmed'}), 200
