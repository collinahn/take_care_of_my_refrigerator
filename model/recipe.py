'''
Recipe 클래스 정의

Class 상세를 참고하여 dataclass로 작성

딕셔너리 형태로 바꿔주는 메소드가 공통적으로 들어감(ToDict 클래스 상속)
'''
from dataclasses import dataclass, asdict, field, is_dataclass
from model.ingredients import ToDict
        

@dataclass(frozen=True)
class Recipe(ToDict):
    '''
    Recipe 클래스
    '''
    ingredient_group: list[str]
    cook_time: int
    explanation: str
