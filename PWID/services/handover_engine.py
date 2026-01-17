from models import db, Shift, Routinelog, Task, HandoverSummary
from datetime import datetime
from risk_engine import calculate_trend_risk
import json

def generate_handover_summary(shift_id):
    shift = Shift.query.get(shift_id)
    if not shift:
        return None
        
    summaries = []
    
    for pwid in shift.assigned_pwids:
        # 1. Aggregate Logs during shift
        # shift.start_time is STRING, Routinelog.created_at is DATETIME
        # Convert shift start to datetime
        shift_start_dt = datetime.fromisoformat(shift.start_time)
        
        logs = Routinelog.query.filter(
            Routinelog.pwid_id == pwid.id,
            Routinelog.created_at >= shift_start_dt,
            Routinelog.created_at <= datetime.utcnow() # Up to now
        ).all()
        
        # 2. Key Metrics
        sleep_logs = [l.sleep_quality for l in logs if l.sleep_quality]
        meals_logs = [l.meals for l in logs if l.meals]
        moods = [l.mood for l in logs if l.mood]
        incidents = [l.notes for l in logs if l.incident == 'yes']
        
        # 3. Pending Tasks
        pending_tasks = Task.query.filter(
            Task.pwid_id == pwid.id,
            Task.status == 'pending'
        ).all()
        pending_task_titles = [t.title for t in pending_tasks]
        
        # 4. Risk Calculation
        risk = calculate_trend_risk(logs) # Reusing existing logic
        
        summary_content = {
            'sleep_quality': max(set(sleep_logs), key=sleep_logs.count) if sleep_logs else 'No Data',
            'meals_summary': f"{len([m for m in meals_logs if m == 'taken'])}/{len(meals_logs)} taken" if meals_logs else 'No Data',
            'mood_trend': moods,
            'incidents': incidents,
            'pending_tasks': pending_task_titles,
            'risk_level': risk.get('level', 'Low'),
            'risk_justification': risk.get('justification', '')
        }
        
        # Create or Update Summary Record
        existing = HandoverSummary.query.filter_by(shift_id=shift.id, pwid_id=pwid.id).first()
        if existing:
            existing.content = summary_content
            db.session.commit()
            summaries.append(existing)
        else:
            new_summary = HandoverSummary(
                shift_id=shift.id,
                pwid_id=pwid.id,
                content=summary_content
            )
            db.session.add(new_summary)
            db.session.commit()
            summaries.append(new_summary)
            
    return summaries
