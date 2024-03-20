import platform
from pymongo import MongoClient

from __classified.mongodb import IP as MONGO_IP, USERNAME as MONGODB_USERNAME, PASSWD as MONGO_PASSWD


class MongoAccess:
    if platform.system() in ['Linux']:
        uri = 'mongodb://localhost:27017/crwlnoti'
    else:
        uri = f'mongodb://{MONGODB_USERNAME}:{MONGO_PASSWD}@{MONGO_IP}:27017/?replicaSet=CrwlnotiDb'
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

