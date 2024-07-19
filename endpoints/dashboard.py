from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import secrets
from datetime import datetime
from .database import db
from .models import *
from .auth import auth_required

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
@auth_required
def get_queue():
    current_user = get_jwt_identity()
    queue_list = Queue.query.order_by(Queue.id).all()
    queue_data = [{"username": user.username} for user in queue_list]
    return jsonify({"queue": queue_data})

    
"""
@dashboard_bp.route('/api/reset_api_key', methods=['POST'])
@auth_required
def reset_api_key():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    user.api_key = secrets.token_hex(16)
    db.session.commit()
    return jsonify({'api_key': user.api_key})
"""