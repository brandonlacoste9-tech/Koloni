const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Check if the user is logged in
if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
}