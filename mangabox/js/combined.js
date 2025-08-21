// Profile.js functionality
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
        this.isOwnProfile = false;
    }
    
    loadProfile(userId) {
        // Carica dati profilo
        this.profileData = this.getUserData(userId);
        this.isOwnProfile = userId === userData.userId;
        this.renderProfile();
    }
    
    getUserData(userId) {
        // Simula caricamento dati utente
        return {
            id: userId,
            username: 'MangaLover',
            bio: 'Appassionato di manga e fumetti. Sempre alla ricerca di nuove storie!',
            avatar: 'https://via.placeholder.com/150',
            coverImage: null,
            stats: {
                totalRead: 234,
                totalReviews: 45,
                totalLists: 12,
                followers: 156,
                following: 89,
                volumesRead: 1852,
                daysActive: 365,
                averageRating: 4.2,
                currentStreak: 15
            },
            favorites: [],
            recentActivity: [],
            genres: {
                'Shonen': 45,
                'Seinen': 30,
                'Fantasy': 25,
                'Sci-Fi': 20,
                'Romance': 15
            }
        };
    }
    
    renderProfile() {
        // Aggiorna elementi DOM con dati profilo
        document.getElementById('profileUsername').textContent = this.profileData.username;
        document.getElementById('profileBio').textContent = this.profileData.bio;
        document.getElementById('totalRead').textContent = this.profileData.stats.totalRead;
        document.getElementById('totalReviews').textContent = this.profileData.stats.totalReviews;
        document.getElementById('totalLists').textContent = this.profileData.stats.totalLists;
        document.getElementById('totalFollowers').textContent = this.profileData.stats.followers;
        document.getElementById('totalFollowing').textContent = this.profileData.stats.following;
        
        // Mostra/nascondi bottoni in base al proprietario
        if (this.isOwnProfile) {
            document.getElementById('btnEditProfile').style.display = 'inline-block';
            document.getElementById('btnFollow').style.display = 'none';
        } else {
            document.getElementById('btnEditProfile').style.display = 'none';
            document.getElementById('btnFollow').style.display = 'inline-block';
        }
        
        this.loadActivityTimeline();
        this.loadUserCollection();
        this.loadUserReviews();
        this.loadUserLists();
        this.loadStatistics();
    }
    
    loadActivityTimeline() {
        const timeline = document.getElementById('userActivityTimeline');
        const activities = [
            { type: 'read', manga: 'One Piece Vol. 100', time: '2 ore fa' },
            { type: 'review', manga: 'Attack on Titan', rating: 5, time: '1 giorno fa' },
            { type: 'list', listName: 'Migliori Shonen', time: '3 giorni fa' },
            { type: 'follow', user: 'MangaExpert', time: '5 giorni fa' }
        ];
        
        timeline.innerHTML = activities.map(activity => `
            <div class="timeline-item">
                <div class="timeline-content">
                    ${this.getActivityHTML(activity)}
                    <span class="timeline-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
    
    getActivityHTML(activity) {
        switch(activity.type) {
            case 'read':
                return `<p>Ha letto <strong>${activity.manga}</strong></p>`;
            case 'review':
                return `<p>Ha recensito <strong>${activity.manga}</strong> ${'⭐'.repeat(activity.rating)}</p>`;
            case 'list':
                return `<p>Ha creato la lista <strong>${activity.listName}</strong></p>`;
            case 'follow':
                return `<p>Ha iniziato a seguire <strong>${activity.user}</strong></p>`;
            default:
                return '';
        }
    }
    
    loadStatistics() {
        // Carica statistiche e grafici
        this.createReadingChart();
        this.createGenreChart();
        this.updateReadingGoals();
    }
    
    createReadingChart() {
        // Simula grafico attività lettura
        const canvas = document.getElementById('readingChart');
        if (canvas) {
            // Qui andrebbe Chart.js o simile
            canvas.innerHTML = 'Grafico attività lettura';
        }
    }
    
    createGenreChart() {
        const genreChart = document.getElementById('genreChart');
        const genres = this.profileData.genres;
        
        genreChart.innerHTML = Object.entries(genres).map(([genre, count]) => `
            <div class="genre-bar">
                <span class="genre-name">${genre}</span>
                <div class="genre-progress">
                    <div class="genre-fill" style="width: ${count}%"></div>
                </div>
                <span class="genre-count">${count}%</span>
            </div>
        `).join('');
    }
    
    updateReadingGoals() {
        const goal = 50;
        const current = this.profileData.stats.totalRead;
        const progress = Math.min((current / goal) * 100, 100);
        
        document.getElementById('goalProgress').textContent = `${current}/${goal}`;
        document.getElementById('goalProgressBar').style.width = `${progress}%`;
    }
}

// Explore.js functionality
class ExploreManager {
    constructor() {
        this.filters = {
            genres: [],
            yearFrom: null,
            yearTo: null,
            status: '',
            rating: null,
            type: ''
        };
        this.searchResults = [];
        this.currentPage = 1;
    }
    
    init() {
        this.setupEventListeners();
        this.loadRecommendations();
        this.loadTopLists();
    }
    
    setupEventListeners() {
        // Genre tags
        document.querySelectorAll('.genre-tags .tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('active');
                const genre = tag.dataset.genre;
                if (this.filters.genres.includes(genre)) {
                    this.filters.genres = this.filters.genres.filter(g => g !== genre);
                } else {
                    this.filters.genres.push(genre);
                }
            });
        });
    }
    
    performSearch() {
        const query = document.getElementById('searchQuery').value;
        
        // Simula ricerca
        this.searchResults = mangaDatabase.filter(manga => 
            manga.title.toLowerCase().includes(query.toLowerCase()) ||
            manga.author.toLowerCase().includes(query.toLowerCase())
        );
        
        this.applyFilters();
        this.displayResults();
    }
    
    applyFilters() {
        let filtered = [...this.searchResults];
        
        // Applica filtri genere
        if (this.filters.genres.length > 0) {
            filtered = filtered.filter(manga => 
                this.filters.genres.includes(manga.genre.toLowerCase())
            );
        }
        
        // Applica filtro anno
        if (this.filters.yearFrom) {
            filtered = filtered.filter(manga => manga.year >= this.filters.yearFrom);
        }
        if (this.filters.yearTo) {
            filtered = filtered.filter(manga => manga.year <= this.filters.yearTo);
        }
        
        // Applica filtro rating
        if (this.filters.rating) {
            filtered = filtered.filter(manga => manga.rating >= this.filters.rating);
        }
        
        this.searchResults = filtered;
    }
    
    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        const searchResultsSection = document.getElementById('searchResults');
        
        searchResultsSection.style.display = 'block';
        document.getElementById('resultsCount').textContent = `${this.searchResults.length} risultati trovati`;
        
        resultsGrid.innerHTML = this.searchResults.map(manga => `
            <div class="result-card">
                <img src="${manga.cover}" alt="${manga.title}">
                <div class="result-info">
                    <h3>${manga.title}</h3>
                    <p>${manga.author} • ${manga.year}</p>
                    <div class="result-rating">⭐ ${manga.rating}</div>
                </div>
            </div>
        `).join('');
    }
    
    loadRecommendations() {
        const grid = document.getElementById('recommendationsGrid');
        // Carica raccomandazioni basate su preferenze utente
        const recommendations = mangaDatabase.slice(0, 6);
        
        grid.innerHTML = recommendations.map(manga => `
            <div class="recommendation-card">
                <img src="${manga.cover}" alt="${manga.title}">
                <div class="recommendation-info">
                    <h4>${manga.title}</h4>
                    <p class="match-percentage">85% match</p>
                </div>
            </div>
        `).join('');
    }
    
    loadTopLists() {
        // Top più letti
        const topRead = mangaDatabase.sort((a, b) => b.rating - a.rating).slice(0, 10);
        document.getElementById('topReadList').innerHTML = topRead.map((manga, index) => `
            <li>
                <span class="rank">${index + 1}</span>
                <span class="title">${manga.title}</span>
                <span class="stat">${Math.floor(Math.random() * 10000)} lettori</span>
            </li>
        `).join('');
        
        // Top più votati
        document.getElementById('topRatedList').innerHTML = topRead.map((manga, index) => `
            <li>
                <span class="rank">${index + 1}</span>
                <span class="title">${manga.title}</span>
                <span class="stat">⭐ ${manga.rating}</span>
            </li>
        `).join('');
    }
    
    browseCategory(category) {
        // Naviga per categoria
        switch(category) {
            case 'trending':
                this.searchResults = mangaDatabase.filter(m => m.year >= 2020);
                break;
            case 'new-releases':
                this.searchResults = mangaDatabase.filter(m => m.year >= 2023);
                break;
            case 'classics':
                this.searchResults = mangaDatabase.filter(m => m.year < 2000);
                break;
            case 'awards':
                this.searchResults = mangaDatabase.filter(m => m.rating >= 4.5);
                break;
            case 'hidden-gems':
                this.searchResults = mangaDatabase.filter(m => m.rating >= 4 && m.rating < 4.5);
                break;
            case 'completed':
                this.searchResults = mangaDatabase.filter(m => m.status === 'completed');
                break;
        }
        this.displayResults();
    }
}

// Lists.js functionality
class ListsManager {
    constructor() {
        this.userLists = [];
        this.currentList = null;
    }
    
    init() {
        this.loadUserLists();
        this.loadPopularLists();
        this.loadFollowingLists();
    }
    
    loadUserLists() {
        // Carica liste dell'utente
        this.userLists = [
            {
                id: 1,
                name: 'Top 10 Shonen',
                description: 'I migliori shonen di sempre',
                items: 10,
                likes: 45,
                privacy: 'public',
                cover: 'https://via.placeholder.com/200x150'
            },
            {
                id: 2,
                name: 'Da leggere',
                description: 'Lista dei manga che voglio leggere',
                items: 25,
                likes: 5,
                privacy: 'private',
                cover: 'https://via.placeholder.com/200x150'
            }
        ];
        
        const grid = document.getElementById('myListsGrid');
        grid.innerHTML = this.userLists.map(list => this.createListCard(list)).join('');
    }
    
    createListCard(list) {
        return `
            <div class="list-card" onclick="openListDetail(${list.id})">
                <div class="list-cover">
                    <img src="${list.cover}" alt="${list.name}">
                    <div class="list-privacy">
                        <i class="fas fa-${list.privacy === 'public' ? 'globe' : 'lock'}"></i>
                    </div>
                </div>
                <div class="list-info">
                    <h3>${list.name}</h3>
                    <p>${list.description}</p>
                    <div class="list-stats">
                        <span><i class="fas fa-book"></i> ${list.items}</span>
                        <span><i class="fas fa-heart"></i> ${list.likes}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    createNewList() {
        const form = document.getElementById('createListForm');
        const formData = new FormData(form);
        
        const newList = {
            id: this.userLists.length + 1,
            name: formData.get('listName'),
            description: formData.get('listDescription'),
            type: formData.get('listType'),
            privacy: formData.get('privacy'),
            tags: formData.get('listTags').split(',').map(tag => tag.trim()),
            items: 0,
            likes: 0,
            dateCreated: new Date().toISOString()
        };
        
        this.userLists.push(newList);
        this.saveListsToStorage();
        this.loadUserLists();
        this.closeCreateListModal();
    }
    
    openListDetail(listId) {
        this.currentList = this.userLists.find(list => list.id === listId);
        if (!this.currentList) return;
        
        // Popola modal dettagli
        document.getElementById('detailListName').textContent = this.currentList.name;
        document.getElementById('detailListDescription').textContent = this.currentList.description;
        document.getElementById('detailListAuthor').textContent = userData.username;
        document.getElementById('detailListDate').textContent = new Date(this.currentList.dateCreated).toLocaleDateString();
        document.getElementById('detailListLikes').textContent = this.currentList.likes;
        
        // Mostra bottone modifica solo per liste proprie
        document.getElementById('btnEditList').style.display = 
            this.currentList.userId === userData.userId ? 'inline-block' : 'none';
        
        this.loadListItems();
        document.getElementById('listDetailModal').style.display = 'block';
    }
    
    loadListItems() {
        const itemsContainer = document.getElementById('listDetailItems');
        // Simula items della lista
        const items = mangaDatabase.slice(0, 5);
        
        itemsContainer.innerHTML = items.map((manga, index) => `
            <div class="list-item">
                <span class="item-rank">${index + 1}</span>
                <img src="${manga.cover}" alt="${manga.title}">
                <div class="item-info">
                    <h4>${manga.title}</h4>
                    <p>${manga.author}</p>
                </div>
                <button class="btn-remove" onclick="removeFromList(${manga.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    saveListsToStorage() {
        localStorage.setItem('userLists', JSON.stringify(this.userLists));
    }
}

// Settings.js functionality
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved) : {
            account: {
                email: userData.email || '',
                username: userData.username || ''
            },
            profile: {
                displayName: '',
                bio: '',
                location: '',
                website: '',
                social: {
                    twitter: '',
                    instagram: '',
                    discord: ''
                }
            },
            privacy: {
                publicProfile: true,
                showCollection: true,
                showStats: true,
                showActivity: true,
                messagePermission: 'all',
                wishlistVisibility: 'all'
            },
            notifications: {
                emailFollowers: false,
                emailComments: true,
                emailNewsletter: true,
                pushEnabled: false
            },
            preferences: {
                theme: 'dark',
                language: 'it',
                itemsPerPage: 40,
                adultContent: false
            }
        };
    }
    
    init() {
        this.loadSettingsIntoForm();
        this.setupEventListeners();
    }
    
    loadSettingsIntoForm() {
        // Account
        document.getElementById('accountEmail').value = this.settings.account.email;
        document.getElementById('accountUsername').value = this.settings.account.username;
        
        // Profile
        document.getElementById('displayName').value = this.settings.profile.displayName;
        document.getElementById('bio').value = this.settings.profile.bio;
        document.getElementById('location').value = this.settings.profile.location;
        document.getElementById('website').value = this.settings.profile.website;
        
        // Privacy toggles
        document.getElementById('publicProfile').checked = this.settings.privacy.publicProfile;
        document.getElementById('showCollection').checked = this.settings.privacy.showCollection;
        document.getElementById('showStats').checked = this.settings.privacy.showStats;
        document.getElementById('showActivity').checked = this.settings.privacy.showActivity;
        
        // Notifications
        document.getElementById('emailFollowers').checked = this.settings.notifications.emailFollowers;
        document.getElementById('emailComments').checked = this.settings.notifications.emailComments;
        document.getElementById('emailNewsletter').checked = this.settings.notifications.emailNewsletter;
        
        // Preferences
        document.getElementById('theme').value = this.settings.preferences.theme;
        document.getElementById('language').value = this.settings.preferences.language;
        document.getElementById('itemsPerPage').value = this.settings.preferences.itemsPerPage;
        document.getElementById('adultContent').checked = this.settings.preferences.adultContent;
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.getAttribute('href').substring(1));
            });
        });
        
        // Save buttons
        document.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', () => this.saveSettings());
        });
        
        // Theme change
        document.getElementById('theme')?.addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });
    }
    
    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from nav items
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
    }
    
    saveSettings() {
        // Collect all settings from form
        this.settings.profile.displayName = document.getElementById('displayName').value;
        this.settings.profile.bio = document.getElementById('bio').value;
        this.settings.profile.location = document.getElementById('location').value;
        this.settings.profile.website = document.getElementById('website').value;
        
        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        
        // Show success message
        this.showNotification('Impostazioni salvate con successo!', 'success');
    }
    
    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.settings.preferences.theme = theme;
        this.saveSettings();
    }
    
    exportData(format) {
        const data = {
            userData: userData,
            settings: this.settings,
            lists: JSON.parse(localStorage.getItem('userLists') || '[]')
        };
        
        let content, filename, type;
        
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            filename = 'mangabox_data.json';
            type = 'application/json';
        } else if (format === 'csv') {
            // Converti in CSV
            content = this.convertToCSV(data);
            filename = 'mangabox_data.csv';
            type = 'text/csv';
        }
        
        // Download file
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }
    
    convertToCSV(data) {
        // Semplice conversione CSV per la collezione
        const collection = Object.values(data.userData.library || {});
        if (collection.length === 0) return 'No data';
        
        const headers = ['Title', 'Author', 'Year', 'Status', 'Rating'];
        const rows = collection.map(item => [
            item.manga.title,
            item.manga.author,
            item.manga.year,
            item.status || 'Not set',
            item.rating || 'Not rated'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    showNotification(message, type = 'info') {
        // Crea notifica temporanea
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
}

// Initialize managers
let profileManager, exploreManager, listsManager, settingsManager;

document.addEventListener('DOMContentLoaded', () => {
    // Determina quale pagina è caricata e inizializza il manager appropriato
    const path = window.location.pathname;
    
    if (path.includes('profile.html')) {
        profileManager = new ProfileManager();
        const userId = new URLSearchParams(window.location.search).get('id') || userData.userId;
        profileManager.loadProfile(userId);
    } else if (path.includes('explore.html')) {
        exploreManager = new ExploreManager();
        exploreManager.init();
    } else if (path.includes('lists.html')) {
        listsManager = new ListsManager();
        listsManager.init();
    } else if (path.includes('settings.html')) {
        settingsManager = new SettingsManager();
        settingsManager.init();
    }
    
    // Setup tab switching for profile
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remove active from all tabs and panes
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // Add active to clicked tab and corresponding pane
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
});

// Global functions
function toggleFollow() {
    const btn = document.getElementById('btnFollow');
    const isFollowing = btn.textContent.includes('Seguendo');
    
    if (isFollowing) {
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Segui';
        btn.classList.remove('following');
    } else {
        btn.innerHTML = '<i class="fas fa-user-check"></i> Seguendo';
        btn.classList.add('following');
    }
}

function toggleFilters() {
    const filters = document.getElementById('advancedFilters');
    filters.classList.toggle('show');
}

function showCreateListModal() {
    document.getElementById('createListModal').style.display = 'block';
}

function closeCreateListModal() {
    document.getElementById('createListModal').style.display = 'none';
}

function closeListDetailModal() {
    document.getElementById('listDetailModal').style.display = 'none';
}

// Export functions for use in other files
window.ProfileManager = ProfileManager;
window.ExploreManager = ExploreManager;
window.ListsManager = ListsManager;
window.SettingsManager = SettingsManager;