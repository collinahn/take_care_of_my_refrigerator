import {
  promptAlertMsg,
  getSubscriptionEndpoint
} from "./utils.js";

const API_DOMAIN = 'https://myrefrigerator.store';

const updateHateKeywordsSettings = async (hateKeywords) => {
    if (!hateKeywords) {promptAlertMsg('warn', '키워드를 입력해주세요.'); return false;}
    if (hateKeywords.length > 50) {promptAlertMsg('warn', '키워드는 500개까지만 입력 가능합니다.'); return false;}
    const response = await fetch(`${API_DOMAIN}/api/user/settings/profile.hate/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'data': hateKeywords || [],
            'endpoint': await getSubscriptionEndpoint(),
        }),
    });
    const respJson = await response.json();

    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', '설정이 저장되었습니다.');
        return true;
    } 
    promptAlertMsg('warn', respJson?.server_msg || '설정 저장에 실패했습니다.');
    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    const keywordForm = document.getElementById('keywordForm');
    const keywordInput = document.getElementById('keywordInput');
    const keywordList = document.getElementById('keywordList');
  
    const savedKeywords = JSON.parse(localStorage.getItem('keywords')) || [];
  
    function renderKeywords() {
      keywordList.innerHTML = '';
      savedKeywords.forEach(keyword => {
        const li = document.createElement('li');
        li.classList.add('keywordItem');
        li.textContent = keyword;
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('deleteBtn');
        deleteBtn.innerHTML = '✕'; // x를 볼드체
        deleteBtn.addEventListener('click', async () => await deleteKeyword(keyword));
        li.appendChild(deleteBtn);
        keywordList.appendChild(li);
      });
    }
  
    // 키워드 추가
    keywordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const newKeyword = keywordInput.value.trim();
      if (newKeyword) {
        savedKeywords.push(newKeyword);

        if (await updateHateKeywordsSettings(savedKeywords)) {
            localStorage.setItem('keywords', JSON.stringify(savedKeywords));
            renderKeywords();
            keywordInput.value = '';
        } else {
            renderKeywords();
        }

      }
    });
  
    // 키워드 삭제
    async function deleteKeyword(keyword) {
      const index = savedKeywords.indexOf(keyword);
      if (index !== -1) {
        savedKeywords.splice(index, 1);

        if (await updateHateKeywordsSettings(savedKeywords)) {
            localStorage.setItem('keywords', JSON.stringify(savedKeywords));
            renderKeywords();
        }
      }
    }
  
    renderKeywords();
  });  