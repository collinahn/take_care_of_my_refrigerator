import json
import time
from flask import Blueprint, request
from pymongo.errors import PyMongoError

from db.mongo import db_users, db_recipe
from utils.pwa_push import PushMsgFormat, PushSettings
from utils.celery_utils import  bulk_write_to_collection, push_history_to_be_recorded
from utils.response import incorrect_data_response, server_error, success_response
from tasks.push.worker import send_push_notification
from utils.logger import get_logger

bp_recipe = Blueprint('recipe', __name__, url_prefix='/api/recipe')
log = get_logger()

@bp_recipe.get('/<recipe_id>/')
def recipe(recipe_id):
    if not recipe_id:
        return incorrect_data_response('recipe_id is required')
    
    try:
        recipe_info = db_recipe['recipes'].find_one(
            {'_id': recipe_id},
        )
        if not recipe_info:
            return incorrect_data_response('no recipe found'), 400
    except PyMongoError as pe:
        log.error(pe)
        return server_error()
    
    
    return success_response('성공', data=recipe_info)
