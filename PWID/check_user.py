
from app import app
from models import Parent
with app.app_context():
    p = Parent.query.filter_by(email='sumit@example.com').first()
    if p:
        print(f"Parent found: {p.email}")
    else:
        print("Parent NOT found")
