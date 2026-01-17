from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import or_, and_
from models import db, Shift, Caretaker, PWID, HandoverSummary
from services.handover_engine import generate_handover_summary

shifts_bp = Blueprint('shifts', __name__)

@shifts_bp.route('/create', methods=['POST'])
def create_shift():
    try:
        data = request.get_json()
        
        # 1. Validation: Overlapping shifts for the same caregiver
        caregiver_id = data['caregiver_id']
        start_time = data['start_time'] # Already ISO String
        end_time = data['end_time'] # Already ISO String
        
        overlapping = Shift.query.filter(
            Shift.caregiver_id == caregiver_id,
            Shift.status.in_(['Scheduled', 'Active']),
            or_(
                and_(Shift.start_time <= start_time, Shift.end_time > start_time),
                and_(Shift.start_time < end_time, Shift.end_time >= end_time),
                and_(Shift.start_time >= start_time, Shift.end_time <= end_time)
            )
        ).first()
        
        if overlapping:
            return jsonify({
                'error': 'Overlap detected',
                'detail': f'Caregiver is already assigned to shift {overlapping.id} during this period.'
            }), 409
            
        # 2. Create Shift
        new_shift = Shift(
            type=data['type'],
            start_time=start_time,
            end_time=end_time,
            caregiver_id=caregiver_id,
            status='Scheduled'
        )
        
        # Optional: Assign PWIDs immediately if provided
        if 'assigned_pwids' in data:
            pwids = PWID.query.filter(PWID.id.in_(data['assigned_pwids'])).all()
            new_shift.assigned_pwids.extend(pwids)
            
        db.session.add(new_shift)
        db.session.commit()
        
        return jsonify(new_shift.to_dict()), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

@shifts_bp.route('/assign_pwids', methods=['POST'])
def assign_pwids():
    try:
        data = request.get_json()
        shift = Shift.query.get_or_404(data['shift_id'])
        
        pwids = PWID.query.filter(PWID.id.in_(data['pwid_ids'])).all()
        
        # Validate: Are these PWIDs already covered by another ACTIVE shift in this time?
        for pwid in pwids:
            overlapping_assignment = Shift.query.join(Shift.assigned_pwids).filter(
                PWID.id == pwid.id,
                Shift.id != shift.id,
                Shift.status.in_(['Scheduled', 'Active']),
                or_(
                    and_(Shift.start_time <= shift.start_time, Shift.end_time > shift.start_time),
                    and_(Shift.start_time < shift.end_time, Shift.end_time >= shift.end_time)
                )
            ).first()
            
            if overlapping_assignment:
                return jsonify({
                    'error': 'Double Assignment',
                    'detail': f'PWID {pwid.full_name} is already assigned to shift {overlapping_assignment.id} during this time.'
                }), 409

        shift.assigned_pwids.extend(pwids)
        db.session.commit()
        return jsonify({'message': 'PWIDs assigned successfully', 'shift': shift.to_dict()})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

@shifts_bp.route('/active', methods=['GET'])
def get_active_shifts():
    now = datetime.utcnow().isoformat()
    shifts = Shift.query.filter(
        Shift.start_time <= now,
        Shift.end_time >= now,
        Shift.status != 'Completed'
    ).all()
    # Auto-update status to 'Active' if they were 'Scheduled'
    updated = False
    for s in shifts:
        if s.status == 'Scheduled':
            s.status = 'Active'
            updated = True
    if updated:
        db.session.commit()
        
    return jsonify([s.to_dict() for s in shifts])

@shifts_bp.route('/all', methods=['GET'])
def get_all_shifts():
    # Maintenance: Update statuses
    now = datetime.utcnow().isoformat()
    active_candidates = Shift.query.filter(
        Shift.start_time <= now,
        Shift.end_time >= now,
        Shift.status == 'Scheduled'
    ).all()
    
    if active_candidates:
        for s in active_candidates:
            s.status = 'Active'
        db.session.commit()

    # Optional filters: start_date, end_date
    shifts = Shift.query.order_by(Shift.start_time.desc()).all()
    return jsonify([s.to_dict() for s in shifts])

@shifts_bp.route('/validate_coverage', methods=['POST'])
def validate_coverage():
    # Check a specific time window to see if all active PWIDs are covered
    data = request.get_json()
    start_time = data['start_time']
    end_time = data['end_time']
    
    all_pwids = PWID.query.filter_by(is_active=True).all()
    uncovered = []
    
    for pwid in all_pwids:
        # Check if they have a shift
        covering_shift = Shift.query.join(Shift.assigned_pwids).filter(
            PWID.id == pwid.id,
            Shift.status.in_(['Scheduled', 'Active']),
            Shift.start_time <= start_time,
            Shift.end_time >= end_time
        ).first()
        
        if not covering_shift:
            uncovered.append(pwid.id)
            
    if uncovered:
        return jsonify({'status': 'incomplete', 'uncovered_pwids': uncovered}), 200
    
    return jsonify({'status': 'complete'}), 200

@shifts_bp.route('/end', methods=['POST'])
def end_shift():
    data = request.get_json()
    shift_id = data['shift_id']
    shift = Shift.query.get_or_404(shift_id)
    
    # 1. Update Status
    shift.status = 'Completed'
    db.session.commit()
    
    # 2. Generate Handover Summary
    summaries = generate_handover_summary(shift_id)
    
    return jsonify({
        'message': 'Shift ended',
        'summaries_generated': len(summaries)
    }), 200

@shifts_bp.route('/emergency_replace', methods=['POST'])
def emergency_replace():
    data = request.get_json()
    shift_id = data['shift_id']
    new_caregiver_id = data['new_caregiver_id']
    reason = data.get('reason', 'Emergency Replacement')
    
    original_shift = Shift.query.get_or_404(shift_id)
    
    # 1. Mark original as replaced
    original_shift.status = 'Emergency-Reassigned' 
    # Log reason if we had a log table, or maybe append to notes?
    # For now ensuring DB consistency is key
    
    # 2. Create new shift
    now = datetime.utcnow()
    new_shift = Shift(
        type=original_shift.type,
        start_time=now, # Start immediately
        end_time=original_shift.end_time,
        caregiver_id=new_caregiver_id,
        status='Active'
    )
    
    # 3. Transfer PWIDs
    # SQLAlchemy relationship handling
    for pwid in original_shift.assigned_pwids:
        new_shift.assigned_pwids.append(pwid)
        
    db.session.add(new_shift)
    db.session.commit()
    
    # 4. Generate partial summary for the old shift so nothing is lost
    generate_handover_summary(shift_id)
    
    return jsonify({
        'message': 'Emergency replacement executed',
        'old_shift_id': original_shift.id,
        'new_shift_id': new_shift.id
    }), 200

@shifts_bp.route('/handover/<int:shift_id>', methods=['GET'])
def get_handover(shift_id):
    summaries = HandoverSummary.query.filter_by(shift_id=shift_id).all()
    return jsonify([s.to_dict() for s in summaries])

