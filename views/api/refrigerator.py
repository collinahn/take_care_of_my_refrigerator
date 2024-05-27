from flask import Blueprint, request
from pymongo.errors import PyMongoError
from bson import ObjectId

from db.mongo import db_users
from utils.response import incorrect_data_response, server_error, success_response
from utils.logger import get_logger

bp_refrigerator = Blueprint('refrigerator', __name__, url_prefix='/api/refrigerator')
log = get_logger()

@bp_refrigerator.post('/add/')
def add_ingredients():
    try:
        data: dict = request.get_json(silent=True)
        if not data:
            return incorrect_data_response('입력하신 정보가 올바르지 않습니다.'), 400
        endpoint = data.get('endpoint')
        ingredients = data.get('ingredient')
        if not endpoint or not ingredients:
            return incorrect_data_response()
        
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint}, 
            {
                '$push': {
                    'ingredients': {
                        '$each': [{
                            'id': str(ObjectId()),
                            **ingredients,
                            }],
                    }
                }
            }
        )
        if update_res.matched_count == 0:
            return incorrect_data_response('존재하지 않는 사용자입니다.'), 400
        
        return success_response("추가되었습니다.")
    except PyMongoError as e:
        log.error(e)
        return server_error(), 500
    except Exception as e:
        log.error(e)
        return server_error(), 500
    
    
@bp_refrigerator.post('/update/')
def update_ingredients():
    try:
        data: dict = request.get_json(silent=True)
        if not data:
            return incorrect_data_response('입력하신 정보가 올바르지 않습니다.'), 400
        endpoint = data.get('endpoint')
        ingredient: dict = data.get('ingredient', {})
        ingredient_id: str = ingredient.get('ingredient_id', '')
        if not endpoint or not ingredient_id or not ingredient:
            return incorrect_data_response('입력하신 정보가 올바르지 않습니다.'), 400
        
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint, 'ingredients.id': ingredient_id}, 
            {
                '$set': {
                    f'ingredients.$[elem].{key}': value 
                    for key, value in ingredient.items() 
                    if key != 'id'
                }
            },
            array_filters=[
                {'ingredient.id': ingredient_id}
            ]
        )
        if update_res.matched_count == 0:
            return incorrect_data_response('존재하지 않는 사용자이거나 재료가 없습니다.'), 400
        
        return success_response("수정되었습니다.")
    except PyMongoError as e:
        log.error(e)
        return server_error(), 500
    except Exception as e:
        log.error(e)
        return server_error(), 500
    
@bp_refrigerator.post('/delete/')
def delete_ingredients():
    try:
        endpoint = request.args.get('endpoint')
        ingredient_id = request.args.get('id')
        if not endpoint or not ingredient_id:
            return incorrect_data_response('입력하신 정보가 올바르지 않습니다.'), 400
        
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint}, 
            {
                '$pull': {
                    'ingredients': {
                        'id': ingredient_id
                    }
                }
            }
        )
        if update_res.matched_count == 0:
            return incorrect_data_response('존재하지 않는 사용자이거나 재료가 없습니다.'), 400
        
        return success_response("삭제되었습니다.")
    except PyMongoError as e:
        log.error(e)
        return server_error(), 500
    except Exception as e:
        log.error(e)
        return server_error(), 500