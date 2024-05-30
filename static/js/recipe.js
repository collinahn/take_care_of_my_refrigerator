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

function toggleFavorite(button) {
    if (button.innerHTML === "☆") {
        button.innerHTML = "★";
    } else {
        button.innerHTML = "☆";
    }
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



const API_DOMAIN = 'http://myrefrigerator.store';

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
const getSearchResult = async (formData) => {
    const resultArea = document.querySelector('.recipe-card')
    const titleH3 = resultArea.querySelector('#recipe-title');
    const recipeThumbnail = resultArea.querySelector('#recipe-thumb');
    const ingredientList = resultArea.querySelector('#ingredients-list');
    const recipeStep = resultArea.querySelector('#recipe-step');
    

    const response = await fetch(`${API_DOMAIN}/api/recipe/${getCurrentId()}/`);
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        const recipeData = respJson.data
        titleH3.innerText = recipeData.title;
        recipeThumbnail.src = recipeData.image;
        getLastKeys(recipeData.ingredients).forEach(ingredient => {
            const ingredientLi = document.createElement('li');
            ingredientLi.innerText = `✔️ ${ingredient}`;
            ingredientList.appendChild(ingredientLi);
        });
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