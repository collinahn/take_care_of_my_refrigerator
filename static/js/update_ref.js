import { getSubscriptionEndpoint, createElementWithClass, promptAlertMsg, removeFadeOut } from './utils.js';

const API_DOMAIN = 'https://myrefrigerator.store'
const GET_API_ENDPOINT = '/api/refrigerator/';
const ADD_API_ENDPOINT = '/api/refrigerator/add/';
const UPDATE_API_ENDPOINT = '/api/refrigerator/update/';
const DELETE_API_ENDPOINT = '/api/refrigerator/delete/';

const createIngredientItem = (ingredient) => {
    const newItem = createElementWithClass('li', ['item']);
    newItem.setAttribute('data-category', ingredient.category);
    newItem.setAttribute('data-storage', ingredient.storage);
    newItem.setAttribute('data-expiryDate', ingredient.expiryDate);
    newItem.setAttribute('data-quantity', ingredient.quantity);
    newItem.setAttribute('data-added', ingredient.added);
    newItem.setAttribute('data-id', ingredient.id);
    newItem.setAttribute('data-name', ingredient.name);

    const categorySpan = createElementWithClass('span', ['category'], ingredient.userInputCategory ?? ingredient.category);
    const storageSpan = createElementWithClass('span', ['storage'], ingredient.storage);
    const nameSpan = createElementWithClass('span', ['name'], ingredient.name);
    const expirySpan = createElementWithClass('span', ['expiry'], `${ingredient.expiryDate} / ${ingredient.quantity}${ingredient.quantityUnit}`);
    const editButton = createElementWithClass('button', ['edit'], '✏️');
    const deleteButton = createElementWithClass('button', ['delete'], '✕');
    
    editButton.onclick = (e) => {
        showBottomSheet(()=>{
            changeModalTitle('식재료 수정');
            enableAddedDate(ingredient.added);
            const form = document.getElementById('addItemForm');
            form.elements['name'].value = ingredient.name;
            form.elements['quantity'].value = ingredient.quantity;
            form.elements['quantityUnit'].value = ingredient.quantityUnit;
            form.elements['expiryDate'].value = ingredient.expiryDate;
            form.elements['storage'].value = ingredient.storage;
            form.elements['category'].value = ingredient.category;
            form.elements['userInputCategory'].value = ingredient.userInputCategory;
            form.elements['id'].value = ingredient.id;
            form.onsubmit = (event) => onSubmitForm(event, 'update');
        })
    }
    deleteButton.onclick = async (e) => {
        const itemDiv = e.target.closest('.item');
        const id = ingredient.id ?? itemDiv.dataset.id;
        const response = await fetch(`${API_DOMAIN}${DELETE_API_ENDPOINT}?endpoint=${await getSubscriptionEndpoint()}&id=${id}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (data.resp_code === 'RET000') {
            removeFadeOut(itemDiv);
            promptAlertMsg('info', data.server_msg);
            return
        }
        promptAlertMsg('warn', data.server_msg);

    }
    newItem.replaceChildren(storageSpan, categorySpan, nameSpan, expirySpan, editButton, deleteButton);
    return newItem;
}

const changeModalTitle = (title) => {
    const titleComponent = document.querySelector('#addItemForm').querySelector('h2');
    if (titleComponent) {
        titleComponent.innerText = title;
    }
}

const onSubmitForm = async (e, type) => {
    e.preventDefault();
    
    const ingredName = document.getElementById('ingredNameInput').value;
    if (!ingredName) {
        return
    }
    let url = `${API_DOMAIN}${ADD_API_ENDPOINT}`;
    if (type === 'update') {
        url = `${API_DOMAIN}${UPDATE_API_ENDPOINT}`;
    }

    const formDataToSend = Object.fromEntries(new FormData(e.target));
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: await getSubscriptionEndpoint(),
            ingredients: formDataToSend
        }),
    });
    const data = await response.json();
    if (data.resp_code === 'RET000') {
        const userRefrigeratorItemsArray = data.data?.refrigerator ?? [];

        if (userRefrigeratorItemsArray.length === 0) {
            promptAlertMsg('warn', '남은 식재료가 없습니다.');
        } else {
            const itemsArea = document.querySelector('.items'); 
            itemsArea.replaceChildren(...userRefrigeratorItemsArray.map((ingredient) => createIngredientItem(ingredient)));
            promptAlertMsg('info', data.server_msg);
        }
        e.target.reset();
        hideBottomSheet();
        return
    }
    promptAlertMsg('warn', data.server_msg);
}

const loadItems = async () => {
    const userEndpoint = await getSubscriptionEndpoint();

    if (!userEndpoint) {
        promptAlertMsg('warn', '홈 화면에서 알림 아이콘을 눌러 기기등록을 먼저 진행해주세요.');
        document.querySelector('.items').replaceChildren(createElementWithClass('li', ['item'], null, '기기 등록 전엔 냉장고 서비스 이용이 불가합니다.'));
        return
    }

    const response = await fetch(`${API_DOMAIN}${GET_API_ENDPOINT}?endpoint=${userEndpoint}`);
    const data = await response.json();
    const userRefrigeratorItemsArray = data ?? [];

    const itemsArea = document.querySelector('.items');
    if (userRefrigeratorItemsArray.length === 0) {
        itemsArea.replaceChildren(createElementWithClass('li', ['item'], null, '추가된 식재료가 없습니다.'));
    }
    else {
        itemsArea.replaceChildren(...userRefrigeratorItemsArray.map((ingredient) => createIngredientItem(ingredient)));
    }
}

const enableAddedDate = (date) => {
    const formBody = document.getElementById('addItemForm').querySelector('.body');
    console.log(date, formBody);
    if (date) {
        const container = createElementWithClass('div', ['form-row', 'date-added']);
        const dateInput = createElementWithClass('input', ['form-group']);
        dateInput.value = date;
        dateInput.disabled = true;
        container.appendChild(createElementWithClass('label', ['form-group'], null, '추가된 일자'));
        container.appendChild(dateInput);

        if (formBody.querySelector('.date-added')) {
            formBody.querySelector('.date-added').replaceWith(container);
        } else {
            formBody.appendChild(container)
        }
    } else {
        const dateString = formBody.querySelector('.date-added')
        if (dateString) {
            removeFadeOut(dateString);
        }
    }

}

const resetForm = ()=> {
    const form = document.getElementById('addItemForm');
    const nameInput = form.querySelector('input[name="name"]');
    if (form) {
        form.reset();
    }
    if (nameInput) {
        setTimeout(() => {
            nameInput.focus();
        }, 200)
    }
}

const setAutoDateForm = () => {
    // localtime
    // set min date to today of local time
    // set default date to today+7 of local time
    const dateInput = document.getElementById('expiryDate');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        dateInput.value = defaultDate.toISOString().split('T')[0];
    }
}

const setAutocompleteForm = () => {
    const ingredNameInput = document.getElementById('ingredNameInput');
    const keywordDataList = document.getElementById('ingredName');
    ingredNameInput.oninput = async (e) => {
        if (!e?.target?.value) {
            return
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

document.addEventListener('DOMContentLoaded', () => {
    const addItemButton = document.querySelector('.add');
if (addItemButton) {
    addItemButton.addEventListener('click', (e) => {
            changeModalTitle('식재료 추가');
            enableAddedDate();
            resetForm();
            setAutoDateForm();

        });
    }

    enableBottomSheet(() => {
        const addItemSheet = document.getElementById('addItemSheetModal');
        const closeModalButton = document.querySelector('.close-sheet');
        const addItemForm = document.getElementById('addItemForm');
        const addCategoryButton = document.getElementById('addCategoryButton');
        const categorySelect = document.getElementById('category');
        const newCategoryInput = document.getElementById('newCategory');

        closeModalButton.addEventListener('click', () => {
            addItemSheet.classList.remove('active');
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
        
        addItemForm.onsubmit = (event) => onSubmitForm(event, 'add');
    })

    loadItems();
    setAutocompleteForm();

});
