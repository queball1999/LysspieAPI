from flask import Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

database_bp = Blueprint('database', __name__)
db = SQLAlchemy()
bcrypt = Bcrypt()