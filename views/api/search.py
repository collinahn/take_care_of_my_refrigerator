import json
import time
from flask import Blueprint, request
from pymongo.errors import PyMongoError

from db.mongo import db_users, db_recipe
from utils.pwa_push import PushMsgFormat, PushSettings
from utils.celery_utils import  bulk_write_to_collection, push_history_to_be_recorded
from utils.response import incorrect_data_response, server_error, success_response
from tasks.recommend.worker import create_recommended_recipe
from utils.logger import get_logger
from views.api.recipe_utils.match_ingredient import not_found_ingredient

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
    use_aggregation = sort == 'INGRED'
    sort_method = ()
    if sort == 'COOKTIME':
        sort_method = (
            'cook_time', 1
        )
        
    
    try:
        _user_data = db_users.find_one(
            {'sub.endpoint': endpoint},
            {
                'refrigerator': 1,
                'favorite': 1,
                'profile': 1,
            }
        ) or {} if endpoint else {}
        
        _ingredients = set([ i.get('name') for i in _user_data.get('refrigerator', [])])
        _favorite = _user_data.get('favorite', [])
        _hate = _user_data.get('profile', {}).get('hate', [])
        
        if not use_aggregation:
            _searched_recipe: list[dict[str, str]] = list(db_recipe.find(
                {
                    '$text': {'$search': f'{title} {keyword}'},
                    'ingred': {'$nin': _hate}
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
            
        else:    
            # Aggregation pipeline
            pipeline = [
                {
                    "$match": {
                        'ingred': {'$nin': _hate},
                        '$text': {'$search': f'{title} {keyword}'},
                    }
                },
                {
                    "$addFields": {
                        "expandedIngred": {
                            "$reduce": {
                                "input": "$ingred",
                                "initialValue": [],
                                "in": {
                                    "$concatArrays": [
                                        "$$value",
                                        {
                                            "$cond": {
                                                "if": { "$regexMatch": { "input": "$$this", "regex": "or" } },
                                                "then": { "$split": ["$$this", "or"] },
                                                "else": ["$$this"]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                { "$unwind": "$expandedIngred" },
                {
                    "$group": {
                        "_id": "$_id",
                        "menu": { "$first": "$menu" },
                        "title": { "$first": "$title" },
                        "image": { "$first": "$image" },
                        "timeMins": { "$first": "$timeMins" },
                        "ingred": { "$first": "$ingred" },
                        "ingredients": { "$first": "$ingredients"},
                        "cook_time": { "$first": "$cook_time" },
                        "recipe": { "$first": "$recipe" },
                        "portion": { "$first": "$portion" },
                        "difficulty": { "$first": "$difficulty" },
                        "tags": { "$first": "$tags" },
                        "expandedIngred": { "$addToSet": "$expandedIngred" }
                    }
                },
                {
                    "$addFields": {
                        "matchingCount": {
                            "$size": {
                                "$setIntersection": ["$expandedIngred", list(_ingredients)]
                            }
                        }
                    }
                },
                { 
                    "$sort": { 
                        "matchingCount": -1, 
                    } 
                },
                {
                    "$skip": cidx
                },
                {
                    "$limit": 20
                }
            ]
            _searched_recipe: list[dict[str, str]] = list(db_recipe.aggregate(pipeline))
                        
        
        if not _searched_recipe:
            return incorrect_data_response('검색 결과가 없습니다'), 404
        
        if endpoint:
            if keyword and not cidx:
                create_recommended_recipe.delay(endpoint, keyword)
            db_users.update_one(
                {'sub.endpoint': endpoint},
                {
                    '$push': {
                        'profile.search': {
                             '$each': [{
                            'keyword': keyword,
                            'title': title,
                            'time': time.time(),
                        }],
                            '$slice': -10,
                        }
                    }
                }
            )        

        searched_recipe_out: list[dict[str, str]] = []
        for recipe in _searched_recipe:
            recipe_ingred = recipe.get('ingred', [])
            ingred_not_found = not_found_ingredient(recipe_ingred, _ingredients)
            
            searched_recipe_out.append({
                **recipe,
                'favorite': recipe.get('_id') in _favorite,
                'ingred404': ingred_not_found,
            })
        
        
    except PyMongoError as pe:
        log.error(pe)
        return server_error('잠시 후 다시 이용해주세요'), 500
        
    return success_response(
        data={
            'display_list': searched_recipe_out,
            'refrigerator': list(_ingredients),
            'hate': _hate,
            'nidx': cidx+ 20 if len(_searched_recipe) == 20 else -1,
        },
    )
        
    

    