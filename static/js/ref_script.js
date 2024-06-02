// JavaScript 코드
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const items = document.querySelectorAll('.item');
    const filterSelect = document.getElementById('filter');
    const addItemSheet = document.getElementById('addItemSheetModal');
    const openModalButton = document.querySelector('.add');
    const closeModalButton = document.querySelector('.close-sheet');
    const addItemForm = document.getElementById('addItemForm');
    const addCategoryButton = document.getElementById('addCategoryButton');
    const categorySelect = document.getElementById('category');
    const newCategoryInput = document.getElementById('newCategory');

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

    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const item = event.target.closest('.item');
            item.remove();
        });
    });

    openModalButton.addEventListener('click', () => {
        addItemSheet.style.display = 'block';
        setTimeout(() => addItemSheet.classList.add('active'), 10);
    });

    closeModalButton.addEventListener('click', () => {
        addItemSheet.classList.remove('active');
        setTimeout(() => addItemSheet.style.display = 'none', 300);
    });

    addItemSheet.addEventListener('click', (event) => {
        if (event.target.classList.contains('sheet-overlay')) {
            addItemSheet.classList.remove('active');
            setTimeout(() => addItemSheet.style.display = 'none', 300);
        }
    });

    addCategoryButton.addEventListener('click', () => {
        newCategoryInput.style.display = 'block';
        newCategoryInput.focus();
    });

    newCategoryInput.addEventListener('blur', () => {
        const newCategory = newCategoryInput.value.trim();
        if (newCategory) {
            const option = document.createElement('option');
            option.value = newCategory;
            option.text = newCategory;
            categorySelect.add(option);
            categorySelect.value = newCategory;
        }
        newCategoryInput.style.display = 'none';
        newCategoryInput.value = '';
    });

    addItemForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const foodName = document.getElementById('foodName').value;
        const storage = document.getElementById('storage').value;
        const category = document.getElementById('category').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const quantity = document.getElementById('quantity').value;
        const quantityUnit = document.getElementById('quantityUnit').value;

        const newItem = document.createElement('li');
        newItem.classList.add('item');
        newItem.setAttribute('data-category', category);

        newItem.innerHTML = `
            <span class="category">${category}</span>
            <span class="name">${foodName}</span>
            <span class="expiry">${expiryDate} / ${quantity}${quantityUnit}</span>
            <button class="edit">✏️</button>
            <button class="delete">✕</button>
        `;

        document.querySelector('.items').appendChild(newItem);
        
        addItemForm.reset();

        addItemSheet.classList.remove('active');
        setTimeout(() => addItemSheet.style.display = 'none', 300);
    });
});
