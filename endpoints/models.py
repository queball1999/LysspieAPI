import os
import secrets
from .database import *

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
    password_hash = db.Column(db.String(128), nullable=False)
    api_key= db.Column(db.String(128), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False, default='viewer')

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def verify_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def generate_api_key():
        return 'q-' + secrets.token_hex(32)