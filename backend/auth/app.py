from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os

load_dotenv()

from models import db, User
from services import AuthService

app = Flask(__name__)
CORS(app)

db_user = os.getenv('MYSQL_USER', 'root')
db_password = quote_plus(os.getenv('MYSQL_PASSWORD', '123456789'))
db_host = os.getenv('MYSQL_HOST', 'localhost')
db_port = os.getenv('MYSQL_PORT', '3306')
db_name = os.getenv('MYSQL_DATABASE', 'auth_db')

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
auth_service = AuthService()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    try:
        user = auth_service.register_user(data['username'], data['email'], data['password'])
        return jsonify(user.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = auth_service.authenticate_user(data['username'], data['password'])
    if user:
        return jsonify({'message': 'Login successful', 'user': user.to_dict()})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/')
def home():
    return "Microserviço de Autenticação - E-commerce"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5001, debug=True)
