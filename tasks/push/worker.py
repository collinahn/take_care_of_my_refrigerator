import json


from pywebpush import webpush, WebPushException
from pymongo.errors import PyMongoError
from tasks.celeryapp import celery_app
from db.mongo import MongoAccess

from __classified.vapid import VAPID_SUBJECT, VAPID_PRIVATE


class RetryWebPushError(Exception):
    ...


@celery_app.task(autoretry_for=(Exception,), retry_backoff=3, ignore_result=True)
def send_push_notification(subscription_info: dict, message: dict):
    noti_id: str = subscription_info.get('_id')
    priority_str: str = 'normal'
    priority_ttl: int = 3600 * 12
    
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(message),
            vapid_private_key=VAPID_PRIVATE,
            vapid_claims={"sub": VAPID_SUBJECT},
            ttl=priority_ttl,
            timeout=10,
            headers={
                "urgency": priority_str,
                "priority": priority_str
            },
        )
    except WebPushException as ex:
        update_query = {
            '$inc': {'fail_cnt': 1},
            '$set': {'last_fail_msg': repr(ex)}
        }

        if '410 Gone' in repr(ex):
            if '$set' in update_query:
                update_query['$set'] |= {'use': False}
            else:
                update_query |= {
                    '$set': {'use': False}
                }
        with MongoAccess.get_client(server_selection_ms=7000) as mongoclient:
            mongoclient['users']['pwa'].update_one(
                {'_id': noti_id}, update_query)

        if '410 Gone' not in repr(ex):
            raise RetryWebPushError()

        return f'error {noti_id} {repr(ex)}'
    except PyMongoError as pe:
        return f'db failed while {noti_id} {repr(pe)}'
    except ConnectionError:
        raise RetryWebPushError()
    except Exception as e:
        return f'push failed while {noti_id} {e}'

    return f'push success {noti_id}'


@celery_app.task(autoretry_for=(Exception,), retry_backoff=3, ignore_result=True)
def test_celery():
    import time
    time.sleep(2)
    return "test success"
