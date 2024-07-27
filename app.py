#
#   Program: LysspieAPI
#
#   Description: 
#
#   Software: Microsoft Visual Studios 16.8.3
#
#   Date: 27th of July 2024
#
#   Author: Quynn Bell
#

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

# Load logging library
import logging
from logging.handlers import RotatingFileHandler

# Custom module imports
from endpoints import *

# FIXME:
#       - uwsgi struggles with SSE events, need to solve
#       - settings modal needs to collapse on mobile.
#       - need to add lazy loading animation. also refresh button needs animation.
#       - Mobile no longer can scroll on dashboard
#       - Need to implement access logging.
#       - Need to ban users with failed authentication for set amount of time.

# Initialize Flask app
app = Flask(__name__)
socketio = SocketIO(app)

def load_config():
    global DEBUG, PRODUCTION, DATABASE_TYPE, SQLALCHEMY_DATABASE_URI, APP_DEFAULT_username, APP_DEFAULT_PASSWORD, SECRET_KEY, NIGHTBOT_USER, NIGHTBOT_CHANNEL
    DEBUG = os.getenv('DEBUG', 'False').lower() in ['true', '1', 't']
    PRODUCTION = os.getenv('PRODUCTION', 'False').lower() in ['true', '1', 't']
    DATABASE_TYPE = os.getenv('DATABASE', 'POSTGRES').upper()
    APP_DEFAULT_username = os.getenv('APP_DEFAULT_USERNAME').lower()
    APP_DEFAULT_PASSWORD = os.getenv('APP_DEFAULT_PASSWORD')
    SECRET_KEY = os.getenv('SECRET_KEY')
    NIGHTBOT_USER = os.getenv('NIGHTBOT_USER')
    NIGHTBOT_CHANNEL = os.getenv('NIGHTBOT_CHANNEL')

def setup_logging():
    log = create_logger(app)
    
    if not os.path.exists('log'):
        os.mkdir('log')

    log_filepath = os.path.join('log', 'app.log')
    access_log_filepath = os.path.join('log', 'access.log')
    error_log_filepath = os.path.join('log', 'error.log')

    handler = RotatingFileHandler(log_filepath, maxBytes=100000, backupCount=10)
    handler.setLevel(logging.DEBUG if DEBUG else logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    log.addHandler(handler)

    access_handler = RotatingFileHandler(access_log_filepath, maxBytes=100000, backupCount=10)
    access_handler.setLevel(logging.INFO)
    access_formatter = logging.Formatter('%(asctime)s - %(message)s')
    access_handler.setFormatter(access_formatter)
    access_log = logging.getLogger('access')
    access_log.addHandler(access_handler)

    error_handler = RotatingFileHandler(error_log_filepath, maxBytes=100000, backupCount=10)
    error_handler.setLevel(logging.ERROR)
    error_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    error_handler.setFormatter(error_formatter)
    error_log = logging.getLogger('error')
    error_log.addHandler(error_handler)
    return log

def configure_database():
    global SQLALCHEMY_DATABASE_URI
    if DATABASE_TYPE == 'POSTGRES':
        SQLALCHEMY_DATABASE_URI = os.getenv('POSTGRES_PROD_URI') if PRODUCTION else os.getenv('POSTGRES_DEV_URI')
    elif DATABASE_TYPE == 'MYSQL':
        SQLALCHEMY_DATABASE_URI = os.getenv('MYSQL_PROD_URI') if PRODUCTION else os.getenv('MYSQL_DEV_URI')
    else:
        log.error("Unsupported DATABASE type; only 'POSTGRES' or 'MYSQL' are valid.")
        print("Unsupported DATABASE type; only 'POSTGRES' or 'MYSQL' are valid.")
        sys.exit(1)

def set_flask_config():
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = SECRET_KEY

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
    bcrypt.init_app(app)

def create_database():
    with app.app_context():
        try:
            db.create_all()
            if not User.query.filter_by(username=APP_DEFAULT_username).first():
                api_key = User.generate_api_key()
                default_user = User(username=APP_DEFAULT_username, password=APP_DEFAULT_PASSWORD, api_key=api_key, role='admin')
                db.session.add(default_user)
                db.session.commit()
        except Exception as e:
            log.error(f"Failed to create database tables: {e}")
            print(f"Failed to create database tables: {e}")
            sys.exit(1)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

def main():
    load_config()
    global log
    log = setup_logging()
    configure_database()
    set_flask_config()
    register_blueprints()
    initialize_extensions()
    create_database()

if __name__ == '__main__':
    main()
    host = socket.gethostname()
    IP = socket.gethostbyname(host)
    try:
        socketio.run(app, host=IP, port=5100, debug=DEBUG)
    except Exception as e:
        log.error(f"Failed to start the Flask server: {e}")
        print(f"Failed to start the Flask server: {e}")
        sys.exit(1)
