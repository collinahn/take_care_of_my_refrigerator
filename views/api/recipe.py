import json
import time
from flask import Blueprint, request
from pymongo.errors import PyMongoError

from db.mongo import db_users
from utils.pwa_push import PushMsgFormat, PushSettings
from utils.celery_utils import  bulk_write_to_collection, push_history_to_be_recorded
from utils.response import incorrect_data_response, server_error, success_response
from tasks.push.worker import send_push_notification
from utils.logger import get_logger

bp_recipe = Blueprint('recipe', __name__, url_prefix='/api/recipe')
log = get_logger()

