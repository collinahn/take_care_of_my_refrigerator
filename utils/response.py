import json
import datetime
from flask import Response

from __classified.domain import DOMAIN


def make_api_resp(dict_obj: dict, cookies: tuple[tuple[str, str]] = None) -> Response:
    resp = Response(json.dumps(dict_obj, ensure_ascii=False),
                    mimetype='application/json')
    resp.headers['Access-Control-Allow-Headers'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = '*'
    if cookies:
        expires = datetime.datetime.utcnow() + datetime.timedelta(days=30)  # expires in 30 days
        for cookie in cookies:
            resp.set_cookie(
                *cookie,
                expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
                domain=DOMAIN,
                secure=True,
                httponly=True,
                samesite='None')
    return resp


def success_response(msg: str = None, **kwargs):
    resp_obj = {
        'resp_code': 'RET000',
        'server_msg': msg or 'success'
    }

    if kwargs:
        for key, value in kwargs.items():
            resp_obj[key] = value

    return make_api_resp(resp_obj)


def incorrect_data_response(msg: str=None, **kwargs):
    resp_obj = {
        'resp_code': 'RET001',
        'server_msg': msg or 'data incorrect'
    }

    if kwargs:
        for key, value in kwargs.items():
            resp_obj[key] = value

    return make_api_resp(resp_obj)


def invalid_auth_response(msg: str=None, **kwargs):
    resp_obj = {
        'resp_code': 'RET002',
        'server_msg': msg or 'token expired'
    }

    if kwargs:
        for key, value in kwargs.items():
            resp_obj[key] = value

    return make_api_resp(resp_obj)


def server_error(msg: str=None, **kwargs):
    resp_obj = {
        'resp_code': 'RET003',
        'server_msg': msg or 'temporary error'
    }

    if kwargs:
        for key, value in kwargs.items():
            resp_obj[key] = value

    return make_api_resp(resp_obj)

