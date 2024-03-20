# pip install -r requirements.txt
# pip freeze > requirements.txt

import time
import json
from datetime import datetime
from flask_cors import CORS
from flask import (
    render_template,
    url_for,
    redirect,
    make_response,
    request,
    abort,
    Blueprint
)
from utils.logger import get_logger
import platform

bp_main = Blueprint('main', __name__, url_prefix='')
server_log = get_logger()


def log_visitor_msg():
    log_msg = f'access from {request.remote_addr} {request.headers.get("User-Agent")}'

    return log_msg


@bp_main.get('/')
def home():
    server_log.info(log_visitor_msg())
    return render_template('home.html'), 200


@bp_main.get('/settings/')
def push_settings():
    server_log.info(log_visitor_msg())

    return render_template('push_settings.html'), 200



@bp_main.get('/sitemap.xml')
def main_sitemap():
    xml = render_template(
        'sitemap.xml', today=datetime.now().strftime('%Y-%m-%d'))
    response = make_response(xml)
    response.headers['Content-Type'] = 'application/xml'
    return response



if __name__ == '__main__':

    @bp_main.get('/test/')
    def test():
        return render_template('test.html')

    bp_main.run(host='0.0.0.0', port=4000, debug=False,
                use_reloader=True, threaded=True, )
