import os
import secrets
import base64
import hashlib
from cryptography.fernet import Fernet
from .database import *

# Load the secret key from the environment variable
SECRET_KEY = os.getenv('SECRET_KEY')
if SECRET_KEY:
    key = hashlib.sha256(SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key)
else:
    fernet_key = Fernet.generate_key()
fernet = Fernet(fernet_key)

class NineLives(db.Model):
    __tablename__ = 'ninelives'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    lives = db.Column(db.Integer, default=9)
    banned = db.Column(db.Boolean, default=False)
    position = db.Column(db.Integer, nullable=False, default=0)
    highlighted = db.Column(db.Boolean, default=False)
    
class Queue(db.Model):
    __tablename__ = 'queue'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)
    highlighted = db.Column(db.Boolean, default=False)
    
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    api_key_enc = db.Column(db.Text, unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False, default='viewer')
    avatar_url = db.Column(db.String(256), nullable=True)
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    @property
    def api_key(self):
        return fernet.decrypt(self.api_key_enc.encode()).decode()

    @api_key.setter
    def api_key(self, api_key):
        self.api_key_enc = fernet.encrypt(api_key.encode()).decode()
        
    def verify_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    @staticmethod
    def generate_api_key():
        return 'q-' + secrets.token_hex(64)