import os
import secrets
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from functools import wraps
from .database import db
from .user import User

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.getenv('SECRET_KEY')

def verify_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        if not api_key:
            return jsonify({"message": "API key missing"}), 401
        
        user = User.query.filter_by(api_key=api_key).first()
        if not user:
            return jsonify({"message": "Invalid API key"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"msg": "Bad request"}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        if user and user.verify_password(data['password']):
            access_token = create_access_token(identity=user.email)
            print(f"Generated JWT Token: {access_token}")  # Debug print
            return jsonify(access_token=access_token), 200
        return jsonify({"msg": "Invalid credentials"}), 401
    return render_template('login.html')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data['email']
    password = data['password']
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    api_key = api_key = 'q-' + secrets.token_hex(32)
    new_user = User(email=email, password=hashed_password, api_key=api_key)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User registered"), 201

@auth_bp.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.json
    user = User.query.filter_by(email=current_user).first()
    if user:
        new_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password = new_password
        db.session.commit()
        return "Password updated", 200
    return "User not found", 404

@auth_bp.route('/reset_password', methods=['POST'])
@jwt_required()
def reset_password():
    current_user = get_jwt_identity()
    user = User.query.filter_by(email=current_user).first()
    new_password = secrets.token_hex(8)
    user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    return jsonify({'new_password': new_password}), 200
