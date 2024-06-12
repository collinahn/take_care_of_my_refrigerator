from flask import Blueprint, request
from pymongo.errors import PyMongoError
from bson import ObjectId

from db.redis import redis_client
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
    bulk_add_ingredients,
    update_ingredients, 
    delete_ingredients,
    delete_many_ingredients_by_name,
    validate_ingredients,
    get_autocomplete_data
)
from utils.ocr.ocr_by_gptapi import receipt_ocr_gptapi_binary

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

@bp_refrigerator.delete('/bulk/delete/')
def bulk_delete_user_ingredients_by_name():
    try:
        endpoint, ingredient_ids = parse_info_from_json(request.args, 
                                                     'endpoint', 'id')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    ingredient_ids = ingredient_ids.split(',')
    
    try:
        res = delete_many_ingredients_by_name(endpoint, ingredient_ids)
    except UserNotFoundError as e:
        return incorrect_data_response(str(e)), 400
    except InvalidIngredientError as e:
        return incorrect_data_response(str(e)), 400
    
    if not res:
        return server_error('서버 오류로 삭제되지 않았습니다.'), 400
    return success_response('삭제되었습니다.')

@bp_refrigerator.post('/upload/')
def upload_file():
    try:
        endpoint,  = parse_info_from_json(request.form, 
                                            'endpoint')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    if 'file' not in request.files:
        return incorrect_data_response('파일이 존재하지 않습니다.'), 400
    file = request.files['file']
    if file.filename == '':
        return incorrect_data_response('선택된 파일이 없습니다.'), 400
    if file:
        file_content = file.read()
        gpt_result: list[dict] = receipt_ocr_gptapi_binary(file_content)
        log.info(f'gpt_result: {gpt_result}')
        
        if not gpt_result:
            return incorrect_data_response('사진으로부터 식재료 정보를 찾을 수 없습니다.\n선명한 사진으로 다시 시도해보세요'), 400
        
        try:
            bulk_add_ingredients(endpoint, gpt_result)
        except UserNotFoundError as e:
            return incorrect_data_response(str(e)), 400
        except InvalidIngredientError as e:
            return incorrect_data_response(str(e)), 400
        

        return success_response('성공')

@bp_refrigerator.get('/autocomplete/recipe/name/')
def autocomplete_recipe_name():
    try:
        query, = parse_info_from_json(request.args, 'q')
    except InvalidInputError as e:
        return incorrect_data_response(str(e)), 400
    
    data = get_autocomplete_data(query)
    
    return success_response('성공', data=data)

    