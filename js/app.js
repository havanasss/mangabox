// ====================================
// MANGABOX - COMPLETE APPLICATION JS
// ====================================

// Database simulato
const mangaDatabase = [
    {
        id: 1,
        title: "One Piece",
        author: "Eiichiro Oda",
        year: 1997,
        genre: "Shonen",
        cover: "https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=One+Piece",
        description: "Le avventure di Monkey D. Luffy e della sua ciurma alla ricerca del tesoro One Piece.",
        rating: 4.8,
        volumes: 105
    },
    {
        id: 2,
        title: "Attack on Titan",
        author: "Hajime Isayama",
        year: 2009,
        genre: "Dark Fantasy",
        cover: "https://via.placeholder.com/150x220/4ECDC4/FFFFFF?text=AOT",
        description: "L'umanità lotta per la sopravvivenza contro i giganti mangiatori di uomini.",
        rating: 4.7,
        volumes: 34
    },
    {
        id: 3,
        title: "My Hero Academia",
        author: "Kohei Horikoshi",
        year: 2014,
        genre: "Superhero",
        cover: "https://via.placeholder.com/150x220/95E1D3/FFFFFF?text=MHA",
        description: "In un mondo dove quasi tutti hanno superpoteri, Izuku Midoriya sogna di diventare un eroe.",
        rating: 4.6,
        volumes: 38
    },
    {
        id: 4,
        title: "Death Note",
        author: "Tsugumi Ohba",
        year: 2003,
        genre: "Thriller",
        cover: "https://via.placeholder.com/150x220/3D5A80/FFFFFF?text=Death+Note",
        description: "Light Yagami trova un quaderno che uccide chiunque il cui nome venga scritto su di esso.",
        rating: 4.9,
        volumes: 12
    },
    {
        id: 5,
        title: "Demon Slayer",
        author: "Koyoharu Gotouge",
        year: 2016,
        genre: "Shonen",
        cover: "https://via.placeholder.com/150x220/EE6C4D/FFFFFF?text=Demon+Slayer",
        description: "Tanjiro Kamado diventa un cacciatore di demoni per salvare sua sorella.",
        rating: 4.7,
        volumes: 23
    },
    {
        id: 6,
        title: "Tokyo Ghoul",
        author: "Sui Ishida",
        year: 2011,
        genre: "Dark Fantasy",
        cover: "https://via.placeholder.com/150x220/293241/FFFFFF?text=Tokyo+Ghoul",
        description: "Ken Kaneki diventa metà ghoul dopo un incidente e deve navigare tra due mondi.",
        rating: 4.5,
        volumes: 14
    }
];

// Attività simulate
const activities = [
    {
        user: "Marco",
        action: "ha valutato",
        manga: "One Piece",
        rating: 5,
        time: "2 ore fa"
    },
    {
        user: "Sara",
        action: "ha completato",
        manga: "Death Note",
        time: "5 ore fa"
    },
    {
        user: "Luca",
        action: "ha iniziato a leggere",
        manga: "Attack on Titan",
        time: "1 giorno fa"
    },
    {
        user: "Anna",
        action: "ha recensito",
        manga: "My Hero Academia",
        time: "2 giorni fa"
    }
];

// ====================================
// USER DATA MANAGEMENT
// ====================================

let userData = {
    isLoggedIn: false,
    userId: null,
    username: null,
    email: null,
    library: {},      // Manga fisicamente posseduti
    readingStatus: {}, // Stato di lettura
    wishlist: {},     // Lista desideri
    readingProgress: {}, // Progresso lettura (volumi letti)
    userCollection: [], // Collezione completa con dettagli economici
    economicData: {
        totalVolumes: 0,
        totalCoverValue: 0,
        totalPaidValue: 0,
        totalSavings: 0,
        savingsPercentage: 0
    }
};

// Enum per gli stati
const CollectionStatus = {
    OWNED_UNREAD: 'owned_unread',
    OWNED_READ: 'owned_read',
    NOT_OWNED_READ: 'not_owned_read',
    WISHLIST: 'wishlist'
};

// ====================================
// COLLECTION ECONOMICS MANAGER
// ====================================

class CollectionEconomicsManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadCollection();
        this.calculateTotals();
        this.updateDashboard();
    }
    
    addMangaToCollection() {
        const formData = this.collectFormData();
        
        if (!this.validateFormData(formData)) {
            return;
        }
        
        formData.id = Date.now();
        formData.dateAdded = new Date().toISOString();
        
        formData.totalCoverValue = formData.ownedVolumes * formData.coverPrice;
        formData.totalPaidValue = formData.ownedVolumes * formData.paidPrice;
        formData.savings = formData.totalCoverValue - formData.totalPaidValue;
        formData.savingsPercentage = formData.totalCoverValue > 0 
            ? ((formData.savings / formData.totalCoverValue) * 100).toFixed(2) 
            : 0;
        
        userData.userCollection.push(formData);
        
        this.saveCollection();
        this.calculateTotals();
        this.updateDashboard();
        
        showNotification('Opera aggiunta alla collezione!', 'success');
        
        document.getElementById('addMangaForm').reset();
        closeAddMangaModal();
    }
    
    collectFormData() {
        return {
            title: document.getElementById('mangaTitle').value,
            originalTitle: document.getElementById('mangaOriginalTitle').value,
            author: document.getElementById('mangaAuthor').value,
            artist: document.getElementById('mangaArtist').value,
            publisher: document.getElementById('mangaPublisher').value,
            year: parseInt(document.getElementById('mangaYear').value) || null,
            type: document.getElementById('mangaType').value,
            genres: document.getElementById('mangaGenres').value.split(',').map(g => g.trim()),
            description: document.getElementById('mangaDescription').value,
            totalVolumes: parseInt(document.getElementById('mangaTotalVolumes').value) || 0,
            ownedVolumes: parseInt(document.getElementById('mangaOwnedVolumes').value) || 0,
            volumesList: document.getElementById('mangaVolumesList').value,
            collectionStatus: document.getElementById('collectionStatus').value,
            condition: document.getElementById('mangaCondition').value,
            coverPrice: parseFloat(document.getElementById('mangaCoverPrice').value) || 0,
            paidPrice: parseFloat(document.getElementById('mangaPaidPrice').value) || 0,
            purchaseNotes: document.getElementById('purchaseNotesDetail').value
        };
    }
    
    validateFormData(data) {
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
        
        if (data.ownedVolumes > data.totalVolumes && data.totalVolumes > 0) {
            showNotification('I volumi posseduti non possono superare il totale', 'error');
            return false;
        }
        
        return true;
    }
    
    calculateTotals() {
        userData.economicData.totalVolumes = 0;
        userData.economicData.totalCoverValue = 0;
        userData.economicData.totalPaidValue = 0;
        
        userData.userCollection.forEach(manga => {
            userData.economicData.totalVolumes += manga.ownedVolumes;
            userData.economicData.totalCoverValue += manga.totalCoverValue;
            userData.economicData.totalPaidValue += manga.totalPaidValue;
        });
        
        userData.economicData.totalSavings = userData.economicData.totalCoverValue - userData.economicData.totalPaidValue;
        userData.economicData.savingsPercentage = userData.economicData.totalCoverValue > 0
            ? ((userData.economicData.totalSavings / userData.economicData.totalCoverValue) * 100).toFixed(2)
            : 0;
    }
    
    updateDashboard() {
        const totalOwnedEl = document.getElementById('totalOwned');
        const totalVolumesEl = document.getElementById('totalVolumesCount');
        const collectionValueEl = document.getElementById('collectionValue');
        const totalSpentEl = document.getElementById('totalSpent');
        
        if (totalOwnedEl) totalOwnedEl.textContent = userData.userCollection.length;
        if (totalVolumesEl) totalVolumesEl.textContent = userData.economicData.totalVolumes;
        if (collectionValueEl) collectionValueEl.textContent = userData.economicData.totalCoverValue.toFixed(2);
        if (totalSpentEl) totalSpentEl.textContent = userData.economicData.totalPaidValue.toFixed(2);
    }
    
    saveCollection() {
        localStorage.setItem('userMangaCollection', JSON.stringify(userData.userCollection));
        localStorage.setItem('economicData', JSON.stringify(userData.economicData));
    }
    
    loadCollection() {
        const savedCollection = localStorage.getItem('userMangaCollection');
        const savedEconomicData = localStorage.getItem('economicData');
        
        if (savedCollection) {
            userData.userCollection = JSON.parse(savedCollection);
        }
        
        if (savedEconomicData) {
            userData.economicData = JSON.parse(savedEconomicData);
        }
    }
}

// ====================================
// INITIALIZATION
// ====================================

let economicsManager;
let currentMangaId = null;

document.addEventListener('DOMContentLoaded', function() {
    economicsManager = new CollectionEconomicsManager();
    
    loadUserData();
    loadMangaGrid();
    loadActivityFeed();
    setupEventListeners();
    
    // Mostra FAB se loggato
    if (userData.isLoggedIn) {
        document.querySelector('.fab-add-manga').style.display = 'block';
    }
});

// ====================================
// CORE FUNCTIONS
// ====================================

function loadMangaGrid() {
    const popularGrid = document.getElementById('popularGrid');
    const recentGrid = document.getElementById('recentGrid');
    
    if (popularGrid) {
        const popularManga = [...mangaDatabase].sort((a, b) => b.rating - a.rating);
        popularGrid.innerHTML = popularManga.map(manga => createMangaCard(manga)).join('');
    }
    
    if (recentGrid) {
        const recentManga = [...mangaDatabase].sort((a, b) => b.year - a.year);
        recentGrid.innerHTML = recentManga.map(manga => createMangaCard(manga)).join('');
    }
}

function createMangaCard(manga) {
    return `
        <div class="manga-card" onclick="showMangaDetail(${manga.id})">
            <img src="${manga.cover}" alt="${manga.title}">
            <div class="manga-rating">★ ${manga.rating}</div>
            <div class="manga-card-info">
                <div class="manga-title">${manga.title}</div>
                <div class="manga-year">${manga.year}</div>
            </div>
        </div>
    `;
}

function loadActivityFeed() {
    const activityList = document.getElementById('activityList');
    
    if (activityList) {
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
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput')?.addEventListener('input', function(e) {
        searchManga(e.target.value);
    });
    
    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('addMangaForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        economicsManager.addMangaToCollection();
    });
    
    // Price calculations
    document.getElementById('mangaOwnedVolumes')?.addEventListener('input', calculatePrices);
    document.getElementById('mangaCoverPrice')?.addEventListener('input', calculatePrices);
    document.getElementById('mangaPaidPrice')?.addEventListener('input', calculatePrices);
    
    // Library filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadCollectionGrid(this.dataset.filter);
        });
    });
    
    // Sort
    document.getElementById('sortLibrary')?.addEventListener('change', function() {
        const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        loadCollectionGrid(currentFilter);
    });
}

function calculatePrices() {
    const ownedVolumes = parseInt(document.getElementById('mangaOwnedVolumes')?.value) || 0;
    const coverPrice = parseFloat(document.getElementById('mangaCoverPrice')?.value) || 0;
    const paidPrice = parseFloat(document.getElementById('mangaPaidPrice')?.value) || 0;
    
    const totalCover = ownedVolumes * coverPrice;
    const totalPaid = ownedVolumes * paidPrice;
    const savings = totalCover - totalPaid;
    const savingsPercent = totalCover > 0 ? ((savings / totalCover) * 100).toFixed(2) : 0;
    
    const totalCoverEl = document.getElementById('totalCoverValue');
    const totalPaidEl = document.getElementById('totalPaidValue');
    const savingsAmountEl = document.getElementById('savingsAmount');
    const savingsPercentEl = document.getElementById('savingsPercentage');
    
    if (totalCoverEl) totalCoverEl.value = totalCover.toFixed(2);
    if (totalPaidEl) totalPaidEl.value = totalPaid.toFixed(2);
    if (savingsAmountEl) savingsAmountEl.textContent = savings.toFixed(2);
    if (savingsPercentEl) savingsPercentEl.textContent = savingsPercent;
    
    updateSummary();
}

function updateSummary() {
    const title = document.getElementById('mangaTitle')?.value || '-';
    const ownedVolumes = document.getElementById('mangaOwnedVolumes')?.value || '0';
    const totalVolumes = document.getElementById('mangaTotalVolumes')?.value || '?';
    const totalValue = document.getElementById('totalPaidValue')?.value || '0.00';
    
    const summaryTitleEl = document.getElementById('summaryTitle');
    const summaryVolumesEl = document.getElementById('summaryVolumes');
    const summaryValueEl = document.getElementById('summaryValue');
    
    if (summaryTitleEl) summaryTitleEl.textContent = title;
    if (summaryVolumesEl) summaryVolumesEl.textContent = `${ownedVolumes} / ${totalVolumes}`;
    if (summaryValueEl) summaryValueEl.textContent = totalValue;
}

// ====================================
// USER AUTHENTICATION
// ====================================

function handleLogin(e) {
    e.preventDefault();
    userData.isLoggedIn = true;
    userData.username = 'Utente';
    userData.userId = Date.now();
    updateUIAfterLogin();
    saveUserData();
    closeLoginModal();
}

function handleSignup(e) {
    e.preventDefault();
    userData.isLoggedIn = true;
    userData.username = 'NuovoUtente';
    userData.userId = Date.now();
    updateUIAfterLogin();
    saveUserData();
    closeSignupModal();
}

function updateUIAfterLogin() {
    const userActions = document.querySelector('.user-actions');
    userActions.innerHTML = `
        <div class="notification-bell" onclick="toggleNotifications()">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        </div>
        <span>Ciao, ${userData.username}!</span>
        <button onclick="showLibraryPage()" class="btn-library">La mia Libreria</button>
        <button onclick="logout()" class="btn-login">Logout</button>
    `;
    
    document.querySelector('.fab-add-manga').style.display = 'block';
}

function logout() {
    userData.isLoggedIn = false;
    userData.username = null;
    location.reload();
}

function checkAuth() {
    if (userData.isLoggedIn) {
        showLibraryPage();
    } else {
        showLoginModal();
    }
}

// ====================================
// LIBRARY MANAGEMENT
// ====================================

function showLibraryPage() {
    document.querySelector('.main-content').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('libraryPage').style.display = 'block';
    loadCollectionGrid('all');
}

function loadCollectionGrid(filter) {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    
    let mangaToShow = [];
    
    // Per ora mostra la collezione personalizzata
    if (userData.userCollection.length > 0) {
        mangaToShow = userData.userCollection.map(manga => ({
            ...manga,
            cover: `https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=${encodeURIComponent(manga.title.substring(0, 10))}`
        }));
    } else {
        // Mostra manga di esempio se non ci sono manga personalizzati
        mangaToShow = mangaDatabase;
    }
    
    grid.innerHTML = mangaToShow.map(manga => createCollectionCard(manga)).join('');
}

function createCollectionCard(manga) {
    const isCustom = manga.hasOwnProperty('ownedVolumes');
    
    if (isCustom) {
        return `
            <div class="collection-card">
                <img src="${manga.cover}" alt="${manga.title}">
                <div class="collection-info">
                    <div class="collection-title">${manga.title}</div>
                    <div class="collection-meta">${manga.author} • ${manga.year || 'N/A'}</div>
                    <div class="collection-volumes">
                        Volumi: ${manga.ownedVolumes}/${manga.totalVolumes || '?'}
                    </div>
                    <div class="collection-value">
                        Valore: €${manga.totalCoverValue?.toFixed(2) || '0.00'}
                    </div>
                    <div class="collection-spent">
                        Speso: €${manga.totalPaidValue?.toFixed(2) || '0.00'}
                    </div>
                    <div class="collection-status">
                        <span class="status-badge owned">Posseduto</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        return createMangaCard(manga);
    }
}

// ====================================
// MANGA DETAIL MANAGEMENT
// ====================================

function showMangaDetail(mangaId) {
    const manga = mangaDatabase.find(m => m.id === mangaId);
    if (!manga) return;
    
    document.getElementById('modalPoster').src = manga.cover;
    document.getElementById('modalTitle').textContent = manga.title;
    document.getElementById('modalAuthor').textContent = manga.author;
    document.getElementById('modalYear').textContent = manga.year;
    document.getElementById('modalGenre').textContent = manga.genre;
    document.getElementById('modalDescription').textContent = manga.description;
    
    document.getElementById('mangaModal').style.display = 'block';
}

function showReviewModal() {
    alert('Funzione recensione in sviluppo!');
}

// ====================================
// MODAL CONTROLS
// ====================================

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
    economicsManager.addMangaToCollection();
    document.getElementById('addMangaForm').reset();
    updateSummary();
    document.querySelector('.add-manga-modal').scrollTop = 0;
    showNotification('Opera salvata! Puoi aggiungerne un\'altra.', 'success');
}

// ====================================
// NOTIFICATIONS
// ====================================

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function markAllAsRead() {
    // Implementare logica notifiche
    document.getElementById('notificationBadge').style.display = 'none';
}

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

// ====================================
// SEARCH FUNCTIONALITY
// ====================================

function searchManga(query) {
    if (query.length < 2) {
        loadMangaGrid();
        return;
    }
    
    const results = mangaDatabase.filter(manga => 
        manga.title.toLowerCase().includes(query.toLowerCase()) ||
        manga.author.toLowerCase().includes(query.toLowerCase())
    );
    
    const popularGrid = document.getElementById('popularGrid');
    if (results.length > 0) {
        popularGrid.innerHTML = results.map(manga => createMangaCard(manga)).join('');
    } else {
        popularGrid.innerHTML = '<p>Nessun risultato trovato</p>';
    }
}

// ====================================
// DATA PERSISTENCE
// ====================================

function saveUserData() {
    if (userData.isLoggedIn) {
        localStorage.setItem('mangaBoxUserData', JSON.stringify(userData));
    }
}

function loadUserData() {
    const saved = localStorage.getItem('mangaBoxUserData');
    if (saved) {
        userData = JSON.parse(saved);
        if (userData.isLoggedIn) {
            updateUIAfterLogin();
        }
    }
}

// ====================================
// WINDOW EVENTS
// ====================================

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
    
    // Chiudi dropdown notifiche se clicchi fuori
    if (!event.target.closest('.notification-bell') && !event.target.closest('.notifications-dropdown')) {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
}

// ====================================
// MANAGE MODAL FUNCTIONS
// ====================================

function toggleOwned() {
    const isChecked = document.getElementById('ownedCheckbox').checked;
    document.getElementById('purchaseInfo').style.display = isChecked ? 'block' : 'none';
    updateStatusSummary();
}

function toggleWishlist() {
    const isChecked = document.getElementById('wishlistCheckbox').checked;
    document.getElementById('wishlistPriority').style.display = isChecked ? 'block' : 'none';
    updateStatusSummary();
}

function updateReadingStatusFromSelect() {
    const status = document.getElementById('readingStatusSelect').value;
    document.getElementById('progressSection').style.display = status === 'reading' ? 'block' : 'none';
    updateStatusSummary();
}

function updateStatusSummary() {
    const summary = document.getElementById('currentStatusSummary');
    const isOwned = document.getElementById('ownedCheckbox').checked;
    const readingStatus = document.getElementById('readingStatusSelect').value;
    const isWishlist = document.getElementById('wishlistCheckbox').checked;
    
    let statusText = '';
    
    if (isOwned && readingStatus === 'completed') {
        statusText = '📚 In libreria, Letto';
    } else if (isOwned && !readingStatus) {
        statusText = '📚 In libreria, Non letto';
    } else if (isOwned && readingStatus === 'reading') {
        statusText = '📚 In libreria, In lettura';
    } else if (!isOwned && readingStatus === 'completed') {
        statusText = '✓ Non in libreria, ma Letto';
    } else if (!isOwned && isWishlist) {
        statusText = '⭐ Nella Wishlist';
    } else {
        statusText = 'Non nella collezione';
    }
    
    if (summary) summary.textContent = statusText;
}

function saveMangaManagement() {
    // Salva modifiche gestione manga
    showNotification('Modifiche salvate!', 'success');
    closeMangaManageModal();
}

// ====================================
// EXPORT FUNCTIONALITY
// ====================================

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
}

function convertToCSV(collection) {
    if (collection.length === 0) return 'Nessun dato';
    
    const headers = ['Titolo', 'Autore', 'Editore', 'Volumi Posseduti', 'Valore Copertina', 'Speso'];
    const rows = collection.map(item => [
        item.title,
        item.author,
        item.publisher,
        item.ownedVolumes,
        item.totalCoverValue?.toFixed(2) || '0',
        item.totalPaidValue?.toFixed(2) || '0'
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


// ====================================
// API CONFIGURATION
// ====================================

const API_BASE = '/.netlify/functions';

// ====================================
// API CALLS
// ====================================

// ====================================
// API CONFIGURATION
// ====================================

const API_BASE = '/.netlify/functions';

// ====================================
// API CALLS - VERSIONE CORRETTA
// ====================================

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    // Merge headers correttamente
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.headers || {})
    };
    
    // Costruisci opzioni complete
    const fetchOptions = {
        ...options,
        headers: headers
    };
    
    // Se c'è un body e non è una stringa, convertilo in JSON
    if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    const url = `${API_BASE}/${endpoint}`;
    
    console.log('API Call:', {
        url: url,
        method: fetchOptions.method || 'GET',
        headers: fetchOptions.headers,
        body: fetchOptions.body
    });
    
    try {
        const response = await fetch(url, fetchOptions);
        
        // Log della risposta per debug
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Prova a parsare la risposta
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Se non è JSON, leggi come testo
            const text = await response.text();
            console.log('Response text:', text);
            
            // Prova comunque a parsare come JSON
            try {
                data = JSON.parse(text);
            } catch {
                data = { error: text || 'Unknown error' };
            }
        }
        
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return data;
        
    } catch (error) {
        console.error('API Error Details:', {
            endpoint: endpoint,
            error: error.message,
            stack: error.stack
        });
        
        // Se è un errore di rete
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Errore di connessione. Verifica che le funzioni Netlify siano attive.');
        }
        
        throw error;
    }
}

// ====================================
// AUTHENTICATION WITH DATABASE - VERSIONE CORRETTA
// ====================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    console.log('Attempting login with:', { email });
    
    try {
        const response = await apiCall('user-auth', {
            method: 'POST',
            body: {  // Passa l'oggetto direttamente, verrà convertito in JSON da apiCall
                action: 'login',
                email: email,
                password: password
            }
        });
        
        console.log('Login response:', response);
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            userData.isLoggedIn = true;
            userData.username = response.user.username;
            userData.userId = response.user.id;
            userData.email = response.user.email;
            
            updateUIAfterLogin();
            saveUserData();
            closeLoginModal();
            showNotification('Login effettuato con successo!', 'success');
            
            // Load user collection from database
            await loadUserCollection();
        } else {
            showNotification('Login fallito: ' + (response.error || 'Credenziali non valide'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Errore durante il login: ' + error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    
    console.log('Attempting signup with:', { username, email });
    
    try {
        const response = await apiCall('user-auth', {
            method: 'POST',
            body: {  // Passa l'oggetto direttamente
                action: 'register',
                username: username,
                email: email,
                password: password
            }
        });
        
        console.log('Signup response:', response);
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            userData.isLoggedIn = true;
            userData.username = response.user.username;
            userData.userId = response.user.id;
            userData.email = response.user.email;
            
            updateUIAfterLogin();
            saveUserData();
            closeSignupModal();
            showNotification('Registrazione completata con successo!', 'success');
        } else {
            showNotification('Registrazione fallita: ' + (response.error || 'Errore sconosciuto'), 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Errore durante la registrazione: ' + error.message, 'error');
    }
}

// ====================================
// TEST FUNCTION - Aggiungi questa per testare
// ====================================

async function testConnection() {
    console.log('Testing API connection...');
    
    try {
        // Test 1: Prova a raggiungere l'endpoint direttamente
        const response = await fetch('/.netlify/functions/manga-get');
        console.log('Direct fetch response:', response);
        
        const text = await response.text();
        console.log('Response text:', text);
        
        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.log('Not JSON:', e);
        }
        
    } catch (error) {
        console.error('Connection test failed:', error);
    }
}

// Aggiungi questa riga per testare la connessione quando la pagina si carica
document.addEventListener('DOMContentLoaded', function() {
    // Test della connessione
    testConnection();
    
    // Resto del codice esistente...
});


 
// ====================================
// LOAD DATA FROM DATABASE
// ====================================

async function loadMangaFromDB() {
    try {
        const response = await apiCall('manga-get');
        
        if (response.success && response.data) {
            // Update mangaDatabase with real data
            mangaDatabase.length = 0;
            mangaDatabase.push(...response.data);
            
            // Reload UI
            loadMangaGrid();
        }
    } catch (error) {
        console.error('Failed to load manga:', error);
        // Use local data as fallback
    }
}

async function loadUserCollection() {
    if (!userData.isLoggedIn) return;
    
    try {
        const response = await apiCall('collection-manage');
        
        if (response.success) {
            userData.userCollection = response.collection;
            userData.economicData = response.economicData;
            
            // Update UI
            updateDashboard();
            if (document.getElementById('collectionGrid')) {
                loadCollectionGrid('all');
            }
        }
    } catch (error) {
        console.error('Failed to load collection:', error);
    }
}

// ====================================
// ADD MANGA TO COLLECTION (DATABASE)
// ====================================

async function addMangaToDB() {
    const formData = collectFormData();
    
    if (!validateFormData(formData)) {
        return;
    }
    
    try {
        const response = await apiCall('collection-manage', {
            method: 'POST',
            body: JSON.stringify({
                ...formData,
                owned_volumes: formData.ownedVolumes,
                total_volumes: formData.totalVolumes,
                cover_price: formData.coverPrice,
                paid_price: formData.paidPrice,
                purchase_notes: formData.purchaseNotes
            })
        });
        
        if (response.success) {
            showNotification('Opera aggiunta alla collezione!', 'success');
            document.getElementById('addMangaForm').reset();
            closeAddMangaModal();
            
            // Reload collection
            await loadUserCollection();
        }
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

// ====================================
// SEARCH MANGA IN DATABASE
// ====================================

async function searchMangaInDB(query) {
    if (query.length < 2) {
        await loadMangaFromDB();
        return;
    }
    
    try {
        const response = await apiCall(`manga-get?search=${encodeURIComponent(query)}`);
        
        if (response.success && response.data) {
            const popularGrid = document.getElementById('popularGrid');
            if (response.data.length > 0) {
                popularGrid.innerHTML = response.data.map(manga => createMangaCard(manga)).join('');
            } else {
                popularGrid.innerHTML = '<p>Nessun risultato trovato</p>';
            }
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// ====================================
// UPDATE INITIALIZATION
// ====================================

document.addEventListener('DOMContentLoaded', async function() {
    // Check for saved token
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token is still valid by loading user data
        try {
            await loadUserCollection();
        } catch (error) {
            // Token expired or invalid
            localStorage.removeItem('token');
            userData.isLoggedIn = false;
        }
    }
    
    // Initialize economics manager
    economicsManager = new CollectionEconomicsManager();
    
    // Load user data from localStorage
    loadUserData();
    
    // Load manga from database
    await loadMangaFromDB();
    
    // Load activity feed
    loadActivityFeed();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update search to use database
    document.getElementById('searchInput')?.addEventListener('input', function(e) {
        searchMangaInDB(e.target.value);
    });
    
    // Update form submission to use database
    document.getElementById('addMangaForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addMangaToDB();
    });
    
    // Show FAB if logged in
    if (userData.isLoggedIn) {
        document.querySelector('.fab-add-manga').style.display = 'block';
    }
});

// Update the existing functions to use DB
function collectFormData() {
    return {
        title: document.getElementById('mangaTitle').value,
        original_title: document.getElementById('mangaOriginalTitle').value,
        author: document.getElementById('mangaAuthor').value,
        artist: document.getElementById('mangaArtist').value,
        publisher: document.getElementById('mangaPublisher').value,
        year: parseInt(document.getElementById('mangaYear').value) || null,
        type: document.getElementById('mangaType').value,
        genres: document.getElementById('mangaGenres').value.split(',').map(g => g.trim()),
        description: document.getElementById('mangaDescription').value,
        totalVolumes: parseInt(document.getElementById('mangaTotalVolumes').value) || 0,
        ownedVolumes: parseInt(document.getElementById('mangaOwnedVolumes').value) || 0,
        volumes_list: document.getElementById('mangaVolumesList').value,
        collection_status: document.getElementById('collectionStatus').value,
        condition: document.getElementById('mangaCondition').value,
        coverPrice: parseFloat(document.getElementById('mangaCoverPrice').value) || 0,
        paidPrice: parseFloat(document.getElementById('mangaPaidPrice').value) || 0,
        purchaseNotes: document.getElementById('purchaseNotesDetail').value,
        cover_url: `https://via.placeholder.com/150x220/FF6B6B/FFFFFF?text=${encodeURIComponent(document.getElementById('mangaTitle').value.substring(0, 10))}`
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
    
    if (data.ownedVolumes > data.totalVolumes && data.totalVolumes > 0) {
        showNotification('I volumi posseduti non possono superare il totale', 'error');
        return false;
    }
    
    return true;
}

// Update dashboard with real data
function updateDashboard() {
    const totalOwnedEl = document.getElementById('totalOwned');
    const totalVolumesEl = document.getElementById('totalVolumesCount');
    const collectionValueEl = document.getElementById('collectionValue');
    const totalSpentEl = document.getElementById('totalSpent');
    
    if (userData.economicData) {
        if (totalOwnedEl) totalOwnedEl.textContent = userData.userCollection?.length || 0;
        if (totalVolumesEl) totalVolumesEl.textContent = userData.economicData.total_volumes || 0;
        if (collectionValueEl) collectionValueEl.textContent = parseFloat(userData.economicData.total_cover_value || 0).toFixed(2);
        if (totalSpentEl) totalSpentEl.textContent = parseFloat(userData.economicData.total_paid_value || 0).toFixed(2);
    }
}
 



console.log('MangaBox App Loaded Successfully! 🚀');