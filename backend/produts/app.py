from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from datetime import datetime
from flask_cors import CORS 

load_dotenv()

app = Flask(__name__)

CORS(app)

from urllib.parse import quote_plus

db_user = os.getenv('MYSQL_USER', 'root')
db_password = quote_plus(os.getenv('MYSQL_PASSWORD', '123456789'))
db_host = os.getenv('MYSQL_HOST', 'localhost')
db_port = os.getenv('MYSQL_PORT', '3306')
db_name = os.getenv('MYSQL_DATABASE', 'ecommerce_lte')
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True
}

db = SQLAlchemy(app)

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    data_volume = db.Column(db.Integer, nullable=False)
    validity_days = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    operator = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'data_volume': self.data_volume,
            'validity_days': self.validity_days,
            'price': self.price,
            'operator': self.operator,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ProductService:
    def get_all_products(self):
        return Product.query.filter_by(is_active=True).all()
    
    def get_product_by_id(self, product_id):
        return Product.query.get(product_id)
    
    def create_product(self, name, data_volume, validity_days, price, operator, 
                      description=None, is_active=True):
        if not name or not operator:
            raise ValueError("Name and operator are required")
        if data_volume <= 0:
            raise ValueError("Data volume must be positive")
        if validity_days <= 0:
            raise ValueError("Validity days must be positive")
        if price <= 0:
            raise ValueError("Price must be positive")
            
        product = Product(
            name=name,
            description=description,
            data_volume=data_volume,
            validity_days=validity_days,
            price=price,
            operator=operator,
            is_active=is_active
        )
        
        db.session.add(product)
        db.session.commit()
        return product
    
    def update_product(self, product_id, **kwargs):
        product = self.get_product_by_id(product_id)
        if not product:
            return None
            
        if 'data_volume' in kwargs and kwargs['data_volume'] <= 0:
            raise ValueError("Data volume must be positive")
        if 'validity_days' in kwargs and kwargs['validity_days'] <= 0:
            raise ValueError("Validity days must be positive")
        if 'price' in kwargs and kwargs['price'] <= 0:
            raise ValueError("Price must be positive")
            
        for key, value in kwargs.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)
                
        db.session.commit()
        return product
    
    def delete_product(self, product_id):
        product = self.get_product_by_id(product_id)
        if product:
            db.session.delete(product)
            db.session.commit()
            return True
        return False
    
    def search_products(self, operator=None, min_data=None, max_price=None):
        query = Product.query.filter_by(is_active=True)
        
        if operator:
            query = query.filter(Product.operator.ilike(f"%{operator}%"))
        if min_data:
            query = query.filter(Product.data_volume >= int(min_data))
        if max_price:
            query = query.filter(Product.price <= float(max_price))
            
        return query.all()

product_service = ProductService()

@app.route('/products', methods=['GET'])
def get_products():
    products = product_service.get_all_products()
    return jsonify([product.to_dict() for product in products])

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = product_service.get_product_by_id(product_id)
    if product:
        return jsonify(product.to_dict())
    return jsonify({"error": "Product not found"}), 404

@app.route('/products', methods=['POST'])
def create_product():
    data = request.get_json()
    try:
        product = product_service.create_product(
            name=data['name'],
            description=data.get('description'),
            data_volume=int(data['data_volume']),
            validity_days=int(data['validity_days']),
            price=float(data['price']),
            operator=data['operator'],
            is_active=data.get('is_active', True)
        )
        return jsonify(product.to_dict()), 201
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json()
    try:
        product = product_service.update_product(
            product_id=product_id,
            name=data.get('name'),
            description=data.get('description'),
            data_volume=data.get('data_volume'),
            validity_days=data.get('validity_days'),
            price=data.get('price'),
            operator=data.get('operator'),
            is_active=data.get('is_active')
        )
        if product:
            return jsonify(product.to_dict())
        return jsonify({"error": "Product not found"}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    success = product_service.delete_product(product_id)
    if success:
        return jsonify({"message": "Product deleted successfully"}), 200
    return jsonify({"error": "Product not found"}), 404

@app.route('/products/search', methods=['GET'])
def search_products():
    operator = request.args.get('operator')
    min_data = request.args.get('min_data')
    max_price = request.args.get('max_price')
    
    products = product_service.search_products(
        operator=operator,
        min_data=min_data,
        max_price=max_price
    )
    
    return jsonify([product.to_dict() for product in products])

@app.route('/')
def home():
    return "Microserviço de Produtos LTE - E-commerce"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)