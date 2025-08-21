// ====================================
// MANGABOX - COMPLETE APPLICATION
// ====================================

// API Configuration
const API_BASE = '/.netlify/functions';

// Global State
let userData = {
    isLoggedIn: false,
    userId: null,
    username: null,
    email: null,
    token: null,
    userCollection: [],
    economicData: {
        totalVolumes: 0,
        totalCoverValue: 0,
        totalPaidValue: 0,
        totalSavings: 0,
        savingsPercentage: 0
    }
};

let currentMangaId = null;
let allManga = [];
let userLists = [];
let userReviews = [];

// ====================================
// INITIALIZATION
// ====================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('MangaBox initializing...');
    
    // Check authentication
    await checkAuth();
    
    // Load initial data based on page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    switch(currentPage) {
        case 'index.html':
        case '':
            await initHomePage();
            break;
        case 'profile.html':
            await initProfilePage();
            break;
        case 'explore.html':
            await initExplorePage();
            break;
        case 'lists.html':
            await initListsPage();
            break;
        case 'feed.html':
            await initFeedPage();
            break;
        case 'messages.html':
            await initMessagesPage();
            break;
        case 'reviews.html':
            await initReviewsPage();
            break;
        case 'settings.html':
            await initSettingsPage();
            break;
    }
    
    // Setup global event listeners
    setupGlobalEventListeners();
});

// ====================================
// API FUNCTIONS
// ====================================

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.headers || {})
    };
    
    const fetchOptions = {
        ...options,
        headers: headers
    };
    
    if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, fetchOptions);
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = { error: text || 'Unknown error' };
            }
        }
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
        
    } catch (error) {
        console.error('API Error:', error);
        // Return fallback data instead of throwing
        if (endpoint === 'manga-get') {
            return { success: true, data: getFallbackManga() };
        }
        return { success: false, error: error.message };
    }
}

// ====================================
// AUTHENTICATION
// ====================================

async function checkAuth() {
    const token = localStorage.getItem('token');
    const savedUserData = localStorage.getItem('mangaBoxUserData');
    
    if (token && savedUserData) {
        try {
            userData = JSON.parse(savedUserData);
            userData.token = token;
            userData.isLoggedIn = true;
            updateUIAfterLogin();
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    return false;
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    try {
        const response = await apiCall('user-auth', {
            method: 'POST',
            body: {
                action: 'login',
                email: email,
                password: password
            }
        });
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            userData = {
                isLoggedIn: true,
                userId: response.user.id,
                username: response.user.username,
                email: response.user.email,
                token: response.token
            };
            
            localStorage.setItem('mangaBoxUserData', JSON.stringify(userData));
            updateUIAfterLogin();
            closeLoginModal();
            showNotification('Login effettuato!', 'success');
            
            // Reload page to refresh data
            window.location.reload();
        } else {
            // Fallback login for demo
            userData = {
                isLoggedIn: true,
                userId: Date.now(),
                username: email.split('@')[0],
                email: email
            };
            localStorage.setItem('mangaBoxUserData', JSON.stringify(userData));
            updateUIAfterLogin();
            closeLoginModal();
            showNotification('Login demo effettuato!', 'success');
            window.location.reload();
        }
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    
    try {
        const response = await apiCall('user-auth', {
            method: 'POST',
            body: {
                action: 'register',
                username: username,
                email: email,
                password: password
            }
        });
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            userData = {
                isLoggedIn: true,
                userId: response.user.id,
                username: response.user.username,
                email: response.user.email,
                token: response.token
            };
            
            localStorage.setItem('mangaBoxUserData', JSON.stringify(userData));
            updateUIAfterLogin();
            closeSignupModal();
            showNotification('Registrazione completata!', 'success');
            window.location.reload();
        } else {
            // Fallback signup for demo
            userData = {
                isLoggedIn: true,
                userId: Date.now(),
                username: username,
                email: email
            };
            localStorage.setItem('mangaBoxUserData', JSON.stringify(userData));
            updateUIAfterLogin();
            closeSignupModal();
            showNotification('Registrazione demo completata!', 'success');
            window.location.reload();
        }
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

function updateUIAfterLogin() {
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
        userActions.innerHTML = `
            <div class="notification-bell" onclick="toggleNotifications()">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </div>
            <span>Ciao, ${userData.username}!</span>
            <button onclick="showLibraryPage()" class="btn-library">La mia Libreria</button>
            <button onclick="logout()" class="btn-login">Logout</button>
        `;
    }
    
    const fab = document.querySelector('.fab-add-manga');
    if (fab) fab.style.display = 'block';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('mangaBoxUserData');
    userData = {
        isLoggedIn: false,
        userId: null,
        username: null,
        email: null
    };
    window.location.href = 'index.html';
}

// ====================================
// PAGE INITIALIZATION FUNCTIONS
// ====================================

async function initHomePage() {
    console.log('Initializing home page...');
    
    // Load manga from DB or use fallback
    const response = await apiCall('manga-get');
    if (response.success && response.data) {
        allManga = response.data;
    } else {
        allManga = getFallbackManga();
    }
    
    // Display manga grids
    displayMangaGrid('popularGrid', allManga.sort((a,b) => (b.rating || 4) - (a.rating || 4)));
    displayMangaGrid('recentGrid', allManga.sort((a,b) => (b.year || 2020) - (a.year || 2020)));
    
    // Load activity feed
    displayActivityFeed();
    
    // Load user collection if logged in
    if (userData.isLoggedIn) {
        await loadUserCollection();
    }
}

async function initProfilePage() {
    console.log('Initializing profile page...');
    
    if (!userData.isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load user collection
    await loadUserCollection();
    
    // Update profile UI with real data
    updateProfileUI();
    
    // Load user activity
    await loadUserActivity();
}

async function initExplorePage() {
    console.log('Initializing explore page...');
    
    // Load all manga
    const response = await apiCall('manga-get');
    if (response.success && response.data) {
        allManga = response.data;
    } else {
        allManga = getFallbackManga();
    }
    
    // Display in explore grid
    const exploreGrid = document.getElementById('exploreGrid');
    if (exploreGrid) {
        displayMangaGrid('exploreGrid', allManga);
    }
    
    // Setup search
    setupExploreSearch();
}

async function initListsPage() {
    console.log('Initializing lists page...');
    
    if (!userData.isLoggedIn) {
        showNotification('Devi effettuare il login per vedere le liste', 'warning');
        return;
    }
    
    await loadUserLists();
    displayUserLists();
}

async function initFeedPage() {
    console.log('Initializing feed page...');
    
    if (!userData.isLoggedIn) {
        showNotification('Devi effettuare il login per vedere il feed', 'warning');
        return;
    }
    
    await loadFeedPosts();
}

async function initMessagesPage() {
    console.log('Initializing messages page...');
    
    if (!userData.isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    loadConversations();
}

async function initReviewsPage() {
    console.log('Initializing reviews page...');
    
    if (!userData.isLoggedIn) {
        showNotification('Devi effettuare il login per vedere le recensioni', 'warning');
        return;
    }
    
    await loadUserReviews();
    displayUserReviews();
}

async function initSettingsPage() {
    console.log('Initializing settings page...');
    
    if (!userData.isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    loadUserSettings();
}

// ====================================
// DATA LOADING FUNCTIONS
// ====================================

async function loadUserCollection() {
    if (!userData.isLoggedIn) return;
    
    try {
        const response = await apiCall('collection-manage', {
            method: 'GET'
        });
        
        if (response.success) {
            userData.userCollection = response.collection || [];
            userData.economicData = response.economicData || {
                totalVolumes: 0,
                totalCoverValue: 0,
                totalPaidValue: 0,
                totalSavings: 0,
                savingsPercentage: 0
            };
        } else {
            // Use localStorage fallback
            const saved = localStorage.getItem('userMangaCollection');
            if (saved) {
                userData.userCollection = JSON.parse(saved);
            }
        }
        
        updateCollectionUI();
    } catch (error) {
        console.error('Failed to load collection:', error);
    }
}

async function loadUserActivity() {
    // Simulate activity for now
    const activities = [
        { action: 'added', item: 'One Piece Vol. 105', time: '2 ore fa' },
        { action: 'completed', item: 'Death Note', time: '1 giorno fa' },
        { action: 'reviewed', item: 'Attack on Titan', time: '3 giorni fa' }
    ];
    
    const container = document.querySelector('.activity-timeline');
    if (container) {
        container.innerHTML = activities.map(a => `
            <div style="padding: 1rem; border-bottom: 1px solid #2C3440;">
                <p>Hai ${a.action} <strong>${a.item}</strong></p>
                <small style="color: #9AB;">${a.time}</small>
            </div>
        `).join('');
    }
}

async function loadUserLists() {
    // Load from localStorage for now
    const saved = localStorage.getItem('userLists');
    if (saved) {
        userLists = JSON.parse(saved);
    } else {
        userLists = [
            { id: 1, name: 'Preferiti', items: 5, isPublic: true },
            { id: 2, name: 'Da leggere', items: 10, isPublic: false }
        ];
    }
}

async function loadFeedPosts() {
    // Simulate feed posts
    const posts = [
        {
            user: userData.username,
            content: 'Ho appena finito di leggere One Piece Vol. 105!',
            time: '2 ore fa',
            likes: 23,
            comments: 5
        }
    ];
    
    const feedContent = document.querySelector('.feed-posts');
    if (feedContent) {
        feedContent.innerHTML = posts.map(p => `
            <div style="background: #1C2128; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                <p><strong>${p.user}</strong></p>
                <p>${p.content}</p>
                <small style="color: #9AB;">${p.time}</small>
            </div>
        `).join('');
    }
}

async function loadUserReviews() {
    const saved = localStorage.getItem('userReviews');
    if (saved) {
        userReviews = JSON.parse(saved);
    } else {
        userReviews = [];
    }
}

// ====================================
// UI UPDATE FUNCTIONS
// ====================================

function updateProfileUI() {
    // Update username
    const usernameEls = document.querySelectorAll('#profileUsername, h1');
    usernameEls.forEach(el => {
        if (el.textContent.includes('Profilo')) {
            el.textContent = `Profilo di ${userData.username}`;
        }
    });
    
    // Update economic stats
    const stats = userData.economicData;
    
    updateElementText('totalVolumesOwned', stats.totalVolumes);
    updateElementText('totalCoverValue', stats.totalCoverValue?.toFixed(2) || '0.00');
    updateElementText('totalPaidValue', stats.totalPaidValue?.toFixed(2) || '0.00');
    updateElementText('totalSavings', stats.totalSavings?.toFixed(2) || '0.00');
    updateElementText('savingsPercent', stats.savingsPercentage || '0');
    
    // Update collection count
    updateElementText('totalOwned', userData.userCollection?.length || 0);
    updateElementText('totalRead', userData.userCollection?.filter(m => m.status === 'completed')?.length || 0);
}

function updateCollectionUI() {
    // Update stats on library page
    const stats = userData.economicData;
    
    updateElementText('totalOwned', userData.userCollection?.length || 0);
    updateElementText('totalVolumesCount', stats.totalVolumes || 0);
    updateElementText('collectionValue', stats.totalCoverValue?.toFixed(2) || '0.00');
    updateElementText('totalSpent', stats.totalPaidValue?.toFixed(2) || '0.00');
    
    // Display collection grid if on library page
    const grid = document.getElementById('collectionGrid');
    if (grid) {
        displayCollectionGrid();
    }
}

function displayMangaGrid(gridId, mangaList) {
    const grid = document.getElementById(gridId);
    if (!grid || !mangaList) return;
    
    grid.innerHTML = mangaList.slice(0, 12).map(manga => `
        <div class="manga-card" onclick="showMangaDetail(${manga.id})">
            <img src="${manga.cover_url || manga.cover || 'https://via.placeholder.com/150x220'}" alt="${manga.title}">
            <div class="manga-rating">★ ${manga.rating || '4.5'}</div>
            <div class="manga-card-info">
                <div class="manga-title">${manga.title}</div>
                <div class="manga-year">${manga.year || '202X'}</div>
            </div>
        </div>
    `).join('');
}

function displayCollectionGrid() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    
    if (userData.userCollection.length === 0) {
        grid.innerHTML = '<p>La tua collezione è vuota. Aggiungi il tuo primo manga!</p>';
        return;
    }
    
    grid.innerHTML = userData.userCollection.map(item => `
        <div class="collection-card">
            <img src="${item.cover_url || 'https://via.placeholder.com/150x220'}" alt="${item.title}">
            <div class="collection-info">
                <div class="collection-title">${item.title}</div>
                <div class="collection-meta">${item.author} • ${item.year || 'N/A'}</div>
                <div class="collection-volumes">
                    Volumi: ${item.owned_volumes}/${item.volumes_total || '?'}
                </div>
                <div class="collection-value">
                    Valore: €${(item.owned_volumes * item.cover_price).toFixed(2)}
                </div>
                <div class="collection-spent">
                    Speso: €${(item.owned_volumes * item.paid_price).toFixed(2)}
                </div>
                <div class="collection-status">
                    <span class="status-badge owned">Posseduto</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayActivityFeed() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const activities = [
        { user: 'Marco', action: 'ha valutato', manga: 'One Piece', rating: 5, time: '2 ore fa' },
        { user: 'Sara', action: 'ha completato', manga: 'Death Note', time: '5 ore fa' },
        { user: 'Luca', action: 'ha iniziato', manga: 'Attack on Titan', time: '1 giorno fa' }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-avatar">${activity.user[0]}</div>
            <div class="activity-content">
                <span class="activity-user">${activity.user}</span>
                <div class="activity-action">
                    ${activity.action} 
                    <span class="activity-manga">${activity.manga}</span>
                    ${activity.rating ? '★'.repeat(activity.rating) : ''}
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function displayUserLists() {
    const container = document.querySelector('.lists-grid');
    if (!container) return;
    
    if (userLists.length === 0) {
        container.innerHTML = '<p>Non hai ancora creato nessuna lista</p>';
        return;
    }
    
    container.innerHTML = userLists.map(list => `
        <div style="background: #1C2128; border-radius: 10px; overflow: hidden; cursor: pointer;">
            <div style="height: 150px; background: linear-gradient(135deg, #FF6B6B, #4ECDC4);"></div>
            <div style="padding: 1rem;">
                <h3>${list.name}</h3>
                <p style="color: #9AB;">${list.items} manga</p>
            </div>
        </div>
    `).join('');
}

function displayUserReviews() {
    const container = document.querySelector('.reviews-list');
    if (!container) return;
    
    if (userReviews.length === 0) {
        container.innerHTML = '<p>Non hai ancora scritto recensioni</p>';
        return;
    }
    
    container.innerHTML = userReviews.map(review => `
        <div style="background: #1C2128; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
            <h3>${review.mangaTitle}</h3>
            <div style="color: #FFD700;">${'⭐'.repeat(review.rating)}</div>
            <p>${review.content}</p>
            <small style="color: #9AB;">${new Date(review.date).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// ====================================
// MANGA MANAGEMENT
// ====================================

async function addMangaToCollection() {
    const formData = collectFormData();
    
    if (!validateFormData(formData)) {
        return;
    }
    
    try {
        const response = await apiCall('collection-manage', {
            method: 'POST',
            body: formData
        });
        
        if (response.success) {
            showNotification('Manga aggiunto alla collezione!', 'success');
            document.getElementById('addMangaForm').reset();
            closeAddMangaModal();
            await loadUserCollection();
        } else {
            // Fallback to localStorage
            const collection = JSON.parse(localStorage.getItem('userMangaCollection') || '[]');
            collection.push({
                ...formData,
                id: Date.now(),
                dateAdded: new Date().toISOString()
            });
            localStorage.setItem('userMangaCollection', JSON.stringify(collection));
            userData.userCollection = collection;
            
            showNotification('Manga aggiunto (modalità offline)!', 'success');
            document.getElementById('addMangaForm').reset();
            closeAddMangaModal();
            updateCollectionUI();
        }
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

function collectFormData() {
    return {
        title: document.getElementById('mangaTitle')?.value || '',
        original_title: document.getElementById('mangaOriginalTitle')?.value || '',
        author: document.getElementById('mangaAuthor')?.value || '',
        artist: document.getElementById('mangaArtist')?.value || '',
        publisher: document.getElementById('mangaPublisher')?.value || '',
        year: parseInt(document.getElementById('mangaYear')?.value) || null,
        type: document.getElementById('mangaType')?.value || '',
        genres: document.getElementById('mangaGenres')?.value.split(',').map(g => g.trim()) || [],
        description: document.getElementById('mangaDescription')?.value || '',
        volumes_total: parseInt(document.getElementById('mangaTotalVolumes')?.value) || 0,
        owned_volumes: parseInt(document.getElementById('mangaOwnedVolumes')?.value) || 0,
        volumes_list: document.getElementById('mangaVolumesList')?.value || '',
        collection_status: document.getElementById('collectionStatus')?.value || '',
        condition: document.getElementById('mangaCondition')?.value || '',
        cover_price: parseFloat(document.getElementById('mangaCoverPrice')?.value) || 0,
        paid_price: parseFloat(document.getElementById('mangaPaidPrice')?.value) || 0,
        purchase_notes: document.getElementById('purchaseNotesDetail')?.value || '',
        cover_url: `https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=${encodeURIComponent((document.getElementById('mangaTitle')?.value || 'Manga').substring(0, 10))}`
    };
}

function validateFormData(data) {
    if (!data.title) {
        showNotification('Il titolo è obbligatorio', 'error');
        return false;
    }
    
    if (!data.author) {
        showNotification('L\'autore è obbligatorio', 'error');
        return false;
    }
    
    if (!data.publisher) {
        showNotification('L\'editore è obbligatorio', 'error');
        return false;
    }
    
    return true;
}

function calculatePrices() {
    const ownedVolumes = parseInt(document.getElementById('mangaOwnedVolumes')?.value) || 0;
    const coverPrice = parseFloat(document.getElementById('mangaCoverPrice')?.value) || 0;
    const paidPrice = parseFloat(document.getElementById('mangaPaidPrice')?.value) || 0;
    
    const totalCover = ownedVolumes * coverPrice;
    const totalPaid = ownedVolumes * paidPrice;
    const savings = totalCover - totalPaid;
    const savingsPercent = totalCover > 0 ? ((savings / totalCover) * 100).toFixed(2) : 0;
    
    updateElementValue('totalCoverValue', totalCover.toFixed(2));
    updateElementValue('totalPaidValue', totalPaid.toFixed(2));
    updateElementText('savingsAmount', savings.toFixed(2));
    updateElementText('savingsPercentage', savingsPercent);
    
    updateSummary();
}

function updateSummary() {
    const title = document.getElementById('mangaTitle')?.value || '-';
    const ownedVolumes = document.getElementById('mangaOwnedVolumes')?.value || '0';
    const totalVolumes = document.getElementById('mangaTotalVolumes')?.value || '?';
    const totalValue = document.getElementById('totalPaidValue')?.value || '0.00';
    
    updateElementText('summaryTitle', title);
    updateElementText('summaryVolumes', `${ownedVolumes} / ${totalVolumes}`);
    updateElementText('summaryValue', totalValue);
}

// ====================================
// MODAL FUNCTIONS
// ====================================

function showMangaDetail(mangaId) {
    const manga = allManga.find(m => m.id == mangaId) || getFallbackManga().find(m => m.id == mangaId);
    if (!manga) return;
    
    currentMangaId = mangaId;
    
    updateElementSrc('modalPoster', manga.cover_url || manga.cover || 'https://via.placeholder.com/150x220');
    updateElementText('modalTitle', manga.title);
    updateElementText('modalAuthor', manga.author);
    updateElementText('modalYear', manga.year || '202X');
    updateElementText('modalGenre', manga.genres?.join(', ') || manga.genre || 'N/A');
    updateElementText('modalDescription', manga.description || 'Nessuna descrizione disponibile');
    
    document.getElementById('mangaModal').style.display = 'block';
}

function showLibraryPage() {
    if (!userData.isLoggedIn) {
        showLoginModal();
        return;
    }
    
    document.querySelector('.main-content').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    const libraryPage = document.getElementById('libraryPage');
    if (libraryPage) {
        libraryPage.style.display = 'block';
        displayCollectionGrid();
    }
}

// Modal control functions
function showLoginModal() {
    closeSignupModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showSignupModal() {
    closeLoginModal();
    document.getElementById('signupModal').style.display = 'block';
}

function closeSignupModal() {
    document.getElementById('signupModal').style.display = 'none';
}

function closeMangaModal() {
    document.getElementById('mangaModal').style.display = 'none';
}

function openAddMangaModal() {
    if (!userData.isLoggedIn) {
        showLoginModal();
        return;
    }
    document.getElementById('addMangaModal').style.display = 'block';
}

function closeAddMangaModal() {
    document.getElementById('addMangaModal').style.display = 'none';
}

function closeMangaManageModal() {
    document.getElementById('mangaManageModal').style.display = 'none';
}

function saveAndContinue() {
    addMangaToCollection();
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function updateElementSrc(id, src) {
    const el = document.getElementById(id);
    if (el) el.src = src;
}

function exportData(format) {
    const data = {
        userData: userData,
        collection: userData.userCollection,
        economicData: userData.economicData
    };
    
    if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'mangabox_data.json', 'application/json');
    } else if (format === 'csv') {
        const csv = convertToCSV(data.collection);
        downloadFile(csv, 'mangabox_collection.csv', 'text/csv');
    }
    
    showNotification(`Dati esportati in ${format.toUpperCase()}!`, 'success');
}

function convertToCSV(collection) {
    if (!collection || collection.length === 0) return 'Nessun dato';
    
    const headers = ['Titolo', 'Autore', 'Editore', 'Volumi Posseduti', 'Valore Copertina', 'Speso'];
    const rows = collection.map(item => [
        item.title,
        item.author,
        item.publisher,
        item.owned_volumes || 0,
        ((item.owned_volumes || 0) * (item.cover_price || 0)).toFixed(2),
        ((item.owned_volumes || 0) * (item.paid_price || 0)).toFixed(2)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function getFallbackManga() {
    return [
        {
            id: 1,
            title: "One Piece",
            author: "Eiichiro Oda",
            year: 1997,
            genre: "Shonen",
            cover: "https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=One+Piece",
            cover_url: "https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=One+Piece",
            description: "Le avventure di Monkey D. Luffy",
            rating: 4.8,
            volumes_total: 105
        },
        {
            id: 2,
            title: "Death Note",
            author: "Tsugumi Ohba",
            year: 2003,
            genre: "Thriller",
            cover: "https://via.placeholder.com/150x220/3D5A80/FFFFFF?text=Death+Note",
            cover_url: "https://via.placeholder.com/150x220/3D5A80/FFFFFF?text=Death+Note",
            description: "Un quaderno che uccide",
            rating: 4.9,
            volumes_total: 12
        },
        {
            id: 3,
            title: "Attack on Titan",
            author: "Hajime Isayama",
            year: 2009,
            genre: "Dark Fantasy",
            cover: "https://via.placeholder.com/150x220/4ECDC4/FFFFFF?text=AOT",
            cover_url: "https://via.placeholder.com/150x220/4ECDC4/FFFFFF?text=AOT",
            description: "L'umanità contro i giganti",
            rating: 4.7,
            volumes_total: 34
        }
    ];
}

// ====================================
// GLOBAL EVENT LISTENERS
// ====================================

function setupGlobalEventListeners() {
    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('addMangaForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addMangaToCollection();
    });
    
    // Price calculations
    document.getElementById('mangaOwnedVolumes')?.addEventListener('input', calculatePrices);
    document.getElementById('mangaCoverPrice')?.addEventListener('input', calculatePrices);
    document.getElementById('mangaPaidPrice')?.addEventListener('input', calculatePrices);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', function(e) {
        searchManga(e.target.value);
    });
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

function setupExploreSearch() {
    const searchInput = document.querySelector('#exploreGrid')?.previousElementSibling?.querySelector('input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allManga.filter(m => 
                m.title.toLowerCase().includes(query) || 
                m.author.toLowerCase().includes(query)
            );
            displayMangaGrid('exploreGrid', filtered);
        });
    }
}

function searchManga(query) {
    if (!query || query.length < 2) {
        displayMangaGrid('popularGrid', allManga);
        return;
    }
    
    const filtered = allManga.filter(manga => 
        manga.title.toLowerCase().includes(query.toLowerCase()) ||
        manga.author.toLowerCase().includes(query.toLowerCase())
    );
    
    displayMangaGrid('popularGrid', filtered);
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function loadConversations() {
    // Placeholder for messages functionality
    console.log('Loading conversations...');
}

function loadUserSettings() {
    // Load user settings
    if (userData.email) {
        updateElementValue('accountEmail', userData.email);
        updateElementValue('accountUsername', userData.username);
    }
}

console.log('MangaBox App Loaded! 🚀');