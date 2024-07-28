import os
from datetime import datetime
import re
from functools import wraps
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from .socketio import *
from .auth import auth_required
from .models import *
from .database import db

# Get the current file's location
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

# Define paths
parent_directory = os.path.dirname(__location__)
main_directory = os.path.dirname(parent_directory)
log_filepath = os.path.join(__location__, 'log', 'app.log')

# Create a Flask Blueprint for clients
user_bp = Blueprint('user', __name__)

def validate_username(username):
    if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
        return False
    return True

def validate_password(password):
    if not re.match(r'^[a-zA-Z0-9!@#$%^&*()_+=-]+$', password):
        return False
    return True

# Endpoint for getting user info
@user_bp.route('/api/user', methods=['GET'])
@auth_required
def get_user():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    if user:
        return jsonify({
            'username': user.username,
            'api_key': user.api_key,
            'light_primary_color': user.light_primary_color,
            'light_secondary_color': user.light_secondary_color,
            'light_background_color': user.light_background_color,
            'light_button_color': user.light_button_color,
            'dark_primary_color': user.dark_primary_color,
            'dark_secondary_color': user.dark_secondary_color,
            'dark_background_color': user.dark_background_color,
            'dark_button_color': user.dark_button_color
        }), 200
    return "User not found", 404

# Endpoint for adding new user
@user_bp.route('/api/user', methods=['POST'])
@auth_required
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not validate_username(username) or not password or not validate_password(password):
        return "invalid_parameters", 400
    ## FIXME: need to add generate_password_hash method
    new_user = User(username=username, password=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'msg': 'User created successfully'}), 200

# Endpoint for deletinguser
@user_bp.route('/api/user/<username>', methods=['DELETE'])
@auth_required
def delete_user(username):
    if not validate_username(username):
        return "Invalid username format", 400
    user = User.query.filter_by(username=current_user).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'msg': 'User deleted successfully'}), 200
    return "User not found", 404

# Endpoint for updating user
@user_bp.route('/api/user/<username>', methods=['PUT'])
@auth_required
def update_user(username):
    if not validate_username(username):
        return "Invalid username format", 400
    data = request.get_json()
    new_password = data.get('password')
    if new_password and not validate_password(new_password):
        return "Invalid password format", 400
    user = User.query.filter_by(username=current_user).first()
    if user:
        if new_password:
            user.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'msg': 'User updated successfully'}), 200
    return "User not found", 404

# Endpoint for getting api key
@user_bp.route('/api/get_api_key', methods=['GET'])
@auth_required
def get_api_key():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    return jsonify(api_key=user.api_key)

# Endpoint for resetting api key
@user_bp.route('/api/reset_api_key', methods=['POST'])
@auth_required
def reset_api_key():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    if user:
        user.api_key = User.generate_api_key()
        db.session.commit()
        return jsonify({'msg': 'API key reset successfully', 'api_key': user.api_key}), 200
    return "User not found", 404

# Endpoint for updating user profile
@user_bp.route('/api/update_profile', methods=['POST'])
@auth_required
def update_profile():
    data = request.json
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    
    if 'display_name' in data:
        user.username = data['display_name']
    #if 'password' in data and data['password']:
        #user.password = data['password']
    if 'api_key' in data:
        user.api_key = data['api_key']
    if 'light_primary_color' in data:
        user.light_primary_color = data['light_primary_color']
    if 'light_secondary_color' in data:
        user.light_secondary_color = data['light_secondary_color']
    if 'light_background_color' in data:
        user.light_background_color = data['light_background_color']
    if 'light_button_color' in data:
        user.light_button_color = data['light_button_color']
    if 'dark_primary_color' in data:
        user.dark_primary_color = data['dark_primary_color']
    if 'dark_secondary_color' in data:
        user.dark_secondary_color = data['dark_secondary_color']
    if 'dark_background_color' in data:
        user.dark_background_color = data['dark_background_color']
    if 'dark_button_color' in data:
        user.dark_button_color = data['dark_button_color']
    print('SAVING USER: ', user)
    
    db.session.commit()
    return jsonify(msg='Profile updated')
