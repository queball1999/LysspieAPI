// login.js

// Function to toggle password visibility
function togglePassword() {
    const passwordField = document.getElementById('password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}

// Function to handle login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error('Login failed');
        }
    })
    .then(data => {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('api_key', data.api_key);
        window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error(error);
        document.getElementById('error-message').textContent = 'Login failed';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const preferredTheme = localStorage.getItem('preferredTheme') || 'light';
    const lightPrimaryColor = localStorage.getItem('light_primary_color') || '#FFFFFF';
    const lightSecondaryColor = localStorage.getItem('light_secondary_color') || '#E5E5E5';
    const lightBackgroundColor = localStorage.getItem('light_background_color') || '#FFC0CB';
    const lightButtonColor = localStorage.getItem('light_button_color') || '#4CAF50';
    const lightTextColor = localStorage.getItem('light_text_color') || '#000000';

    const darkPrimaryColor = localStorage.getItem('dark_primary_color') || '#363636';
    const darkSecondaryColor = localStorage.getItem('dark_secondary_color') || '#505050';
    const darkBackgroundColor = localStorage.getItem('dark_background_color') || '#202020';
    const darkButtonColor = localStorage.getItem('dark_button_color') || '#4CAF50';
    const darkTextColor = localStorage.getItem('dark_text_color') || '#FFFFFF';

    changeTheme(preferredTheme, {
        lightPrimaryColor,
        lightSecondaryColor,
        lightBackgroundColor,
        lightButtonColor,
        lightTextColor,
        darkPrimaryColor,
        darkSecondaryColor,
        darkBackgroundColor,
        darkButtonColor,
        darkTextColor
    });
});

function changeTheme(theme, colors) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.style.setProperty('--background-color', colors.darkBackgroundColor);
        root.style.setProperty('--primary-color', colors.darkPrimaryColor);
        root.style.setProperty('--secondary-color', colors.darkSecondaryColor);
        root.style.setProperty('--button-color', colors.darkButtonColor);
        root.style.setProperty('--text-color', colors.darkTextColor);
        document.body.classList.add('dark-mode');
    } else {
        root.style.setProperty('--background-color', colors.lightBackgroundColor);
        root.style.setProperty('--primary-color', colors.lightPrimaryColor);
        root.style.setProperty('--secondary-color', colors.lightSecondaryColor);
        root.style.setProperty('--button-color', colors.lightButtonColor);
        root.style.setProperty('--text-color', colors.lightTextColor);
        document.body.classList.remove('dark-mode');
    }
}

// Submit login on Enter key press
document.getElementById('username').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        login();
    }
});
document.getElementById('password').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        login();
    }
});
