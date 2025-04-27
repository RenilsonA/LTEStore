from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from functools import wraps
from services import OrderService

load_dotenv()

app = Flask(__name__)
CORS(app)

order_service = OrderService()

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:5001')

def authenticate():
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Unauthorized'}), 401

            token = auth_header.split(' ')[1]
            headers = {'Authorization': f'Bearer {token}'}
            try:
                auth_response = requests.get(f'{AUTH_SERVICE_URL}/verify', headers=headers)
                auth_response.raise_for_status()
                user_data = auth_response.json()
                kwargs['user_id'] = user_data.get('user_id')
                return f(*args, **kwargs)
            except requests.exceptions.RequestException as e:
                return jsonify({'error': f'Erro no serviço de autenticação: {e}'}), 500
            except Exception:
                return jsonify({'error': 'Token inválido'}), 401
        return wrapper
    return decorator

@app.route('/buy', methods=['POST'])
@authenticate()
def buy(user_id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    payment_method = data.get('payment_method')

    if not product_id:
        return jsonify({'error': 'Missing product_id'}), 400
    if not payment_method:
        return jsonify({'error': 'Missing payment_method'}), 400

    try:
        confirmation = order_service.process_order(user_id, product_id, quantity, payment_method)
        return jsonify(confirmation), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/')
def home():
    return "Microserviço de Pedidos - E-commerce"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)