from models import db, Product
from datetime import datetime

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