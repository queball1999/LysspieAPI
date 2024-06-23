from flask import Blueprint
from flask_sqlalchemy import SQLAlchemy

database_bp = Blueprint('database', __name__)
db = SQLAlchemy()