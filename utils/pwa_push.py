'''
PWA 푸시 메시지의 포맷 및 유저별 설정을 정한다.
'''
from dataclasses import dataclass, asdict, field, is_dataclass
from typing import Optional
import time


@dataclass
class PushMsgFormat:
    title: str
    body: str
    actions: Optional[list[dict[str]]] = None
    tag: Optional[str] = None
    image: Optional[str] = ''
    url: str = '/'
    badge: str = '/assets/push-icon.png'
    icon: str = '/assets/button.png'

    def to_dict(self):
        return {
            key: value
            for key, value in asdict(self).items()
            if value
        }


class ToDictMixin:
    def to_dict(self):
        return {
            k: v.to_dict()
            if isinstance(v, ToDictMixin)
            else asdict(v)
            if is_dataclass(v)
            else v
            for k, v in asdict(self).items()
        }



@dataclass
class PushSettings(ToDictMixin):
    push: bool = True
    do_not_disturb_until: int = 0
    


if __name__ == '__main__':

    # Example usage:
    notification = PushMsgFormat(
        title='첫 푸시!',
        body='기기가 정상적으로 등록되었습니다.',
        # image='http://thumbnail9.coupangcdn.com/thumbnails/remote/292x292q65ex/image/retail/images/1571557561579423-0e8d377f-a4f6-4e33-afe5-909a38c36bd5.jpg',
        url='/discount/',
    )

    # Convert the dataclass to a dictionary
    notification_dict = notification.to_dict()

    print(notification_dict)
    PushSettings()

    print(PushSettings().to_dict())
