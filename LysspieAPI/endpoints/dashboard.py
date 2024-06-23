from flask import request, Blueprint, render_template, send_from_directory, jsonify, send_file
import os
from datetime import datetime
from .database import db
from .queue import Queue
from .ninelives import NineLives

# Create a Flask Blueprint for homepage
dashboard_bp = Blueprint('dashboard', __name__)

# Defining endpoints for downloads
@dashboard_bp.route('/')
def dashboard():
    return render_template('dashboard.html')

@dashboard_bp.route('/api/queue', methods=['GET'])
def get_queue():
    queue_list = Queue.query.order_by(Queue.id).all()
    queue_data = [{"username": user.username} for user in queue_list]
    return jsonify({"queue": queue_data})

@dashboard_bp.route('/api/lives', methods=['GET'])
def get_lives():
    lives_list = NineLives.query.order_by(NineLives.id).all()
    lives_data = [{"username": user.username, "lives": user.lives} for user in lives_list]
    return jsonify({"lives": lives_data})

@dashboard_bp.route('/api/clean_queue', methods=['POST'])
def clean_queue():
    Queue.query.delete()
    db.session.commit()
    return "Queue cleaned", 200

@dashboard_bp.route('/api/remove_user', methods=['POST'])
def remove_user():
    username = request.args.get('username')
    user = Queue.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return f"User {username} removed", 200
    return "User not found", 404

@dashboard_bp.route('/api/adjust_lives', methods=['POST'])
def adjust_lives():
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
def ban_user():
    username = request.args.get('username')
    user = NineLives.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return f"User {username} banned", 200
    return "User not found", 404

@dashboard_bp.route('/api/update_queue_order', methods=['POST'])
def update_queue_order():
    order = request.json.get('order')
    for index, username in enumerate(order):
        user = Queue.query.filter_by(username=username).first()
        if user:
            user.id = index + 1
    db.session.commit()
    return "Queue order updated", 200
    return jsonify({"lives": lives_data})