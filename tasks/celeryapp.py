from celery import Celery
from tasks import celeryconfig

celery_app = Celery(
    'celery',
    broker="redis://127.0.0.1:6379/0",
    backend="redis://127.0.0.1:6379/0",
    include=[
        'tasks.push.worker',
        'tasks.recommend.worker'
    ],
    result_expires=60*60
)

celery_app.config_from_object(celeryconfig)
