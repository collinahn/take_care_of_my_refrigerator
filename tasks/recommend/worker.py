
from pymongo.errors import PyMongoError
from tasks.celeryapp import celery_app
from db.mongo import db_users
import time

from model.keyword_recipe import keyword_recipe


class RetryWebPushError(Exception):
    ...


@celery_app.task(autoretry_for=(Exception,), retry_backoff=1, ignore_result=True)
def create_recommended_recipe(endpoint: str, keyword: str):
    if not endpoint:
        print(f'user_id is None {keyword=}')
        return
    
    overlapping = db_users.find_one({
        'sub.endpoint': endpoint,
        'recommendedRecipe.keyword': keyword
    })
    
    if overlapping:
        print(f'overlapping {endpoint=}')
        return
    
    recipe_ids = keyword_recipe(keyword, 30)
    
    try:
        updated_res = db_users.update_one(
            {
                'sub.endpoint': endpoint
            },
            {
                '$push': {
                    'recommendedRecipe': {
                        '$each': [
                            {
                                'ids': recipe_ids,
                                'keyword': keyword,
                                'created': time.time(),
                            }
                        ],
                        '$position': 0,
                        '$slice': 4
                    }
                }
            }
        )
        if updated_res.matched_count == 0:
            return f'user not found {endpoint=}'
    except PyMongoError as e:
        print(f'failed to update user favorite list: {e} {recipe_ids=}')
        raise RetryWebPushError()
        
    return f'success {endpoint=}'


if __name__ == '__main__':

    print(create_recommended_recipe('https://fcm.googleapis.com/fcm/send/cN9gA61wJbI:APA91bG_eQygI6qgPv8oXA1jiAryF2HrSImPDhq2bNVjEluzyVlf63Qb02TeDL0ZsVYq-HWTImE1Q8IGzBSyuTsWWk9Jebi2b9xqiArjXNOlRe49sJyg-AdL67qz04jaYUWuoTkTCBsw', 'test'))