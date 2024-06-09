import {
getSubscriptionEndpoint,
getCurrentId,
setFavorite,
deleteFavorite,
carouselItemsToBeAppended,
createElementWithClassV2,
promptAlertMsg
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
    searchTrigger.replaceChildren();
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
    searchTrigger.appendChild(
        createElementWithClassV2('input', [], {
            type: 'submit',
            style: {
                display: 'none'
            }
        })
    )

    const response = await fetch(`${API_DOMAIN}/api/recipe/${getCurrentId()}/?endpoint=${await getSubscriptionEndpoint()}`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        setUpFavoriteButton(respJson.data.favorite);
        const recipeData = respJson.data
        titleH3.innerText = recipeData.title;
        recipeThumbnail.src = recipeData.image;
        const recipeIngredients = recipeData?.ingred || []

        ingredientList.replaceChildren();
        recipeIngredients?.forEach((ingredient, idx, arr) => {
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
                        await updateBanner(`${ingredient} ${ingredientTextIndex} ${ingredient.slice(0, 2)} ${ingredient.slice(2)} ${ingredient.slice(0, 3)} ${ingredient.slice(3)}`)
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
        enableBottomSheet(()=> {
            const bottomSheetBody = document.getElementById('modalBody')
            bottomSheetBody.replaceChildren();
            const titleH3 = createElementWithClassV2('h3', [], {
                innerText: '이번 요리에서 남은 재료를 선택 해제해주세요'
            })
            bottomSheetBody.appendChild(titleH3);
            const formElem = createElementWithClassV2('form', [], {
                onsubmit: async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const checkedIngredients = formData.getAll('ingredient');
                    if (checkedIngredients.length === 0) {
                        promptAlertMsg('warn', '선택된 재료가 없습니다.');
                        return;
                    }
                    if (!window.confirm(`선택된 ${checkedIngredients.length}개의 재료가 냉장고에서 삭제됩니다.`)){
                        return;
                    }
                    try {
                        const response = await fetch(`${API_DOMAIN}/api/refrigerator/bulk/delete/?endpoint=${await getSubscriptionEndpoint()}&id=${checkedIngredients}`, {
                            method: 'DELETE',
                        });
                        const respJson = await response.json();
                        if (respJson.resp_code === 'RET000') {
                            await getSearchResult();
                            promptAlertMsg('info', respJson.server_msg);
                            hideBottomSheet();
                        } else {
                            promptAlertMsg('warn', respJson.server_msg);
                        }
                    } catch (e) {
                        console.error(e);
                        promptAlertMsg('warn', '서버와의 통신 중 문제가 발생했습니다.');
                    }
                }
            });
            const checkboxContainer = createElementWithClassV2('div', ['checkbox-container']);
            recipeIngredients.forEach((ingredient) => {
                const ingredientInput = createElementWithClassV2('input', [], {
                    type: 'checkbox',
                    name: 'ingredient',
                    checked: true,
                    value: ingredient,
                    id: `ingredient-${ingredient}`
                });
                const ingredientLabel = createElementWithClassV2('label', ['ingredient'], {
                    for: `ingredient-${ingredient}`,
                    innerText: ingredient
                });
                checkboxContainer.appendChild(ingredientInput);
                checkboxContainer.appendChild(ingredientLabel);
            });
            formElem.appendChild(checkboxContainer);
            const submitButton = createElementWithClassV2('button', ['submit'], {
                type: 'submit',
                innerText: '선택된 재료를 냉장고에서 삭제합니다.'
            });
            formElem.appendChild(submitButton);
            bottomSheetBody.appendChild(formElem);
            })
        searchTrigger.appendChild(
            createElementWithClassV2('input', [], {
                type: 'search',
                placeholder: '검색어를 입력하세요',
                id: 'keyboardInput',
                oninput: async (e) => {
                    if (e.data === undefined) {
                        await updateBanner()
                        searchTrigger.querySelectorAll('input[type="radio"]').forEach(radio => {
                            radio.checked = false;
                            if (radio.id === 'keyword-') {
                                radio.checked = true;
                            }
                        })
                    }
                }
            })
        )

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
    getRecommendList();
});