// lives.js

/**
 * Adjust the number of lives for a user
 * @param {string} username - Username of the user
 * @param {number} amount - Amount to adjust the lives by
 */
function adjustLives(username, amount) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/adjust_lives?username=${username}&amount=${amount}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log(`Adjusted lives for ${username}`); // Log message instead of fetching data
    });
}

/**
 * Ban a single user
 * @param {string} username - Username of the user to ban
 */
function banUser(username) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/ban_user?username=${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(checkAuth)    
    .then(response => response.text())
    .then(data => {
        console.log(`Banned user ${username}`); // Log message instead of fetching data
    });
}

/**
 * Bulk ban users
 */
function bulkBanUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const checkboxes = document.querySelectorAll('#lives-list .highlight-checkbox:checked');
    const usernames = Array.from(checkboxes).map(checkbox => checkbox.parentElement.dataset.username);

    fetch('/api/bulk_ban', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usernames: usernames })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log('Bulk banned users successfully'); // Log message instead of fetching data
    });
}

/**
 * Bulk clear lives for users
 */
function bulkClearLives() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const checkboxes = document.querySelectorAll('#lives-list .highlight-checkbox:checked');
    const usernames = Array.from(checkboxes).map(checkbox => checkbox.parentElement.dataset.username);

    fetch('/api/clear_lives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usernames: usernames })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log('Bulk cleared lives successfully'); // Log message instead of fetching data
        closeClearLivesModal();
    });
}
