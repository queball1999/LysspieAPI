let refreshInterval = 5000; // Default to 5 seconds
let intervalId;

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
            const queueList = document.getElementById('queue-list');
            queueList.innerHTML = '';
            data.queue.forEach(user => {
                const li = document.createElement('li');
                li.classList.add('draggable');
                li.setAttribute('draggable', true);
                li.dataset.username = user.username;
                li.innerHTML = `
                <span>${user.username}</span>
                <button class="remove-btn" onclick="removeUser('${user.username}')">x</button>
            `;
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
}

// Fetch data initially and set up auto-refresh
fetchData();
intervalId = setInterval(fetchData, refreshInterval);
