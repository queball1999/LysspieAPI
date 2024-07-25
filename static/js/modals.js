// modals.js

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
    const username_raw = atob(token.split('.')[1]);
    const username = JSON.parse(username_raw).sub;
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

/**
 * Open the remove user modal
 */
function openRemoveUserModal(username) {
    document.getElementById('remove-user-username').value = `${username}`;
    document.getElementById('remove-user-message').textContent = `Are you sure you want to remove ${username} from the queue? This action cannot be undone.`;
    document.getElementById('remove-user-modal').style.display = 'block';
}

/**
 * Close the remove user modal
 */
function closeRemoveUserModal() {
    userToRemove = null;
    document.getElementById('remove-user-modal').style.display = 'none';
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
