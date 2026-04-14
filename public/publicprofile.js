/* ── Section switching ── */
function showSection(section) {
  document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.button-group button').forEach(el => el.classList.remove('active'));
  document.getElementById(section).classList.add('active');
  event.target.classList.add('active');
  if (section === 'browse') {
    // Show hint, don't load until user searches
    const list = document.querySelector('.profiles-list');
    if (list && list.innerHTML === '') list.innerHTML = '<div style="padding:20px;color:var(--text-2);font-size:0.875rem;text-align:center;">Type a name or @username to search for profiles.</div>';
  }
}

const availableCryptos = ['BTC','ETH','USDT','SOL','ADA','DOT','USDC','LTC','DOGE','BNB','LINK'];
let cachedProfiles = [];
let currentUser   = null;
let createForm, createMessage;

window.addEventListener('DOMContentLoaded', async () => {
  createForm    = document.querySelector('#create form');
  createMessage = document.getElementById('create-message');

  try {
    const res = await fetch('/api/user');
    if (res.ok) {
      currentUser = (await res.json()).user;
    } else {
      window.location.href = '/login'; return;
    }
  } catch {
    window.location.href = '/login'; return;
  }

  initCryptoSelector();
  if (createForm) createForm.addEventListener('submit', handleCreateProfile);

});

/* ── Crypto chip selector ── */
function initCryptoSelector() {
  const container = document.getElementById('acceptedCryptos');
  if (!container) return;
  container.innerHTML = '';
  availableCryptos.forEach(sym => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'crypto-chip';
    chip.dataset.value = sym;
    chip.textContent = sym;
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
    container.appendChild(chip);
  });
}

function resetCryptoChips() {
  document.querySelectorAll('.crypto-chip.selected').forEach(c => c.classList.remove('selected'));
}

/* ── Message helper ── */
function showMsg(text, type) {
  if (!createMessage) return;
  createMessage.textContent = text;
  createMessage.className = '';
  void createMessage.offsetWidth;
  createMessage.className = `form-message ${type}`;
}

/* ── Create profile ── */
async function handleCreateProfile(e) {
  e.preventDefault();

  const name   = document.getElementById('name').value.trim();
  const bio    = document.getElementById('bio').value.trim();
  const cryptos = Array.from(document.querySelectorAll('.crypto-chip.selected'))
                        .map(c => c.dataset.value);

  if (!name || !bio || cryptos.length === 0) {
    showMsg('Please fill in all fields and select at least one cryptocurrency.', 'error');
    return;
  }

  showMsg('Creating profile…', 'info');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res;
    try {
      res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, acceptedCryptos: cryptos }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    const data = await res.json();

    if (data.success) {
      showMsg('✓ Profile created successfully!', 'success');
      createForm.reset();
      resetCryptoChips();
      // Refresh the cached list so browse shows the new profile
      await loadProfiles();
    } else {
      showMsg(data.message || 'Failed to create profile.', 'error');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      showMsg('Request timed out — check your server is running and profileService.js is updated.', 'error');
    } else {
      showMsg('Network error — please try again.', 'error');
    }
  }
}

/* ── Browse profiles ── */
async function loadProfiles() {
  const list   = document.querySelector('.profiles-list');
  const search = document.getElementById('profile-search');
  if (search) search.value = '';
  if (list) list.innerHTML = '<div style="padding:20px;color:var(--text-2);font-size:0.875rem;">Loading…</div>';

  try {
    const profiles = await (await fetch('/api/profiles')).json();
    cachedProfiles = Array.isArray(profiles) ? profiles : [];
    renderProfiles(list, cachedProfiles);
  } catch {
    if (list) list.innerHTML = '<div class="error-message">Unable to load profiles.</div>';
  }
}

async function filterProfiles(query) {
  const list    = document.querySelector('.profiles-list');
  const trimmed = query.trim();
  if (!trimmed) {
    list.innerHTML = '<div style="padding:20px;color:var(--text-2);font-size:0.875rem;text-align:center;">Type a name or @username to search for profiles.</div>';
    return;
  }
  // Fetch fresh on first search if cache is empty
  if (cachedProfiles.length === 0) {
    list.innerHTML = '<div style="padding:20px;color:var(--text-2);font-size:0.875rem;">Loading…</div>';
    try {
      const profiles = await (await fetch('/api/profiles')).json();
      cachedProfiles = Array.isArray(profiles) ? profiles : [];
    } catch { list.innerHTML = '<div class="error-message">Could not load profiles.</div>'; return; }
  }
  const isUser = trimmed.startsWith('@');
  const val    = (isUser ? trimmed.slice(1) : trimmed).toLowerCase();
  const field  = isUser ? 'username' : 'name';
  const hits   = cachedProfiles.filter(p => (p[field] || '').toLowerCase().includes(val));
  renderProfiles(list, hits, `No profiles match "${trimmed}".`);
}

function renderProfiles(list, profiles, emptyMsg = 'No profiles yet — be the first to create one!') {
  if (!list) return;
  list.innerHTML = '';
  if (!profiles.length) {
    list.innerHTML = `<div class="error-message">${emptyMsg}</div>`; return;
  }
  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'profile-card';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'profile-header';

    const textDiv = document.createElement('div');
    textDiv.className = 'profile-text';
    textDiv.innerHTML = `<div class="profile-name">${profile.name}</div>
                         <div class="profile-username">@${profile.username}</div>`;

    const tagDiv = document.createElement('div');
    tagDiv.className = 'profile-tags';
    (profile.acceptedCryptos || []).forEach(c => {
      const tag = document.createElement('span');
      tag.className = 'profile-tag'; tag.textContent = c;
      tagDiv.appendChild(tag);
    });

    const bioDiv = document.createElement('div');
    bioDiv.className = 'profile-bio hidden';
    bioDiv.textContent = profile.bio || 'No bio available.';

    card.addEventListener('click', () => {
      bioDiv.classList.toggle('hidden');
      card.classList.toggle('expanded');
    });

    headerDiv.appendChild(textDiv);
    headerDiv.appendChild(tagDiv);
    card.appendChild(headerDiv);
    card.appendChild(bioDiv);
    list.appendChild(card);
  });
}