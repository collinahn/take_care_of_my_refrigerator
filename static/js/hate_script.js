import {
  promptAlertMsg,
  getSubscriptionEndpoint,
  createElementWithClass
} from "./utils.js";

const API_DOMAIN = 'https://myrefrigerator.store';


const setAutocompleteForm = () => {
    const ingredNameInput = document.getElementById('keywordInput');
    const keywordDataList = document.getElementById('keywordDatalist');
    ingredNameInput.onkeyup = async (e) => {
        if (!e?.target?.value) {
            return
        }
        if (e?.isComposing) {
            return; // 한글 조합 중인 경우 추가 요청 안보냄 
        }
        try {
            const response = await fetch(`${API_DOMAIN}/api/refrigerator/autocomplete/recipe/name/?q=${e?.target?.value}`);
            const data = await response.json();
            if (data.data?.length > 0) {
                const autocompletedData = []
            data.data.forEach((kw) => {
                const optionKeyword = createElementWithClass("option", [])
            optionKeyword.value = kw
            autocompletedData.push(optionKeyword)
            })

            keywordDataList.replaceChildren(...autocompletedData)
            } else {
                throw new Error('No data found');
            }
        } catch (error) {
            console.error(error);
        }
    }
}

const updateHateKeywordsSettings = async (hateKeywords, isDelete) => {
    const userEndpoint =  await getSubscriptionEndpoint();
    if (!userEndpoint) {
        promptAlertMsg('warn', '기기 등록 후에 이용 가능합니다.');
        return false;
    }
    if (hateKeywords.length > 50 && !isDelete) {
        promptAlertMsg('warn', '키워드는 50개까지만 입력 가능합니다.'); 
        return false;
    }
    const response = await fetch(`${API_DOMAIN}/api/user/settings/profile.hate/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'data': hateKeywords || [],
            'endpoint': userEndpoint,
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
    
    let isExist = false;
    // 키워드 추가
    keywordForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (keywordInput.value.trim() === '') {
        promptAlertMsg('warn', '키워드를 입력해주세요.', null, "warn");
        return;
      }
      const newKeywords = keywordInput.value.trim().split(',');
      if (newKeywords.length > 0) {
        newKeywords.forEach(newKeyword => {
            isExist = savedKeywords.includes(newKeyword.trim());
            if (isExist) {
                return;
            }
            savedKeywords.push(newKeyword.trim())
        })
        
        if (isExist) {
            promptAlertMsg('warn', '중복된 키워드를 정리하였습니다.', null, "warn");
        }
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

        if (await updateHateKeywordsSettings(savedKeywords, true)) {
            localStorage.setItem('keywords', JSON.stringify(savedKeywords));
            renderKeywords();
        }
      }
    }
  
    renderKeywords();
    setAutocompleteForm();
  });  