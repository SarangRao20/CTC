from flask import Flask, request, jsonify
from flask_cors import CORS
from routes import routes_bp
from models import db
from flasgger import Swagger
import os
import time

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = "supersecret_ctc_key"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///pwid.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['SWAGGER'] = {
    "title": "PWID Care Platform API",
    "uiversion" : 3, 
    "specs_route" : "/docs/"
}

db.init_app(app)
CORS(app)
swagger = Swagger(app)

app.register_blueprint(routes_bp)

with app.app_context():
    db.create_all()


@app.route("/")
def health_check():
    return {"status": "ok"}

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = f"{int(time.time())}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        # Return URL relative to static
        return jsonify({"url": f"/static/uploads/{filename}", "type": "image"}), 201

if __name__ == "__main__":
    app.run(debug=True)