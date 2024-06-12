import {
    promptAlertMsg,
    createElementWithClass,
    removeFadeOut,
    getSubscriptionEndpoint,
    setFavorite,
    deleteFavorite
} from './utils.js';

const API_DOMAIN = 'https://myrefrigerator.store';
// const API_DOMAIN = 'http://127.0.0.1:4000';

const getSearchResult = async (formData, forceCidx, sortFilter) => {
    const resultArea = document.querySelector('.recipe-list');
    const cidx = forceCidx ?? (resultArea.querySelectorAll('.recipe-item')?.length || 0);
    const searchSortFilter = document.getElementById('filter');
    const searchSortFilterValue = searchSortFilter?.value || "";

    const response = await fetch(`${API_DOMAIN}/api/search/recipe/?${new URLSearchParams(formData).toString()}&cidx=${cidx}&sort=${searchSortFilterValue}`);
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
            const recipeItem = createRecipeItem(recipe);
            resultArea.appendChild(recipeItem);
        });

        if (respJson.data.nidx !== -1) {
            addSeeMoreButtonRecursive(formData);
        }
    } else {
        promptAlertMsg('warn', respJson?.server_msg || '검색 결과를 가져오는데 실패했습니다.');
    }
}

const getFavorites = async () => {
    const resultArea = document.querySelector('#favorites');

    const response = await fetch(`${API_DOMAIN}/api/user/favorite/?endpoint=${await getSubscriptionEndpoint()}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        const recipeData = respJson?.data;
        if (!recipeData || recipeData.length === 0) {
            resultArea.textContent = '즐겨찾기한 레시피가 없습니다.';
            return;
        }

        recipeData.forEach((recipe) => {
            const recipeItem = createRecipeItem(recipe, true);
            resultArea.appendChild(recipeItem);
        });
    } else {
        promptAlertMsg('warn', respJson?.server_msg || '검색 결과를 가져오는데 실패했습니다.');
    }
}

const getRecentViews = async () => {
    const storageKey = 'viewedRecipes';
    const resultArea = document.querySelector('#recent');
    const viewedRecipes = JSON.parse(localStorage.getItem(storageKey) || "[]").slice(0, 20);
    const ids = viewedRecipes.join('|');

    if (viewedRecipes.length === 0) {
        resultArea.textContent = '최근 본 레시피가 없습니다.';
        return;
    }

    const response = await fetch(`${API_DOMAIN}/api/recipe/bulk/?endpoint=${await getSubscriptionEndpoint()}&ids=${ids}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        const recipeData = respJson?.data;
        if (!recipeData || recipeData.length === 0) {
            resultArea.textContent = '최근 본 레시피가 없습니다.';
            return;
        }
        
        // sort by recent views
        recipeData.sort((a, b) => {
            const aId = a._id;
            const bId = b._id;
            return  viewedRecipes.indexOf(aId) - viewedRecipes.indexOf(bId);
        });
        recipeData.forEach((recipe) => {
            const recipeItem = createRecentRecipe(recipe);
            resultArea.appendChild(recipeItem);
        });
    } else {
        promptAlertMsg('warn', respJson?.server_msg || '검색 결과를 가져오는데 실패했습니다.');
    }
}

const addSeeMoreButtonRecursive = (formData) => {
    const resultArea = document.querySelector('.recipe-list');
    const seeMoreButton = createElementWithClass('button', [], '더보기 ▼');
    seeMoreButton.style.backgroundColor = 'transparent';
    seeMoreButton.style.border = 'none';
    seeMoreButton.style.cursor = 'pointer';
    seeMoreButton.style.margin = '10px auto';
    seeMoreButton.style.display = 'block';
    seeMoreButton.style.width = '100%';
    seeMoreButton.style.height = '50px';
    seeMoreButton.style.fontSize = '1rem';
    seeMoreButton.style.color = 'var(--primary-color)';
    seeMoreButton.style.transition = 'all 0.3s ease-in-out';
    seeMoreButton.style.transform = 'translateY(20px) scale(0.9)';

    setTimeout(() => {
        resultArea.appendChild(seeMoreButton);
    }, 1500);
    seeMoreButton.onclick = () => {
        getSearchResult(formData);
        addSeeMoreButtonRecursive(formData);
        removeFadeOut(seeMoreButton);
    }

}



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
            container.style.height = "35px";
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

const ingredientArea = (ingredients, ingredients404) => {
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    ingredients?.forEach(ingredient => {
        if (ingredients404?.includes(ingredient)) {
            ingredientList.appendChild(createElementWithClass('span', ['available-ingredient', 'missing'], ingredient));
        } else {
            ingredientList.appendChild(createElementWithClass('span', ['available-ingredient'], ingredient));
        }
        ingredientList.appendChild(createElementWithClass('span', ['ingredient-separator'], ', '));
    });
    return ingredientList;
}

const createRecipeItem = (recipeData, isFavoriteView) => {
    const isFavorite = recipeData?.favorite || false;
    const foodImageHeader = createElementWithClass('div', ['food-image']);
    const thumbContainer = createElementWithClass('div', ['thumb-container']);
    const favoriteButton = createElementWithClass('button', ['star-button'], isFavorite ? '★' : '☆');
    favoriteButton.onclick = async (e) => {
        e.preventDefault();
        const isFavorite = e.target.innerHTML === '★';
        if (isFavorite) {
            if (await deleteFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
                if (isFavoriteView) {
                    removeFadeOut(e.target.closest('.recipe-item'));
                }
            }
        } else {
            if (await setFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
            }
        }
    }
    thumbContainer.appendChild(favoriteButton);
    const foodThumbnail = createElementWithClass('img');
    foodThumbnail.src = recipeData?.image;
    foodThumbnail.alt = recipeData?.title;
    foodThumbnail.loading = 'lazy';
    foodThumbnail.referrerpolicy = 'no-referrer';
    thumbContainer.appendChild(foodThumbnail);
    foodImageHeader.appendChild(thumbContainer);
    const cookTime = createElementWithClass('div', ['cook-time']);
    if (recipeData?.cook_time) {
        cookTime.textContent = `약 ${recipeData?.cook_time}분 소요`;
        cookTime.style.textAlign = 'center';
    }
    foodImageHeader.appendChild(cookTime);
    
    const foodHeader = createElementWithClass('div', ['food-header']);
    const foodName = createElementWithClass('div', ['food-name'], null, recipeData?.title);
    
    foodHeader.appendChild(foodName);
    
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    // const noIngredient = createElementWithClass('div', ['no-ingredient'], `없는 재료: ${recipeData?.ingred404?.join(', ')}`);
    // const availableIngredient = createElementWithClass('div', ['available-ingredient'], recipeData?.ingred?.join(', '));

    
    // if (recipeData?.ingred404?.length > 0) {
    //     ingredientList.appendChild(noIngredient);
    // }
    // ingredientList.appendChild(availableIngredient);
    ingredientList.appendChild(ingredientArea(recipeData?.ingred, recipeData?.ingred404));
    if (recipeData?.matchingCount) {
        const matchingCount = createElementWithClass('div', ['matching-count'], `일치하는 재료: ${recipeData?.matchingCount}개`);
        matchingCount.style.paddingTop = '5px';
        ingredientList.appendChild(matchingCount);
    }
    
    const foodDetails = createElementWithClass('div', ['food-details']);
    foodDetails.appendChild(foodHeader);
    foodDetails.appendChild(ingredientList);


    const recipeItem = createElementWithClass('a', ['recipe-item']);
    if (recipeData?._id) {
        recipeItem.href = `/recipe/${recipeData?._id}`;
        recipeItem.id = recipeData._id;
        recipeItem.style.textDecoration = 'none';
    }
    recipeItem.appendChild(foodImageHeader);
    recipeItem.appendChild(foodDetails);

    return recipeItem;
}
const createRecentRecipe = (recipeData) => {
    const isFavorite = recipeData?.favorite || false;
    const foodImageHeader = createElementWithClass('div', ['food-image']);
    const thumbContainer = createElementWithClass('div', ['thumb-container']);
    const favoriteButton = createElementWithClass('button', ['star-button'], isFavorite ? '★' : '☆');
    favoriteButton.onclick = async (e) => {
        e.preventDefault();
        const isFavorite = e.target.innerHTML === '★';
        if (isFavorite) {
            if (await deleteFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
            }
        } else {
            if (await setFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
            }
        }
    }
    thumbContainer.appendChild(favoriteButton);
    const foodThumbnail = createElementWithClass('img');
    foodThumbnail.src = recipeData?.image;
    foodThumbnail.alt = recipeData?.title;
    foodThumbnail.loading = 'lazy';
    foodThumbnail.referrerpolicy = 'no-referrer';
    thumbContainer.appendChild(foodThumbnail);
    foodImageHeader.appendChild(thumbContainer);
    const cookTime = createElementWithClass('div', ['cook-time']);
    if (recipeData?.cook_time) {
        cookTime.textContent = `약 ${recipeData?.cook_time}분 소요`;
        cookTime.style.textAlign = 'center';
    }
    foodImageHeader.appendChild(cookTime);
    
    const foodHeader = createElementWithClass('div', ['food-header']);
    const foodName = createElementWithClass('div', ['food-name'], null, recipeData?.title);
    
    foodHeader.appendChild(foodName);
    
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    // const noIngredient = createElementWithClass('div', ['no-ingredient'], "없는 재료: 구현 예정");
    const availableIngredient = createElementWithClass('div', ['available-ingredient'], getLastKeys(recipeData?.ingredients).join(', '));
    
    // ingredientList.appendChild(noIngredient);
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
    recipeItem.appendChild(foodImageHeader);
    recipeItem.appendChild(foodDetails);

    const closeBtn = createElementWithClass('button', ['delete-button'], '삭제');
    closeBtn.onclick = (e) => {
        e.preventDefault();
        const recipeItem = e.target.closest('.recipe-item');
        removeFadeOut(recipeItem);
        window.localStorage.setItem('viewedRecipes', JSON.stringify(JSON.parse(window.localStorage.getItem('viewedRecipes')).filter(id => id !== recipeData._id)));
    }
    recipeItem.appendChild(closeBtn);

    return recipeItem;
}


async function activateTab(evt, tabName) {
    let i, tablinks, contentBoxes;
    const recipeListArea = document.querySelector('.recipe-list');

    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    contentBoxes = document.getElementsByClassName("content-box");
    for (i = 0; i < contentBoxes.length; i++) {
        contentBoxes[i].style.display = "none";
    }

    evt.currentTarget.className += " active";

    if (tabName === "search") {
        document.getElementById("search-interaction").style.display = "block";
        if (document.querySelector('.recipe-list')?.children?.length !== 0) {
            document.getElementById("search").style.display = "none";
        } else {
            document.getElementById("search").style.display = "block";
        }
        recipeListArea.style.display = "flex";
    } else {
        document.getElementById("search-interaction").style.display = "none";
        document.getElementById(tabName).style.display = "block"; 
        recipeListArea.style.display = "none";
    }

    if (tabName === 'favorites') {
        await getFavorites();
    }
    if (tabName === 'recent') {
        await getRecentViews();
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('searchTab').onclick = (e) => {
        activateTab(e, 'search');
    }
    document.getElementById('favoriteTab').onclick = (e) => {
        activateTab(e, 'favorites');
    }
    document.getElementById('recentTab').onclick = (e) => {
        activateTab(e, 'recent');
    }

    setTimeout(() => {
        document.querySelector('.tab-link').click();
    }, 100);

    const searchForm = document.querySelector('.search-form');
    // add hidden input for token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'endpoint';
    tokenInput.value = await getSubscriptionEndpoint();
    searchForm.appendChild(tokenInput);

    searchForm.onsubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target, e.submitter);
        for (let pair of formData.entries()) {
            console.log(pair, formData)
        }
        if ([...formData.values()].every(v => v === '')) {
            promptAlertMsg('warn', '검색어를 입력해주세요.');
            return;
        }
        const resultArea = document.querySelector('.recipe-list');
        Array.from(resultArea?.children)?.forEach?.(child => {
            removeFadeOut(child);
        })
        await getSearchResult(formData, 0);
    }

    const searchSortFilter = document.getElementById('filter');
    searchSortFilter.onchange = async (e) => {
        const searchForm = document.querySelector('.search-form');
        const formData = new FormData(searchForm);
        const sortFilter = e.target.value;
        const resultArea = document.querySelector('.recipe-list');
        Array.from(resultArea?.children)?.forEach?.(child => {
            removeFadeOut(child);
        })
        await getSearchResult(formData, 0, sortFilter);
    }


});