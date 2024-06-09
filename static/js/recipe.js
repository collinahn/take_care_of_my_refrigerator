import {
getSubscriptionEndpoint,
getCurrentId,
setFavorite,
deleteFavorite,
carouselItemsToBeAppended,
createElementWithClassV2
} from "./utils.js";

const API_DOMAIN = 'https://myrefrigerator.store';
// const API_DOMAIN = 'http://127.0.0.1:5000';


function removeRecipe(event) {
    const recipeItem = event.currentTarget.closest(".recipe-item");
    recipeItem.remove();
}

window.onload = function() {
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', removeRecipe);
    });
};

function closePage() {
    window.history.back();
}

window.onload = function() {
    const closeButton = document.querySelector('.list-button');
    closeButton.addEventListener('click', closePage);
};

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

export const setUpFavoriteButton = async (isFavorite) => {
    const favoriteButton = document.querySelector('.star-button');
    if (isFavorite) {
        favoriteButton.innerHTML = "★";
    } else {
        favoriteButton.innerHTML = "☆";
    }

    favoriteButton.onclick = async () => {
        if (isFavorite) {
            if (await deleteFavorite()) {
                setUpFavoriteButton(false);
            }
        } else {
            if (await setFavorite()) {
                setUpFavoriteButton(true);
            }
        }
    }
}

const getSearchResult = async (formData) => {
    const resultArea = document.querySelector('.recipe-card')
    const titleH3 = resultArea.querySelector('#recipe-title');
    const recipeThumbnail = resultArea.querySelector('#recipe-thumb');
    const ingredientList = resultArea.querySelector('#ingredient-list');
    const recipeStep = resultArea.querySelector('#recipe-step');
    const searchTrigger = document.querySelector('#formKeywordInput');
    searchTrigger.appendChild(
        createElementWithClassV2('input', [], {
            type:'radio',
            name: 'keyword',
            id: `keyword-`,
            value: '',
            checked: true,
            onchange: async (e) => {
            await updateBanner()
            },
        })
    )
    searchTrigger.appendChild(
        createElementWithClassV2('label', [], {
                for: `keyword-`,
                innerText: '전체',
            })
    )

    const response = await fetch(`${API_DOMAIN}/api/recipe/${getCurrentId()}/?endpoint=${await getSubscriptionEndpoint()}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        setUpFavoriteButton(respJson.data.favorite);
        const recipeData = respJson.data
        titleH3.innerText = recipeData.title;
        recipeThumbnail.src = recipeData.image;

        ingredientList.replaceChildren();
        recipeData.ingred.forEach((ingredient, idx, arr) => {
            if (recipeData?.ingred404?.includes(ingredient)) {
                return;
            }
            if (arr.indexOf(ingredient) !== idx) {
                return;
            }
            const ingredientLi = document.createElement('li');
            ingredientLi.innerText = `✔️ ${ingredient}`;
            ingredientList.appendChild(ingredientLi);
        });
        recipeData?.ingred404?.forEach((ingredient, idx, arr) => {
            if (arr.indexOf(ingredient) !== idx) {
                return;
            }
            const ingredientLi = document.createElement('li');
            ingredientLi.innerText = `❌ ${ingredient}`;
            ingredientList.appendChild(ingredientLi);

            searchTrigger.appendChild(
                createElementWithClassV2('input', [], {
                    type:'radio',
                    name: 'keyword',
                    id: `keyword-${ingredient}`,
                    value: ingredient,
                    onchange: async (e) => {
                        const ingredientTextIndex = ingredient?.length > 3 ? ingredient.split('').join(' ') : "";
                        await updateBanner(`${ingredient} ${ingredientTextIndex} ${ingredient.slice(0, 2)} ${ingredient.slice(2)}`)
                    }
                })
            )
            searchTrigger.appendChild(
                createElementWithClassV2('label', [], {
                    for: `keyword-${ingredient}`,
                    innerText: ingredient,
                })
            )
        });
        recipeStep.replaceChildren();
        recipeData.recipe.forEach((step, idx) => {
            const recipeStepLi = document.createElement('li');
            recipeStepLi.innerText = `${step}`;
            recipeStep.appendChild(recipeStepLi);
        });
    } else {
        titleH3.innerText = respJson.server_msg;
    }
}


const updateViewedRecipes = () => {
    const currentId = getCurrentId();
    const storageKey = 'viewedRecipes';
    let viewedRecipes = JSON.parse(localStorage.getItem(storageKey)) || [];

    viewedRecipes = viewedRecipes.filter(id => id !== currentId);

    viewedRecipes.unshift(currentId);

    if (viewedRecipes.length > 20) {
        viewedRecipes = viewedRecipes.slice(0, 20);
    }

    localStorage.setItem(storageKey, JSON.stringify(viewedRecipes));
}

const updateBanner = async (keyword) =>{
    const recommendArea = document.querySelector('#carouselRecommend');
    recommendArea.replaceChildren();
    const bannerItems = await carouselItemsToBeAppended(keyword)
    recommendArea.replaceChildren(...bannerItems);
}

const getRecommendList = async () => {
    try {
        await updateBanner()

        const formKeywordInput = document.querySelector('#formKeywordInput');
        formKeywordInput.appendChild(
            createElementWithClassV2('input', [], {
                type: 'search',
                placeholder: '검색어를 입력하세요',
                id: 'keyboardInput'
            })
        )
        formKeywordInput.onsubmit = async (e) => {
            e.preventDefault();
            formKeywordInput.querySelector('input[type="search"]').blur();
            formKeywordInput.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.checked = false;
            })
            await updateBanner(formKeywordInput.querySelector('input[type="search"]').value)
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    getSearchResult();
    updateViewedRecipes();
    getRecommendList()
});