import os
import secrets
import socket
import sys
from datetime import timedelta
from flask import Flask
from dotenv import load_dotenv
from flask.logging import create_logger
from flask_jwt_extended import JWTManager
##FIXME:
# - JWT timeout seems to work, but I need to make sure it only "starts" when there is no activity. basically with every user input, we can refresh timeout?
#    - Remove revoking jwt when navigating away from page. Only want to do time based JWT.

# Custom module imports
from endpoints import *

# load .env
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Setup logging
log = create_logger(app)    # flask built-in logging

log_filepath = os.path.join(os.path.dirname(__file__), 'log', 'app.log')

# define config variables
DEBUG = os.getenv('DEBUG', 'False').lower() in ['true', '1', 't']
PRODUCTION = os.getenv('PRODUCTION', 'False').lower() in ['true', '1', 't']
DATABASE_TYPE = os.getenv('DATABASE', 'POSTGRES').upper()
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_DATABASE_URI = None
SECRET_KEY = os.getenv('SECRET_KEY')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
APP_DEFAULT_EMAIL = os.getenv('APP_DEFAULT_EMAIL').lower()
APP_DEFAULT_PASSWORD = os.getenv('APP_DEFAULT_PASSWORD')

# Set Flask configurations
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)))

# Initialize JWT
jwt = JWTManager(app)
socketio.init_app(app)

# Parse variables and determine best database URI
if DATABASE_TYPE == 'POSTGRES':
    SQLALCHEMY_DATABASE_URI = os.getenv('POSTGRES_PROD_URI') if PRODUCTION else os.getenv('POSTGRES_DEV_URI')
elif DATABASE_TYPE == 'MYSQL':
    SQLALCHEMY_DATABASE_URI = os.getenv('MYSQL_PROD_URI') if PRODUCTION else os.getenv('MYSQL_DEV_URI')
else:
    log.error("Unsupported DATABASE type; only 'POSTGRES' or 'MYSQL' are valid.")
    print("Unsupported DATABASE type; only 'POSTGRES' or 'MYSQL' are valid.")
    sys.exit(1)

app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
log.info(f'{DATABASE_TYPE} database configuration loaded.')


# Register blueprints
app.register_blueprint(database_bp)
app.register_blueprint(queue_bp)
app.register_blueprint(ninelives_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(auth_bp)

# Initialize extensions
db.init_app(app)
bcrypt.init_app(app)

# Create the database tables
with app.app_context():
    try:
        db.create_all()
        if not User.query.filter_by(email=APP_DEFAULT_EMAIL).first():
            api_key = 'q-' + secrets.token_hex(32)
            print(api_key)
            default_user = User(email=APP_DEFAULT_EMAIL, password=APP_DEFAULT_PASSWORD, api_key=api_key, role='admin')
            print(default_user.password_hash, default_user.api_key)
            db.session.add(default_user)
            db.session.commit()
    except Exception as e:
        log.error(f"Failed to create database tables: {e}")
        print(f"Failed to create database tables: {e}")
        sys.exit(1)


if __name__ == '__main__':
    host = socket.gethostname()
    IP = socket.gethostbyname(host)
    try:
        socketio.run(app, host=IP, port=5000, debug=DEBUG)
    except Exception as e:
        log.error(f"Failed to start the Flask server: {e}")
        print(f"Failed to start the Flask server: {e}")
        sys.exit(1)