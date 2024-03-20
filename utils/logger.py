# 로그를 설정하고 생성하는 클래스(싱글턴)
# 모듈 파일명, 함수명, 등의 정보를 포함하여 로그를 출력한다.
# 함수명 등의 디버그 정보는 Python3.8 이상에서 동작한다.

# 사용법
# 로그를 레벨별로 세분화한다.
"""
DEBUG       상세한 정보가 필요할 때, 보통 문제 분석, 디버깅할 때 사용

INFO        동작이 절차에 따라서 진행되고 있는지 관찰 할 때

WARNING     어떤 문제가 조만간 발생할 조짐이 있을 때. 예) 디스크 용량이 부족 할 때

ERROR       프로그램에 문제가 발생해서 기능의 일부가 동작하지 않을 때

CRITICAL    심각한 문제가 발생해서 도저히 시스템이 정상적으로 동작할 수 없을 때


출처: https://wikidocs.net/17747
"""

# 2021.11.09. created by 안태영
# 2022.10.21. modified - add watchedfilehandler 
# (리눅스에서 멀티프로세스로 동작하는 프로그램의 로그 파일 포인터가 업데이트되지 않아 정상적으로 로그가 출력되지 않는 문제 해결)

import logging
from logging import Formatter
from logging.handlers import RotatingFileHandler, WatchedFileHandler


class WatchedRotatingFileHandler(RotatingFileHandler, WatchedFileHandler):
    def __init__(self, filename, mode='a', maxBytes=0, backupCount=0, encoding=None, delay=False):
        RotatingFileHandler.__init__(self, filename=filename, mode='a', maxBytes=maxBytes,
                                     backupCount=backupCount, encoding=encoding, delay=delay)
        self.dev, self.ino = -1, -1
        self._statstream()

    def emit(self, record):
        try:
            if self.shouldRollover(record):
                self.doRollover()
            # notice reopenIfNeeded() calls os.stat
            # may cause failure when other process is creating or deleting target file.
            self.reopenIfNeeded()
            logging.FileHandler.emit(self, record)
        except Exception:
            self.handleError(record)
            

class _SingleLogger:
    logger = None


def get_logger(app_config_data: dict = None):
    if _SingleLogger.logger is not None:
        return _SingleLogger.logger

    if not app_config_data:
        app_config_data = {}

    DEFAULT_LOGGING_FORMAT = '%(asctime)s %(levelname)s: %(message)s [%(filename)s:%(lineno)d]'

    log = logging.getLogger('server')
    file_path = (
        app_config_data.get('LOGGING_LOCATION', '') + app_config_data.get('LOGGING_FILENAME', '') or
        '.log.server/logfile.log'
    )
    file_handler = WatchedRotatingFileHandler(file_path,
                                              maxBytes=app_config_data.get(
                                                  'LOGGING_MAX_BYTES', 150*1024*1024),
                                              backupCount=app_config_data.get(
                                                  'LOGGING_BACKUP_COUNT', 365)
                                              )

    file_handler.setFormatter(
        Formatter(
            app_config_data.get('LOGGING_FORMAT', DEFAULT_LOGGING_FORMAT)
        )
    )
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(
        Formatter(
            app_config_data.get('LOGGING_FORMAT', DEFAULT_LOGGING_FORMAT))
    )
    log.handlers.clear()
    log.addHandler(file_handler)
    log.addHandler(stream_handler)

    file_handler.setLevel(logging.INFO)
    stream_handler.setLevel(logging.DEBUG)
    log.setLevel(logging.DEBUG)

    _SingleLogger.logger = log

    return log
