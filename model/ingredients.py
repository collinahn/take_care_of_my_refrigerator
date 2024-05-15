'''
Ingredients 클래스 및 IngredientsInput 클래스 정의

Class 상세를 참고하여 dataclass로 작성

딕셔너리 형태로 바꿔주는 메소드가 공통적으로 들어감(ToDict 클래스 상속)
'''
from dataclasses import dataclass, asdict, field, is_dataclass


class ToDict:
    def to_dict(self):
        return {
            key: value
            for key, value in asdict(self).items()
            if value
        }
        

@dataclass
class Ingredients(ToDict):
    '''
    재료 클래스
    '''
    ingredient_id: str
    name: str
    recommended_expiration: int
    category: str
    tip: str
    is_significant: bool
    
@dataclass
class IngredientsInput(Ingredients, ToDict):
    '''
    재료 입력 클래스
    유저가 재료를 추가할 때마다 생성됨
    '''
    input_id: str
    date_input: int
    expiration_date: int
    count: int
