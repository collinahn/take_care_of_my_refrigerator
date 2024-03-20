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
    lang = kr
    endpoint="https://web.push.apple.com/QE9XB6RaTxzL3bkxqQxhBXapVFNFc-xUGzw4YjqgewFcue8xvGQhVPzTREddvGyvvXTzlZJeJ7131Zaqixp8VAQd15ab4LygRBbTPdfvIvlWjEswkfqEsmByD_1eu_zrZC5gaEh1f1NZ9Mp3NVLxPVG1BxDSwVPk6zDawTecPRw"
    '''
    if 'endpoint' not in request.args:
        return incorrect_data_response('wrong request'), 400
    
    try:
        _push_settings: dict = db_users['pwa'].find_one(
            {
                'endpoint': request.args.get('endpoint')    
            },
            {
                'device': 0,
                'restricted': 0,
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
