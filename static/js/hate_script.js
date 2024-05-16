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
        deleteBtn.addEventListener('click', () => deleteKeyword(keyword));
        li.appendChild(deleteBtn);
        keywordList.appendChild(li);
      });
    }
  
    // 키워드 추가
    keywordForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const newKeyword = keywordInput.value.trim();
      if (newKeyword) {
        savedKeywords.push(newKeyword);
        localStorage.setItem('keywords', JSON.stringify(savedKeywords));
        renderKeywords();
        keywordInput.value = '';
      }
    });
  
    // 키워드 삭제
    function deleteKeyword(keyword) {
      const index = savedKeywords.indexOf(keyword);
      if (index !== -1) {
        savedKeywords.splice(index, 1);
        localStorage.setItem('keywords', JSON.stringify(savedKeywords));
        renderKeywords();
      }
    }
  
    renderKeywords();
  });  