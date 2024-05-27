from bson import ObjectId
from pymongo.errors import PyMongoError

from utils.logger import get_logger
from db.mongo import db_users

log = get_logger()

class InvalidInputError(Exception):
    pass
class UserNotFoundError(Exception):
    pass
class InvalidIngredientError(Exception):
    pass
class ServerError(Exception):
    pass

def parse_info_from_json(data: dict, *keyword) -> tuple:
    if not data:
        raise InvalidInputError('잘못된 요청입니다.')
    
    for k in keyword:
        if k not in data:
            raise InvalidInputError('입력하신 정보가 올바르지 않습니다.')
    
    return tuple(data.get(k) for k in keyword)


def get_ingredients(endpoint: str) -> list:
    try:
        user = db_users.find_one({'sub.endpoint': endpoint}, {
            'ingredients': 1
        })
        if not user:
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return user.get('ingredients', [])
    except PyMongoError as e:
        log.error(e)
        raise ServerError(str(e))
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
    
def add_ingredients(endpoint: str, ingredients: dict) -> bool:
    try:
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
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return True        
    except PyMongoError as e:
        log.error(e)
        return False
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
def update_ingredients(endpoint: str, ingredients: dict)  -> bool:
    ingredients_id = ingredients.get('id')
    if not ingredients_id:
        raise InvalidInputError('입력하신 정보가 올바르지 않습니다.')
    try:
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint, 'ingredients.id': ingredients_id}, 
            {
                '$set': {
                    f'ingredients.$[elem].{key}': value 
                    for key, value in ingredients.items() 
                    if key != 'id'
                }
            },
            array_filters=[
                {'ingredient.id': ingredients_id}
            ]
        )
        if update_res.matched_count == 0:
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return True        
    except PyMongoError as e:
        log.error(e)
        return False
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
def delete_ingredients(endpoint: str, ingredients_id: str) -> bool:
    try:
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint}, 
            {
                '$pull': {
                    'ingredients': {
                        'id': ingredients_id
                    }
                }
            }
        )
        if update_res.matched_count == 0:
            raise UserNotFoundError('존재하지 않는 사용자이거나 재료가 없습니다.')
    except PyMongoError as e:
        log.error(e)
        return False
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')