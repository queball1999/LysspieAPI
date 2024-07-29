from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta

# Initialize Limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1500 per 15 minutes"]
)

# IP Ban tracking
failed_attempts = {}

def log_failed_attempt(ip):
    now = datetime.now()
    if ip not in failed_attempts:
        failed_attempts[ip] = []
    failed_attempts[ip].append(now)
    failed_attempts[ip] = [time for time in failed_attempts[ip] if time > now - timedelta(minutes=15)]

def is_ip_banned(ip):
    print('IP: ', ip)
    if ip in failed_attempts and len(failed_attempts[ip]) >= 3:
        return True
    return False

def check_ip_ban():
    ip = get_remote_address()
    if is_ip_banned(ip):
        return "You are temporarily banned due to multiple failed attempts. Please try again later.", 403
