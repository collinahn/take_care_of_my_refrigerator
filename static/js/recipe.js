import {
  promptAlertMsg,
  getSubscriptionEndpoint
} from "./utils.js";

const API_DOMAIN = 'http://myrefrigerator.store';

function activateTab(evt, tabName) {
    var i, tablinks, contentBoxes;

    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    contentBoxes = document.getElementsByClassName("tab-content");
    for (i = 0; i < contentBoxes.length; i++) {
        contentBoxes[i].style.display = "none";
    }

    evt.currentTarget.className += " active";

    document.getElementById(tabName).style.display = "block";
}

function removeRecipe(event) {
    const recipeItem = event.currentTarget.closest(".recipe-item");
    recipeItem.remove();
}

window.onload = function() {
    document.querySelector('.tab-link[onclick="activateTab(event, \'search\')"]').click();
    
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', removeRecipe);
    });
};


const getCurrentId = () =>
  window.location.pathname.replace(/\/$/, "").split("/").pop();

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

const setUpFavoriteButton = async (isFavorite) => {
    const favoriteButton = document.querySelector('.star-button');
    if (isFavorite) {
        favoriteButton.innerHTML = "★";
    } else {
        favoriteButton.innerHTML = "☆";
    }

    favoriteButton.addEventListener('click', async () => {
        if (isFavorite) {
            if (await deleteFavorite()) {
                favoriteButton.innerHTML = "☆";
            }
        } else {
            if (await setFavorite()) {
                favoriteButton.innerHTML = "★";
            }
        }
    });
}


const setFavorite = async () => {
    const endpointUrl = await getSubscriptionEndpoint();
    if (!endpointUrl) {
        promptAlertMsg('warn', '기기등록이 필요한 서비스입니다.\n홈 화면에서 기기등록을 진행해주세요.');
        return false;
    }
    const response = await fetch(`${API_DOMAIN}/api/user/favorite/`, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'recipe_id': getCurrentId(),
            'endpoint': endpointUrl,
        }),

        
    });
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', '즐겨찾기에 추가되었습니다.');
        return true;
    }
    promptAlertMsg('warn', respJson?.server_msg || '즐겨찾기 추가에 실패했습니다.');
    return false
}

const deleteFavorite = async () => {
    const endpointUrl = await getSubscriptionEndpoint();
    if (!endpointUrl) {
        promptAlertMsg('warn', '기기등록이 필요한 서비스입니다.\n홈 화면에서 기기등록을 진행해주세요.');
        return false;
    }
    const response = await fetch(`${API_DOMAIN}/api/user/favorite/?${new URLSearchParams({
        'recipe_id': getCurrentId(),
        'endpoint': endpointUrl,
    }).toString()}
    })}`, {
        method: 'DELETE',
    });
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', '즐겨찾기에서 삭제되었습니다.');
        return true;
    }
    promptAlertMsg('warn', respJson?.server_msg || '즐겨찾기 삭제에 실패했습니다.');
    return false
}


const getSearchResult = async (formData) => {
    const resultArea = document.querySelector('.recipe-card')
    const titleH3 = resultArea.querySelector('#recipe-title');
    const recipeThumbnail = resultArea.querySelector('#recipe-thumb');
    const ingredientList = resultArea.querySelector('#ingredient-list');
    const recipeStep = resultArea.querySelector('#recipe-step');
    

    const response = await fetch(`${API_DOMAIN}/api/recipe/${getCurrentId()}/`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        setUpFavoriteButton(respJson.data.favorite);
        const recipeData = respJson.data
        titleH3.innerText = recipeData.title;
        recipeThumbnail.src = recipeData.image;

        ingredientList.replaceChildren();
        getLastKeys(recipeData.ingredients).forEach(ingredient => {
            const ingredientLi = document.createElement('li');
            ingredientLi.innerText = `✔️ ${ingredient}`;
            ingredientList.appendChild(ingredientLi);
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

document.addEventListener('DOMContentLoaded', function() {
    getSearchResult();
});