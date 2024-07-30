#
#   Program: LysspieAPI
#
#   Description: 
#
#   Software: Microsoft Visual Studios 16.8.3
#
#   Date: 30th of July 2024
#
#   Author: Quynn Bell
#

# FIXME:
#       - uwsgi struggles with SSE events, need to solve
#       - settings modal seems to stack on mobile, but clicking on category does not display the settings.
#       - need to add lazy loading animation. also refresh button needs animation.
#       - Should the password be hashed before sent to server? Probably
#       - Need to ban users with failed authentication for set amount of time.
#       - Need tooltips for buttons

import os
import secrets
import socket
import sys

# Load .env
from dotenv import load_dotenv
load_dotenv()

# Load Flask
from flask import Flask, render_template
from flask.logging import create_logger
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Custom module imports
from endpoints import *

# Initialize Flask app
app = Flask(__name__)

# Setup logging
from handling import *
loggers = setup_logging(app)
log = loggers['log']
access_log = loggers['access_log']
error_log = loggers['error_log']

# Register the limiter
limiter.init_app(app)

def load_config():
    app.config['DEBUG'] = os.getenv('DEBUG', 'False').lower() in ['true', '1', 't']
    app.config['PRODUCTION'] = os.getenv('PRODUCTION', 'False').lower() in ['true', '1', 't']
    app.config['DATABASE_TYPE'] = os.getenv('DATABASE', 'POSTGRES').upper()
    app.config['APP_DEFAULT_USERNAME'] = os.getenv('APP_DEFAULT_USERNAME').lower()
    app.config['APP_DEFAULT_PASSWORD'] = os.getenv('APP_DEFAULT_PASSWORD')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['NIGHTBOT_USER'] = os.getenv('NIGHTBOT_USER')
    app.config['NIGHTBOT_CHANNEL'] = os.getenv('NIGHTBOT_CHANNEL')

def configure_database():
    if app.config['DATABASE_TYPE'] == 'POSTGRES':
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRES_PROD_URI') if app.config['PRODUCTION'] else os.getenv('POSTGRES_DEV_URI')
    elif app.config['DATABASE_TYPE'] == 'MYSQL':
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('MYSQL_PROD_URI') if app.config['PRODUCTION'] else os.getenv('MYSQL_DEV_URI')
    else:
        log_write(log='error_log', msg="Unsupported DATABASE type; only 'POSTGRES' or 'MYSQL' are valid.")
        sys.exit(1)

def register_blueprints():
    app.register_blueprint(database_bp)
    app.register_blueprint(queue_bp)
    app.register_blueprint(ninelives_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(auth_bp)

def initialize_extensions():
    jwt = JWTManager(app)
    socketio.init_app(app)
    db.init_app(app)
    Bcrypt(app).init_app(app)

def create_database():
        with app.app_context():    
            try:
                log_write(log='log', msg=f"Creating database tables")
                db.create_all()
                if not User.query.filter_by(username=app.config['APP_DEFAULT_USERNAME']).first():
                    log_write(log='log', msg=f"Creating default user account")
                    api_key = User.generate_api_key()
                    default_user = User(username=app.config['APP_DEFAULT_USERNAME'], password=app.config['APP_DEFAULT_PASSWORD'], api_key=api_key, role='admin')
                    db.session.add(default_user)
                    db.session.commit()
            except Exception as e:
                log_write(log='error_log', msg=f"Failed to create database tables: {e}")
                sys.exit(1)

@app.before_request
def handle_before_request():
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr
    ip_ban_response = check_ip_ban(ip)
    if ip_ban_response:
        log_write(log='access_log', msg=f'IP banned from request', ip=ip)
        return ip_ban_response

@app.errorhandler(404)
def page_not_found(e):
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr
    log_write(log='error_log', msg=f'404 error encountered', ip=ip)
    return render_template('404.html'), 404

def main():
    load_config()
    configure_database()
    register_blueprints()
    initialize_extensions()
    create_database()

if __name__ == '__main__':
    main()
    HOST = socket.gethostname()
    HOST_IP = socket.gethostbyname(HOST)
    try:
        socketio.run(app, host=HOST_IP, port=5100, debug=app.config['DEBUG'], use_reloader=False)
    except Exception as e:
        log_write(log='error_log', msg=f"Failed to start the Flask server: {e}")
        sys.exit(1)
