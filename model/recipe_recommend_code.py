# -*- coding: utf-8 -*-
"""recipe_recommend_code.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/10Mn1s14qCC7CKWF63fJqm42TeVu3Fv3U
"""

!pip install konlpy
!pip install fasttext

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

data = pd.read_excel('/content/drive/MyDrive/Colab Notebooks/종합설계/input_recipe.xlsx')


# 문자열 상태 변경(문자열 -> 리스트로)
data['Recipe'] = data['Recipe'].apply(literal_eval)
data['Tags'] = data['Tags'].apply(literal_eval)
data['Ingredients'] = data['Ingredients'].apply(literal_eval)
data['temp'] = data['Ingred'].apply(literal_eval)
data['Ingred'] = data['Ingred'].apply(literal_eval)


# 내 재료 리스트
my_ingred = ['계란','간장','다진마늘','참기름','고춧가루','고추장','된장']

# 재료를 기반으로 현재 가능한 레시피 반환함수
def can_cook_recipe():
  # 레시피 초기화
  recipe = data.copy()
  for i, ingredients in enumerate(recipe['Ingred']):
      for my in my_ingred:
          if my in ingredients:
              # 있는 재료 temp에서 삭제
              recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != my]
          else:
            # 텍스트 포함된 재료 temp에서 삭제
            for s in ingredients:
              if my in s:
                recipe.at[i, 'temp'] = [ing for ing in recipe.at[i, 'temp'] if ing != s]

  recipe['loss'] = recipe['temp'].apply(len)

  # loss(부족한 재료 수)가 작은 순 정렬
  sorted_recipe = recipe.sort_values(by='loss')

  top_30 = sorted_recipe.head(30)
  return top_30[['Menu', 'temp','loss']]

# 토큰화 데이터 불러오기 
train = pd.read_excel('/content/drive/MyDrive/Colab Notebooks/종합설계/train_recipe(1글자포함).xlsx')
train['token'] = train['token'].apply(literal_eval)
test = train.head(9700)

# 모델 불러오기
model = joblib.load('/content/drive/MyDrive/Colab Notebooks/종합설계/saved_model.pkl')

# 키워드 입력 후 유사도 순으로 정렬된 레시피 반환함수
def keyword_recipe():
    keyword = input("키워드를 입력하세요 : ")
    test['max_similarity'] = test['token'].apply(lambda tokens: max([model.wv.similarity(keyword, token) for token in tokens]))    
    # 상위 30개 결과 출력
    result = test_head.sort_values(by = 'max_similarity', ascending=False)
    result = result.head(30)
    # result[['Menu','Description','Tags','token']]
    return result['Menu']

