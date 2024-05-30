import {
    promptAlertMsg,
    createElementWithClass
} from './utils.js';

const API_DOMAIN = 'http://myrefrigerator.store';

const getSearchResult = async (formData) => {
    const resultArea = document.querySelector('.recipe-list');
    const cidx = resultArea.querySelectorAll('.recipe-item')?.length || 0;

    const response = await fetch(`${API_DOMAIN}/api/search/recipe/?${new URLSearchParams(formData).toString()}&cidx=${cidx}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', respJson?.server_msg);
        const recipeData = respJson?.data?.display_list;
        if (!recipeData || recipeData.length === 0) {
            promptAlertMsg('warn', '검색 결과가 없습니다.');
            return;
        }

        renderSearchedSearchArea();
        recipeData.forEach((recipe) => {
            const recipeItem = renderSearchResultList(recipe);
            resultArea.appendChild(recipeItem);
        });
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

const renderDefaultSearchArea = () => {
    const container = document.querySelector('#search-interaction');
    const searchInputArea = document.querySelector("#search");
    const searchResultIndicator = document.querySelector(".filter-container")
    if (searchResultIndicator) {
        searchResultIndicator.style.transform = "translateX(-50px)";
        searchResultIndicator.style.opacity = "0";
        container.style.height = "270px";
        searchResultIndicator.ontransitionend = (e) => {
            searchResultIndicator.style.display = "none";
            searchResultIndicator.ontransitionend = null;
            if (searchInputArea){
                searchInputArea.style.display = "block";
                searchInputArea.style.opacity = "0";
                searchInputArea.style.transform = "none";
                setTimeout(() => {
                    searchInputArea.style.opacity = "1";
                }, 50);
            }
        }
    }
}

const renderSearchedSearchArea = () => {
    const container = document.querySelector('#search-interaction');
    const searchInputArea = document.querySelector("#search");
    const searchResultIndicator = document.querySelector(".filter-container")
    if (searchInputArea){
        searchInputArea.style.transformOrigin = "top left";
        searchInputArea.style.transform = "translateX(-50px)";
        searchInputArea.style.opacity = "0";  
        
        searchInputArea.ontransitionend = (e) => {
            searchInputArea.style.display = "none";
            searchInputArea.ontransitionend = null;
            if (searchResultIndicator) {
                const searchButton = searchResultIndicator.querySelector('.search');
                searchButton.onclick = () => {
                    renderDefaultSearchArea();
                }
                searchResultIndicator.style.display = "flex";
                searchResultIndicator.style.opacity = "1";
                searchResultIndicator.style.transform = "translateX(50px)";
                setTimeout(() => {
                    searchResultIndicator.style.transform = "none";
                    
                }, 100);
            }
            container.style.height = "50px";
        }
    }
}

const getLastKeys = (ingredients) => {
    const lastKeys = [];

    for (const category in ingredients) {
        const items = ingredients?.[category];
        if (!items) {
            continue;
        }
        items.forEach(item => {
        const keys = Object.keys(item);
        if (keys.length > 0) {
            lastKeys.push(keys[keys.length - 1]);
        }
        });
    }

    return lastKeys;
}
const renderSearchResultList = (recipeData) => {

    const foodImage = createElementWithClass('div', ['food-image']);
    const foodThumbnail = createElementWithClass('img');
    foodThumbnail.src = recipeData?.image;
    foodThumbnail.alt = recipeData?.title;
    foodThumbnail.loading = 'lazy';
    foodThumbnail.referrerpolicy = 'no-referrer';
    foodImage.appendChild(foodThumbnail);
    
    const foodHeader = createElementWithClass('div', ['food-header']);
    const foodName = createElementWithClass('div', ['food-name'], null, recipeData?.title);
    const cookTime = createElementWithClass('div', ['cook-time']);
    if (recipeData?.cook_time) {
        cookTime.textContent = `소요시간: 약 ${recipeData?.cook_time}분`;
    }
    
    foodHeader.appendChild(foodName);
    foodHeader.appendChild(cookTime);
    
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    const noIngredient = createElementWithClass('div', ['no-ingredient'], "없는 재료: 구현 예정");
    const availableIngredient = createElementWithClass('div', ['available-ingredient'], getLastKeys(recipeData?.ingredients).join(', '));
    
    ingredientList.appendChild(noIngredient);
    ingredientList.appendChild(availableIngredient);
    
    const foodDetails = createElementWithClass('div', ['food-details']);
    foodDetails.appendChild(foodHeader);
    foodDetails.appendChild(ingredientList);


    const recipeItem = createElementWithClass('a', ['recipe-item']);
    if (recipeData?._id) {
        recipeItem.href = `/recipe/${recipeData?._id}`;
        recipeItem.id = recipeData._id;
        recipeItem.style.textDecoration = 'none';
    }
    recipeItem.appendChild(foodImage);
    recipeItem.appendChild(foodDetails);

    return recipeItem;
}