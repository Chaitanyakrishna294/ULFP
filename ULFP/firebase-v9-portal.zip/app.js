// Firebase v9+ Lost & Found Portal JavaScript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp,
    connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

class LostAndFoundApp {
    constructor() {
        this.items = [];
        this.currentSection = 'home';
        this.currentActionItemId = null;
        this.db = null;
        this.unsubscribe = null;
        this.isConnected = false;
        
        this.initFirebase();
    }

    async initFirebase() {
        try {
            // Firebase configuration - using the provided config exactly
            const firebaseConfig = {
                apiKey: "AIzaSyAtPAwF5KGNG-AIa0sSe37KzsGgmEy3u1w",
                authDomain: "ulfp-a7e8b.firebaseapp.com",
                projectId: "ulfp-a7e8b",
                storageBucket: "ulfp-a7e8b.firebasestorage.app",
                messagingSenderId: "641228955536",
                appId: "1:641228955536:web:5c4383bd52d104ccc75d15",
                measurementId: "G-B2H2TDSGX1"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);

            console.log('Firebase initialized successfully');
            this.updateConnectionStatus('connected', 'Connected to database');
            this.isConnected = true;

            // Initialize the app
            this.init();

        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.updateConnectionStatus('error', 'Database connection failed');
            this.showToast('Database connection failed. Please refresh the page.', 'error');
            
            // Load sample data as fallback
            this.loadSampleData();
            this.init();
        }
    }

    updateConnectionStatus(status, message) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
    }

    init() {
        this.setupEventListeners();
        this.setupFirestoreListener();
        this.updateStatistics();
    }

    setupFirestoreListener() {
        if (!this.db) {
            console.warn('Database not initialized, using sample data');
            this.loadSampleData();
            this.renderRecentItems();
            this.renderAllItems();
            return;
        }

        try {
            // Create a real-time listener for the items collection
            const itemsQuery = query(collection(this.db, 'items'), orderBy('createdAt', 'desc'));
            
            this.unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
                console.log('Firestore data updated, items count:', snapshot.size);
                
                this.items = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    this.items.push({
                        id: doc.id,
                        ...data,
                        // Convert Firestore timestamps to ISO strings
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || data.resolvedAt
                    });
                });

                // If no items exist, add sample data
                if (this.items.length === 0) {
                    console.log('No items found, adding sample data');
                    this.addSampleData();
                    return;
                }

                this.updateStatistics();
                this.renderRecentItems();
                this.renderAllItems();
                
            }, (error) => {
                console.error('Firestore listener error:', error);
                this.updateConnectionStatus('error', 'Database sync failed');
                this.showToast('Database sync error. Some features may not work.', 'error');
                
                // Fallback to sample data
                this.loadSampleData();
                this.renderRecentItems();
                this.renderAllItems();
            });

        } catch (error) {
            console.error('Error setting up Firestore listener:', error);
            this.loadSampleData();
            this.renderRecentItems();
            this.renderAllItems();
        }
    }

    async addSampleData() {
        if (!this.db) return;

        const sampleData = [
            {
                type: "lost",
                itemName: "iPhone 14 Pro Max",
                category: "electronics",
                description: "Black iPhone 14 Pro Max with blue protective case and cracked screen protector",
                location: "Library 2nd floor, near windows by study tables 23-25",
                contactEmail: "student@vitstudent.ac.in",
                contactPhone: "+91 9876543210",
                reporterName: "Arjun Kumar",
                status: "active",
                urgency: "high",
                images: [],
                createdAt: serverTimestamp()
            },
            {
                type: "found",
                itemName: "VIT Student ID Card",
                category: "documents",
                description: "Found VIT Chennai student ID card belonging to Priya Sharma from CSE department",
                location: "Academic Block A main entrance, lying on floor near notice board",
                currentLocation: "Security office at main gate - handed over to Mr. Raj",
                contactEmail: "security@vit.ac.in",
                contactPhone: "+91 44 3993 1500",
                reporterName: "Security Team",
                status: "active",
                urgency: "medium",
                images: [],
                createdAt: serverTimestamp()
            },
            {
                type: "found",
                itemName: "Black Adidas Backpack",
                category: "accessories",
                description: "Large black Adidas backpack found in food court containing textbooks and notebooks",
                location: "Food court seating area, under table near Pizza Corner stall",
                currentLocation: "Main security office with complete inventory list",
                contactEmail: "security.main@vit.ac.in",
                contactPhone: "+91 44 3993 1500",
                reporterName: "Cafeteria Staff",
                status: "active",
                urgency: "medium",
                images: [],
                createdAt: serverTimestamp()
            }
        ];

        try {
            for (const item of sampleData) {
                await addDoc(collection(this.db, 'items'), item);
            }
            console.log('Sample data added successfully');
        } catch (error) {
            console.error('Error adding sample data:', error);
        }
    }

    loadSampleData() {
        // Fallback sample data for offline mode
        this.items = [
            {
                "id": "sample_1",
                "type": "lost",
                "itemName": "iPhone 14 Pro Max",
                "category": "electronics",
                "description": "Black iPhone 14 Pro Max with blue protective case and cracked screen protector",
                "location": "Library 2nd floor, near windows by study tables 23-25",
                "contactEmail": "student@vitstudent.ac.in",
                "contactPhone": "+91 9876543210",
                "reporterName": "Arjun Kumar",
                "status": "active",
                "urgency": "high",
                "images": [],
                "createdAt": "2025-09-18T00:00:00.000Z"
            },
            {
                "id": "sample_2",
                "type": "found",
                "itemName": "VIT Student ID Card",
                "category": "documents",
                "description": "Found VIT Chennai student ID card belonging to Priya Sharma from CSE department",
                "location": "Academic Block A main entrance, lying on floor near notice board",
                "currentLocation": "Security office at main gate - handed over to Mr. Raj",
                "contactEmail": "security@vit.ac.in",
                "contactPhone": "+91 44 3993 1500",
                "reporterName": "Security Team",
                "status": "active",
                "urgency": "medium",
                "images": [],
                "createdAt": "2025-09-17T23:00:00.000Z"
            },
            {
                "id": "sample_3",
                "type": "found",
                "itemName": "Black Adidas Backpack",
                "category": "accessories",
                "description": "Large black Adidas backpack found in food court containing textbooks and notebooks",
                "location": "Food court seating area, under table near Pizza Corner stall",
                "currentLocation": "Main security office with complete inventory list",
                "contactEmail": "security.main@vit.ac.in",
                "contactPhone": "+91 44 3993 1500",
                "reporterName": "Cafeteria Staff",
                "status": "active",
                "urgency": "medium",
                "images": [],
                "createdAt": "2025-09-17T22:00:00.000Z"
            }
        ];
        this.updateStatistics();
    }

    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachEventListeners());
        } else {
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                console.log('Nav button clicked:', section);
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // View All Items button
        document.querySelectorAll('[data-section="browse"]:not(.nav-btn)').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('View all items clicked');
                this.switchSection('browse');
            });
        });

        // Report Item Buttons
        const reportItemBtn = document.getElementById('reportItemBtn');
        const reportLostBtn = document.getElementById('reportLostBtn');
        const reportFoundBtn = document.getElementById('reportFoundBtn');

        if (reportItemBtn) {
            reportItemBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Report item button clicked');
                this.openReportModal();
            });
        }

        if (reportLostBtn) {
            reportLostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Report lost button clicked');
                this.openReportModal('lost');
            });
        }

        if (reportFoundBtn) {
            reportFoundBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Report found button clicked');
                this.openReportModal('found');
            });
        }

        // Modal Controls
        this.setupModalControls();

        // Report Form
        const reportForm = document.getElementById('reportForm');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReportSubmit(e);
            });

            const itemTypeInput = reportForm.querySelector('#itemType');
            if (itemTypeInput) {
                // Use MutationObserver to watch for changes
                const observer = new MutationObserver(() => {
                    this.toggleCurrentLocationField();
                });
                observer.observe(itemTypeInput, { attributes: true, attributeFilter: ['value'] });
                
                // Also add change event listener
                itemTypeInput.addEventListener('change', () => {
                    this.toggleCurrentLocationField();
                });
            }
        }

        // Search and Filter
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterAndRenderItems();
            });
        }

        [categoryFilter, typeFilter, statusFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterAndRenderItems();
                });
            }
        });

        // Action Modal Buttons
        const markResolvedBtn = document.getElementById('markResolvedBtn');
        const deleteItemBtn = document.getElementById('deleteItemBtn');

        if (markResolvedBtn) {
            markResolvedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.markItemAsResolved();
            });
        }

        if (deleteItemBtn) {
            deleteItemBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteItem();
            });
        }
    }

    setupModalControls() {
        document.querySelectorAll('.modal').forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                // Remove existing listeners
                closeBtn.removeEventListener('click', this.closeModalHandler);
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal(modal);
                });
            }

            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.removeEventListener('click', this.overlayClickHandler);
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closeModal(modal);
                    }
                });
            }

            const cancelBtn = modal.querySelector('.modal-cancel');
            if (cancelBtn) {
                cancelBtn.removeEventListener('click', this.cancelHandler);
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal(modal);
                });
            }
        });
    }

    switchSection(section) {
        console.log('Switching to section:', section);

        // Update navigation active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('btn--primary');
            btn.classList.add('btn--outline');
        });

        const activeBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('btn--outline');
            activeBtn.classList.add('btn--primary');
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(contentSection => {
            contentSection.classList.remove('active');
        });

        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error(`Section ${section}Section not found`);
        }

        this.currentSection = section;

        // Update data based on active section
        if (section === 'browse') {
            this.renderAllItems();
        } else if (section === 'home') {
            this.renderRecentItems();
        }
    }

    openReportModal(type = null) {
        console.log('Opening report modal with type:', type);
        
        const modal = document.getElementById('reportModal');
        const form = document.getElementById('reportForm');
        const titleEl = document.getElementById('modalTitle');
        const typeInput = document.getElementById('itemType');

        if (!modal) {
            console.error('Report modal not found');
            return;
        }

        if (form) {
            form.reset();
        }

        if (type && typeInput) {
            typeInput.value = type;
            if (titleEl) {
                titleEl.textContent = type === 'lost' ? 'Report Lost Item' : 'Report Found Item';
            }
            this.toggleCurrentLocationField();
        } else if (titleEl) {
            titleEl.textContent = 'Report Item';
        }

        // Show modal by removing hidden class
        modal.classList.remove('hidden');
        console.log('Modal should be visible now');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    toggleCurrentLocationField() {
        const type = document.getElementById('itemType')?.value;
        const currentLocationGroup = document.getElementById('currentLocationGroup');
        
        console.log('Toggling location field for type:', type);
        
        if (currentLocationGroup) {
            if (type === 'found') {
                currentLocationGroup.style.display = 'block';
            } else {
                currentLocationGroup.style.display = 'none';
            }
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            console.log('Modal closed');
        }
    }

    async handleReportSubmit(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnSpinner = submitBtn?.querySelector('.btn-spinner');
        
        // Show loading state
        if (btnText && btnSpinner) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        try {
            const formData = new FormData(e.target);
            const itemData = {
                type: formData.get('type') || 'lost',
                itemName: formData.get('itemName'),
                category: formData.get('category'),
                description: formData.get('description'),
                location: formData.get('location'),
                currentLocation: formData.get('currentLocation') || '',
                contactEmail: formData.get('contactEmail'),
                contactPhone: formData.get('contactPhone') || '',
                reporterName: formData.get('reporterName'),
                status: 'active',
                urgency: formData.get('urgency') || 'medium',
                images: [],
                createdAt: serverTimestamp()
            };

            console.log('Submitting item data:', itemData);

            if (this.db) {
                // Add to Firestore
                await addDoc(collection(this.db, 'items'), itemData);
                console.log('Item added to Firestore successfully');
            } else {
                // Fallback: add to local array
                itemData.id = 'item_' + Date.now();
                itemData.createdAt = new Date().toISOString();
                this.items.unshift(itemData);
                this.updateStatistics();
                this.renderRecentItems();
                this.renderAllItems();
            }

            this.closeModal(document.getElementById('reportModal'));
            this.showToast('Item reported successfully!', 'success');

        } catch (error) {
            console.error('Error adding item:', error);
            this.showToast('Failed to report item. Please try again.', 'error');
        } finally {
            // Reset button state
            if (btnText && btnSpinner) {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    }

    renderRecentItems() {
        const container = document.getElementById('recentItemsGrid');
        if (!container) return;

        const recentItems = this.items
            .filter(item => item.status === 'active')
            .slice(0, 6);

        if (recentItems.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No recent items');
            return;
        }

        container.innerHTML = recentItems.map(item => this.createItemCardHTML(item)).join('');
        this.attachItemEventListeners();
    }

    renderAllItems() {
        const container = document.getElementById('allItemsGrid');
        if (!container) return;

        const filteredItems = this.getFilteredItems();

        if (filteredItems.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No items match your filters');
            return;
        }

        container.innerHTML = filteredItems.map(item => this.createItemCardHTML(item)).join('');
        this.attachItemEventListeners();
    }

    getFilteredItems() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const categoryFilterValue = categoryFilter ? categoryFilter.value : '';
        const typeFilterValue = typeFilter ? typeFilter.value : '';
        const statusFilterValue = statusFilter ? statusFilter.value : 'active';

        return this.items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.itemName.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm);

            const matchesCategory = !categoryFilterValue || item.category === categoryFilterValue;
            const matchesType = !typeFilterValue || item.type === typeFilterValue;
            const matchesStatus = !statusFilterValue || item.status === statusFilterValue;

            return matchesSearch && matchesCategory && matchesType && matchesStatus;
        });
    }

    filterAndRenderItems() {
        if (this.currentSection === 'browse') {
            this.renderAllItems();
        }
    }

    createItemCardHTML(item) {
        const isResolved = item.status === 'resolved';
        const urgencyClass = `urgency-${item.urgency}`;
        const typeClass = item.type;
        const resolvedClass = isResolved ? 'resolved' : '';
        
        return `
            <div class="item-card ${resolvedClass}" data-item-id="${item.id}">
                <button class="item-action-btn" data-item-id="${item.id}" title="Item Actions">
                    ⚙️
                </button>
                
                <div class="item-card-header">
                    <span class="item-type ${typeClass}">${item.type}</span>
                    <span class="urgency-indicator ${urgencyClass}">${item.urgency}</span>
                </div>
                
                <h4 class="item-name">${this.escapeHtml(item.itemName)}</h4>
                <span class="item-category">${this.escapeHtml(item.category)}</span>
                
                <p class="item-description">${this.escapeHtml(item.description)}</p>
                
                <div class="item-location">
                    <span>📍</span>
                    <span>${this.escapeHtml(item.location)}</span>
                </div>
                
                <div class="item-footer">
                    <span class="item-date">${this.formatDate(item.createdAt)}</span>
                    ${isResolved ? '<span class="status-badge"><span>✓</span> Resolved</span>' : ''}
                </div>
            </div>
        `;
    }

    attachItemEventListeners() {
        // Item card clicks for details
        document.querySelectorAll('.item-card').forEach(card => {
            // Remove existing listeners
            card.removeEventListener('click', this.cardClickHandler);
            card.addEventListener('click', (e) => {
                if (e.target.closest('.item-action-btn')) {
                    return;
                }
                
                const itemId = card.dataset.itemId;
                console.log('Item card clicked:', itemId);
                this.showItemDetails(itemId);
            });
        });

        // Action button clicks
        document.querySelectorAll('.item-action-btn').forEach(btn => {
            btn.removeEventListener('click', this.actionButtonHandler);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                console.log('Action button clicked:', itemId);
                this.showActionModal(itemId);
            });
        });
    }

    showItemDetails(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.getElementById('itemDetailsModal');
        const titleEl = document.getElementById('itemDetailsTitle');
        const contentEl = document.getElementById('itemDetailsContent');

        if (titleEl) {
            titleEl.textContent = item.itemName;
        }
        
        if (contentEl) {
            contentEl.innerHTML = this.createItemDetailsHTML(item);
        }

        if (modal) {
            modal.classList.remove('hidden');
            console.log('Item details modal opened');
        }
    }

    createItemDetailsHTML(item) {
        const isResolved = item.status === 'resolved';
        
        return `
            <div class="detail-section">
                <h4>Item Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${item.type === 'lost' ? 'Lost Item' : 'Found Item'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${this.escapeHtml(item.category)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${isResolved ? '✓ Resolved' : '🔄 Active'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Urgency:</span>
                    <span class="detail-value">${item.urgency}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Description:</span>
                    <span class="detail-value">${this.escapeHtml(item.description)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h4>Location Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${this.escapeHtml(item.location)}</span>
                </div>
                ${item.currentLocation ? `
                <div class="detail-row">
                    <span class="detail-label">Current Location:</span>
                    <span class="detail-value">${this.escapeHtml(item.currentLocation)}</span>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Reporter:</span>
                    <span class="detail-value">${this.escapeHtml(item.reporterName)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value"><a href="mailto:${item.contactEmail}" target="_blank">${this.escapeHtml(item.contactEmail)}</a></span>
                </div>
                ${item.contactPhone ? `
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value"><a href="tel:${item.contactPhone}">${this.escapeHtml(item.contactPhone)}</a></span>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h4>Timeline</h4>
                <div class="detail-row">
                    <span class="detail-label">Reported:</span>
                    <span class="detail-value">${this.formatDate(item.createdAt)}</span>
                </div>
                ${item.resolvedAt ? `
                <div class="detail-row">
                    <span class="detail-label">Resolved:</span>
                    <span class="detail-value">${this.formatDate(item.resolvedAt)}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    showActionModal(itemId) {
        this.currentActionItemId = itemId;
        const modal = document.getElementById('actionModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Action modal opened');
        }
    }

    async markItemAsResolved() {
        if (!this.currentActionItemId) return;

        const markResolvedBtn = document.getElementById('markResolvedBtn');
        const btnText = markResolvedBtn?.querySelector('.btn-text');
        const btnSpinner = markResolvedBtn?.querySelector('.btn-spinner');
        
        // Show loading state
        if (btnText && btnSpinner) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        }
        if (markResolvedBtn) {
            markResolvedBtn.disabled = true;
        }

        try {
            if (this.db) {
                // Update in Firestore
                const itemRef = doc(this.db, 'items', this.currentActionItemId);
                await updateDoc(itemRef, {
                    status: 'resolved',
                    resolvedAt: serverTimestamp()
                });
                console.log('Item marked as resolved in Firestore');
            } else {
                // Fallback: update local array
                const item = this.items.find(i => i.id === this.currentActionItemId);
                if (item) {
                    item.status = 'resolved';
                    item.resolvedAt = new Date().toISOString();
                    this.updateStatistics();
                    this.renderRecentItems();
                    this.renderAllItems();
                }
            }

            this.closeModal(document.getElementById('actionModal'));
            this.showToast('Item marked as resolved!', 'success');

        } catch (error) {
            console.error('Error updating item:', error);
            this.showToast('Failed to update item. Please try again.', 'error');
        } finally {
            // Reset button state
            if (btnText && btnSpinner) {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }
            if (markResolvedBtn) {
                markResolvedBtn.disabled = false;
            }
            this.currentActionItemId = null;
        }
    }

    async deleteItem() {
        if (!this.currentActionItemId) return;

        const deleteItemBtn = document.getElementById('deleteItemBtn');
        const btnText = deleteItemBtn?.querySelector('.btn-text');
        const btnSpinner = deleteItemBtn?.querySelector('.btn-spinner');
        
        // Show loading state
        if (btnText && btnSpinner) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        }
        if (deleteItemBtn) {
            deleteItemBtn.disabled = true;
        }

        try {
            if (this.db) {
                // Delete from Firestore
                await deleteDoc(doc(this.db, 'items', this.currentActionItemId));
                console.log('Item deleted from Firestore');
            } else {
                // Fallback: remove from local array
                this.items = this.items.filter(item => item.id !== this.currentActionItemId);
                this.updateStatistics();
                this.renderRecentItems();
                this.renderAllItems();
            }

            this.closeModal(document.getElementById('actionModal'));
            this.showToast('Item deleted permanently!', 'success');

        } catch (error) {
            console.error('Error deleting item:', error);
            this.showToast('Failed to delete item. Please try again.', 'error');
        } finally {
            // Reset button state
            if (btnText && btnSpinner) {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }
            if (deleteItemBtn) {
                deleteItemBtn.disabled = false;
            }
            this.currentActionItemId = null;
        }
    }

    updateStatistics() {
        const totalItems = this.items.length;
        const lostItems = this.items.filter(item => item.type === 'lost' && item.status === 'active').length;
        const foundItems = this.items.filter(item => item.type === 'found' && item.status === 'active').length;
        const recoveredItems = this.items.filter(item => item.status === 'resolved').length;

        const totalItemsEl = document.getElementById('totalItems');
        const lostItemsEl = document.getElementById('lostItems');
        const foundItemsEl = document.getElementById('foundItems');
        const recoveredItemsEl = document.getElementById('recoveredItems');

        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (lostItemsEl) lostItemsEl.textContent = lostItems;
        if (foundItemsEl) foundItemsEl.textContent = foundItems;
        if (recoveredItemsEl) recoveredItemsEl.textContent = recoveredItems;
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✓' : '⚠'}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getEmptyStateHTML(message) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h4>${message}</h4>
                <p>Check back later or try adjusting your filters.</p>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup method
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lostAndFoundApp = new LostAndFoundApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.lostAndFoundApp) {
        window.lostAndFoundApp.destroy();
    }
});