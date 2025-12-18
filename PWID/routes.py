from flask import jsonify, request, Blueprint
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, PWID, Caretaker, Routinelog
from flasgger import swag_from 
from risk_engine import calculate_risk

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/pwids', methods=['GET'])
def get_pwids():
    pwids = PWID.query.all()
    pwid_list = [{
        'id': pwid.id,
        'full_name': pwid.full_name,
        'age': pwid.age,
        'age_group': pwid.age_group,
        'support_level': pwid.support_level,
        'ngo_name': pwid.ngo_name,
        'location_type': pwid.location_type,
        'baseline_mood': pwid.baseline_mood,
        'is_active': pwid.is_active,
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
        'age': pwid.age,
        'age_group': pwid.age_group,
        'support_level': pwid.support_level,
        'ngo_name': pwid.ngo_name,
        'location_type': pwid.location_type,
        'baseline_mood': pwid.baseline_mood,
        'is_active': pwid.is_active,
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
@swag_from({
    "tags": ["PWIDs"],
    "summary": "Get list of all PWIDs",
    "description": "Retrieve a list of all Persons With Intellectual Disabilities (PWIDs) in the system.",
    "produces": ["application/json"],
    "responses": {
        200: {
            "description": "List of PWIDs",
            "schema": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "full_name": {"type": "string"},
                        "age": {"type": "integer"},
                        "age_group": {"type": "string"},
                        "support_level": {"type": "string"},
                        "ngo_name": {"type": "string"},
                        "location_type": {"type": "string"},
                        "baseline_mood": {"type": "string"},
                        "is_active": {"type": "boolean"},
                        "created_at": {"type": "string", "format": "date-time"}
                    }
                }
            }
        }
    }
})
def list_pwids():
    pwids = PWID.query.all()
    pwid_list = [{
        'id': pwid.id,
        'full_name': pwid.full_name,
        'age': pwid.age,
        'age_group': pwid.age_group,
        'support_level': pwid.support_level,
        'ngo_name': pwid.ngo_name,
        'location_type': pwid.location_type,
        'baseline_mood': pwid.baseline_mood,
        'is_active': pwid.is_active,
        'created_at': pwid.created_at
    } for pwid in pwids]
    return jsonify(pwid_list)

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

    risk = calculate_risk(logs)

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
    pwids = PWID.query.filter_by(is_active=True).all()
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

        risk = calculate_risk(recent_logs)
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
