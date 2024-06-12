from model.constant import VAGUE_INGRED_CATEGORIES



def not_found_ingredient(recipe_ingredients: list[str], user_ingredients: set[str]) -> list[str]:
    '''
    레시피 재료와 유저가 갖고 있는 재료를 비교하여 레시피에 없는 재료를 반환하는 함수
    :param recipe_ingredients: 레시피 재료 리스트
    :param user_ingredients: 유저가 갖고 있는 재료 리스트
    :return: 레시피에 없는 재료 리스트
    
    model.constant.VAGUE_INGRED_CATEGORIES를 사용하여 집합 관계의 재료 처리
    '''
    recipe_not_found = []
    
    for ingred in recipe_ingredients:
        ingred_splited: list[str] = ingred.split('or')
        if any(ingred_element in user_ingredients for ingred_element in ingred_splited):
            # 정확히 일치 
            continue
        if (
            any(
                ingred_element in VAGUE_INGRED_CATEGORIES.keys() and 
                any(user_ingred in VAGUE_INGRED_CATEGORIES.get(ingred_element) for user_ingred in user_ingredients)
                for ingred_element in ingred_splited
            )
        ): # 큰카테고리에 해당하는 재료가 재료 목록에 있고 작은 카테고리를 유저가 갖고 있을 때
            continue
        
        recipe_not_found.append(ingred)
        
    return recipe_not_found

def overlapping_ingredient(recipe_ingredients: list[str], hate_list: list[str]) -> list[str]:
    '''
    두 리스트를 비교하여 레시피가 겹치는 것을 비교한다
    :param recipe_ingredients: 레시피 재료 리스트
    :param user_ingredients: 유저가 갖고 있는 재료 리스트
    :return: 레시피에 없는 재료 리스트
    
    model.constant.VAGUE_INGRED_CATEGORIES를 사용하여 집합 관계의 재료 처리
    '''
    for ingred in recipe_ingredients:
        ingred_splited: list[str] = ingred.split('or')
        if any(ingred_element in hate_list for ingred_element in ingred_splited):
            # 정확히 일치 
            return True
        if (
            any(
                ingred_element in VAGUE_INGRED_CATEGORIES.keys() and 
                any(user_ingred in VAGUE_INGRED_CATEGORIES.get(ingred_element) for user_ingred in hate_list)
                for ingred_element in ingred_splited
            )
        ): # 큰카테고리에 해당하는 재료가 재료 목록에 있고 작은 카테고리를 유저가 갖고 있을 때
            return True
    
    return False        
        


if __name__ == '__main__':

    recipe_ingred = ['소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    user_ingred = ['소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    assert not_found_ingredient(recipe_ingred, user_ingred) == []
    
    recipe_ingred = ['소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    user_ingred = ['양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    assert not_found_ingredient(recipe_ingred, user_ingred) == ['소고기다짐육']
    
    recipe_ingred = ['돼지고기', '소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    user_ingred = ['돼지고기뒷다리살', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    assert not_found_ingredient(recipe_ingred, user_ingred) == ['소고기다짐육','양파', ]
    
    recipe_ingred = ['돼지고기뒷다리살', '소고기다짐육', '양파', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    user_ingred = ['돼지고기뒷다리살', '파프리카', '팽이버섯', '깻잎', '간장', '사과식초', '백설탕', '다진마늘', '연겨자', '소금', '후추']
    
    assert not_found_ingredient(recipe_ingred, user_ingred) == ['소고기다짐육','양파', ]