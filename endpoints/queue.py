import os
from datetime import datetime
import re
from functools import wraps
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from .socketio import *
from .user import User
from .auth import auth_required

# Import your local modules
from .database import db

# Get the current file's location
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

# Define paths
parent_directory = os.path.dirname(__location__)
main_directory = os.path.dirname(parent_directory)
log_filepath = os.path.join(__location__, 'log', 'app.log')

# Create a Flask Blueprint for clients
queue_bp = Blueprint('queue', __name__)


class Queue(db.Model):
    __tablename__ = 'queue'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)
    highlighted = db.Column(db.Boolean, default=False)
    

@queue_bp.route('/api/queue', methods=['GET'])
@auth_required
def manage_queue():
    action = request.args.get('action')
    username = request.args.get('username')
    
    if not action or not username:
        return "missing_parameters", 400

    if action == "join":
        try:
            new_user = Queue(username=username)
            db.session.add(new_user)
            db.session.commit()
            socketio.emit('update', {'message': 'Queue updated!'})
            return f"{username} has joined the queue!", 200
        except:
            db.session.rollback()
            return f"{username} is already in the queue!", 200
    elif action == "leave":
        user = Queue.query.filter_by(username=username).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            socketio.emit('update', {'message': 'Queue updated!'})
            return f"{username} has left the queue!", 200
        else:
            return f"{username} is not in the queue!", 200
    elif action == "skip":
        user = Queue.query.order_by(Queue.id).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            socketio.emit('update', {'message': 'Queue updated!'})
            return f"{user.username} has skipped this round and will go next.", 200
        else:
            return "The queue is empty.", 200
    elif action == "position":
        users = Queue.query.order_by(Queue.id).all()
        position = next((i for i, u in enumerate(users, start=1) if u.username == username), None)
        if position:
            return f"{username}, your position in the queue is {position}.", 200
        else:
            return f"{username} is not in the queue!", 200
    else:
        return "invalid_action", 400
    
@queue_bp.route('/api/clear_queue', methods=['POST'])
@auth_required
def clean_queue():
    current_user = get_jwt_identity()
    Queue.query.delete()
    db.session.commit()
    socketio.emit('update', {'message': 'Queue updated!'})
    return "Queue cleaned", 200

@queue_bp.route('/api/remove_user', methods=['POST'])
@auth_required
def remove_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    user = Queue.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        socketio.emit('update', {'message': 'Queue updated!'})
        return f"User {username} removed", 200
    return "User not found", 404

@queue_bp.route('/api/update_queue_order', methods=['POST'])
@auth_required
def update_queue_order():
    data = request.get_json()
    order = data.get('order', [])
    
    for position, username in enumerate(order):
        user = Queue.query.filter_by(username=username).first()
        if user:
            user.position = position
        else:
            new_user = Queue(username=username, position=position)
            db.session.add(new_user)
    
    db.session.commit()
    socketio.emit('update', {'message': 'Queue order updated!'})
    return jsonify({'msg': 'Queue order updated successfully'}), 200

@queue_bp.route('/api/update_highlighted_users', methods=['POST'])
@auth_required
def update_highlighted_users():
    data = request.get_json()
    highlighted_users = data.get('highlighted_users', [])
    
    for user in Queue.query.all():
        user.highlighted = user.username in highlighted_users
    
    db.session.commit()
    socketio.emit('update', {'message': 'Highlighted users updated!'})
    return jsonify({'msg': 'Highlighted users updated successfully'}), 200

@queue_bp.route('/api/clear_highlighted_users', methods=['POST'])
@auth_required
def clear_highlighted_users():
    for user in Queue.query.all():
        user.highlighted = False
        
    db.session.commit()
    socketio.emit('update', {'message': 'Highlighted users updated!'})
    return jsonify({'message': 'All highlights cleared successfully.'})

@queue_bp.route('/api/get_queue_order', methods=['GET'])
@auth_required
def get_queue_order():
    queue_order = Queue.query.order_by(Queue.position).all()
    return jsonify({
        'queue_order': [{'username': user.username, 'highlighted': user.highlighted} for user in queue_order]
    }), 200
