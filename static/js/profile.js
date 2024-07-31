// profile.js

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
    const token = localStorage.getItem('token');
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
 * Clear the password field when focused
 */
function clearPassword() {
    document.getElementById('password').value = '';
}

function handlePasswordRefill() {
    const passwordField = document.getElementById('password');
    if (passwordField.value === '') {
        passwordField.value = '********';
    }
}
