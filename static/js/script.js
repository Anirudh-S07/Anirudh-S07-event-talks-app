// Application State
let state = {
    notes: [],
    selectedNoteId: null,
    activeFilter: 'all',
    searchQuery: '',
    lastChecked: null
};

// DOM Elements
const elements = {
    notesFeed: document.getElementById('notes-feed'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshSpinner: document.getElementById('refresh-spinner'),
    noteSearch: document.getElementById('note-search'),
    typeFilters: document.getElementById('type-filters'),
    
    // Stats
    statTotalCount: document.getElementById('stat-total-count'),
    statLastChecked: document.getElementById('stat-last-checked'),
    
    // Filter Counts
    countAll: document.getElementById('count-all'),
    countFeature: document.getElementById('count-feature'),
    countIssue: document.getElementById('count-issue'),
    countDeprecation: document.getElementById('count-deprecation'),
    countChanged: document.getElementById('count-changed'),
    countGeneral: document.getElementById('count-general'),
    
    // Composer
    composerNoSelection: document.getElementById('composer-no-selection'),
    composerActiveSelection: document.getElementById('composer-active-selection'),
    previewBadge: document.getElementById('preview-badge'),
    previewDate: document.getElementById('preview-date'),
    previewText: document.getElementById('preview-text'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    progressIndicator: document.getElementById('progress-indicator'),
    tweetSubmitBtn: document.getElementById('tweet-submit-btn'),
    btnClearSelection: document.getElementById('btn-clear-selection'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Button Click
    elements.refreshBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search input
    elements.noteSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().stripOrTrim();
        renderNotes();
    });

    // Helper for whitespace cleaning
    String.prototype.stripOrTrim = function() {
        return this.trim().replace(/\s+/g, ' ');
    };
    
    // Filter click delegation
    elements.typeFilters.addEventListener('click', (e) => {
        const tag = e.target.closest('.filter-tag');
        if (!tag) return;
        
        // Remove active class from all tags
        document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked tag
        tag.classList.add('active');
        
        state.activeFilter = tag.dataset.filter;
        renderNotes();
    });
    
    // Textarea input for tweet length validation
    elements.tweetTextarea.addEventListener('input', handleTweetTextareaInput);
    
    // Submit Tweet Button
    elements.tweetSubmitBtn.addEventListener('click', postTweet);
    
    // Clear Selection Button
    elements.btnClearSelection.addEventListener('click', clearSelection);
}

// Fetch Release Notes from Flask API
async function fetchReleaseNotes() {
    // Set loading state
    elements.refreshBtn.classList.add('loading');
    renderSkeletons();
    
    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        state.notes = data;
        state.lastChecked = new Date();
        
        // Update stats
        elements.statTotalCount.textContent = state.notes.length;
        elements.statLastChecked.textContent = formatTime(state.lastChecked);
        
        updateFilterCounts();
        renderNotes();
        showToast('Release notes refreshed successfully!');
    } catch (error) {
        console.error('Error fetching release notes:', error);
        renderErrorState(error.message);
        showToast('Failed to refresh release notes.', true);
    } finally {
        elements.refreshBtn.classList.remove('loading');
    }
}

// Render skeleton screen loaders
function renderSkeletons() {
    elements.notesFeed.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
}

// Render Error State
function renderErrorState(message) {
    elements.notesFeed.innerHTML = `
        <div class="error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Unable to retrieve release notes</h3>
            <p>${message}. Please verify your internet connection or check back later.</p>
        </div>
    `;
}

// Calculate and Update Count Bubbles for Filter Tags
function updateFilterCounts() {
    const counts = {
        all: state.notes.length,
        feature: 0,
        issue: 0,
        deprecation: 0,
        changed: 0,
        general: 0
    };
    
    state.notes.forEach(note => {
        const type = note.type.toLowerCase();
        if (type.includes('feature')) counts.feature++;
        else if (type.includes('issue')) counts.issue++;
        else if (type.includes('deprecation')) counts.deprecation++;
        else if (type.includes('change') || type.includes('changed')) counts.changed++;
        else counts.general++;
    });
    
    elements.countAll.textContent = counts.all;
    elements.countFeature.textContent = counts.feature;
    elements.countIssue.textContent = counts.issue;
    elements.countDeprecation.textContent = counts.deprecation;
    elements.countChanged.textContent = counts.changed;
    elements.countGeneral.textContent = counts.general;
}

// Render Notes based on current filters and search
function renderNotes() {
    // Filter notes
    const filteredNotes = state.notes.filter(note => {
        // 1. Type Filter
        let matchesType = false;
        const noteType = note.type.toLowerCase();
        
        if (state.activeFilter === 'all') {
            matchesType = true;
        } else if (state.activeFilter === 'feature' && noteType.includes('feature')) {
            matchesType = true;
        } else if (state.activeFilter === 'issue' && noteType.includes('issue')) {
            matchesType = true;
        } else if (state.activeFilter === 'deprecation' && noteType.includes('deprecation')) {
            matchesType = true;
        } else if (state.activeFilter === 'changed' && (noteType.includes('change') || noteType.includes('changed'))) {
            matchesType = true;
        } else if (state.activeFilter === 'general' && 
                   !noteType.includes('feature') && 
                   !noteType.includes('issue') && 
                   !noteType.includes('deprecation') && 
                   !noteType.includes('change') && 
                   !noteType.includes('changed')) {
            matchesType = true;
        }
        
        // 2. Search Query
        const searchStr = state.searchQuery.trim();
        const matchesSearch = !searchStr || 
            note.text.toLowerCase().includes(searchStr) || 
            note.type.toLowerCase().includes(searchStr) || 
            note.date.toLowerCase().includes(searchStr);
            
        return matchesType && matchesSearch;
    });
    
    // Clear feed
    elements.notesFeed.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        elements.notesFeed.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>No updates found</h3>
                <p>Try refining your search query or choosing another category.</p>
            </div>
        `;
        return;
    }
    
    // Group notes by date
    let currentDateGroup = '';
    
    filteredNotes.forEach(note => {
        // If date has changed, insert a date header
        if (note.date !== currentDateGroup) {
            currentDateGroup = note.date;
            const groupHeader = document.createElement('div');
            groupHeader.className = 'feed-date-header';
            groupHeader.innerHTML = `
                <div class="header-line"></div>
                <span class="header-date">${currentDateGroup}</span>
                <div class="header-line"></div>
            `;
            elements.notesFeed.appendChild(groupHeader);
        }
        
        // Render card
        const card = document.createElement('article');
        card.className = `note-card ${state.selectedNoteId === note.id ? 'selected' : ''}`;
        card.id = `card-${note.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        card.setAttribute('aria-selected', state.selectedNoteId === note.id ? 'true' : 'false');
        card.tabIndex = 0;
        
        const typeClass = getBadgeClass(note.type);
        
        card.innerHTML = `
            <div class="select-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="card-header-meta">
                <span class="type-badge ${typeClass}">${note.type}</span>
                <span class="card-date">${note.date}</span>
            </div>
            <div class="card-body">
                ${note.html}
            </div>
        `;
        
        // Add click listener
        card.addEventListener('click', () => toggleSelectNote(note));
        
        // Add keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSelectNote(note);
            }
        });
        
        elements.notesFeed.appendChild(card);
    });
}

// Get Badge Class CSS by type
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'type-feature';
    if (t.includes('issue')) return 'type-issue';
    if (t.includes('deprecation')) return 'type-deprecation';
    if (t.includes('change') || t.includes('changed')) return 'type-changed';
    return 'type-general';
}

// Select or Deselect a release note card
function toggleSelectNote(note) {
    if (state.selectedNoteId === note.id) {
        clearSelection();
    } else {
        selectNote(note);
    }
}

// Select a release note
function selectNote(note) {
    // Deselect previous cards in the UI
    document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
    
    state.selectedNoteId = note.id;
    
    // Highlight new selected card
    const cleanId = note.id.replace(/[^a-zA-Z0-9]/g, '_');
    const selectedCard = document.getElementById(`card-${cleanId}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.setAttribute('aria-selected', 'true');
    }
    
    // Show composer UI elements
    elements.composerNoSelection.style.display = 'none';
    elements.composerActiveSelection.style.display = 'block';
    elements.btnClearSelection.style.display = 'block';
    
    // Populate Preview
    elements.previewBadge.textContent = note.type;
    elements.previewBadge.className = `preview-type-badge type-badge ${getBadgeClass(note.type)}`;
    elements.previewDate.textContent = note.date;
    elements.previewText.textContent = note.text;
    
    // Compose Tweet Content
    // Standard Twitter link counts as 23 characters.
    // The maximum length is 280.
    const urlText = note.link ? ` ${note.link}` : '';
    const twitterLinkLength = 23;
    const spacing = 1; // whitespace
    
    const prefix = `BigQuery Update (${note.date}) | ${note.type}: `;
    
    // Characters used by template format: prefix + spacing + link
    const reservedChars = prefix.length + (note.link ? (twitterLinkLength + spacing) : 0);
    const availableChars = 280 - reservedChars;
    
    let mainText = note.text;
    if (mainText.length > availableChars) {
        // truncate with ellipsis
        mainText = mainText.slice(0, availableChars - 3) + '...';
    }
    
    const defaultTweet = `${prefix}${mainText}${urlText}`;
    elements.tweetTextarea.value = defaultTweet;
    
    // Focus & triggers counter
    handleTweetTextareaInput();
    
    // Scroll composer into view on mobile
    if (window.innerWidth <= 1024) {
        elements.composerActiveSelection.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// Clear currently selected note
function clearSelection() {
    state.selectedNoteId = null;
    
    // Remove UI styling
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-selected', 'false');
    });
    
    // Reset composer UI
    elements.composerNoSelection.style.display = 'flex';
    elements.composerActiveSelection.style.display = 'none';
    elements.btnClearSelection.style.display = 'none';
}

// Character counter and progress indicator rendering
function handleTweetTextareaInput() {
    const text = elements.tweetTextarea.value;
    const len = text.length;
    
    // Render count text
    elements.charCounter.textContent = len;
    
    // Calculate progress ring circle dashboard offset
    // 50.26 is the stroke dash-array for r=8 (2 * PI * 8 = 50.26)
    const circumference = 50.26;
    const percentage = Math.min(len / 280, 1);
    const offset = circumference - (percentage * circumference);
    elements.progressIndicator.style.strokeDashoffset = offset;
    
    // Styles color based on character counts
    const charCountEl = elements.charCounter.parentElement;
    charCountEl.classList.remove('warning', 'danger');
    elements.tweetSubmitBtn.classList.remove('disabled');
    elements.tweetSubmitBtn.disabled = false;
    
    if (len >= 250 && len < 280) {
        charCountEl.classList.add('warning');
        elements.progressIndicator.style.stroke = '#fbbf24';
    } else if (len >= 280) {
        charCountEl.classList.add('danger');
        elements.progressIndicator.style.stroke = '#ef4444';
        elements.tweetSubmitBtn.classList.add('disabled');
        elements.tweetSubmitBtn.disabled = true;
    } else {
        elements.progressIndicator.style.stroke = '#6366f1';
    }
}

// Open X Intent window to post tweet
function postTweet() {
    const text = elements.tweetTextarea.value;
    if (text.length > 280) {
        showToast('Tweet exceeds the 280 character limit.', true);
        return;
    }
    
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
    
    showToast('Opening X (Twitter) in a new tab!');
}

// Format Timestamp Helper
function formatTime(date) {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Toast Notification Banner
let toastTimeout;
function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    
    elements.toastMessage.textContent = message;
    
    if (isError) {
        elements.toast.style.borderColor = '#ef4444';
        elements.toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(239, 68, 68, 0.15)';
    } else {
        elements.toast.style.borderColor = 'var(--border-selected)';
        elements.toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), var(--shadow-glow)';
    }
    
    elements.toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}
