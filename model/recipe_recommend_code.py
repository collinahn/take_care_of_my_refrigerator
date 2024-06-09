# -*- coding: utf-8 -*-
"""recipe_recommend_code.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/10Mn1s14qCC7CKWF63fJqm42TeVu3Fv3U
"""

# !pip install konlpy
# !pip install fasttext

import pandas as pd
import numpy as np
from ast import literal_eval
import io
import re
from konlpy.tag import Hannanum, Kkma, Komoran, Mecab, Okt
from gensim.models import Word2Vec, FastText
from gensim.models.fasttext import load_facebook_model
from gensim import models
from tqdm import tqdm
import joblib

data = pd.read_excel('./model/input_recipe.xlsx')


# 문자열 상태 변경(문자열 -> 리스트로)
data['Recipe'] = data['Recipe'].apply(literal_eval)
data['Tags'] = data['Tags'].apply(literal_eval)
data['Ingredients'] = data['Ingredients'].apply(literal_eval)
data['temp'] = data['Ingred'].apply(literal_eval)
data['Ingred'] = data['Ingred'].apply(literal_eval)


# 내 재료 리스트
my_ingred = ['소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']


# 대분류 처리
category = {
    "돼지고기": ['돼지고기', '돼지고기갈비', '돼지고기다짐육', '돼지고기대패목살', '돼지고기대패삼겹살', '돼지고기뒷다리살',
             '돼지고기등갈비', '돼지고기등뼈', '돼지고기등심', '돼지고기목살', '돼지고기목심', '돼지고기불고기', '돼지고기사태살',
             '돼지고기삼겹살', '돼지고기안심살', '돼지고기앞다리살', '돼지고기오겹살', '돼지고기오돌뼈', '돼지고기지방', '돼지고기항정살'],
    "소고기" : ['소고기', '소고기갈비', '소고기국거리', '소고기다짐육', '소고기등심', '소고기목심', '소고기부채살', '소고기불고기',
             '소고기사태살', '소고기살치살', '소고기샤브샤브', '소고기안심', '소고기앞다리살', '소고기양지', '소고기우둔살',
             '소고기우삼겹살', '소고기차돌박이', '소고기채끝살', '소고기척아이롤', '소고기치마살', '소고기홍두께살'],
    "닭고기": ['닭고기', '닭가슴살통조림', '닭고기가슴살', '닭고기날개', '닭고기다리살', '닭고기똥집', '닭고기목살', '닭고기발',
            '닭고기봉', '닭고기안심살'],
    "액젓" : ['액젓', '멸치액젓', '참치액젓'], # 까나리 등 제외
    "상추" : ['상추', '청상추', '적상추', '꽃상추'], # 로메인 제외
    "조개" : ['조개', '키조개', '모시조개'],
    "과일잼" : ['과일잼', '살구잼', '사과잼', '블루베리잼', '라즈베리잼', '체리잼', '오디잼', '망고잼', '포도잼', '딸기잼'],
    "쌀밥" : ['쌀'],
    "버섯" : ['버섯', '양송이버섯', '느타리버섯', '새송이버섯', '팽이버섯', '백만송이버섯', '표고버섯', '맛타리버섯', '머쉬마루버섯',
           '삼색버섯', '만가닥버섯', '목이버섯', '참타리버섯', '고기느타리버섯'], # 건버섯 제외
    "견과류": ['견과류', '견과류콩배기', '견과류호박씨', '견과류아몬드', '견과류해바라기씨', '견과류헤이즐넛', '견과류아몬드가루',
            '견과류잣', '견과류피칸', '견과류브라질너트', '견과류땅콩분태', '견과류땅콩', '견과류아몬드분태', '견과류캐슈넛',
            '견과류호두', '견과류호두분태']
}

# 재료를 기반으로 현재 가능한 레시피 반환함수
def can_cook_recipe():
    # 레시피 초기화
    recipe = data.copy()

    for i, ingredients in enumerate(recipe['Ingred']):
        del_list = []
        for my in my_ingred:
            # 1. my가 ingredients에 있다면 temp에서 삭제
            if my in ingredients:
                recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != my]

            # 2. 대분류 처리 : my가 category에 있다면 키를 temp에서 삭제(ex. 돼지고기뒷다리살 보유 -> temp에서 돼지고기 삭제)
            elif any(my in values for values in category.values()):
                for key, values in category.items():
                    if my in values:
                        recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != key]

            # 3. or 처리 : my가 or로 연결된 재료중 하나라면 temp에서 삭제
            elif any('or' in s for s in ingredients):
                # ingredients의 요소 중 'or'를 포함하는 요소가 있을 때
                for s in ingredients:
                    if 'or' in s:   
                        # 'or'로 분리하여 확인
                        parts = [part.strip() for part in s.split('or')] # parts는 분리된 재료들 (ex. 채소(야채)or버섯-> 채소(야채), 버섯)
                        # 3.1. 분리된 요소(parts) 중 하나라도 my에 있다면 temp에서 삭제 (ex. 소주 보유 -> temp에서 소주or청주 삭제)
                        if my in parts:
                            recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != s]

                        # 3.2. my가 category에 있고 그 키가 분리된 요소(parts)중에 있다면 temp에서 삭제 (ex. 팽이버섯 보유 -> temp에서 버섯or야채(채소) 삭제)                                        
                        for part in parts:
                            if part in del_list:
                                recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != s]

    recipe['loss'] = recipe['temp'].apply(len)

    # loss(부족한 재료 수)가 작은 순 정렬
    sorted_recipe = recipe.sort_values(by='loss')

    top_30 = sorted_recipe.head(30)
    return top_30[['ObjectId', 'temp', 'loss']]

# 토큰화 데이터 불러오기 
train = pd.read_excel('./model/train_recipe(1글자포함).xlsx')
train['token'] = train['token'].apply(literal_eval)
test = train.head(9700)

# 모델 불러오기
model = joblib.load('./model/saved_model.pkl')

# 키워드 입력 후 유사도 순으로 정렬된 레시피 반환함수
def keyword_recipe():
    keyword = input("키워드를 입력하세요 : ")
    test['max_similarity'] = test['token'].apply(lambda tokens: max([model.wv.similarity(keyword, token) for token in tokens]))    
    # 상위 30개 결과 출력
    result = test.sort_values(by = 'max_similarity', ascending=False)
    result = result.head(30)
    # result[['Menu','Description','Tags','token']]
    return result['ObjectId']
    


print(can_cook_recipe())
