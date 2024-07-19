import os
import secrets
import bcrypt
import jwt
import re
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, verify_jwt_in_request
from functools import wraps
from .database import db
from .models import *

auth_bp = Blueprint('auth', __name__)

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"msg": "Missing Authorization Header"}), 401

        auth_token = auth_header.split(" ")[1]

        # Define regex patterns for JWT and API tokens
        api_key_regex = re.compile(r"q-[a-fA-F0-9]{64}")
        jwt_regex = re.compile(r"ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+")

        # Check if the token matches the JWT pattern
        if jwt_regex.match(auth_token):
            try:
                verify_jwt_in_request()
                return f(*args, **kwargs)
            except Exception as jwt_error:
                print('JWT ERROR', jwt_error)   #convert to log
                return render_template('login.html')
        # Check if the token matches the API key pattern
        elif api_key_regex.match(auth_token):
            try:
                user = User.query.filter_by(api_key=auth_token).first()
                if user:
                    return f(*args, **kwargs)
            except Exception as e:
                print('API ERROR', e)   #convert to log
                return jsonify({"msg": "Invalid API key"}), 401
        else:
            print('INVALID AUTH TOKEN FORMAT')  #convert to log
            return render_template('login.html')

    return decorated_function


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"msg": "Bad request"}), 400
        
        user = User.query.filter_by(email=data['email'].lower()).first()
        if user and user.verify_password(data['password']):
            access_token = create_access_token(identity=user.email)
            print(f"Generated JWT Token: {access_token}")  # Debug print
            return jsonify(access_token=access_token, api_key=user.api_key), 200
        return jsonify({"msg": "Invalid credentials"}), 401
    return render_template('login.html')

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    data = request.json
    email = data['email']
    password = data['password']
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    api_key = User.generate_api_key()
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
