import json
import time
from flask import Blueprint, request
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId

from db.mongo import db_users
from utils.pwa_push import PushMsgFormat, PushSettings
from utils.celery_utils import  bulk_write_to_collection, push_history_to_be_recorded
from utils.response import incorrect_data_response, server_error, success_response
from tasks.push.worker import send_push_notification
from utils.logger import get_logger

bp_register = Blueprint('register', __name__, url_prefix='/api/register')
log = get_logger()


@bp_register.post('/register/')
def push_register():
    ip_addr: str = request.remote_addr
    try:
        subscription_info: dict = json.loads(request.form.get('sub') or '{}')
        device_info: dict = json.loads(request.form.get('device') or '{}')
        previous_info: dict = json.loads(
            request.form.get('previous') or '{}')  # 이전 정보
    except json.JSONDecodeError as je:
        log.error(f'{je} while decoding {request.form=}')
        return incorrect_data_response('데이터에 오류가 있습니다.\n관리자에게 문의바랍니다.'), 400
    endpoint_url = subscription_info.get("endpoint")
    log.info(f'{ip_addr} requested push register request {subscription_info=}')
    if not subscription_info or not endpoint_url:
        return incorrect_data_response(), 400

    current_t = time.time()

    try:
        if matching_user := db_users['pwa'].find_one({'endpoint': endpoint_url}) or {}:
            if matching_user.get('use'):
                msg = PushMsgFormat(
                    '냉장고를 잘 부탁해', '이미 등록된 기기입니다.')
                send_push_notification.delay(
                    matching_user, msg.to_dict(), priority=False)
                return success_response(
                    '푸시 알림 요청을 보냈습니다.\n푸시알림이 오지 않는경우 브라우저의 알림설정을 확인해주세요.',
                    data={
                        'identification': {
                            'first_reg': matching_user.get('first_reg', current_t),
                            '_id': matching_user.get('_id'),
                        }}
                )
            else:
                db_users['pwa'].update_one({'_id': matching_user.get('_id')}, {
                                          '$set': {'use': True}})
                msg = PushMsgFormat(
                    '냉장고를 잘 부탁해', '푸시알림이 다시 활성화 되었습니다.', tag='REGISTER_MSG'
                )
                send_push_notification.delay(
                    matching_user, msg.to_dict(), priority=False)
                return success_response(
                    '기기가 다시 등록되었습니다.',
                    data={
                        'identification': {
                            'first_reg': matching_user.get('first_reg', current_t),
                            '_id': matching_user.get('_id'),
                        }}
                )
        if previous_info:
            res = db_users['pwa'].find_one_and_update(
                previous_info,
                {
                    '$set': {
                        'last_called': current_t,
                        'use': True,
                        'register_ip': ip_addr,
                        'sub': subscription_info
                        **device_info
                    }
                },
            )
            if not res:
                return success_response('다시 시도해주세요', data={'identification': {}}), 200

            caller_id = res.get('_id')

            first_msg = PushMsgFormat(
                '냉장고를 잘 부탁해!', '기기가 다시 등록되었습니다.', tag='REGISTER_MSG')
            first_msg_to_dict = first_msg.to_dict()
            send_push_notification.delay(subscription_info, first_msg_to_dict)
            first_msg_to_dict |= {'time': current_t}
            bulk_write_to_collection(db_users['pwa'], [push_history_to_be_recorded(
                caller_id, first_msg_to_dict, current_t)])

            return success_response(
                '기기가 다시 등록되었습니다.\n푸시 알림 요청을 보냈습니다.\n푸시알림이 오지 않는경우 브라우저의 알림설정을 확인해주세요.',
                data={
                    'identification': {
                        'first_reg': res.get('first_reg'),
                        '_id': caller_id,
                    }}
            ), 200

        else:
            inserted_id = str(ObjectId())
            db_users['pwa'].insert_one({
                '_id': inserted_id,
                'last_called': current_t,
                'first_reg': current_t,
                'use': True,
                'register_ip': ip_addr,
                'sub': subscription_info,
                'device':device_info,
                'push_settings': PushSettings().to_dict()
            })
    except PyMongoError as pe:
        log.error(repr(pe))
        return server_error('DB서버의 오류로 저장하지 못했습니다. 잠시 후 다시 이용해주세요.'), 400

    first_msg = PushMsgFormat(
        '⚡️냉장고를 부탁해 첫 푸시!', '기기가 정상적으로 등록되었습니다🎉', tag='REGISTER_MSG')
    first_msg_to_dict = first_msg.to_dict()
    send_push_notification.delay(subscription_info, first_msg_to_dict)
    first_msg_to_dict |= {'time': current_t}
    bulk_write_to_collection(db_users['pwa'], [push_history_to_be_recorded(
        inserted_id, first_msg_to_dict, current_t)])

    return success_response(
        '기기가 등록되었습니다.\n푸시 알림 요청을 보냈습니다.\n푸시알림이 오지 않는경우 브라우저의 알림설정을 확인해주세요.',
        data={
            'identification': {
                'first_reg': current_t,
                '_id': inserted_id,
            }}), 200

