import os
import logging
from logging.handlers import RotatingFileHandler
from flask.logging import create_logger

loggers = {'log': '', 'access_log': '','error_log': ''}

def setup_logging(app):
    global loggers
    
    log = create_logger(app)
    
    if not os.path.exists('log'):
        os.mkdir('log')

    log_filepath = os.path.join('log', 'app.log')
    access_log_filepath = os.path.join('log', 'access.log')
    error_log_filepath = os.path.join('log', 'error.log')

    handler = RotatingFileHandler(log_filepath, maxBytes=100000, backupCount=10)
    handler.setLevel(logging.DEBUG if app.config['DEBUG'] else logging.INFO)
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
    
    loggers['log'] = log
    loggers['access_log'] = access_log
    loggers['error_log'] = error_log

    return loggers
