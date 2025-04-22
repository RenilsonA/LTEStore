from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    data_volume = db.Column(db.Integer, nullable=False)  # em MB
    validity_days = db.Column(db.Integer, nullable=False)  # dias de validade
    price = db.Column(db.Float, nullable=False)  # em R$
    operator = db.Column(db.String(50), nullable=False)  # operadora (Vivo, Claro, etc.)
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