
CELERY_BROKER_URL = 'redis://localhost:6379/0'
RESULT_BACKEND = 'redis://localhost:6379/0'
task_serializer = 'json'
broker_pool_limit = 256
worker_prefetch_multiplier = 4
BROKER_POOL_TIMEOUT = 10
broker_connection_timeout = 10
broker_connection_retry_on_startup = True
broker_transport_options = {
    'visibility_timeout': 7200,  # Time in seconds for task visibility timeout
    'fanout_patterns': True,  # Enable Redis pub-sub pattern matching for fanout tasks
    'fanout_prefix': True,  # Enable Redis pub-sub prefix matching for fanout tasks
    'max_connections': 200,
}
