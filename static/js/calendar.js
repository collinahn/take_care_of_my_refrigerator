import { getSubscriptionEndpoint, promptAlertMsg, setUpRecommendRecipe, requestRecommendRecipe, createRecipeItem } from "./utils.js";

const API_DOMAIN = 'https://myrefrigerator.store';
const GET_API_ENDPOINT = '/api/refrigerator/';

const currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

function generateYearOptions() {
    const yearSelect = document.getElementById('year-select');
    const currentYear = new Date().getFullYear();

    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
}

function generateCalendar(year, month, items) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    yearSelect.value = year;
    monthSelect.value = month;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day', 'empty');
        calendar.appendChild(emptyCell);
    }

    for (let date = 1; date <= lastDate; date++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.classList.add('day');

        const dateLabel = document.createElement('div');
        dateLabel.textContent = date;

        dayCell.appendChild(dateLabel);

        if (items?.[dateStr]) {
            dayCell.classList.add('has-item');
            const itemCount = items[dateStr].length;
            const itemCountLabel = document.createElement('div');
            itemCountLabel.classList.add('item-count');
            itemCountLabel.textContent = `+ ${itemCount}`;
            itemCountLabel.onclick = function(event) {
                event.stopPropagation();
                showItems(dateStr, items);
            };
            dayCell.appendChild(itemCountLabel);
        }

        dayCell.onclick = function() {
            showItems(dateStr, items);
        };

        calendar.appendChild(dayCell);
    }
}

function showItems(dateStr, items) {
    const itemListTitle = document.getElementById('item-list-title');
    const itemListContent = document.getElementById('item-list-content');

    itemListTitle.textContent = `${dateStr} 유통기한 알림`;
    itemListContent.innerHTML = '';

    const itemList = items[dateStr];
    if (itemList) {
        itemList.forEach(item => {
            const itemElement = document.createElement('li');
            itemElement.textContent = item.name;
            itemListContent.appendChild(itemElement);
        });
    } else {
        const noItemsElement = document.createElement('li');
        noItemsElement.textContent = '없습니다.';
        itemListContent.appendChild(noItemsElement);
    }
}

function changeYearMonth() {
    const year = parseInt(document.getElementById('year-select').value, 10);
    const month = parseInt(document.getElementById('month-select').value, 10);
    generateCalendar(year, month);
}

const getItems = async () => {
    const response = await fetch(`${API_DOMAIN}${GET_API_ENDPOINT}?endpoint=${await getSubscriptionEndpoint()}`);
    const data = await response.json();
    return data ?? [];
};

const setupCalendar = () => {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    yearSelect.onchange = changeYearMonth;
    monthSelect.onchange = changeYearMonth;
}



document.addEventListener("DOMContentLoaded", async ()=> {
    generateYearOptions();
    const items = await getItems(); // 
    const itemsByDate = items?.reduce?.((acc, item) => {
        const date = item.expiryDate;
        if (acc[date]) {
            acc[date].push(item);
        } else {
            acc[date] = [item];
        }
        return acc;
    }, {}) || [];
    if (itemsByDate.length === 0) {
        promptAlertMsg('warn', '식재료가 없습니다.');
    }
    setupCalendar();
    generateCalendar(currentYear, currentMonth, itemsByDate);
    setUpRecommendRecipe(document.getElementById('recommendRecipe'));
});