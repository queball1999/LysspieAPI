from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from datetime import datetime
from .database import db
from .queue import Queue
from .ninelives import NineLives
from .user import User
import secrets

# This blueprint handles top-level endpoints

# Create a Flask Blueprint for homepage
dashboard_bp = Blueprint('dashboard', __name__)

# Defining endpoints for downloads
@dashboard_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@dashboard_bp.route('/')
def home():
    return redirect(url_for('auth.login'))

@dashboard_bp.route('/queue', methods=['GET'])
@jwt_required()
def get_queue():
    current_user = get_jwt_identity()
    queue_list = Queue.query.order_by(Queue.id).all()
    queue_data = [{"username": user.username} for user in queue_list]
    return jsonify({"queue": queue_data})

@dashboard_bp.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def manage_users():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    
    if user.role != 'admin':
        return "Permission denied", 403

    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{'id': u.id, 'username': u.username, 'role': u.role} for u in users])

    if request.method == 'POST':
        data = request.json
        new_user = User(
            username=data['username'],
            password=data['password'],
            api_key=secrets.token_hex(16),
            role=data.get('role', 'viewer')
        )
        db.session.add(new_user)
        db.session.commit()
        return "User created", 201

    if request.method == 'PUT':
        data = request.json
        user = User.query.filter_by(id=data['id']).first()
        if user:
            user.username = data['username']
            user.role = data['role']
            db.session.commit()
            return "User updated", 200
        return "User not found", 404

    if request.method == 'DELETE':
        data = request.json
        user = User.query.filter_by(id=data['id']).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            return "User deleted", 200
        return "User not found", 404

@dashboard_bp.route('/api/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    
    if request.method == 'GET':
        return jsonify({'username': user.username, 'api_key': user.api_key})

    if request.method == 'PUT':
        data = request.json
        if 'username' in data:
            user.username = data['username']
        if 'password' in data:
            user.password = data['password']
        db.session.commit()
        return "Profile updated", 200

@dashboard_bp.route('/api/reset_api_key', methods=['POST'])
@jwt_required()
def reset_api_key():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    user.api_key = secrets.token_hex(16)
    db.session.commit()
    return jsonify({'api_key': user.api_key})
