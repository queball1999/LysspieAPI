import os
from datetime import datetime
import re
from functools import wraps
from flask import jsonify, request, Blueprint
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import jwt_required, get_jwt_identity

# Import your local modules
from .database import db

# Get the current file's location
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

# Define paths
parent_directory = os.path.dirname(__location__)
main_directory = os.path.dirname(parent_directory)
log_filepath = os.path.join(__location__, 'log', 'app.log')

# Create a Flask Blueprint for clients
ninelives_bp = Blueprint('ninelives', __name__)

class NineLives(db.Model):
    __tablename__ = 'ninelives'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    lives = db.Column(db.Integer, default=9)
    banned = db.Column(db.Boolean, default=False)

@ninelives_bp.route('/api/ninelives', methods=['GET'])
def manage_ninelives():
    username = request.args.get('username')
    
    if not username:
        return "missing_parameters", 400
    
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.lives -= 1
        if user.lives <= 0:
            user.banned = True
            db.session.commit()
            return f"{username} has no lives left! Banning them from chat.", 200
        else:
            db.session.commit()
            return f"{username} has {user.lives} lives left.", 200
    else:
        try:
            new_user = NineLives(username=username, lives=8)
            db.session.add(new_user)
            db.session.commit()
            return f"{username} has 8 lives left.", 200
        except IntegrityError:
            db.session.rollback()
            return "There was an error processing your request.", 500

@ninelives_bp.route('/api/bulk_ban', methods=['POST'])
@jwt_required()
def bulk_ban():
    current_user = get_jwt_identity()
    data = request.get_json()
    usernames = data.get('usernames', [])
    
    for username in usernames:
        user = NineLives.query.filter_by(username=username).first()
        if user:
            user.banned = True
    db.session.commit()
    return "Users banned successfully", 200

@ninelives_bp.route('/api/bulk_clear', methods=['POST'])
@jwt_required()
def bulk_clear():
    current_user = get_jwt_identity()
    data = request.get_json()
    usernames = data.get('usernames', [])
    
    for username in usernames:
        user = NineLives.query.filter_by(username=username).first()
        if user:
            db.session.delete(user)
    db.session.commit()
    return "Lives cleared successfully", 200

@ninelives_bp.route('/api/ban_user', methods=['POST'])
@jwt_required()
def ban_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    user = NineLives.query.filter_by(username=username).first()
    if user:
        user.banned = True
        db.session.commit()
        return "User banned successfully", 200
    return "User not found", 404

@ninelives_bp.route('/api/remove_user', methods=['POST'])
@jwt_required()
def remove_user():
    current_user = get_jwt_identity()
    username = request.args.get('username')
    user = NineLives.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return "User removed successfully", 200
    return "User not found", 404

@ninelives_bp.route('/api/adjust_lives', methods=['POST'])
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
