/**
 * Initialize necessary variables
 */
let intervalId;
let timeoutDuration = parseInt(localStorage.getItem('jwt_expiration')) || 900000; // Default to 15 minutes
let timeoutWarning = 60000; // Set to 1 minute timeout
let activityTimeout;
let lightPrimaryColor, lightSecondaryColor, lightTertiaryColor, lightButtonColor;
let darkPrimaryColor, darkSecondaryColor, darkTertiaryColor, darkButtonColor;

// Initialize socket connection
const socket = io();

/**
 * Handle server-sent events (SSE) to refresh data on receiving an update
 */
socket.on('update', function(data) {
    console.log(data.message);
    fetchData(); // Refresh data on receiving an update
    resetActivityTimeout();
});

/**
 * Check response status and handle unauthorized errors
 * @param {Response} response - The fetch response object
 * @returns {Response} - The fetch response object if no error
 */
function checkAuth(response) {
    console.log(`Auth check: ${response.status}`);
    if (response.status === 401) {
        // Token expired or invalid, redirect to login
        window.location.href = '/login';
    }
    return response;
}

/**
 * Retrieve highlighted users from local storage
 * @returns {Array} - List of highlighted users
 */
function getHighlightedUsers() {
    return JSON.parse(localStorage.getItem('highlightedUsers')) || [];
}

/**
 * Save highlighted users to local storage
 * @param {Array} users - List of highlighted users
 */
function saveHighlightedUsers(users) {
    localStorage.setItem('highlightedUsers', JSON.stringify(users));
}

/**
 * Retrieve queue order from local storage
 * @returns {Array} - List of queue order
 */
function getQueueOrder() {
    return JSON.parse(localStorage.getItem('queueOrder')) || [];
}

/**
 * Save queue order to local storage
 * @param {Array} order - List of queue order
 */
function saveQueueOrder(order) {
    localStorage.setItem('queueOrder', JSON.stringify(order));
}

/**
 * Retrieve selected lives users from local storage
 * @returns {Array} - List of selected lives users
 */
function getSelectedLivesUsers() {
    return JSON.parse(localStorage.getItem('selectedLivesUsers')) || [];
}

/**
 * Save selected lives users to local storage
 * @param {Array} users - List of selected lives users
 */
function saveSelectedLivesUsers(users) {
    localStorage.setItem('selectedLivesUsers', JSON.stringify(users));
}

/**
 * Clear the queue
 */
function clearQueue() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/clear_queue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.text())
    .then(data => {
        console.log('Queue cleared successfully'); // Log message instead of fetching data
        closeClearQueueModal();
    });
}

/**
 * Add drag and drop listeners to the draggable elements
 * @param {string} listId - The ID of the list element
 */
function addDragAndDropListeners(listId) {
    const draggables = document.querySelectorAll(`#${listId} .draggable`);
    const list = document.getElementById(listId);

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            updateOrder(listId);
        });
    });

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });
}

/**
 * Get the element to insert the dragged item after
 * @param {HTMLElement} container - The container element
 * @param {number} y - The y-coordinate of the drag event
 * @returns {HTMLElement} - The element to insert after
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Update the order and save it
 * @param {string} listId - The ID of the list element
 */
function updateOrder(listId) {
    const list = document.getElementById(listId);
    const items = list.querySelectorAll('.draggable');
    const usernames = Array.from(items).map(item => item.dataset.username);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const endpoint = listId === 'queue-list' ? '/api/update_queue_order' : '/api/update_lives_order';

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: usernames })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log('Order updated successfully');
    });
}

/**
 * Spin the queue to select random users
 */
function spinQueue() {
    const spinCount = parseInt(document.getElementById('spin-count').value);
    const queueList = document.getElementById('queue-list');
    const queueItems = queueList.querySelectorAll('.draggable');
    const totalUsers = Array.from(queueItems);

    if (totalUsers.length < spinCount) {
        alert('Not enough users in the queue.');
        return;
    }

    let chosenUsers = [];
    for (let i = 0; i < spinCount; i++) {
        const randomIndex = Math.floor(Math.random() * totalUsers.length);
        const chosenUser = totalUsers.splice(randomIndex, 1)[0];
        chosenUser.classList.add('highlight');
        chosenUser.querySelector('.highlight-checkbox').checked = true;
        chosenUsers.push(chosenUser);
    }

    const highlightedUsers = chosenUsers.map(user => user.dataset.username);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Update highlighted users in the backend
    fetch('/api/update_highlighted_users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ highlighted_users: highlightedUsers })
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        console.log('Spun successfully');
    });

    chosenUsers.forEach(user => queueList.prepend(user));

    const currentOrder = Array.from(queueList.children).map(item => item.dataset.username);

    fetch('/api/update_queue_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: currentOrder })
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        console.log('Queue updated successfully');
    });
}

/**
 * Clear the spin highlight
 */
function clearSpin() {
    const highlightedUsers = document.querySelectorAll('.highlight');
    highlightedUsers.forEach(user => {
        user.classList.remove('highlight');
        user.querySelector('.highlight-checkbox').checked = false;
    });
    saveHighlightedUsers([]);
    saveQueueOrder([]);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Clear highlights in the backend
    fetch('/api/clear_highlighted_users', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        console.log('Spin selection cleared successfully');
    });
}

/**
 * Toggle highlight for a user
 * @param {HTMLElement} checkbox - The checkbox element
 */
function toggleHighlight(checkbox) {
    const listItem = checkbox.parentElement;
    const username = listItem.dataset.username;
    const highlightedUsers = getHighlightedUsers();

    if (checkbox.checked) {
        listItem.classList.add('highlight');
        if (!highlightedUsers.includes(username)) {
            highlightedUsers.push(username);
        }
    } else {
        listItem.classList.remove('highlight');
        const index = highlightedUsers.indexOf(username);
        if (index !== -1) {
            highlightedUsers.splice(index, 1);
        }
    }

    saveHighlightedUsers(highlightedUsers);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/update_highlighted_users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ highlighted_users: highlightedUsers })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log('Highlighted users updated successfully');
    });
}

/**
 * Toggle select lives user
 * @param {HTMLElement} checkbox - The checkbox element
 */
function toggleSelectLivesUser(checkbox) {
    const listItem = checkbox.parentElement;
    const username = listItem.dataset.username;
    const selectedLivesUsers = getSelectedLivesUsers();

    if (checkbox.checked) {
        if (!selectedLivesUsers.includes(username)) {
            selectedLivesUsers.push(username);
        }
    } else {
        const index = selectedLivesUsers.indexOf(username);
        if (index !== -1) {
            selectedLivesUsers.splice(index, 1);
        }
    }

    saveSelectedLivesUsers(selectedLivesUsers);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/update_highlighted_lives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ highlighted_users: selectedLivesUsers })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log('Highlighted users updated successfully');
    });

    toggleBulkButtons();
}

/**
 * Toggle bulk buttons based on the selected lives users
 */
function toggleBulkButtons() {
    const selectedLivesUsers = getSelectedLivesUsers();
    const bulkBanBtn = document.querySelector('.bulk-ban-btn');
    const bulkClearBtn = document.querySelector('.bulk-clear-btn');

    bulkBanBtn.disabled = selectedLivesUsers.length === 0;
    bulkClearBtn.disabled = selectedLivesUsers.length === 0;
}

/**
 * Toggle select all lives users
 * @param {HTMLElement} checkbox - The checkbox element
 */
function toggleSelectAllLives(checkbox) {
    const checkboxes = document.querySelectorAll('#lives-list .highlight-checkbox');
    const selectedLivesUsers = [];

    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const listItem = cb.parentElement;
        const username = listItem.dataset.username;

        if (checkbox.checked) {
            if (!selectedLivesUsers.includes(username)) {
                selectedLivesUsers.push(username);
            }
            listItem.classList.add('highlight');
        } else {
            const index = selectedLivesUsers.indexOf(username);
            if (index !== -1) {
                selectedLivesUsers.splice(index, 1);
            }
            listItem.classList.remove('highlight');
        }
    });

    saveSelectedLivesUsers(selectedLivesUsers);

    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Update highlighted users in the backend
    fetch('/api/update_highlighted_lives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ highlighted_users: selectedLivesUsers })
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        console.log('Highlighted users updated successfully');
    });

    toggleBulkButtons();
}

/**
 * Toggle the view between list and grid
 * @param {string} listId - The ID of the list element
 */
function toggleView(listId) {
    const list = document.getElementById(listId);
    list.classList.toggle('grid-view');
    const button = list.previousElementSibling;
    if (list.classList.contains('grid-view')) {
        button.textContent = 'List';
    } else {
        button.textContent = 'Grid';
    }
}

/**
 * Set the last activity time in local storage
 */
function setLastActivityTime() {
    localStorage.setItem('lastActivityTime', new Date().getTime());
}

/**
 * Get the last activity time from local storage
 * @returns {number} - The timestamp of the last activity
 */
function getLastActivityTime() {
    return parseInt(localStorage.getItem('lastActivityTime')) || new Date().getTime();
}

/**
 * Check for inactivity and log out the user if the timeout has expired
 */
function checkInactivity() {
    const currentTime = new Date().getTime();
    const lastActivityTime = getLastActivityTime();
    const timeElapsed = currentTime - lastActivityTime;

    if (timeElapsed > timeoutDuration) {
        logout();
    } else if (timeElapsed > timeoutDuration - timeoutWarning) {
        openSessionModal();
    }
}

/**
 * Log out the user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('api_key');
    window.location.href = '/login';
}

/**
 * Continue the session by closing the modal and resetting the activity timeout
 */
function continueSession() {
    closeSessionModal();
    setLastActivityTime();
    resetActivityTimeout();
}

/**
 * Reset the activity timeout
 */
function resetActivityTimeout() {
    clearTimeout(activityTimeout);
    setLastActivityTime();
    activityTimeout = setTimeout(() => {
        openSessionModal();
    }, timeoutDuration - timeoutWarning);
}

function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
}

function setAvatar() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
    const username_raw = atob(token.split('.')[1]);
    const username = JSON.parse(username_raw).sub;
    document.getElementById('avatar-text').textContent = username.slice(0, 2).toUpperCase();
}


// Event listeners to reset activity timeout on various user actions
document.addEventListener('mousemove', resetActivityTimeout);
document.addEventListener('keypress', resetActivityTimeout);
document.addEventListener('mousedown', resetActivityTimeout); // for mobile
document.addEventListener('touchstart', resetActivityTimeout); // for mobile
document.addEventListener('scroll', resetActivityTimeout);

/**
 * Handle visibility change event
 */
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkInactivity();
    }
});

// Event listeners for password field behavior
document.getElementById('password').addEventListener('blur', handlePasswordRefill);
document.getElementById('password').addEventListener('focus', clearPassword);

document.addEventListener('DOMContentLoaded', () => {
    const preferredTheme = localStorage.getItem('preferredTheme') || 'light';
    //changeTheme(preferredTheme);
    document.getElementById('theme-select').value = preferredTheme;

    // Initialize avatar and fetch user data only once
    setAvatar();

    // Fetch initial data
    fetchData();

    // Set up activity timeout
    resetActivityTimeout();
    setLastActivityTime();
});