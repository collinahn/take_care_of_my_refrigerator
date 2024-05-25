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
