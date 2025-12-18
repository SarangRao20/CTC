from flask import Flask
from flask_cors import CORS
from routes import routes_bp
from models import db
from flasgger import Swagger

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run(debug=True)