function activateTab(evt, tabName) {
    // Declare all variables
    var i, tablinks, contentBoxes;

    // Get all elements with class="tab-link" and remove the class "active"
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Hide all content boxes
    contentBoxes = document.getElementsByClassName("content-box");
    for (i = 0; i < contentBoxes.length; i++) {
        contentBoxes[i].style.display = "none";
    }

    // Add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";

    // Show the current tab
    if (tabName === "search") {
        document.getElementById("search-interaction").style.display = "block";
        if (document.querySelector('.recipe-list')?.children?.length !== 0) {
            document.getElementById("search").style.display = "none";
        } else {
            document.getElementById("search").style.display = "block";
        }
    } else {
        document.getElementById("search-interaction").style.display = "none";
    }

    // Only show the content box if it is the search tab
    if (tabName === "search") {
        document.getElementById(tabName).style.display = "block";
    }
}
