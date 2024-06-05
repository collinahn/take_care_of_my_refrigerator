import {
  promptAlertMsg,
  getSubscriptionEndpoint,
  getCurrentId,
  setFavorite,
  deleteFavorite,
} from "./utils.js";

const API_DOMAIN = 'https://myrefrigerator.store';

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
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', removeRecipe);
    });
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
    

    const response = await fetch(`${API_DOMAIN}/api/recipe/${getCurrentId()}/?endpoint=${await getSubscriptionEndpoint()}`);
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

document.addEventListener('DOMContentLoaded', function() {
    getSearchResult();
    updateViewedRecipes();
});