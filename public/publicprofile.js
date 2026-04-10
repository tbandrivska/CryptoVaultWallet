function showSection(section) {
    document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('button').forEach(el => el.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    event.target.classList.add('active');
    
    if (section === 'browse') {
        loadProfiles();
    }
}

let createForm;
let createMessage;
const availableCryptos = ['BTC', 'ETH', 'USDT', 'SOL', 'ADA', 'DOT', 'USDC', 'LTC', 'DOGE', 'BNB', 'LINK'];
let currentUser = null;

window.addEventListener('DOMContentLoaded', async () => {
    createForm = document.querySelector('form');
    createMessage = document.getElementById('create-message');

    // Get current user
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
        } else {
            // Not logged in, redirect to login
            window.location.href = '/login';
            return;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        window.location.href = '/login';
        return;
    }

    if (createForm) {
        createForm.addEventListener('submit', handleCreateProfile);
    }

    initCryptoSelector();
});

async function getProfiles() {
    const response = await fetch('/api/profiles');
    if (!response.ok) {
        throw new Error(`Failed to load profiles: ${response.status}`);
    }
    return await response.json();
}

function initCryptoSelector() {
    const cryptoContainer = document.getElementById('acceptedCryptos');
    if (!cryptoContainer) {
        return;
    }

    cryptoContainer.innerHTML = '';
    availableCryptos.forEach(symbol => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'crypto-chip';
        chip.dataset.value = symbol;
        chip.textContent = symbol;

        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
        });

        cryptoContainer.appendChild(chip);
    });
}

function resetCryptoChips() {
    document.querySelectorAll('.crypto-chip.selected').forEach(chip => chip.classList.remove('selected'));
}

async function handleCreateProfile(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const bio = document.getElementById('bio').value.trim();

    const acceptedCryptos = Array.from(document.querySelectorAll('.crypto-select .crypto-chip.selected'))
        .map(chip => chip.dataset.value)
        .filter(Boolean);

    if (!name || !bio || acceptedCryptos.length === 0) {
        return showCreateMessage('Please fill in all fields and select at least one cryptocurrency.', 'error');
    }

    try {
        const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                bio: bio,
                acceptedCryptos: acceptedCryptos
            })
        });

        const result = await response.json();

        if (result.success) {
            showCreateMessage('Profile created successfully!', 'success');
            createForm.reset();
            resetCryptoChips();
            if (document.getElementById('browse').classList.contains('active')) {
                loadProfiles();
            }
        } else {
            showCreateMessage(result.message || 'Failed to create profile.', 'error');
        }
    } catch (error) {
        console.error('Error creating profile:', error);
        showCreateMessage('Failed to create profile. Please try again.', 'error');
    }
}

function showCreateMessage(text, type) {
    if (!createMessage) {
        return;
    }

    createMessage.textContent = text;
    createMessage.className = `form-message ${type}`;
}

let cachedProfiles = [];

function filterProfiles(query) {
    const profilesList = document.querySelector('.profiles-list');
    const trimmed = query.trim();
    let filtered;
    if (!trimmed) {
        filtered = cachedProfiles;
    } else if (trimmed.startsWith('@')) {
        const term = trimmed.slice(1).toLowerCase();
        filtered = cachedProfiles.filter(p => p.username.toLowerCase().includes(term));
    } else {
        const term = trimmed.toLowerCase();
        filtered = cachedProfiles.filter(p => p.name.toLowerCase().includes(term));
    }
    renderProfiles(profilesList, filtered);
}

async function loadProfiles() {
    const profilesList = document.querySelector('.profiles-list');
    profilesList.innerHTML = ''; // Clear existing content

    // Clear search on reload
    const searchInput = document.getElementById('profile-search');
    if (searchInput) searchInput.value = '';

    try {
        const profiles = await getProfiles();
        cachedProfiles = profiles;
        renderProfiles(profilesList, profiles);
    } catch (error) {
        profilesList.innerHTML = '<div class="error-message">Unable to load profiles.</div>';
        console.error('Error loading profiles:', error);
    }
}

function renderProfiles(profilesList, profiles) {
    profilesList.innerHTML = '';

        if (!Array.isArray(profiles) || profiles.length === 0) {
            profilesList.innerHTML = '<div class="error-message">No profiles found.</div>';
            return;
        }

    profiles.forEach(profile => {
        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'profile-name';
        nameDiv.textContent = profile.name;

        const usernameDiv = document.createElement('div');
        usernameDiv.className = 'profile-username';
        usernameDiv.textContent = "@" + profile.username;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'profile-header';

        const textWrapper = document.createElement('div');
        textWrapper.className = 'profile-text';
        textWrapper.appendChild(nameDiv);
        textWrapper.appendChild(usernameDiv);

        const tagWrapper = document.createElement('div');
        tagWrapper.className = 'profile-tags';

        (profile.acceptedCryptos || []).forEach(crypto => {
            const tag = document.createElement('span');
            tag.className = 'profile-tag';
            tag.textContent = crypto;
            tagWrapper.appendChild(tag);
        });

        const bioDiv = document.createElement('div');
        bioDiv.className = 'profile-bio hidden';
        bioDiv.textContent = profile.bio || 'No bio available.';

        profileCard.addEventListener('click', () => {
            bioDiv.classList.toggle('hidden');
            profileCard.classList.toggle('expanded');
        });

        headerDiv.appendChild(textWrapper);
        headerDiv.appendChild(tagWrapper);

        profileCard.appendChild(headerDiv);
        profileCard.appendChild(bioDiv);
        profilesList.appendChild(profileCard);
    });
}