
import time
import json
import random
import math
from urllib import parse
from abc import ABC
from celery import group
from html.parser import HTMLParser
from pymongo import UpdateOne, UpdateMany
from pymongo.errors import PyMongoError
from pymongo.collection import Collection

from tasks.push.worker import send_push_notification
from db.mongo import  db_users
from db.redis import redis_client

from utils.logger import get_logger
from utils.pwa_push import PushMsgFormat

log = get_logger()

def filter_necessary_for_push_notification(user_push_settings: dict):
    subscription_info = user_push_settings.get('sub', {})
    user_id = user_push_settings.get('_id')
    return {
        '_id': user_id,
        **subscription_info,
    }


def find_users_for_push_notification(_restriction: dict = None, _projection: dict = None) -> tuple[dict]:
    if not _restriction:
        _restriction = {}
    if not _projection:
        _projection = {}

    find_cond = {
        'use': True,
        'restricted': {'$ne': True},
        ** _restriction
    }

    try:
        res = list(db_users.find(
            find_cond,
            _projection
        )) or tuple()
        return res
    except PyMongoError as pe:
        log.error(f'{pe}, {_restriction=}')
        return tuple()


def bulk_write_to_collection(collection: Collection, data: list, ordered: bool = False) -> bool:
    if not data:
        return False
    try:
        collection.bulk_write(data, ordered=ordered)
    except PyMongoError as pe:
        log.error(pe)
        return False
    return True


def push_history_to_be_recorded(push_dest_id: str, push_msg: dict, current_t: float = None, history_dest: str = None):
    if not current_t:
        current_t = time.time()

    notification_dest = 'notifications'
    if history_dest:
        notification_dest = f'subnotifications.{history_dest}'
    return UpdateOne(
        {'_id': push_dest_id},
        {
            '$inc': {'success_cnt': 1},
            '$set': {'last_called': current_t},
            '$push': {
                notification_dest: {
                    '$each': [push_msg],
                    '$slice': -50
                }
            }
        }
    )


def updatemany_push_history(push_dest_ids: list[str], push_msg: dict, history_dest: str = None):
    notification_dest = 'notifications'
    if history_dest:
        notification_dest = f'subnotifications.{history_dest}'
    return UpdateMany(
        {
            '$or': [
                {'_id': notifee_id}
                for notifee_id in push_dest_ids
            ]},
        {
            '$inc': {'success_cnt': 1},
            '$set': {'last_called': time.time()},
            '$push': {
                notification_dest: {
                    '$each': [push_msg],
                    '$slice': -50
                }
            }
        }
    )


def send_unified_push_msg_to_users(users: list[dict], push_msg_as_dict: dict):
    '''
    celery_nodes는 3개
    '''
    CELERY_NODES = 3
    node_batches_subs_info = [users[i::CELERY_NODES]
                              for i in range(CELERY_NODES)]
    notification_groups: list[group] = []
    for subscriptions in node_batches_subs_info:
        noti_tasks = [
            send_push_notification.s(
                filter_necessary_for_push_notification(notifee),
                push_msg_as_dict
            )
            for notifee in subscriptions
        ]
        notification_groups.append(group(*noti_tasks))

    for task in notification_groups:
        task.apply_async()

    push_msg_as_dict |= {'time': time.time()}
    bulk_write_ids = [user.get('_id') for user in users]
    bulk_write_to_collection(
        db_users, [updatemany_push_history(bulk_write_ids, push_msg_as_dict)])

