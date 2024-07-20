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
    .then(checkAuth) // Check for unauthorized status
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
                <button class="remove-btn" onclick="openRemoveUserModal('${user.username}')">x</button>
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
    .then(checkAuth) // Check for unauthorized status
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

        // Apply the current theme to the newly added items
        const preferredTheme = localStorage.getItem('preferredTheme') || 'light';
        changeTheme(preferredTheme);
    });
}

/**
 * Clear the queue
 */
function clearQueue() {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    if (!token || !apiKey) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/clear_queue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
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
 * Remove a user from the queue
 */
function removeUser() {
    const token = localStorage.getItem('token');
    const user = document.getElementById('remove-user-username').value;

    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/remove_user?username=${user}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.text())
    .then(data => {
        console.log('User removed successfully'); // Log message instead of fetching data
        closeRemoveUserModal();
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
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        console.log(`Adjusted lives for ${username}`); // Log message instead of fetching data
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
    .then(checkAuth)    
    .then(response => response.text())
    .then(data => {
        console.log(`Banned user ${username}`); // Log message instead of fetching data
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
        //fetchData();
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
        //fetchData();
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
        //fetchData();
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
        //fetchData();
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
        //fetchData();
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
    const apiKey = localStorage.getItem('api_key');
    if (!token || !apiKey) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/update_highlighted_lives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
        },
        body: JSON.stringify({ highlighted_users: selectedLivesUsers })
    })
    .then(checkAuth)
    .then(response => response.text())
    .then(data => {
        //fetchData();
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
    if (!token || !apiKey) {
        window.location.href = '/login';
        return;
    }

    // Update highlighted users in the backend
    fetch('/api/update_highlighted_lives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
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
    document.getElementById('about-section').style.display = 'none';
}

/**
 * Show the user management section
 */
function showUserManagement() {
    document.getElementById('general-settings').style.display = 'none';
    document.getElementById('user-management').style.display = 'block';
    document.getElementById('about-section').style.display = 'none';
}

/**
 * Show the about section
 */
function showAbout() {
    document.getElementById('general-settings').style.display = 'none';
    document.getElementById('user-management').style.display = 'none';
    document.getElementById('about-section').style.display = 'block';
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
    fetch('/api/get_api_key', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        document.getElementById('api-key').value = data.api_key;
    });
}

/**
 * Close the profile modal
 */
function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}

/**
 * Clear the password field when focused
 */
function clearPassword() {
    document.getElementById('password').value = '';
}

/**
 * Reset the API key
 */
function resetApiKey() {
    const token = localStorage.getItem('token');

    fetch('/api/reset_api_key', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        document.getElementById('api-key').value = data.api_key;
    });
}

/**
 * Save the profile information
 */
function saveProfile() {
    const displayName = document.getElementById('display-name').value;
    const password = document.getElementById('password').value;
    const apiKey = document.getElementById('api-key').value;

    fetch('/api/update_profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ display_name: displayName, password: password !== '••••••••' ? password : '', api_key: apiKey })
    })
    .then(checkAuth) // Check for unauthorized status
    .then(response => response.json())
    .then(data => {
        closeProfile();
        //fetchData();
        console.log('Profile saved successfully');
    });
}

/**
 * Open the clear queue modal
 */
function openClearQueueModal() {
    document.getElementById('clear-queue-modal').style.display = 'block';
}

/**
 * Close the clear queue modal
 */
function closeClearQueueModal() {
    document.getElementById('clear-queue-modal').style.display = 'none';
}

/**
 * Open the clear lives modal
 */
function openClearLivesModal() {
    document.getElementById('clear-lives-modal').style.display = 'block';
}

/**
 * Close the clear lives modal
 */
function closeClearLivesModal() {
    document.getElementById('clear-lives-modal').style.display = 'none';
}

// Function to open the remove user confirmation modal
function openRemoveUserModal(username) {
    document.getElementById('remove-user-username').value = `${username}`;
    document.getElementById('remove-user-message').textContent = `Are you sure you want to remove ${username} from the queue? This action cannot be undone.`;
    document.getElementById('remove-user-modal').style.display = 'block';
}

// Function to close the remove user confirmation modal
function closeRemoveUserModal() {
    userToRemove = null;
    document.getElementById('remove-user-modal').style.display = 'none';
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
    alert("You are now logged out due to inactivity.");
    window.location.href = '/login';
}

/**
 * Open the session continuation modal
 */
function openSessionModal() {
    closeRemoveUserModal()
    closeClearLivesModal()
    closeClearQueueModal()
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

function changeTheme(theme) {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const githubIcon = document.getElementById('github-icon');

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.header').classList.add('dark-mode');
        document.querySelectorAll('.column').forEach(col => col.classList.add('dark-mode'));
        document.querySelectorAll('.modal-content').forEach(modal => modal.classList.add('dark-mode'));
        document.querySelectorAll('.draggable').forEach(item => item.classList.add('dark-mode'));
        document.querySelectorAll('.header-button').forEach(item => item.classList.add('dark-mode'));
        document.querySelectorAll('.theme-button').forEach(item => item.classList.add('dark-mode'));
        document.querySelectorAll('.toggle-view-btn').forEach(item => item.classList.add('dark-mode'));
        document.querySelectorAll('.settings-menu').forEach(item => item.classList.add('dark-mode'));
        themeIcon.src = '/static/images/sun.svg';
        githubIcon.src = '/static/images/github-light.svg';
    } else {
        body.classList.remove('dark-mode');
        document.querySelector('.header').classList.remove('dark-mode');
        document.querySelectorAll('.column').forEach(col => col.classList.remove('dark-mode'));
        document.querySelectorAll('.modal-content').forEach(modal => modal.classList.remove('dark-mode'));
        document.querySelectorAll('.draggable').forEach(item => item.classList.remove('dark-mode'));
        document.querySelectorAll('.header-button').forEach(item => item.classList.remove('dark-mode'));
        document.querySelectorAll('.theme-button').forEach(item => item.classList.remove('dark-mode'));
        document.querySelectorAll('.toggle-view-btn').forEach(item => item.classList.remove('dark-mode'));
        document.querySelectorAll('.settings-menu').forEach(item => item.classList.remove('dark-mode'));
        themeIcon.src = '/static/images/moon.svg';
        githubIcon.src = '/static/images/github-dark.svg';
    }
    savePreferredTheme(theme)
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        changeTheme('light');
    } else {
        changeTheme('dark');
    }
}

function changePrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    document.body.classList.add('custom-primary');
    document.querySelector('.header').classList.add('custom-primary');
    document.querySelector('.avatar').classList.add('custom-primary');
    document.querySelectorAll('.column').forEach(col => col.classList.add('custom-primary'));
    document.querySelectorAll('.modal-content').forEach(modal => modal.classList.add('custom-primary'));
    document.querySelectorAll('.list .draggable').forEach(item => item.classList.add('custom-primary'));
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

// Call changeTheme on page load to set the initial theme based on stored preference
document.addEventListener('DOMContentLoaded', () => {
    const preferredTheme = localStorage.getItem('preferredTheme') || 'light';
    changeTheme(preferredTheme);
    document.getElementById('theme-select').value = preferredTheme;
});

// Save the preferred theme to localStorage
function savePreferredTheme(theme) {
    localStorage.setItem('preferredTheme', theme);
}

// Update theme selection in the settings modal
document.getElementById('theme-select').addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    changeTheme(selectedTheme);
    savePreferredTheme(selectedTheme);
});

// Initial functions
fetchData();
resetActivityTimeout();
setLastActivityTime();