// Load the navbar.html file into the navbar div
window.onload = function() {
    fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
    });
};
