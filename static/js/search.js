function activateTab(evt, tabName) {
    // Declare all variables
    var i, tablinks, contents;

    // Get all elements with class="tab-link" and remove the class "active"
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Hide all content boxes
    contents = document.getElementsByClassName('content-box');
    for (i = 0; i < contents.length; i++) {
        contents[i].style.display = 'none';
    }

    // Add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";

    // Display the content box associated with the tab
    if (tabName === 'search') {
        document.querySelector('.content-box').style.display = 'block';
    }
}