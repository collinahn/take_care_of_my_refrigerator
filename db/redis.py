import redis

redis_pool = redis.ConnectionPool(
    host='localhost', port=6379, db=0, decode_responses=True)
redis_client = redis.StrictRedis(connection_pool=redis_pool)

if __name__ == '__main__':

    ...
