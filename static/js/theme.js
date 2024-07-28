// theme.js

/* Theme Handling */
function updateLightPrimaryColor(color) {
    document.documentElement.style.setProperty('--light-primary-color', color);
    lightPrimaryColor = color;
}

function updateLightSecondaryColor(color) {
    document.documentElement.style.setProperty('--light-secondary-color', color);
    lightSecondaryColor = color;
}

function updateLightBackgroundColor(color) {
    document.documentElement.style.setProperty('--light-background-color', color);
    lightTertiaryColor = color;
}

function updateLightButtonColor(color) {
    document.documentElement.style.setProperty('--light-button-color', color);
    lightButtonColor = color;
}

function updateDarkPrimaryColor(color) {
    document.documentElement.style.setProperty('--dark-primary-color', color);
    darkPrimaryColor = color;
}

function updateDarkSecondaryColor(color) {
    document.documentElement.style.setProperty('--dark-secondary-color', color);
    darkSecondaryColor = color;
}

function updateDarkBackgroundColor(color) {
    document.documentElement.style.setProperty('--dark-background-color', color);
    darkTertiaryColor = color;
}

function updateDarkButtonColor(color) {
    document.documentElement.style.setProperty('--dark-button-color', color);
    darkButtonColor = color;
}

function saveColorSettings() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const colors = {
        light_primary_color: lightPrimaryColor,
        light_secondary_color: lightSecondaryColor,
        light_tertiary_color: lightTertiaryColor,
        light_button_color: lightButtonColor,
        dark_primary_color: darkPrimaryColor,
        dark_secondary_color: darkSecondaryColor,
        dark_tertiary_color: darkTertiaryColor,
        dark_button_color: darkButtonColor
    };

    fetch('/api/update_profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(colors)
    })
    .then(response => response.json())
    .then(data => {
        console.log(colors);
        console.log('Color settings saved successfully');
    });
}

function changeTheme(theme) {
    document.body.className = theme + '-mode';
    localStorage.setItem('preferredTheme', theme);
    loadThemeColors(theme);
}

function loadThemeColors(theme) {
    const token = localStorage.getItem('token');
    const themeIcon = document.getElementById('theme-icon');
    const githubIcon = document.getElementById('github-icon');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    fetch('/api/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (theme === 'light') {
            if (data.light_background_color) {
                document.documentElement.style.setProperty('--light-background-color', data.light_background_color);
                document.getElementById('light-background-color').value = data.light_background_color;
                document.getElementById('dark-background-color').value = data.dark_background_color;
            }
            if (data.light_primary_color) {
                document.documentElement.style.setProperty('--light-primary-color', data.light_primary_color);
                document.getElementById('light-primary-color').value = data.light_primary_color;
                document.getElementById('dark-primary-color').value = data.dark_primary_color;
            }
            if (data.light_secondary_color) {
                document.documentElement.style.setProperty('--light-secondary-color', data.light_secondary_color);
                document.getElementById('light-secondary-color').value = data.light_secondary_color;
                document.getElementById('dark-secondary-color').value = data.dark_secondary_color;
            }
            if (data.light_button_color) {
                document.documentElement.style.setProperty('--light-button-color', data.light_button_color);
                document.getElementById('light-button-color').value = data.light_button_color;
                document.getElementById('dark-button-color').value = data.dark_button_color;
            }
            if (data.light_text_color) {
                document.documentElement.style.setProperty('--light-text-color', data.light_text_color);
                document.getElementById('light-text-color').value = data.light_text_color;
                document.getElementById('dark-text-color').value = data.dark_text_color;
            }
            themeIcon.src = '/static/images/moon.svg';
            githubIcon.src = '/static/images/github-dark.svg';
        } else {
            if (data.dark_background_color) {
                document.documentElement.style.setProperty('--dark-background-color', data.dark_background_color);
                document.getElementById('light-background-color').value = data.light_background_color;
                document.getElementById('dark-background-color').value = data.dark_background_color;
            }
            if (data.dark_primary_color) {
                document.documentElement.style.setProperty('--dark-primary-color', data.dark_primary_color);
                document.getElementById('light-primary-color').value = data.light_primary_color;
                document.getElementById('dark-primary-color').value = data.dark_primary_color;
            }
            if (data.dark_secondary_color) {
                document.documentElement.style.setProperty('--dark-secondary-color', data.dark_secondary_color);
                document.getElementById('light-secondary-color').value = data.light_secondary_color;
                document.getElementById('dark-secondary-color').value = data.dark_secondary_color;
            }
            if (data.dark_button_color) {
                document.documentElement.style.setProperty('--dark-button-color', data.dark_button_color);
                document.getElementById('light-button-color').value = data.light_button_color;
                document.getElementById('dark-button-color').value = data.dark_button_color;
            }
            if (data.dark_text_color) {
                document.documentElement.style.setProperty('--dark-text-color', data.dark_text_color);
                document.getElementById('light-text-color').value = data.light_text_color;
                document.getElementById('dark-text-color').value = data.dark_text_color;
            }
            themeIcon.src = '/static/images/sun.svg';
            githubIcon.src = '/static/images/github-light.svg';
        }
        savePreferredTheme(theme)
    });
}

/* Function to toggle theme */
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        changeTheme('light');
    } else {
        changeTheme('dark');
    }
}

/* Save the preferred theme to localStorage */
function savePreferredTheme(theme) {
    localStorage.setItem('preferredTheme', theme);
}