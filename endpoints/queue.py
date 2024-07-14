import os
from datetime import datetime
import re
from functools import wraps
from flask import jsonify, request, Blueprint
#from .auth import verify_api_key

# Import your local modules
from .database import db

# Get the current file's location
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

# Define paths
parent_directory = os.path.dirname(__location__)
main_directory = os.path.dirname(parent_directory)
log_filepath = os.path.join(__location__, 'log', 'app.log')

# Create a Flask Blueprint for clients
queue_bp = Blueprint('queue', __name__)


class Queue(db.Model):
    __tablename__ = 'queue'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    

@queue_bp.route('/api/queue', methods=['GET'])
def manage_queue():
    print('QUEUE')
    action = request.args.get('action')
    username = request.args.get('username')
    
    if not action or not username:
        return "missing_parameters", 400

    if action == "join":
        try:
            new_user = Queue(username=username)
            db.session.add(new_user)
            db.session.commit()
            return f"{username} has joined the queue!", 200
        except:
            db.session.rollback()
            return f"{username} is already in the queue!", 200
    elif action == "leave":
        user = Queue.query.filter_by(username=username).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            return f"{username} has left the queue!", 200
        else:
            return f"{username} is not in the queue!", 200
    elif action == "skip":
        user = Queue.query.order_by(Queue.id).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            return f"{user.username} has skipped this round and will go next.", 200
        else:
            return "The queue is empty.", 200
    elif action == "position":
        users = Queue.query.order_by(Queue.id).all()
        position = next((i for i, u in enumerate(users, start=1) if u.username == username), None)
        if position:
            return f"{username}, your position in the queue is {position}.", 200
        else:
            return f"{username} is not in the queue!", 200
    else:
        return "invalid_action", 400