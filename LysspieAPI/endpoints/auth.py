from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .user import User
import os
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Bad request"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if user and user.verify_password(data['password']):
        access_token = create_access_token(identity=user.email)
        print(f"Generated JWT Token: {access_token}")  # Debug print
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Invalid credentials"}), 401
