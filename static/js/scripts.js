let refreshInterval = 5000; // Default to 5 seconds
let intervalId;

// Function to get highlighted users from localStorage
function getHighlightedUsers() {
    return JSON.parse(localStorage.getItem('highlightedUsers')) || [];
}

// Function to save highlighted users to localStorage
function saveHighlightedUsers(users) {
    localStorage.setItem('highlightedUsers', JSON.stringify(users));
}

// Function to get the current queue order from localStorage
function getQueueOrder() {
    return JSON.parse(localStorage.getItem('queueOrder')) || [];
}

// Function to save the current queue order to localStorage
function saveQueueOrder(order) {
    localStorage.setItem('queueOrder', JSON.stringify(order));
}

function fetchData() {
    const token = localStorage.getItem('token');
    console.log(`Using JWT Token: ${token}`);  // Debug print
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/queue', {
        headers: {
            'Authorization': `Bearer ${token}`
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

            // Reorder the queue data based on saved order
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
                <span>${user.username}</span>
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
            'Authorization': `Bearer ${token}`
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
            livesList.innerHTML = '';
            data.lives.forEach(user => {
                const li = document.createElement('li');
                li.innerHTML = `
                <span>${user.username} - ${user.lives} lives left</span>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', 1)">+1</button>
                <button class="adjust-lives" onclick="adjustLives('${user.username}', -1)">-1</button>
                <button class="ban-btn" onclick="banUser('${user.username}')">Ban</button>
            `;
                livesList.appendChild(li);
            });
        });
}

function setRefreshInterval() {
    const intervalSelect = document.getElementById('interval');
    refreshInterval = parseInt(intervalSelect.value, 10);
    clearInterval(intervalId);
    intervalId = setInterval(fetchData, refreshInterval);
}

function cleanQueue() {
    const token = localStorage.getItem('token');
    console.log(`Using JWT Token in cleanQueue: ${token}`);  // Debug print
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/clean_queue', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

function removeUser(username) {
    const token = localStorage.getItem('token');
    console.log(`Using JWT Token in removeUser: ${token}`);  // Debug print
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/remove_user?username=${username}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

function adjustLives(username, amount) {
    const token = localStorage.getItem('token');
    console.log(`Using JWT Token in adjustLives: ${token}`);  // Debug print
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/adjust_lives?username=${username}&amount=${amount}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.text())
        .then(data => {
            fetchData();
        });
}

function banUser(username) {
    const token = localStorage.getItem('token');
    console.log(`Using JWT Token in banUser: ${token}`);  // Debug print
    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch(`/api/ban_user?username=${username}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
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
    console.log(`Using JWT Token in updateQueueOrder: ${token}`);  // Debug print
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

    // Save the current order to localStorage
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

    // Move chosen users to the top
    chosenUsers.forEach(user => queueList.prepend(user));

    // Update the order in localStorage
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

// Fetch data initially and set up auto-refresh
fetchData();
intervalId = setInterval(fetchData, refreshInterval);
