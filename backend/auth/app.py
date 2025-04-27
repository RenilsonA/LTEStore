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

tokens = {}

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    try:
        user = auth_service.register_user(data['username'], data['email'], data['password'])
        token = str(user.id)
        tokens[token] = user.id
        return jsonify({'user': user.to_dict(), 'token': token}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = auth_service.authenticate_user(data['username'], data['password'])
    if user:
        token = str(user.id)
        tokens[token] = user.id
        return jsonify({'message': 'Login successful', 'user': user.to_dict(), 'token': token})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/verify')
def verify():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        user_id = tokens.get(token)
        if user_id:
            user = User.query.get(user_id)
            if user and user.is_active:
                return jsonify({'user_id': user.id})
            else:
                return jsonify({'error': 'Invalid token'}), 401
        else:
            return jsonify({'error': 'Invalid token'}), 401
    else:
        return jsonify({'error': 'Unauthorized'}), 401

@app.route('/')
def home():
    return "Microserviço de Autenticação - E-commerce"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5001, debug=True)