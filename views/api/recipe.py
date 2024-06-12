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
from views.api.recipe_utils.match_ingredient import not_found_ingredient, overlapping_ingredient

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
    recipe_ingred = recipe_info.get('ingred', [])
    ingred_not_found = not_found_ingredient(recipe_ingred, _ingredients)
    
    
    
    return success_response('성공', data={
        **recipe_info,
        'favorite': recipe_id in user_favorite_info.get('favorite', []),
        'ingred404': ingred_not_found,
        'refrigerator': list(_ingredients)
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
    
@bp_recipe.get('/recommended/')
def recommended_recipe():
    endpoint = request.args.get('endpoint')
    if not endpoint:
        return incorrect_data_response('기기 정보가 없습니다'), 400
    
    aggregation_pipeline = [
        {
            '$match': {
                'sub.endpoint': endpoint
            }
        },
        {
            '$unwind': {
                'path': '$recommendedRecipe', 
                'includeArrayIndex': 'string', 
                'preserveNullAndEmptyArrays': False
            }
        }, {
            '$unwind': {
                'path': '$recommendedRecipe.ids', 
                'includeArrayIndex': 'string', 
                'preserveNullAndEmptyArrays': False
            }
        }, {
            '$lookup': {
                'from': 'recipe', 
                'localField': 'recommendedRecipe.ids', 
                'foreignField': '_id', 
                'as': 'matchedRecipe'
            }
        }, {
            '$unwind': {
                'path': '$matchedRecipe', 
                'preserveNullAndEmptyArrays': False
            }
        }, {
            '$group': {
                '_id': '$_id', 
                'endpoint': {
                    '$first': '$sub.endpoint'
                }, 
                'favorite': {
                    '$first': '$favorite'
                }, 
                'profile': {
                    '$first': '$profile'
                }, 
                'ids': {
                    '$addToSet': '$recommendedRecipe.ids'
                },
                'refrigerator': {
                    '$first': '$refrigerator'
                },
                'matchedRecipe': {
                    '$addToSet': '$matchedRecipe'
                }
            }
        }, {
            '$project': {
                'matchedRecipe.original_url': 0,
                'matchedRecipe.description': 0,
                'matchedRecipe.recipe': 0,
                'matchedRecipe.soup': 0,
                'matchedRecipe.text': 0,
                'matchedRecipe.ingredients': 0,
                'matchedRecipe.temp': 0,
            }
        }
    ]
    
    try:
        user_info: list[dict] = list(db_users.aggregate(aggregation_pipeline))
        if not user_info or len(user_info) == 0:
            return incorrect_data_response('사용자 정보가 없습니다'), 400
    except PyMongoError as pe:
        log.error(pe)
        return server_error(), 400
    
    _recommended_recipe = user_info[0].get('matchedRecipe', [])
    _favorite = user_info[0].get('favorite', [])
    _user_ref = user_info[0].get('refrigerator', [])
    _ingredients = set([ i.get('name') for i in _user_ref])
    _hatelist = user_info[0].get('profile', {}).get('hate', [])
    
    
    if not _recommended_recipe:
        return incorrect_data_response('저장된 추천 레시피 없음'), 200
    
    return success_response('성공', data={
        'display_list': [
            {
                **recipe,
                'ingred404': not_found_ingredient(recipe.get('ingred', []), _ingredients),
                'favorite': _favorite,
            } for recipe in _recommended_recipe
            if not overlapping_ingredient(recipe.get('ingred', []), _hatelist)
        ],
        'hate': _hatelist,
    })
    
    
    