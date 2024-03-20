import secrets
from flask_cors import CORS
from flask import (
    request,
    abort,
    render_template,
    Flask
)
from db.mongo import  MongoAccess
from tasks.celeryapp import celery_app
from utils.logger import get_logger


def create_app():
    app = Flask(__name__,
                static_url_path='/',
                static_folder='../../static',
                template_folder='../../templates'
                )
    CORS(app, resources={r'*': {'origins': '*'}})
    app.config["SECRET_KEY"] = secrets.token_hex(16)
    app.config["MONGO_URI"] = MongoAccess.uri
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['LOGGING_FORMAT'] = '%(asctime)s %(levelname)s: %(message)s [%(filename)s:%(lineno)d]'
    app.config['LOGGING_LOCATION'] = '.log.server/'
    app.config['LOGGING_FILENAME'] = 'server.log'
    app.config['LOGGING_MAX_BYTES'] = 150*1024*1024
    app.config['LOGGING_BACKUP_COUNT'] = 300
    app.config['JSON_AS_ASCII'] = False

    log = get_logger(app.config)

    app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
    app.config['RESULT_BACKEND'] = 'redis://localhost:6379/0'
    app.config['broker_pool_limit'] = 1000
    app.config['BROKER_POOL_TIMEOUT'] = 30
    app.config['broker_connection_timeout'] = 10
    app.config['broker_transport_options'] = {
        'visibility_timeout': 7200,  # Time in seconds for task visibility timeout
        'fanout_patterns': True,  # Enable Redis pub-sub pattern matching for fanout tasks
        'fanout_prefix': True,  # Enable Redis pub-sub prefix matching for fanout tasks
    }

    celery_app.conf.update(app.config)

    from views.main.main import bp_main
    app.register_blueprint(bp_main)
    
    from views.api.recipe import bp_recommend
    from views.api.register import bp_register
    from views.api.refrigerator import bp_refrigerator
    from views.api.user import bp_user
    app.register_blueprint(bp_recommend)
    app.register_blueprint(bp_register)
    app.register_blueprint(bp_refrigerator)
    app.register_blueprint(bp_user)

    return app

