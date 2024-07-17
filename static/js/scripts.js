/**
 * Initialize necessary variables
 */
let intervalId;
let timeoutDuration = parseInt(localStorage.getItem('jwt_expiration')) || 900000; // Default to 15 minutes
let timeoutWarning = 60000; // Set to 1 minute timeout
let activityTimeout;

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
 * Fetch data from the server and update the UI
 */
function fetchData() {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    if (!token || !apiKey) {
        window.location.href = '/login';
        return;
    }

    // Fetch queue order
    fetch('/api/get_queue_order', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
        }
    })
    .then(response => response.json())
    .then(data => {
        const queueOrder = data.queue_order;
        const queueList = document.getElementById('queue-list');
        queueList.innerHTML = '';

        queueOrder.forEach(user => {
            const li = document.createElement('li');
            li.classList.add('draggable');
            li.setAttribute('draggable', true);
            li.dataset.username = user.username;
            li.innerHTML = `
                <input type="checkbox" class="highlight-checkbox" onchange="toggleHighlight(this)" ${user.highlighted ? 'checked' : ''}>
                <span class="username">${user.username}</span>
                <button class="remove-btn" onclick="removeUser('${user.username}')">x</button>
            `;
            if (user.highlighted) {
                li.classList.add('highlight');
            }
            queueList.appendChild(li);
        });
        addDragAndDropListeners('queue-list');
    });

    // Fetch lives order
    fetch('/api/get_lives_order', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
        }
    })
    .then(response => response.json())
    .then(data => {
        const livesOrder = data.lives_order;
        const livesList = document.getElementById('lives-list');
        livesList.innerHTML = '';

        livesOrder.forEach(user => {
            const li = document.createElement('li');
            li.classList.add('draggable');
            li.setAttribute('draggable', true);
            li.dataset.username = user.username;
            li.innerHTML = `
                <input type="checkbox" class="highlight-checkbox" onchange="toggleSelectLivesUser(this)" ${user.highlighted ? 'checked' : ''}>
                <span class="username">${user.username} - ${user.lives} lives left</span>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', 1)">+1</button>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', -1)">-1</button>
            `;
            if (user.highlighted) {
                li.classList.add('highlight');
            }
            livesList.appendChild(li);
        });
        addDragAndDropListeners('lives-list');
    });
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
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

/**
 * Remove a user from the queue
 * @param {string} username - Username of the user to remove
 */
function removeUser(username) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/remove_user?username=${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

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
        .then(response => response.text())
        .then(data => {
            fetchData();
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
        .then(response => response.text())
        .then(data => {
            fetchData();
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

    fetch('/api/bulk_clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usernames: usernames })
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

/**
 * Ban a user
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
        .then(response => response.text())
        .then(data => {
            fetchData();
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
    }).then(response => response.text())
        .then(data => {
            fetchData();
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
    .then(response => response.json())
    .then(data => {
        fetchData();
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
    }).then(response => response.json())
        .then(data => {
            fetchData();
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
    }).then(response => response.json())
        .then(data => {
            fetchData();
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
    }).then(response => response.text())
        .then(data => {
            fetchData();
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
    }).then(response => response.text())
        .then(data => {
            fetchData();
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
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        toggleSelectLivesUser(cb);
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
 * Open the settings modal
 */
function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

/**
 * Close the settings modal
 */
function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

/**
 * Show the general settings section
 */
function showGeneralSettings() {
    document.getElementById('general-settings').style.display = 'block';
    document.getElementById('user-management').style.display = 'none';
}

/**
 * Show the user management section
 */
function showUserManagement() {
    document.getElementById('general-settings').style.display = 'none';
    document.getElementById('user-management').style.display = 'block';
}

/**
 * Open the profile modal
 */
function openProfile() {
    document.getElementById('profile-modal').style.display = 'block';
    const token = localStorage.getItem('token');
    const email = atob(token.split('.')[1]);
    const username = JSON.parse(email).sub;
    document.getElementById('display-name').value = username;
    // Fetch and set API key from server
}

/**
 * Close the profile modal
 */
function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}

/**
 * Reset the API key
 */
function resetApiKey() {
    // API call to reset the API key and update the input field
}

/**
 * Save the profile information
 */
function saveProfile() {
    // API call to save the updated profile information
}

/**
 * Open the session continuation modal
 */
function openSessionModal() {
    document.getElementById('session-modal').style.display = 'block';

    // Start another timer to log out the user if no action is taken
    const logoutTimeout = setTimeout(() => {
        if (document.getElementById('session-modal').style.display === 'block') {
            logout();
        }
    }, timeoutWarning); // Remaining time to log out
}

/**
 * Close the session continuation modal
 */
function closeSessionModal() {
    document.getElementById('session-modal').style.display = 'none';
}

/**
 * Continue the session by closing the modal and resetting the activity timeout
 */
function continueSession() {
    closeSessionModal();
    resetActivityTimeout();
}

/**
 * Reset the activity timeout
 */
function resetActivityTimeout() {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        openSessionModal();
    }, timeoutDuration - timeoutWarning);
}

// Event listeners to reset activity timeout on various user actions
document.addEventListener('mousemove', resetActivityTimeout);
document.addEventListener('keypress', resetActivityTimeout);
document.addEventListener('mousedown', resetActivityTimeout); // for mobile
document.addEventListener('touchstart', resetActivityTimeout); // for mobile
document.addEventListener('scroll', resetActivityTimeout);

// Initial data fetch and activity timeout reset
fetchData();
resetActivityTimeout();
