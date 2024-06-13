from datetime import datetime, timedelta

from utils.celery_utils import find_users_for_push_notification, send_unified_push_msg_to_users

from utils.pwa_push import PushMsgFormat



def ingredient_expiration_notification(until_days: int = 3):
    # if time format is '2024-12-31' and today + until_days is match

    until = [
        (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
        for i in range(until_days)
    ]    
    
    users = find_users_for_push_notification({
        'refrigerator.expiryDate': {'$in': until}
    })
    
    for user in users:
        for ingredient in user['refrigerator']:
            if ingredient['expiryDate'] in until:
                time_remain = (datetime.strptime(ingredient['expiryDate'], '%Y-%m-%d') - datetime.now()).days
                expiry_notification = f'등록하신 소비기한이 {time_remain+1}일 남았습니다.' if time_remain>0 else '오늘 유통기한이 만료됩니다.'
                msg = PushMsgFormat(
                    f'유통기한 임박 알림 "{ingredient.get("name")}"',
                    f'{expiry_notification}\n클릭하시면 냉장고 화면으로 이동합니다.\n추천 요리법을 확인해보세요',
                    url='/refrigerator/'
                    )
                send_unified_push_msg_to_users([user],msg.to_dict())
                break

if __name__ == '__main__':

    ingredient_expiration_notification()
    