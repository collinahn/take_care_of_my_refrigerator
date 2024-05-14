import json
import time
from flask import Blueprint, request
from pymongo.errors import PyMongoError

from db.mongo import db_users
from utils.pwa_push import PushMsgFormat, PushSettings
from utils.response import incorrect_data_response, server_error, success_response
from utils.logger import get_logger

bp_user = Blueprint('user', __name__, url_prefix='/api/user')
log = get_logger()



@bp_user.get('/settings/')
def user_push_settings():
    '''
    푸시 설정을 가져온다
    params
    endpoint="https://web.push.apple.com/QE9XB6RaTxzL3bkxqQxhBXapVFNFc-xUGzw4YjqgewFcue8xvGQhVPzTREddvGyvvXTzlZJeJ7131Zaqixp8VAQd15ab4LygRBbTPdfvIvlWjEswkfqEsmByD_1eu_zrZC5gaEh1f1NZ9Mp3NVLxPVG1BxDSwVPk6zDawTecPRw"
    '''
    if 'endpoint' not in request.args:
        return incorrect_data_response('wrong request'), 400
    
    try:
        _push_settings: dict = db_users.find_one(
            {
                'sub.endpoint': request.args.get('endpoint')    
            },
            {
                'first_reg':0,
                'last_called': 0,
                'success_cnt': 0,
                'use': 0,
                'device': 0,
                'sub': 0
            })

        if not _push_settings:
            return incorrect_data_response('서버에 등록되지 않은 기기입니다. 다시 등록해주세요.'), 404

    except PyMongoError as pe:
        log.error(pe)
        return server_error('잠시 후 다시 이용해주세요'), 500

    return success_response(
        '성공',
        data=_push_settings,
    )


@bp_user.post('/settings/<settings_key>/')
def set_user_preference(settings_key: str):
    '''
    개인 선호 설정을 저장한다
    request body
    endpoint:"https://web.push.apple.com/QE9XB6RaTxzL3bkxqQxhBXapVFNFc-xUGzw4YjqgewFcue8xvGQhVPzTREddvGyvvXTzlZJeJ7131Zaqixp8VAQd15ab4LygRBbTPdfvIvlWjEswkfqEsmByD_1eu_zrZC5gaEh1f1NZ9Mp3NVLxPVG1BxDSwVPk6zDawTecPRw"
    <settings_key>: data
    '''
    
    request_body =  request.get_json(silent=True) or {}
    if request_body.get('endpoint') is None:
        return incorrect_data_response('wrong request'), 400
    
    try:
        updated_res = db_users.update_one(
            {
                'endpoint': request_body['endpoint']
            },
            {
                '$set': {
                    settings_key: request_body.get(request_body.get('data'))
                }
            }
        )
    except PyMongoError as pe:
        log.error(pe)
        return server_error('잠시 후 다시 이용해주세요'), 500

    if updated_res.modified_count == 0:
        return incorrect_data_response('변경 사항이 없습니다.'), 400 
    
    return success_response('성공')