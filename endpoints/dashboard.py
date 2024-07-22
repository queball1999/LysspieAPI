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
    web_server = request.environ.get('SERVER_SOFTWARE', 'Unknown Web Server')
    app_version = "1.0.0"  # Replace with your app version
    return render_template('dashboard.html', web_server=web_server, app_version=app_version)

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
