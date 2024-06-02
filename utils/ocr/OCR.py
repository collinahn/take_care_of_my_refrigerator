import cv2
import numpy as np
from PIL import Image
import pytesseract

def correct_skew(image):
    coords = np.column_stack(np.where(image > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated

def preprocess_image(image_path):
    # 이미지를 읽기
    image = cv2.imread(image_path)
    
    # 그레이스케일로 변환
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 이진화 (흑백 변환)
    _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 노이즈 제거
    denoised = cv2.fastNlMeansDenoising(binary, h=30)
    
    # 이미지 크기 조정 (선택 사항)
    resized = cv2.resize(denoised, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    # 회전 보정
    rotated = correct_skew(resized)
    
    return rotated

def extract_text_from_image(image_path):
    # 이미지 전처리
    processed_image = preprocess_image(image_path)
    
    # 이미지 저장 (디버깅용)
    cv2.imwrite('processed_image.jpg', processed_image)
    
    # Tesseract를 사용하여 텍스트 추출 (한국어와 영어 설정)
    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(processed_image, lang='kor+eng', config=custom_config)
    
    return text

# 테스트할 이미지 경로
image_path = 'IMG_5964.jpg'

# 텍스트 추출
extracted_text = extract_text_from_image(image_path)
print(extracted_text)
