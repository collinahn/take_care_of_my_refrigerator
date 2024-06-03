// JavaScript 코드
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const items = document.querySelectorAll('.item');
    const filterSelect = document.getElementById('filter');

    function updateItems(category) {
        items.forEach(item => {
            if (category === '전체') {
                item.style.display = '';
            } else {
                if (item.getAttribute('data-category') === category) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const item = event.target.closest('.item');
            item.remove();
        });
    });

    function activateTab(tab) {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const selectedTab = tab.getAttribute('data-tab');
        updateItems(selectedTab);
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            activateTab(event.target);
        });
    });

    const initialTab = document.querySelector('.tab-link[data-tab="전체"]');
    if (initialTab) {
        activateTab(initialTab);
    }

    filterSelect.addEventListener('change', (event) => {
        const selectedFilter = event.target.value;
        // 필터링된 아이템들을 표시하는 함수 호출
        updateItems(selectedFilter);
    });


});
