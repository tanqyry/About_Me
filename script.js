// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'mocha';
htmlElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'mocha' ? 'latte' : 'mocha';

    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Time and Date Logic
function updateTime() {
    const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Tallinn" });
    const dateObj = new Date(now);

    // Time
    const timeDisplay = document.getElementById('local-time');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}`;

    // Date
    const dateDisplay = document.getElementById('local-date');
    const options = { month: 'short', day: 'numeric' };
    dateDisplay.textContent = dateObj.toLocaleDateString('en-US', options);
}

updateTime();
setInterval(updateTime, 1000);

// Discord Lanyard API Integration (Robust)
const DISCORD_ID = '1115674875919597639';
const REST_API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

// Store current state to handle partial updates
let discordState = {
    discord_user: {
        username: 'Tan',
        avatar: null
    },
    discord_status: 'offline',
    activities: []
};

async function initDiscord() {
    // 1. Fetch Initial State via REST (to handle "not monitored" errors)
    try {
        const response = await fetch(REST_API_URL);
        const data = await response.json();

        if (data.success) {
            discordState = data.data;
            renderDiscordUI();
            // 2. Connect WebSocket for updates if successful
            connectLanyardWS();
        } else {
            // Handle Error (e.g., User not monitored)
            console.error('Lanyard Error:', data.error);
            if (data.error && data.error.code === 'user_not_monitored') {
                document.getElementById('discord-activity').textContent = "Join Lanyard Discord!";
                document.getElementById('discord-status').className = 'status-indicator offline';
            }
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        document.getElementById('discord-activity').textContent = "API Error";
    }
}

function connectLanyardWS() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: DISCORD_ID }
        }));
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const { t, d } = msg;

        if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
            // Merge new data into state
            discordState = { ...discordState, ...d };
            renderDiscordUI();
        }
    };

    ws.onclose = () => {
        setTimeout(connectLanyardWS, 5000); // Reconnect
    };
}

function renderDiscordUI() {
    const { discord_user, discord_status, activities } = discordState;

    // Update Avatar
    if (discord_user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}.png`;
        document.getElementById('discord-avatar').src = avatarUrl;
    }

    // Update Username
    if (discord_user.username) {
        document.getElementById('discord-username').textContent = discord_user.username;
    }

    // Update Status Indicator
    const statusIndicator = document.getElementById('discord-status');
    statusIndicator.className = 'status-indicator ' + (discord_status || 'offline');

    // Update Activity / Tagline
    const activityElement = document.getElementById('discord-activity');

    // Logic:
    // 1. If Custom Status (Type 4) exists, show that.
    // 2. If Spotify (Type 2), show "Listening to..."
    // 3. If Game (Type 0), show "Playing..."
    // 4. Fallback to "Chilling"

    let customStatus = activities.find(a => a.type === 4);
    let gameActivity = activities.find(a => a.type === 0);
    let spotifyActivity = activities.find(a => a.type === 2);

    if (customStatus && customStatus.state) {
        activityElement.textContent = customStatus.state;
    } else if (gameActivity) {
        activityElement.textContent = `Playing ${gameActivity.name}`;
    } else if (spotifyActivity) {
        activityElement.textContent = `Listening to ${spotifyActivity.details || spotifyActivity.name}`;
    } else {
        activityElement.textContent = "Chilling"; // Default if nothing is happening
    }
}

// Start
initDiscord();

// Parallax Effect
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.card');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;

        if (Math.abs(cardX - mouseX) < 500 && Math.abs(cardY - mouseY) < 500) {
            const angleX = (cardY - mouseY) / 30;
            const angleY = (mouseX - cardX) / 30;
            card.style.transform = `perspective(1000px) rotateX(${angleX * 0.05}deg) rotateY(${angleY * 0.05}deg)`;
        } else {
            card.style.transform = 'none';
        }
    });
});

document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.card').forEach(card => card.style.transform = 'none');
});
