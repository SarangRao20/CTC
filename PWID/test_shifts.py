from app import app
from models import db, Caretaker, Shift, PWID, HandoverSummary, Routinelog
from datetime import datetime, timedelta
import json

def test_shifts():
    with app.app_context():
        # Ensure tables exist
        db.create_all()
        
        # Setup Data
        client = app.test_client()
        
        # Cleanup
        db.session.execute(db.text("DELETE FROM shift_pwid"))
        db.session.query(HandoverSummary).delete()
        db.session.query(Routinelog).delete()
        db.session.query(Shift).delete()
        db.session.query(Caretaker).filter(Caretaker.email.like('%@test.com')).delete()
        db.session.commit()
        
        # 1. Register Caretaker
        c_data = {
            "name": "Shift Tester",
            "email": "shifter@test.com",
            "password": "pass",
            "ngo_name": "Test NGO",
            "role": "Caregiver"
        }
        resp = client.post('/caretaker/register', json=c_data)
        assert resp.status_code == 201
        caretaker_id = resp.get_json()['caretaker']['id']
        
        # 2. Create Shift
        now = datetime.utcnow()
        start = (now - timedelta(hours=1)).isoformat()
        end = (now + timedelta(hours=7)).isoformat()
        
        shift_data = {
            "caregiver_id": caretaker_id,
            "type": "Morning",
            "start_time": start,
            "end_time": end
        }
        print("Testing Shift Creation...")
        resp = client.post('/shifts/create', json=shift_data)
        if resp.status_code != 201:
            print(f"FAILED [Create Shift]: {resp.status_code}")
            print(resp.get_data(as_text=True))
        assert resp.status_code == 201
        shift_id = resp.get_json()['id']
        print(f"Shift Created: {shift_id}")
        
        # 3. Test Overlap
        print("Testing Overlap Validation...")
        resp = client.post('/shifts/create', json=shift_data)
        if resp.status_code != 409:
            print(f"FAILED [Overlap]: {resp.status_code}")
            print(resp.get_data(as_text=True))
        assert resp.status_code == 409
        print("Overlap Correctly Blocked")
        
        # 4. Assign PWID
        pwid = PWID.query.first()
        if not pwid: 
            pwid = PWID(full_name="Test Patient", age=10, age_group="Child", support_level="High", ngo_name="Test NGO", location_type="Loc", baseline_mood="Calm")
            db.session.add(pwid)
            db.session.commit()
            
        print(f"Assigning PWID {pwid.id}...")
        resp = client.post('/shifts/assign_pwids', json={
            "shift_id": shift_id,
            "pwid_ids": [pwid.id]
        })
        if resp.status_code != 200:
             print(f"FAILED [Assign]: {resp.status_code}")
             print(resp.get_data(as_text=True))
        assert resp.status_code == 200
        
        # 5. Log Entry
        print("Logging Routine Entry...")
        log_data = {
            "pwid_id": pwid.id,
            "sleep_quality": "Average",
            "meals": "taken",
            "medication_given": "yes",
            "mood": "happy",
            "activity_done": "yes",
            "incident": "no",
            "notes": "Testing handover",
            "created_by": caretaker_id
        }
        resp = client.post('/routinelogs', json=log_data)
        if resp.status_code != 201:
             print(f"FAILED [Routine Log]: {resp.status_code}")
             print(resp.get_data(as_text=True))
        assert resp.status_code == 201
        
        # 6. End Shift
        print("Ending Shift...")
        resp = client.post('/shifts/end', json={"shift_id": shift_id})
        if resp.status_code != 200:
             print(f"FAILED [End Shift]: {resp.status_code}")
             print(resp.get_data(as_text=True))
        assert resp.status_code == 200
        assert resp.get_json()['summaries_generated'] >= 1
        
        # Verify Summary
        summary = HandoverSummary.query.filter_by(shift_id=shift_id).first()
        assert summary is not None
        assert "happy" in summary.content['mood_trend']
        print("Handover Generation Verified")
        
        print("\nAll Shift Tests Passed!")

if __name__ == "__main__":
    test_shifts()
