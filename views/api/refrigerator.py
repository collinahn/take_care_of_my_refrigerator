from flask import Blueprint, request
from pymongo.errors import PyMongoError
from bson import ObjectId

from db.mongo import db_users
from utils.response import incorrect_data_response, server_error, success_response
from utils.logger import get_logger
from utils.ingredients import (
    UserNotFoundError, 
    InvalidIngredientError,
    InvalidInputError,
    ServerError,
    parse_info_from_json, 
    get_ingredients,
    add_ingredients, 
    update_ingredients, 
    delete_ingredients,
    validate_ingredients
)

bp_refrigerator = Blueprint('refrigerator', __name__, url_prefix='/api/refrigerator')
log = get_logger()

@bp_refrigerator.get('/')
def get_ingredients_list():
    try:
        endpoint, = parse_info_from_json(request.args, 'endpoint')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    try:
        return get_ingredients(endpoint), 200
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    except UserNotFoundError as e:
        return incorrect_data_response(str(e)), 400
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    except ServerError as e:
        return server_error(str(e)), 500

@bp_refrigerator.post('/add/')
def add_user_ingredients():
    try:
        endpoint, ingredients  = parse_info_from_json(request.get_json(silent=True), 
                                                      'endpoint', 'ingredients')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    try:
        validate_ingredients(ingredients)
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    
    try:
        res = add_ingredients(endpoint, ingredients)
    except UserNotFoundError as e:
        return incorrect_data_response(str(e)), 400
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    
    if not res:
        return server_error('서버 오류로 추가되지 않았습니다.'), 400
    return success_response('추가되었습니다.', data=res)
    
    
@bp_refrigerator.post('/update/')
def update_user_ingredients():
    try:
        endpoint, ingredients = parse_info_from_json(request.get_json(silent=True), 
                                                     'endpoint', 'ingredients')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    try:
        validate_ingredients(ingredients)
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
        
    try:
        res = update_ingredients(endpoint, ingredients)
    except UserNotFoundError as e:
        return incorrect_data_response(str(e)), 400
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    
    if not res:
        return server_error('서버 오류로 수정되지 않았습니다.'), 400
    return success_response('수정되었습니다.', data=res)
    
@bp_refrigerator.delete('/delete/')
def delete_user_ingredients():
    try:
        endpoint, ingredient_id = parse_info_from_json(request.args, 
                                                     'endpoint', 'id')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    
    try:
        res = delete_ingredients(endpoint, ingredient_id)
    except UserNotFoundError as e:
        return incorrect_data_response(str(e)), 400
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    
    if not res:
        return server_error('서버 오류로 삭제되지 않았습니다.'), 400
    return success_response('삭제되었습니다.')