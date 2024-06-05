from bson import ObjectId
from pymongo.errors import PyMongoError
from pymongo import ReturnDocument
from datetime import datetime

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

def get_int(value: str, default: int = 0) -> int:
    try:
        return int(value)
    except ValueError:
        return default

def parse_info_from_json(data: dict, *keyword) -> tuple:
    if not data:
        raise InvalidInputError('잘못된 요청입니다.')
    
    for k in keyword:
        if k not in data:
            raise InvalidInputError('입력하신 정보가 올바르지 않습니다. 1')
    
    return tuple(data.get(k) for k in keyword)


def get_ingredients(endpoint: str) -> list:
    try:
        user: dict = db_users.find_one({'sub.endpoint': endpoint}, {
            'refrigerator': 1
        })
        if not user:
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return user.get('refrigerator', [])
    except PyMongoError as e:
        log.error(e)
        raise ServerError(str(e))
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
def validate_ingredients(ingredients: dict[str,str]) -> bool:
    if not ingredients:
        raise InvalidIngredientError('입력받은 재료가 없습니다.')
    if 'name' not in ingredients:
        raise InvalidIngredientError('재료 이름이 입력되지 않았습니다.')
    if not (0 < get_int(ingredients.get('quantity')) < 999):
        raise InvalidIngredientError('재료의 수량을 0이상 999 이하로 설정해주세요')
    if get_int(ingredients.get('expiryDate', '').replace('-', ''), -1) < get_int(datetime.now().strftime('%Y%m%d'), 0):
        raise InvalidIngredientError('유효하지 않은 유통기한입니다.') # 테스트용
    
    return True
        
    
    
def add_ingredients(endpoint: str, ingredients: dict) -> dict:
    iid = str(ObjectId())
    try:
        update_res = db_users.find_one_and_update(
            {'sub.endpoint': endpoint}, 
            {
                '$push': {
                    'refrigerator': {
                        '$each': [{
                            **ingredients,
                            'id': iid,
                            'added': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                            }],
                    }
                }
            },
            {
                'refrigerator': 1
            },
            return_document=ReturnDocument.AFTER
        )
        if not update_res:
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return update_res        
    except PyMongoError as e:
        log.error(e)
        return None
    except UserNotFoundError as e:
        log.error(e)
        raise UserNotFoundError('존재하지 않는 사용자입니다.')
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
def update_ingredients(endpoint: str, ingredients: dict)  -> dict:
    ingredients_id = ingredients.get('id')
    if not ingredients_id:
        raise InvalidInputError('입력하신 정보가 올바르지 않습니다.')
    try:
        update_res = db_users.find_one_and_update(
            {'sub.endpoint': endpoint, 'refrigerator.id': ingredients_id}, 
            {
                '$set': {
                    **{
                        f'refrigerator.$[elem].{key}': value 
                    for key, value in ingredients.items() 
                    if key != 'id'
                    },
                    'refrigerator.$[elem].updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            },
            {
                'refrigerator': 1
            },
            array_filters=[
                {'elem.id': ingredients_id}
            ],
            return_document=ReturnDocument.AFTER
        )
        if not update_res:
            raise UserNotFoundError('존재하지 않는 사용자입니다.')
        
        return update_res 
    except PyMongoError as e:
        log.error(e)
        return False
    except UserNotFoundError as e:
        log.error(e)
        raise UserNotFoundError('존재하지 않는 사용자입니다.')
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')
    
def delete_ingredients(endpoint: str, ingredients_id: str) -> bool:
    try:
        update_res = db_users.update_one(
            {'sub.endpoint': endpoint}, 
            {
                '$pull': {
                    'refrigerator': {
                        'id': ingredients_id
                    }
                }
            }
        )
        if update_res.matched_count == 0:
            raise UserNotFoundError('존재하지 않는 사용자이거나 재료가 없습니다.')
        return True
    except PyMongoError as e:
        log.error(e)
        return False
    except UserNotFoundError as e:
        log.error(e)
        raise UserNotFoundError('존재하지 않는 사용자입니다.')
    except Exception as e:
        log.error(e)
        raise InvalidIngredientError('올바르지 않은 재료형식입니다.')