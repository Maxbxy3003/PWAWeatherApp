const apiKey = "22a919f748e666a6909b49624c3772ea";
 
let currentScreen = 'home-screen';
let currentActivityType = 'random';
let originalWeatherCategory = null;

// Main control of the program
document.addEventListener('DOMContentLoaded', function() {
    checkRegistration();
    setupNavigation();
    setupWeatherFunctions();
    setupActivityButtons();
    updateActivityButtonStates();
    setupLocationToggle();
});

function checkRegistration() {
    const userData = localStorage.getItem('weatherWiseUser');
    if (userData) {
        showScreen('home-screen');
        personalizeWelcome(JSON.parse(userData));
    } else {
        showScreen('registration-screen');
        document.getElementById('register-btn').addEventListener('click', registerUser);
    }
}

function personalizeWelcome(user) {
    // Update title accordinly
    const welcomeTitle = document.querySelector('#home-screen .welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${user.name}, ${user.age}!`;
    }
}

function registerUser() {
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();

    // Must have both name and an age
    if (!name || !age) {
        alert('Please enter both name and age');
        return;
    }

    // Check for invalid age
    if (isNaN(age) || age < 1 || age > 120) {
        alert('Please enter a valid age (1-120)');
        return;
    }

    const userData = {
        name: name,
        age: parseInt(age)
    };

    // Stores data locally
    localStorage.setItem('weatherWiseUser', JSON.stringify(userData));

    showScreen('home-screen');
    personalizeWelcome(userData);

}


function setupNavigation() {
    document.querySelectorAll('.go-home').forEach(button => {
        button.addEventListener('click', function() {
            showScreen('home-screen')
        });
    });

    document.querySelectorAll('.go-add').forEach(button => {
        button.addEventListener('click', function() {
            showScreen('add-screen')
        });
    });

    document.querySelectorAll('.go-activities').forEach(button => {
        button.addEventListener('click', function() {
            showScreen('activities-screen')
            loadSavedActivities();
        })
    })
}

function showScreen(screenName) {
    // const to ensure local variable
    const screens = ['home-screen', 'add-screen', 'activities-screen', 'registration-screen'];

    // Hide them initially
    screens.forEach(screen => {
        const screenElement = document.getElementById(screen);
        if (screenElement) {
            screenElement.style.display = 'none';
        }
    });

    // Show the screen needed
    const showedScreen = document.getElementById(screenName);
    if (showedScreen) {
        showedScreen.style.display = 'block'
        currentScreen = screenName;
    }

}

function setupWeatherFunctions() {
    document.getElementById('get-weather-by-city').addEventListener('click', getWeatherByCity);
    document.getElementById('get-weather-by-GPS').addEventListener('click', getWeatherByGPS);
}

function setupActivityButtons() {
    //Buttons for home screen
    
    document.getElementById('favourite-activities-btn').addEventListener('click', function() {
        currentActivityType = 'favourite';
        updateActivityButtonStates();
    });

    document.getElementById('random-activities-btn').addEventListener('click', function() {
        currentActivityType = 'random';
        updateActivityButtonStates();
    });

    document.getElementById('generate-activities-btn').addEventListener('click', generateRandomActivity);

    document.getElementById('save-custom-activity').addEventListener('click', saveCustomActivity);
}


function updateActivityButtonStates() {
    const favBtn = document.getElementById('favourite-activities-btn');
    const randomBtn = document.getElementById('random-activities-btn');
    
    // Reset both buttons
    favBtn.classList.remove('active');
    randomBtn.classList.remove('active');
    
    // Highlight active button
    if (currentActivityType === 'favourite') {
        favBtn.classList.add('active');
    } else {
        randomBtn.classList.add('active');
    }
}

async function generateRandomActivity() {

    const weatherDisplay = document.getElementById("weather").textContent.toLowerCase();

    if (isFreshWeatherData(weatherDisplay)) {
        originalWeatherCategory = getWeatherCategoryFromText(weatherDisplay);
    } else if (!originalWeatherCategory) {
        alert("Please get weather data first using 'Get Weather' or 'Use My Location'");
        return;
    }

    const weatherCategory = originalWeatherCategory;

    try {
        if (currentActivityType === 'favourite') {
            // Use user's custom activities
            const savedActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');
            
            if (savedActivities.length === 0) {
                alert("No activities added yet. Let's add some first");
                showScreen('add-screen');
                return;
            }

            const weatherAppropriateActivities = savedActivities.filter(activity => {
                return activity.weatherTypes.includes(weatherCategory) || 
                activity.weatherTypes.includes('general') ||
                !activity.weatherTypes || 
                activity.weatherTypes.length === 0;
            });

            if (weatherAppropriateActivities.length === 0) {
                alert(`No activities saved for ${weatherCategory} weather yet. Let's add some first`);
                showScreen('add-screen');
                return;
            }
            
            const randomIndex = Math.floor(Math.random() * weatherAppropriateActivities.length);
            const activity = weatherAppropriateActivities[randomIndex];
            
            document.getElementById("weather").innerText = 
                `Your Activity for ${weatherCategory} weather: ${activity.activity}\n` +
                `Added: ${activity.date}`;
                
        } else {
            const activity = getLocalActivityByWeather(weatherCategory);
            
            
            document.getElementById("weather").innerText = 
                `Activity for ${weatherCategory} weather: ${activity.name}\n` +
                `Type: ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}\n` +
                `Participants: ${activity.participants}\n` +
                `Price: ${activity.price}`;
        }
            
    } catch (error) {
        document.getElementById("weather").innerText = "Failed to get activity. Check connection.";
    }
}


function isFreshWeatherData(text) {
    return text.includes('temperature') &&
    text.includes('°c');
}


function getWeatherCategoryFromText(weatherText) {
    const weatherLower = weatherText.toLowerCase();

    if (weatherLower.includes('rain') || weatherLower.includes('drizzle')) {
        return 'rainy';
    }
    if (weatherLower.includes('snow') || weatherLower.includes('freezing')) {
        return 'snowy';
    }
    if (weatherLower.includes('cold')) {
        return 'cold';
    }
    if (weatherLower.includes('wind')) {
        return 'windy';
    }
    if (weatherLower.includes('cloud') || weatherLower.includes('overcast') || weatherLower.includes('fog')) {
        return 'cloudy';
    }
    if (weatherLower.includes('sun') || weatherLower.includes('clear') || weatherLower.includes('warm')) {
        return 'sunny';
    }
    
    return 'general';
}


function getLocalActivityByWeather(weatherCategory) {
    const activityDatabase = {
        rainy: [
            { name: "Read a book with hot chocolate", type: "relaxation", participants: 1, price: "Free" },
            { name: "Try a new recipe in the kitchen", type: "cooking", participants: 1, price: "Low cost" },
            { name: "Organize your photo collection", type: "busywork", participants: 1, price: "Free" },
            { name: "Learn something new online", type: "education", participants: 1, price: "Free" },
            { name: "Have a movie marathon", type: "recreational", participants: 1, price: "Low cost" },
            { name: "Do a jigsaw puzzle", type: "recreational", participants: 1, price: "Free" },
            { name: "Write in a journal", type: "relaxation", participants: 1, price: "Free" },
            { name: "Listen to a podcast", type: "education", participants: 1, price: "Free" }
        ],
        sunny: [
            { name: "Go for a walk in the park", type: "recreational", participants: 1, price: "Free" },
            { name: "Visit a local museum", type: "education", participants: 1, price: "Paid" },
            { name: "Have a picnic outdoors", type: "social", participants: 2, price: "Low cost" },
            { name: "Try outdoor photography", type: "recreational", participants: 1, price: "Free" },
            { name: "Explore a new neighborhood", type: "social", participants: 1, price: "Free" },
            { name: "Go cycling", type: "recreational", participants: 1, price: "Free" },
            { name: "Visit a botanical garden", type: "recreational", participants: 1, price: "Paid" },
            { name: "Play frisbee in the park", type: "recreational", participants: 2, price: "Free" }
        ],
        cloudy: [
            { name: "Visit a coffee shop", type: "social", participants: 1, price: "Low cost" },
            { name: "Go window shopping", type: "recreational", participants: 1, price: "Free" },
            { name: "Try a new board game", type: "social", participants: 2, price: "Low cost" },
            { name: "Call a friend you haven't spoken to", type: "social", participants: 2, price: "Free" },
            { name: "Visit an indoor market", type: "recreational", participants: 1, price: "Free" },
            { name: "Go to a library", type: "education", participants: 1, price: "Free" },
            { name: "Visit an art gallery", type: "education", participants: 1, price: "Free" },
            { name: "Try indoor mini golf", type: "recreational", participants: 1, price: "Paid" }
        ],
        snowy: [
            { name: "Build a snowman", type: "recreational", participants: 1, price: "Free" },
            { name: "Drink hot cocoa by the window", type: "relaxation", participants: 1, price: "Low cost" },
            { name: "Bake cookies or bread", type: "cooking", participants: 1, price: "Low cost" },
            { name: "Organize your closet", type: "busywork", participants: 1, price: "Free" },
            { name: "Start a journal", type: "relaxation", participants: 1, price: "Free" },
            { name: "Watch winter sports", type: "recreational", participants: 1, price: "Free" },
            { name: "Do indoor exercises", type: "recreational", participants: 1, price: "Free" },
            { name: "Make homemade soup", type: "cooking", participants: 1, price: "Low cost" }
        ],
        windy: [
            { name: "Fly a kite", type: "recreational", participants: 1, price: "Low cost" },
            { name: "Visit an indoor botanical garden", type: "education", participants: 1, price: "Paid" },
            { name: "Go to a library", type: "education", participants: 1, price: "Free" },
            { name: "Try indoor rock climbing", type: "recreational", participants: 1, price: "Paid" },
            { name: "Visit an aquarium", type: "education", participants: 1, price: "Paid" },
            { name: "Go to a movie theater", type: "recreational", participants: 1, price: "Paid" },
            { name: "Visit a museum", type: "education", participants: 1, price: "Paid" },
            { name: "Go bowling", type: "recreational", participants: 1, price: "Paid" }
        ],
        cold: [
            { name: "Make soup from scratch", type: "cooking", participants: 1, price: "Low cost" },
            { name: "Drink warm tea and read", type: "relaxation", participants: 1, price: "Free" },
            { name: "Do yoga indoors", type: "recreational", participants: 1, price: "Free" },
            { name: "Organize your digital files", type: "busywork", participants: 1, price: "Free" },
            { name: "Plan your spring garden", type: "recreational", participants: 1, price: "Free" },
            { name: "Learn to knit or crochet", type: "education", participants: 1, price: "Low cost" },
            { name: "Watch documentary series", type: "education", participants: 1, price: "Free" },
            { name: "Create a vision board", type: "recreational", participants: 1, price: "Low cost" }
        ],
        general: [
            { name: "Learn a magic trick", type: "education", participants: 1, price: "Free" },
            { name: "Write a short story", type: "recreational", participants: 1, price: "Free" },
            { name: "Try meditation", type: "relaxation", participants: 1, price: "Free" },
            { name: "Clean and reorganize a room", type: "busywork", participants: 1, price: "Free" },
            { name: "Plan your next vacation", type: "recreational", participants: 1, price: "Free" },
            { name: "Listen to a podcast", type: "education", participants: 1, price: "Free" },
            { name: "Learn a new language", type: "education", participants: 1, price: "Free" },
            { name: "Call a family member", type: "social", participants: 2, price: "Free" }
        ]
    };

    const activities = activityDatabase[weatherCategory] || activityDatabase.general;
    const randomIndex = Math.floor(Math.random() * activities.length);
    return activities[randomIndex];
}

function saveCustomActivity() {
    const activityInput = document.getElementById('custom-activity-input');
    const activity = activityInput.value.trim();
    
    if (!activity) {
        alert('Please enter an activity');
        return;
    }
    
    // Get selected weather types
    const selectedWeathers = [];
    document.querySelectorAll('.weather-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
        selectedWeathers.push(checkbox.value);
    });
    
    if (selectedWeathers.length === 0) {
        alert('Please select at least one weather type for this activity!');
        return;
    }

    const savedActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    
    // Add new activity
    savedActivities.push({
        activity: activity,
        weatherTypes: selectedWeathers,
        date: new Date().toLocaleDateString()
    });
    
    localStorage.setItem('userActivities', JSON.stringify(savedActivities));
    
    // Clear input and show success
    activityInput.value = '';
    alert('Activity saved successfully!');

}

function loadSavedActivities() {
    const activitiesContainer = document.getElementById('activities-screen');
    const savedActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');

    let activitiesHTML = '<h2>Your Activities</h2>';
    
    if (savedActivities.length === 0) {
        activitiesHTML = `
            <div class="empty-state">
                <h2>Your Activities</h2>
                <p>No activities saved yet.</p>
                <p><em>Go to the Add screen to create your first activity</em></p>
            </div>
        `;
    } else {
        activitiesHTML = `
            <div class="activities-header">
                <h2>Your Saved Activities</h2>
                <p class="activities-count">${savedActivities.length} activities saved</p>
            </div>
        `;

        savedActivities.forEach((activity, index) => {
            activitiesHTML += `
            <div class="activity-item>
                <h3>${activity.activity}</h3>
                <div class="weather-tags">
                    <strong>Suitable for:</strong> ${activity.weatherTypes.join(', ')} weather
                </div>
                <p class="activity-date">Added: ${activity.date}</p>
                <button onclick="removeActivity(${index})" class="remove-btn">Remove</button>
            </div>
        `;
        });
    }
    
    let activitiesContent = document.getElementById('activities-content');
    
    if (!activitiesContent) {
        activitiesContent = document.createElement('div');
        activitiesContent.id = 'activities-content';
        activitiesContent.className = 'activities-content';
        const navBar = activitiesContainer.querySelector('.nav-bar');
        activitiesContainer.insertBefore(activitiesContent, navBar);
    }
    
    activitiesContent.innerHTML = activitiesHTML;
}


function removeActivity(index) {
    const savedActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    savedActivities.splice(index, 1);
    localStorage.setItem('userActivities', JSON.stringify(savedActivities));
    loadSavedActivities(); // Refresh the display
}

// Fetch weather using city input
async function getWeatherByCity() {
    let city = document.getElementById("city").value;
    let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    fetchWeather(url);
}
 
// Fetch weather using GPS
function getWeatherByGPS() {
    const isEnabled = localStorage.getItem('locationEnabled') === 'true';

    if (!isEnabled) {
        // Show message based on current screen
        if (currentScreen === 'home-screen') {
            document.getElementById("weather").innerText = "Please enable location access in the Activities screen first.";
        } else {
            // If called from activities screen, update the toggle
            document.getElementById('location-toggle').checked = false;
            updatePermissionStatus(document.querySelector('.permission-status'));
        }
        return;
    }

    if (navigator.geolocation) {
        //Trigger a popup to ask for user's location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                //Gathers latitude and longitude of user
                let lat = position.coords.latitude;
                let lon = position.coords.longitude;
                let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
                await fetchWeather(url);
            },
            (error) => {
                let message = "Location access denied!";
                if (error.code===error.PERMISSION_DENIED) {
                    message += "Please enable location permissions in your browser settings.";
                } else if (error.code===error.POSITION_UNAVAILABLE) {
                    message += "Location information unavailable.";
                } else if (error.code===error.TIMEOUT) {
                    message += "Location request timeout.";
                }
            

                if (currentScreen === 'home-screen') {
                    document.getElementById("Weather").innerText = message;
                }

                document.getElementById('location-toggle').checked=false;
                localStorage.setItem('locationEnabled', 'false');
                const statusElement = document.querySelector('.permission-status');
                if (statusElement) {
                    updatePermissionStatus(statusElement, error);
                }
            }
        );
    //If declined/function not supported
    } else {
        document.getElementById("weather").innerText = "Geolocation not supported.";
    }
}
 
// Fetch and display weather
async function fetchWeather(url) {
    let weatherDisplay = document.getElementById("weather");
    weatherDisplay.innerText = "Loading...";
    
    try {
        let response = await fetch(url);
        let data = await response.json();

        document.getElementById("weather").innerText = `Weather: ${data.weather[0].description
            .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | Temperature: ${data.main.temp}°C`;
    } catch (error) {
        document.getElementById("weather").innerText = "Weather data unavailable!";
    }
}

function setupLocationToggle() {
    const locationToggle = document.getElementById('location-toggle');
    
    // Create status element
    const locationStatus = document.createElement('div');
    locationStatus.className = 'permission-status';
    document.querySelector('.permission-section').appendChild(locationStatus);

    // Load saved preference
    const locationEnabled = localStorage.getItem('locationEnabled') === 'true';
    locationToggle.checked = locationEnabled;
    updatePermissionStatus(locationStatus);

    // Toggle event listener
    locationToggle.addEventListener('change', function() {
        if (this.checked) {
            requestLocationPermission(locationStatus);
        } else {
            localStorage.setItem('locationEnabled', 'false');
            updatePermissionStatus(locationStatus);
            // Update home screen weather display if needed
            updateHomeScreenWeatherDisplay();
        }
    });

    // Auto-get weather if permission was previously granted
    if (locationEnabled) {
        setTimeout(() => {
            // Only fetch if we're on the activities screen
            if (currentScreen === 'activities-screen') {
                getWeatherByGPS();
            }
        }, 1000);
    }
}

function requestLocationPermission(statusElement) {
    if (!navigator.geolocation) {
        statusElement.textContent = 'Geolocation is not supported by this browser.';
        statusElement.className = 'permission-status permission-denied';
        document.getElementById('location-toggle').checked = false;
        localStorage.setItem('locationEnabled', 'false');
        return;
    }

    statusElement.textContent = 'Requesting location access...';
    statusElement.className = 'permission-status permission-prompt';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Permission granted
            localStorage.setItem('locationEnabled', 'true');
            updatePermissionStatus(statusElement);
            
            // Auto-fetch weather with new permission
            getWeatherByGPS();
        },
        (error) => {
            // Permission denied
            localStorage.setItem('locationEnabled', 'false');
            updatePermissionStatus(statusElement, error);
            document.getElementById('location-toggle').checked = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function updatePermissionStatus(statusElement, error = null) {
    const isEnabled = localStorage.getItem('locationEnabled') === 'true';
    
    if (isEnabled) {
        statusElement.textContent = 'Location access granted';
        statusElement.className = 'permission-status permission-granted';
    } else if (error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                statusElement.textContent = '✗ Location access denied. Enable in browser settings.';
                break;
            case error.POSITION_UNAVAILABLE:
                statusElement.textContent = '✗ Location information unavailable.';
                break;
            case error.TIMEOUT:
                statusElement.textContent = '✗ Location request timed out.';
                break;
            default:
                statusElement.textContent = '✗ Location access disabled.';
        }
        statusElement.className = 'permission-status permission-denied';
    } else {
        statusElement.textContent = 'Location access is disabled';
        statusElement.className = 'permission-status permission-denied';
    }
}

function updateHomeScreenWeatherDisplay() {
    // If home screen is active and location is disabled, update the display
    if (currentScreen === 'home-screen') {
        const isEnabled = localStorage.getItem('locationEnabled') === 'true';
        if (!isEnabled) {
            const weatherDisplay = document.getElementById("weather");
            if (weatherDisplay.textContent.includes('GPS') || weatherDisplay.textContent.includes('location')) {
                weatherDisplay.innerText = "Enable location access in Activities screen to use GPS weather.";
            }
        }
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(error => console.log("Service Worker Registration Failed", error));
}