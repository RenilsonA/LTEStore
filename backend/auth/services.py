from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash

class AuthService:
    def register_user(self, username, email, password):
        if User.query.filter((User.username == username) | (User.email == email)).first():
            raise ValueError("User already exists.")
        
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        return user

    def authenticate_user(self, username, password):
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            return user
        return None
