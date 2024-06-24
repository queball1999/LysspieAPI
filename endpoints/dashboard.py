from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from datetime import datetime
from .database import db
from .queue import Queue
from .ninelives import NineLives

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
    print(f"Current User in get_queue: {current_user}")  # Debug print
    queue_list = Queue.query.order_by(Queue.id).all()
    queue_data = [{"username": user.username} for user in queue_list]
    return jsonify({"queue": queue_data})

@dashboard_bp.route('/api/lives', methods=['GET'])
@jwt_required()
def get_lives():
    current_user = get_jwt_identity()
    print(f"Current User in get_lives: {current_user}")  # Debug print
    lives_list = NineLives.query.order_by(NineLives.id).all()
    lives_data = [{"username": user.username, "lives": user.lives} for user in lives_list]
    return jsonify({"lives": lives_data})

@dashboard_bp.route('/api/clean_queue', methods=['POST'])
@jwt_required()
def clean_queue():
    current_user = get_jwt_identity()
    print(f"Current User in clean_queue: {current_user}")  # Debug print
    Queue.query.delete()
    db.session.commit()
    return "Queue cleaned", 200

@dashboard_bp.route('/api/remove_user', methods=['POST'])
@jwt_required()
def remove_user():
    current_user = get_jwt_identity()
    print(f"Current User in remove_user: {current_user}")  # Debug print
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
    print(f"Current User in adjust_lives: {current_user}")  # Debug print
    username = request.args.get('username')
    amount = int(request.args.get('amount'))
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.lives += amount
        if user.lives <= 0:
            db.session.delete(user)
            db.session.commit()
            return f"User {username} banned", 200
        db.session.commit()
        return f"User {username} now has {user.lives} lives", 200
    return "User not found", 404

@dashboard_bp.route('/api/ban_user', methods=['POST'])
@jwt_required()
def ban_user():
    current_user = get_jwt_identity()
    print(f"Current User in ban_user: {current_user}")  # Debug print
    username = request.args.get('username')
    user = NineLives.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return f"User {username} banned", 200
    return "User not found", 404

@dashboard_bp.route('/api/update_queue_order', methods=['POST'])
@jwt_required()
def update_queue_order():
    current_user = get_jwt_identity()
    print(f"Current User in update_queue_order: {current_user}")  # Debug print
    order = request.json.get('order')
    for index, username in enumerate(order):
        user = Queue.query.filter_by(username=username).first()
        if user:
            user.id = index + 1
    db.session.commit()
    return "Queue order updated", 200