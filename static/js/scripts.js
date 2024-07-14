let refreshInterval = 5000; // Default to 5 seconds
let intervalId;
// Initialize socket connection
const socket = io();

socket.on('update', function(data) {
    console.log(data.message);
    fetchData(); // Refresh data on receiving an update
});

function getHighlightedUsers() {
    return JSON.parse(localStorage.getItem('highlightedUsers')) || [];
}

function saveHighlightedUsers(users) {
    localStorage.setItem('highlightedUsers', JSON.stringify(users));
}

function getQueueOrder() {
    return JSON.parse(localStorage.getItem('queueOrder')) || [];
}

function saveQueueOrder(order) {
    localStorage.setItem('queueOrder', JSON.stringify(order));
}

function getSelectedLivesUsers() {
    return JSON.parse(localStorage.getItem('selectedLivesUsers')) || [];
}

function saveSelectedLivesUsers(users) {
    localStorage.setItem('selectedLivesUsers', JSON.stringify(users));
}

function fetchData() {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    if (!token || !apiKey) {
        window.location.href = '/login';
        return;
    }

    fetch('/queue', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
        }
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/login';
        }
        return response.json();
    })
    .then(data => {
        const highlightedUsers = getHighlightedUsers();
        const queueOrder = getQueueOrder();
        const queueList = document.getElementById('queue-list');
        queueList.innerHTML = '';

        const orderedQueue = data.queue.sort((a, b) => {
            const indexA = queueOrder.indexOf(a.username);
            const indexB = queueOrder.indexOf(b.username);
            return (indexA === -1 ? queueOrder.length : indexA) - (indexB === -1 ? queueOrder.length : indexB);
        });

        orderedQueue.forEach(user => {
            const li = document.createElement('li');
            li.classList.add('draggable');
            li.setAttribute('draggable', true);
            li.dataset.username = user.username;
            li.innerHTML = `
                <input type="checkbox" class="highlight-checkbox" onchange="toggleHighlight(this)" ${highlightedUsers.includes(user.username) ? 'checked' : ''}>
                <span class="username">${user.username}</span>
                <button class="remove-btn" onclick="removeUser('${user.username}')">x</button>
            `;
            if (highlightedUsers.includes(user.username)) {
                li.classList.add('highlight');
            }
            queueList.appendChild(li);
        });
        addDragAndDropListeners();
    });

    fetch('/api/lives', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': apiKey
        }
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/login';
        }
        return response.json();
    })
    .then(data => {
        const livesList = document.getElementById('lives-list');
        const selectedLivesUsers = getSelectedLivesUsers();
        livesList.innerHTML = '';
        data.lives.forEach(user => {
            const li = document.createElement('li');
            li.classList.add('draggable');
            li.setAttribute('draggable', true);
            li.dataset.username = user.username;
            li.innerHTML = `
                <input type="checkbox" class="highlight-checkbox" onchange="toggleSelectLivesUser(this)" ${selectedLivesUsers.includes(user.username) ? 'checked' : ''}>
                <span class="username">${user.username} - ${user.lives} lives left</span>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', 1)">+1</button>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', -1)">-1</button>
            `;
            livesList.appendChild(li);
        });
        toggleBulkButtons();
    });
}

function setRefreshInterval() {
    const intervalSelect = document.getElementById('interval');
    refreshInterval = parseInt(intervalSelect.value, 10);
    clearInterval(intervalId);
    //intervalId = setInterval(fetchData, refreshInterval);
}

function cleanQueue() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/clean_queue', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

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

function addDragAndDropListeners() {
    const draggables = document.querySelectorAll('.draggable');
    const queueList = document.getElementById('queue-list');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            updateQueueOrder();
        });
    });

    queueList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(queueList, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            queueList.appendChild(dragging);
        } else {
            queueList.insertBefore(dragging, afterElement);
        }
    });
}

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

function updateQueueOrder() {
    const queueList = document.getElementById('queue-list');
    const queueItems = queueList.querySelectorAll('.draggable');
    const usernames = Array.from(queueItems).map(item => item.dataset.username);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/update_queue_order', {
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

    saveQueueOrder(usernames);
}

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

    const highlightedUsers = getHighlightedUsers();
    const newHighlightedUsers = chosenUsers.map(user => user.dataset.username);
    saveHighlightedUsers([...new Set([...highlightedUsers, ...newHighlightedUsers])]);

    chosenUsers.forEach(user => queueList.prepend(user));

    const currentOrder = Array.from(queueList.children).map(item => item.dataset.username);
    saveQueueOrder(currentOrder);
}

function clearSpin() {
    const highlightedUsers = document.querySelectorAll('.highlight');
    highlightedUsers.forEach(user => {
        user.classList.remove('highlight');
        user.querySelector('.highlight-checkbox').checked = false;
    });
    saveHighlightedUsers([]);
    saveQueueOrder([]);
}

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
}

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
    toggleBulkButtons();
}

function toggleBulkButtons() {
    const selectedLivesUsers = getSelectedLivesUsers();
    const bulkBanBtn = document.querySelector('.bulk-ban-btn');
    const bulkClearBtn = document.querySelector('.bulk-clear-btn');

    bulkBanBtn.disabled = selectedLivesUsers.length === 0;
    bulkClearBtn.disabled = selectedLivesUsers.length === 0;
}

function toggleSelectAllLives(checkbox) {
    const checkboxes = document.querySelectorAll('#lives-list .highlight-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        toggleSelectLivesUser(cb);
    });
    toggleBulkButtons();
}

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

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function showGeneralSettings() {
    document.getElementById('general-settings').style.display = 'block';
    document.getElementById('user-management').style.display = 'none';
}

function showUserManagement() {
    document.getElementById('general-settings').style.display = 'none';
    document.getElementById('user-management').style.display = 'block';
}

function openProfile() {
    document.getElementById('profile-modal').style.display = 'block';
    const token = localStorage.getItem('token');
    const email = atob(token.split('.')[1]);
    const username = JSON.parse(email).sub;
    document.getElementById('display-name').value = username;
    // Fetch and set API key from server
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}

function resetApiKey() {
    // API call to reset the API key and update the input field
}

function saveProfile() {
    // API call to save the updated profile information
}

fetchData();
//intervalId = setInterval(fetchData, refreshInterval);