// JavaScript 코드
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const filterSelect = document.getElementById('filter');
    const closePopupButton = document.getElementById('closePopup');
    const popupContent = document.querySelector('.popup-content');

    closePopupButton.addEventListener('click', () => {
        popupContent.style.display = 'none';
    });
    
    function updateItems(category) {
        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            if (category === '전체') {
                item.style.display = 'flex';
            } else {
                if (item.dataset.storage === category) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    function sortItems(category) {
        const itemsArea = document.querySelector('.items');
        const items = Array.from(itemsArea.children);
        if (category === 'expiry') {
            items.sort((a, b) => {
                const aDate = a.dataset.expirydate;
                const bDate = b.dataset.expirydate;
                return aDate.localeCompare(bDate);
            });
            itemsArea.replaceChildren(...items);
        }
        else if (category === 'added') {
            items.sort((a, b) => {
                const aDate = a.dataset.added;
                const bDate = b.dataset.added;
                return -aDate.localeCompare(bDate);
            });
            itemsArea.replaceChildren(...items);
        }
        else if (category === 'added-reverse') {
            items.sort((a, b) => {
                const aDate = a.dataset.added;
                const bDate = b.dataset.added;
                return aDate.localeCompare(bDate);
            });
            itemsArea.replaceChildren(...items);
        }
        else if (category ==='category') {
            items.sort((a, b) => {
                const aCategory = a.dataset.category;
                const bCategory = b.dataset.category;
                return aCategory.localeCompare(bCategory);
            });
            itemsArea.replaceChildren(...items);
        }
        else if (category === 'name') {
            items.sort((a, b) => {
                const aName = a.dataset.name;
                const bName = b.dataset.name;
                return aName.localeCompare(bName);
            });
            itemsArea.replaceChildren(...items);
        }

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
        console.log(selectedFilter)
        sortItems(selectedFilter);
    });
});
