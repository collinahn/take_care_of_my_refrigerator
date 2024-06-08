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

bp_search = Blueprint('search', __name__, url_prefix='/api/search')
log = get_logger()


@bp_search.get('/recipe/')
def search_recipe():
    '''
    레시피를 검색한다
    params
    title: 검색어
    keyword: 선호 키워드
    endpoint: 검색자의 endpoint
    cidx: current index
    '''
    if 'title' not in request.args and 'keyword' not in request.args:
        return incorrect_data_response('검색어를 입력해주세요'), 400
    
    title = request.args.get('title')
    keyword = request.args.get('keyword')
    endpoint = request.args.get('endpoint')
    cidx = int(request.args.get('cidx', 0))
    sort = request.args.get('sort', 'DEFAULT')
    sort_method = ()
    if sort == "COOKTIME":
        sort_method = (
            'cook_time', 1
        )
    
    try:
        _searched_recipe = list(db_recipe.find(
            {
                '$text': {'$search': f'{title} {keyword}'},
            },
            {
                'title': 1,
                'image': 1,
                'url': 1,
                'cook_time': 1,
                'portion': 1,
                'ingredients': 1,
                'tags': 1,
                'ingred': 1,
                'difficulty': 1,
                'score': {'$meta': 'textScore'}
            }
        ).sort([
            sort_method, ('score', {'$meta': 'textScore'})
        ] if sort_method else [('score', {'$meta': 'textScore'})]).skip(cidx).limit(20))
        
        if not _searched_recipe:
            return incorrect_data_response('검색 결과가 없습니다'), 404
        
        _user_data = db_users.find_one(
            {'sub.endpoint': endpoint},
            {
                'refrigerator': 1,
                'favorite': 1,
            }
        ) or {}
        
        _ingredients = set([ i.get('name') for i in _user_data.get('refrigerator', [])])
        _favorite = _user_data.get('favorite', [])
        
        _searched_recipe = [
            {
                **recipe,
                'favorite': recipe.get('_id') in _favorite,
                'ingred404': [
                    ingred
                    for ingred in recipe.get('ingred', [])
                    if ingred not in _ingredients
                ]
            }
            for recipe in _searched_recipe
        ]
        
    except PyMongoError as pe:
        log.error(pe)
        return server_error('잠시 후 다시 이용해주세요'), 500
        
    return success_response(
        data={
            'display_list': _searched_recipe,
            'refrigerator': list(_ingredients),
            'nidx': cidx+ 20,
        },
    )
        
    

    