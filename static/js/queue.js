// queue.js

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