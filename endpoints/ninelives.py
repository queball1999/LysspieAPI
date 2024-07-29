import os
from datetime import datetime
import re
from functools import wraps
from flask import jsonify, request, Blueprint
from sqlalchemy.exc import IntegrityError
from .socketio import *
from flask_jwt_extended import jwt_required, get_jwt_identity
from .auth import auth_required
from .models import *
from .database import db
from handling.logging import *

# Get the current file's location
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

# Define paths
parent_directory = os.path.dirname(__location__)
main_directory = os.path.dirname(parent_directory)
log_filepath = os.path.join(__location__, 'log', 'app.log')

# Create a Flask Blueprint for clients
ninelives_bp = Blueprint('ninelives', __name__)

def validate_username(username):
    if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
        return False
    return True

@ninelives_bp.route('/api/ninelives', methods=['GET'])
@auth_required
def manage_ninelives():
    username = request.args.get('username')
    ip = request.remote_addr
    if not username or not validate_username(username):
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.lives -= 1
        if user.lives <= 0:
            user.banned = True
            db.session.commit()
            socketio.emit('update', {'message': 'Ninelives updated!'})
            return f"{username} has no lives left! Banning them from chat.", 200
        else:
            db.session.commit()
            return f"{username} has {user.lives} lives left.", 200
    else:
        try:
            next_position = NineLives.get_next_position()
            new_user = NineLives(username=username, lives=8, position=next_position)
            db.session.add(new_user)
            db.session.commit()
            socketio.emit('update', {'message': 'Ninelives updated!'})
            return f"{username} has 8 lives left.", 200
        except IntegrityError:
            db.session.rollback()
            return "There was an error processing your request.", 500

@ninelives_bp.route('/api/bulk_ban', methods=['POST'])
@auth_required
def bulk_ban():
    current_user = get_jwt_identity()
    data = request.get_json()
    ip = request.remote_addr
    if not data:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    usernames = data.get('usernames', [])
    
    for username in usernames:
        if not validate_username(username):
            return "Invalid username format", 400
        user = NineLives.query.filter_by(username=username).first()
        if user:
            user.banned = True
    db.session.commit()
    socketio.emit('update', {'message': 'Queue updated!'})
    return "Users banned successfully", 200

@ninelives_bp.route('/api/clear_lives', methods=['POST'])
@auth_required
def clear_lives():
    current_user = get_jwt_identity()
    data = request.get_json()
    ip = request.remote_addr
    if not data:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    usernames = data.get('usernames', [])
    
    for username in usernames:
        if not validate_username(username):
            return "Invalid username format", 400
        user = NineLives.query.filter_by(username=username).first()
        if user:
            db.session.delete(user)
    db.session.commit()
    socketio.emit('update', {'message': 'Queue updated!'})
    return "Lives cleared successfully", 200

@ninelives_bp.route('/api/ban_user', methods=['POST'])
@auth_required
def ban_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    ip = request.remote_addr
    if not username:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    if not validate_username(username):
        return "Invalid username format", 400
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.banned = True
        db.session.commit()
        socketio.emit('update', {'message': 'Queue updated!'})
        return "User banned successfully", 200
    return "User not found", 404

@ninelives_bp.route('/api/remove_user', methods=['POST'])
@auth_required
def remove_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    ip = request.remote_addr
    if not username:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    if not validate_username(username):
        return "Invalid username format", 400
    user = NineLives.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return "User removed successfully", 200
    return "User not found", 404

@ninelives_bp.route('/api/lives', methods=['GET'])
@auth_required
def get_lives():
    current_user = get_jwt_identity()
    lives_list = NineLives.query.order_by(NineLives.id).all()
    lives_data = [{"username": user.username, "lives": user.lives} for user in lives_list]
    return jsonify({"lives": lives_data})

@ninelives_bp.route('/api/adjust_lives', methods=['POST'])
@auth_required
def adjust_lives():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    ip = request.remote_addr
    if not username:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    if not validate_username(username):
        return "Invalid username format", 400
    amount = int(request.args.get('amount'))
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.lives += amount
        if user.lives <= 0:
            user.banned = True
            user.lives = 0
        db.session.commit()
        socketio.emit('update', {'message': 'Queue updated!'})
        return f"User {username} now has {user.lives} lives", 200
    return "User not found", 404

@ninelives_bp.route('/api/update_lives_order', methods=['POST'])
@auth_required
def update_lives_order():
    data = request.get_json()
    ip = request.remote_addr
    if not data:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    order = data.get('order', [])
    
    for position, username in enumerate(order):
        if not validate_username(username):
            return "Invalid username format", 400
        user = NineLives.query.filter_by(username=username).first()
        if user:
            user.position = position
        else:
            new_user = NineLives(username=username, position=position)
            db.session.add(new_user)
    
    db.session.commit()
    socketio.emit('update', {'message': 'Lives order updated!'})
    return jsonify({'msg': 'Lives order updated successfully'}), 200

@ninelives_bp.route('/api/update_highlighted_lives', methods=['POST'])
@auth_required
def update_highlighted_lives():
    data = request.get_json()
    ip = request.remote_addr
    if not data:
        log_write(log='error_log', msg='Missing parameters or invalid username', ip=ip, data=request.args)
        return "missing_parameters", 400
    
    highlighted_users = data.get('highlighted_users', [])
    
    for username in highlighted_users:
        if not validate_username(username):
            return "Invalid username format", 400
    
    for user in NineLives.query.all():
        user.highlighted = user.username in highlighted_users
    
    db.session.commit()
    socketio.emit('update', {'message': 'Highlighted lives updated!'})
    return jsonify({'msg': 'Highlighted lives updated successfully'}), 200

@ninelives_bp.route('/api/get_lives_order', methods=['GET'])
@auth_required
def get_lives_order():
    lives_order = NineLives.query.order_by(NineLives.position).all()
    return jsonify({
        'lives_order': [{'username': user.username, 'highlighted': user.highlighted, 'lives': user.lives} for user in lives_order]
    }), 200