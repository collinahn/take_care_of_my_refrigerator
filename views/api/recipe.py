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
def recipe_data(recipe_id):
    if not recipe_id:
        return incorrect_data_response('recipe_id is required')
    
    user_favorite_info = {}
    endpoint = request.args.get('endpoint')
    
    try:
        recipe_info: dict = db_recipe.find_one(
            {'_id': recipe_id},
            {
                'original_url': 0,
            }
        )
        if endpoint:
            user_favorite_info = db_users.find_one(
                {'sub.endpoint': endpoint},
                {
                    'favorite': 1, 
                    'refrigerator': 1,
                }
            ) or {}
        if not recipe_info:
            return incorrect_data_response('no recipe found'), 400
    except PyMongoError as pe:
        log.error(pe)
        return server_error()
    
    _ingredients = set([ i.get('name') for i in user_favorite_info.get('refrigerator', [])])
    return success_response('성공', data={
        **recipe_info,
        'favorite': recipe_id in user_favorite_info.get('favorite', []),
        'ingred404': [
            ingred
            for ingred in recipe_info.get('ingred', [])
            if ingred not in _ingredients
        ]
    })


@bp_recipe.get('/bulk/')
def bulk_recipe():
    if 'ids' not in request.args:
        return incorrect_data_response('잘못된 요청'), 403
    
    recipe_ids = request.args.get('ids')
    if not recipe_ids:
        return incorrect_data_response('요청하신 레시피가 없습니다'), 400
    
    recipes_id = recipe_ids.split('|')
    
    user_favorite_info = {}
    endpoint = request.args.get('endpoint')
    
    log.info(f'bulk_recipe: {recipes_id}')
    
    try:
        recipes = db_recipe.find(
            {
                '_id': {'$in': recipes_id}
            },
            {
                'original_url': 0,
            }
        )
        if endpoint:
            user_favorite_info = db_users.find_one(
                {'sub.endpoint': endpoint},
                {'favorite': 1}
            )
        log.info(f'recipes: {recipes}')
        if not recipes:
            return incorrect_data_response('no recipe found'), 400
    except PyMongoError as pe:
        log.error(pe)
        return server_error()
    
    return success_response('성공', data=[
        {
            **recipe,
            'favorite': recipe['_id'] in user_favorite_info.get('favorite', [])
        } for recipe in recipes
    ])