import platform
from pymongo import MongoClient

from __classified.mongodb import IP as MONGO_IP, PORT as MONGO_PORT,USERNAME as MONGODB_USERNAME, PASSWD as MONGO_PASSWD


class MongoAccess:
    if platform.system() in ['Linux']:
        uri = f'mongodb://{MONGODB_USERNAME}:{MONGO_PASSWD}@localhost:27017/refrigerator'
    else:
        uri = f'mongodb://{MONGODB_USERNAME}:{MONGO_PASSWD}@{MONGO_IP}:{MONGO_PORT}/refrigerator'
    port = None

    @classmethod
    def get_client(cls, server_selection_ms: int = 5000, timeout_ms: int = 5000):
        '''
        connect=False for multiprocessing scenarios
        '''
        server_selection_timeout = server_selection_ms
        connect_timeout = timeout_ms
        return MongoClient(cls.uri, cls.port,
                           serverSelectionTimeoutMS=server_selection_timeout, connectTimeoutMs=connect_timeout, connect=False)


client = MongoAccess.get_client()

db_users = client['users']

