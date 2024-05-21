import {
    promptAlertMsg,
    createElementWithClass
} from './utils.js';

const API_DOMAIN = 'http://myrefrigerator.store';

const getSearchResult = async (formData) => {
    const searchResultArea = document.getElementById('result');
    const cidx = searchResultArea.children.length

    const response = await fetch(`${API_DOMAIN}/api/search/recipe/?${new URLSearchParams(formData).toString()}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', respJson?.server_msg);
        promptAlertMsg('warn', '미구현', null, 'warn');
    } else {
        promptAlertMsg('warn', respJson?.server_msg || '검색 결과를 가져오는데 실패했습니다.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.querySelector('.tab-link').click();
    }, 100);

    const searchForm = document.querySelector('.search-form');
    searchForm.onsubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target, e.submitter);
        console.log([...formData.keys()])
        console.log([...formData.values()])
        for (let pair of formData.entries()) {
            console.log(pair, formData)
        }
        if ([...formData.values()].every(v => v === '')) {
            promptAlertMsg('warn', '검색어를 입력해주세요.');
            return;
        }

        getSearchResult(formData);
    }
});