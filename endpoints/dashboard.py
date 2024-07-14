from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from datetime import datetime
from .database import db
from .queue import Queue
from .ninelives import NineLives
from .user import User
import secrets

# Create a Flask Blueprint for homepage
dashboard_bp = Blueprint('dashboard', __name__)

# Defining endpoints for downloads
@dashboard_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@dashboard_bp.route('/')
def home():
    return redirect(url_for('auth.login'))

@dashboard_bp.route('/api/queue', methods=['GET'])
@jwt_required()
def get_queue():
    current_user = get_jwt_identity()
    queue_list = Queue.query.order_by(Queue.id).all()
    queue_data = [{"username": user.username} for user in queue_list]
    return jsonify({"queue": queue_data})

@dashboard_bp.route('/api/lives', methods=['GET'])
@jwt_required()
def get_lives():
    current_user = get_jwt_identity()
    lives_list = NineLives.query.order_by(NineLives.id).all()
    lives_data = [{"username": user.username, "lives": user.lives} for user in lives_list]
    return jsonify({"lives": lives_data})

@dashboard_bp.route('/api/clean_queue', methods=['POST'])
@jwt_required()
def clean_queue():
    current_user = get_jwt_identity()
    Queue.query.delete()
    db.session.commit()
    return "Queue cleaned", 200

@dashboard_bp.route('/api/remove_user', methods=['POST'])
@jwt_required()
def remove_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    user = Queue.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return f"User {username} removed", 200
    return "User not found", 404

@dashboard_bp.route('/api/adjust_lives', methods=['POST'])
@jwt_required()
def adjust_lives():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    amount = int(request.args.get('amount'))
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.lives += amount
        if user.lives <= 0:
            user.banned = True
            user.lives = 0
        db.session.commit()
        return f"User {username} now has {user.lives} lives", 200
    return "User not found", 404

@dashboard_bp.route('/api/ban_user', methods=['POST'])
@jwt_required()
def ban_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.banned = True
        db.session.commit()
        return f"User {username} banned", 200
    return "User not found", 404

@dashboard_bp.route('/api/update_queue_order', methods=['POST'])
@jwt_required()
def update_queue_order():
    current_user = get_jwt_identity()
    order = request.json.get('order')
    for index, username in enumerate(order):
        user = Queue.query.filter_by(username=username).first()
        if user:
            user.id = index + 1
    db.session.commit()
    return "Queue order updated", 200

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
