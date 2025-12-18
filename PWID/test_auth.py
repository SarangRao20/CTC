from app import app
from models import db, Caretaker
from werkzeug.security import check_password_hash
import json

def test_auth():
    with app.app_context():
        # Clean up existing test user
        test_email = "test@example.com"
        Caretaker.query.filter_by(email=test_email).delete()
        db.session.commit()

        client = app.test_client()

        # 1. Test Registration
        reg_data = {
            "name": "Test Caretaker",
            "email": test_email,
            "password": "password123",
            "ngo_name": "Test NGO",
            "role": "Caregiver"
        }
        print("Testing Registration...")
        resp = client.post('/caretaker/register', 
                           data=json.dumps(reg_data), 
                           content_type='application/json')
        print(f"Registration Response: {resp.status_code}, {resp.get_json()}")
        assert resp.status_code == 201

        # 2. Verify Password Hashing in DB
        caretaker = Caretaker.query.filter_by(email=test_email).first()
        print(f"Stored Password Hash: {caretaker.password_hash}")
        assert caretaker.password_hash != "password123"
        assert check_password_hash(caretaker.password_hash, "password123")
        print("Password Hashing Verified!")

        # 3. Test Login
        login_data = {
            "email": test_email,
            "password": "password123"
        }
        print("Testing Login...")
        resp = client.post('/caretaker/login', 
                           data=json.dumps(login_data), 
                           content_type='application/json')
        print(f"Login Response: {resp.status_code}, {resp.get_json()}")
        assert resp.status_code == 200
        assert resp.get_json()['caretaker']['name'] == "Test Caretaker"

        # 4. Test Login Failure
        print("Testing Login Failure...")
        login_data['password'] = "wrongpassword"
        resp = client.post('/caretaker/login', 
                           data=json.dumps(login_data), 
                           content_type='application/json')
        print(f"Login Failure Response: {resp.status_code}, {resp.get_json()}")
        assert resp.status_code == 401

        print("\nAll Auth Tests Passed!")

if __name__ == "__main__":
    test_auth()
