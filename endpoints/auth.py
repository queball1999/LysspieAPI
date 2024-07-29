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
from .rate_limit import *
#from handling.logging import loggers

auth_bp = Blueprint('auth', __name__)
loggers = {'log': '', 'access_log': '', 'error_log': ''}
log = loggers['log']
access_log = loggers['access_log']
error_log = loggers['error_log']

NIGHTBOT_USER = os.getenv('NIGHTBOT_USER')
NIGHTBOT_CHANNEL = os.getenv('NIGHTBOT_CHANNEL')

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        nightbot_user = request.headers.get('Nightbot-User')
        nightbot_channel = request.headers.get('Nightbot-Channel')
        
        if not auth_header and not (nightbot_user and nightbot_channel):
            return jsonify({"msg": "Missing Authorization Header"}), 401

        if auth_header:
            auth_token = auth_header.split(" ")[1]

            # Define regex patterns for JWT and API tokens
            api_key_regex = re.compile(r"q-[a-fA-F0-9]{64}")
            jwt_regex = re.compile(r"ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+")

            # Check if the token matches the JWT pattern
            if jwt_regex.match(auth_token):
                try:
                    verify_jwt_in_request()
                    access_log.error(f'{user.username} successfully authenticated via JWT')
                    return f(*args, **kwargs)
                except Exception as jwt_error:
                    error_log.error('JWT ERROR', jwt_error, auth_token)   #convert to log
                    return redirect(url_for('auth.login'))

            # Check if the token matches the API key pattern
            elif api_key_regex.match(auth_token):
                try:
                    users = User.query.all()
                    for user in users:
                        try:
                            if user.api_key == auth_token:
                                access_log.error(f'{user.username} successfully authenticated via API')
                                return f(*args, **kwargs)
                        except Exception as e:
                            continue
                    return jsonify({"msg": "Invalid API key"}), 401
                except Exception as e:
                    error_log.error(f'API ERROR: {e}')
                    return jsonify({"msg": "Something went wrong processing API key"}), 500

        # Check for Nightbot authentication
        if nightbot_user and nightbot_channel:
            if nightbot_user == NIGHTBOT_USER and nightbot_channel == NIGHTBOT_CHANNEL:
                access_log.error(f'{user.username} successfully authenticated via NIGHTBOT')
                return f(*args, **kwargs)
            else:
                return jsonify({"msg": "Invalid Nightbot credentials"}), 401

        error_log.error('INVALID AUTH TOKEN FORMAT. Redirected to login.')
        return redirect(url_for('auth.login'))

    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    ip = request.remote_addr
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('username') or not data.get('password'):
            log_failed_attempt(ip)
            access_log.error(f'Bad Request from {ip} -- Request: {data}')
            return jsonify({"msg": "Bad request"}), 400
        
        user = User.query.filter_by(username=data['username'].lower()).first()
        if user and user.verify_password(data['password']):
            access_token = create_access_token(identity=user.username)
            
            print(f"Generated JWT Token: {access_token}")
            access_log.error(f'{user.username} successfully logged in from {ip}')
            print(f'{user.username} successfully logged in from {ip}')
            
            return jsonify(access_token=access_token, api_key=user.api_key), 200
        log_failed_attempt(ip)
        if user:
            access_log.error(f'Invalid credentials. -- User: {user.username} -- IP: {ip} -- Request: {data}')
        else:
            access_log.error(f'Invalid credentials. -- User: None Found -- IP: {ip} -- Request: {data}')
        return jsonify({"msg": "Invalid credentials"}), 401
    return render_template('login.html')

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    data = request.json
    username = data['username']
    password = data['password']
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    api_key = User.generate_api_key()
    new_user = User(username=username, password=hashed_password, api_key=api_key)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User registered"), 201

@auth_bp.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.json
    user = User.query.filter_by(username=current_user).first()
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
    user = User.query.filter_by(username=current_user).first()
    new_password = secrets.token_hex(8)
    user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    return jsonify({'new_password': new_password}), 200
