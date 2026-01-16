
from app import app
from models import Parent
from werkzeug.security import check_password_hash, generate_password_hash

with app.app_context():
    p = Parent.query.filter_by(email='sumit@example.com').first()
    if p:
        print(f"Stored Hash: {p.password_hash}")
        print(f"Hash Length: {len(p.password_hash)}")
        
        matches = check_password_hash(p.password_hash, 'password123')
        print(f"Matches 'password123': {matches}")
        
        # Test generation length
        test_hash = generate_password_hash("password123")
        print(f"New Hash Length: {len(test_hash)}")
        print(f"New Hash Matches: {check_password_hash(test_hash, 'password123')}")
    else:
        print("Parent not found")
