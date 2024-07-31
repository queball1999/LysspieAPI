// fetchData.js

// Add lazy loading animation
function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        document.body.removeChild(spinner);
    }
}

// Add refresh button animation
function startRefreshAnimation() {
    const refreshButton = document.getElementById('refresh');
    refreshButton.classList.add('loading');
}

function stopRefreshAnimation() {
    const refreshButton = document.getElementById('refresh');
    refreshButton.classList.remove('loading');
}

/**
 * Fetch data from the server and update the UI
 */
function fetchData() {
    showLoadingSpinner();
    startRefreshAnimation();
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Fetch queue order
    fetch('/api/get_queue_order', {
        headers: { 
            'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
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
    });

    // Apply the current theme to the newly added items
    const preferredTheme = localStorage.getItem('preferredTheme') || 'light';
    changeTheme(preferredTheme);
    hideLoadingSpinner();
    stopRefreshAnimation();
}
