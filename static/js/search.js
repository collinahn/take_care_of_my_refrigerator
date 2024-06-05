function activateTab(evt, tabName) {
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
}
