// Firebase Configuration and Sample Data
const firebaseConfig = {
  apiKey: "AIzaSyAtPAwF5KGNG-AIa0sSe37KzsGgmEy3u1w",
  authDomain: "ulfp-a7e8b.firebaseapp.com",
  projectId: "ulfp-a7e8b",
  storageBucket: "ulfp-a7e8b.firebasestorage.app",
  messagingSenderId: "641228955536",
  appId: "1:641228955536:web:5c4383bd52d104ccc75d15",
  measurementId: "G-B2H2TDSGX1"
};

// Sample data for fallback
const sampleItems = [
  {
    id: "sample_1",
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
    createdAt: new Date().toISOString()
  },
  {
    id: "sample_2",
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
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: "sample_3",
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
    createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

// Categories Data
const categories = [
  {
    id: "electronics",
    name: "Electronics",
    icon: "📱",
    description: "Phones, laptops, chargers, earphones, tablets"
  },
  {
    id: "documents",
    name: "Documents",
    icon: "📄",
    description: "ID cards, certificates, important papers"
  },
  {
    id: "clothing",
    name: "Clothing",
    icon: "👕",
    description: "Shirts, jackets, shoes, uniforms"
  },
  {
    id: "accessories",
    name: "Accessories",
    icon: "👜",
    description: "Bags, wallets, jewelry, watches"
  },
  {
    id: "books",
    name: "Books",
    icon: "📚",
    description: "Textbooks, notebooks, study materials"
  },
  {
    id: "keys",
    name: "Keys",
    icon: "🔑",
    description: "Room keys, bike keys, keychains"
  },
  {
    id: "others",
    name: "Others",
    icon: "🎒",
    description: "Water bottles, umbrellas, sports items"
  }
];

// Global state
let currentItems = [];
let filteredItems = [];
let selectedImages = [];
let searchTimeout = null;
let db = null;
let isOnline = navigator.onLine;
let realtimeUnsubscribe = null;

// Utility Functions
function formatDate(timestamp) {
  console.log('Formatting date:', timestamp);
  if (!timestamp) return 'Just now';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getCategoryInfo(categoryId) {
  return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
}

function getUrgencyClass(urgency) {
  const urgencyMap = {
    high: 'urgency-high',
    medium: 'urgency-medium',
    low: 'urgency-low'
  };
  return urgencyMap[urgency] || 'urgency-low';
}

function getUrgencyIcon(urgency) {
  const urgencyIcons = {
    high: '🚨',
    medium: '⚠️',
    low: 'ℹ️'
  };
  return urgencyIcons[urgency] || 'ℹ️';
}

// Initialize Firebase
function initializeFirebase() {
  try {
    console.log('Initializing Firebase...');
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// NEW: Remove/Resolve Item Function
async function resolveItem(itemId) {
  try {
    console.log('Resolving item:', itemId);

    // Show loading state
    showToast('Resolving item...', 'info');

    if (isOnline && db) {
      try {
        // Update in Firestore - mark as resolved instead of deleting
        await db.collection('items').doc(itemId).update({
          status: 'resolved',
          resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Item resolved in Firestore');
      } catch (firestoreError) {
        console.error('Firestore resolve error:', firestoreError);
        // Continue with local update
      }
    }

    // Update local arrays
    currentItems = currentItems.map(item => 
      item.id === itemId ? { ...item, status: 'resolved' } : item
    );
    filteredItems = filteredItems.map(item => 
      item.id === itemId ? { ...item, status: 'resolved' } : item
    );

    // Re-render UI
    renderAllItems();

    showToast('Item marked as resolved!', 'success');
    return { success: true };

  } catch (error) {
    console.error('Error resolving item:', error);
    showToast('Failed to resolve item. Please try again.', 'error');
    throw error;
  }
}

// NEW: Permanently Delete Item Function
async function deleteItem(itemId) {
  try {
    console.log('Deleting item:', itemId);

    // Show loading state
    showToast('Deleting item...', 'info');

    if (isOnline && db) {
      try {
        // Delete from Firestore
        await db.collection('items').doc(itemId).delete();
        console.log('Item deleted from Firestore');
      } catch (firestoreError) {
        console.error('Firestore delete error:', firestoreError);
        // Continue with local deletion
      }
    }

    // Remove from local arrays
    currentItems = currentItems.filter(item => item.id !== itemId);
    filteredItems = filteredItems.filter(item => item.id !== itemId);

    // Re-render UI
    renderAllItems();

    showToast('Item deleted successfully!', 'success');
    return { success: true };

  } catch (error) {
    console.error('Error deleting item:', error);
    showToast('Failed to delete item. Please try again.', 'error');
    throw error;
  }
}

// NEW: Show Resolve/Delete Confirmation Modal
function showResolveModal(itemId, itemName) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Item Actions</h2>
        <button class="modal-close" onclick="closeModal(this)">&times;</button>
      </div>
      <div class="modal-body">
        <h3>${itemName}</h3>
        <p>What would you like to do with this item?</p>

        <div class="resolve-actions">
          <button class="btn btn--success resolve-btn" onclick="handleResolveItem('${itemId}')">
            ✓ Mark as Found/Resolved
          </button>
          <p class="action-description">Mark this item as resolved. It will be moved to resolved items but remain in the system for reference.</p>

          <button class="btn btn--danger delete-btn" onclick="handleDeleteItem('${itemId}')">
            🗑️ Delete Permanently
          </button>
          <p class="action-description">Permanently delete this item from the system. This action cannot be undone.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.add('active');
}

// NEW: Handle Resolve Item Action
async function handleResolveItem(itemId) {
  try {
    await resolveItem(itemId);
    // Close all modals
    document.querySelectorAll('.modal').forEach(modal => modal.remove());
  } catch (error) {
    console.error('Failed to resolve item:', error);
  }
}

// NEW: Handle Delete Item Action
async function handleDeleteItem(itemId) {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteItem(itemId);
    // Close all modals
    document.querySelectorAll('.modal').forEach(modal => modal.remove());
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}

// Enhanced Item Rendering Functions
function renderRecentItems() {
  console.log('Rendering recent items, count:', currentItems.length);
  const container = document.getElementById('recent-items-grid');
  const loading = document.getElementById('recent-items-loading');
  const empty = document.getElementById('recent-items-empty');

  console.log('Recent items DOM elements:', { 
    container: !!container, 
    loading: !!loading, 
    empty: !!empty 
  });

  if (!container) {
    console.error('Recent items container not found');
    return;
  }

  // Hide loading
  if (loading) loading.classList.add('hidden');

  // Filter out resolved items for recent display
  const activeItems = currentItems.filter(item => item.status === 'active');

  if (activeItems.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    return;
  }

  // Show recent items
  container.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');

  const recentItems = activeItems.slice(0, 8);
  console.log('Displaying recent items:', recentItems);
  container.innerHTML = recentItems.map(item => createItemCard(item)).join('');
}

function renderBrowseItems() {
  console.log('Rendering browse items, count:', filteredItems.length);
  const container = document.getElementById('browse-items-grid');
  const loading = document.getElementById('browse-items-loading');
  const empty = document.getElementById('browse-items-empty');
  const resultsCount = document.getElementById('resultsCount');

  console.log('Browse items DOM elements:', { 
    container: !!container, 
    loading: !!loading, 
    empty: !!empty 
  });

  if (!container) {
    console.error('Browse items container not found');
    return;
  }

  // Hide loading
  if (loading) loading.classList.add('hidden');

  // Update results count
  if (resultsCount) {
    resultsCount.textContent = `${filteredItems.length} items found`;
  }

  if (filteredItems.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    return;
  }

  // Show browse items
  container.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');

  console.log('Displaying browse items:', filteredItems);
  container.innerHTML = filteredItems.map(item => createItemCard(item)).join('');
}

function updateStats() {
  console.log('Updating statistics from items:', currentItems.length);
  const totalItems = currentItems.length;
  const lostItems = currentItems.filter(item => item.type === 'lost').length;
  const foundItems = currentItems.filter(item => item.type === 'found').length;
  const recoveredItems = currentItems.filter(item => item.status === 'resolved').length;

  console.log('Stats:', { totalItems, lostItems, foundItems, recoveredItems });

  const totalItemsStat = document.getElementById('totalItemsStat');
  const lostItemsStat = document.getElementById('lostItemsStat');
  const foundItemsStat = document.getElementById('foundItemsStat');
  const recoveredItemsStat = document.getElementById('recoveredItemsStat');

  if (totalItemsStat) totalItemsStat.textContent = totalItems;
  if (lostItemsStat) lostItemsStat.textContent = lostItems;
  if (foundItemsStat) foundItemsStat.textContent = foundItems;
  if (recoveredItemsStat) recoveredItemsStat.textContent = recoveredItems;
}

function renderAllItems() {
  console.log('Rendering all UI components with', currentItems.length, 'items');

  // Initialize filtered items with all current items if empty
  if (filteredItems.length === 0 && currentItems.length > 0) {
    filteredItems = [...currentItems];
  }

  renderRecentItems();
  renderBrowseItems();
  updateStats();
  console.log('UI rendering complete');
}

// Enhanced Real-time Listener
function setupRealtimeListener() {
  if (!db) {
    console.log('Database not available, using sample data');
    currentItems = [...sampleItems];
    filteredItems = [...sampleItems];
    renderAllItems();
    return;
  }

  console.log('Setting up Firestore real-time listener...');

  // Clean up existing listener
  if (realtimeUnsubscribe) {
    realtimeUnsubscribe();
  }

  realtimeUnsubscribe = db.collection('items')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        console.log('Firestore update received:', snapshot.docs.length, 'items');
        currentItems = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        });

        // If no items from Firestore, use sample data
        if (currentItems.length === 0) {
          console.log('No Firestore items, using sample data');
          currentItems = [...sampleItems];
        }

        filteredItems = [...currentItems];
        console.log('Current items updated:', currentItems);

        // Force UI update
        renderAllItems();
      },
      error => {
        console.error('Firestore listener error:', error);
        // Fallback to sample data
        console.log('Using sample data as fallback');
        currentItems = [...sampleItems];
        filteredItems = [...sampleItems];
        renderAllItems();
      }
    );
}

// Enhanced Item Submission
async function submitItem(itemData) {
  try {
    console.log('Submitting item:', itemData);

    let newItem = {
      ...itemData,
      id: 'local_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (isOnline && db) {
      try {
        // Add to Firestore
        const docRef = await db.collection('items').add({
          ...itemData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });
        console.log('Item added to Firestore with ID:', docRef.id);
        newItem.id = docRef.id;
      } catch (firestoreError) {
        console.error('Firestore submission error:', firestoreError);
        // Continue with local storage
      }
    }

    // Add to local array immediately for instant UI update
    currentItems.unshift(newItem);
    filteredItems.unshift(newItem);
    console.log('Item added to local arrays');

    // Force immediate UI update
    renderAllItems();

    return { success: true, id: newItem.id };
  } catch (error) {
    console.error('Error submitting item:', error);
    throw error;
  }
}

// MODIFIED: Enhanced createItemCard function with resolve/delete buttons
function createItemCard(item) {
  if (!item) {
    console.error('Cannot create card for null/undefined item');
    return '';
  }

  console.log('Creating item card for:', item.itemName);
  const category = getCategoryInfo(item.category);
  const urgencyClass = getUrgencyClass(item.urgency);
  const urgencyIcon = getUrgencyIcon(item.urgency);
  const date = formatDate(item.createdAt);

  const mainImage = item.images && item.images.length > 0 
    ? `<img src="${item.images[0]}" alt="${item.itemName}" class="item-card-image">` 
    : `<div class="item-card-placeholder">${category.icon}</div>`;

  // Add resolved status indicator
  const statusIndicator = item.status === 'resolved' 
    ? '<div class="status-badge status-resolved">✓ Resolved</div>' 
    : '';

  // Add action buttons (only for active items)
  const actionButtons = item.status === 'active' 
    ? `<div class="item-actions">
         <button class="action-btn resolve-action-btn" onclick="showResolveModal('${item.id}', '${item.itemName.replace(/'/g, '\'')}')" title="Mark as resolved or delete">
           ⚙️
         </button>
       </div>` 
    : '';

  return `
    <div class="item-card ${item.status === 'resolved' ? 'item-resolved' : ''}" onclick="openItemModal('${item.id}')">
      ${statusIndicator}
      ${actionButtons}
      <div class="item-card-header">
        <div class="item-type item-type--${item.type}">${item.type === 'lost' ? 'Lost' : 'Found'}</div>
        <div class="item-urgency ${urgencyClass}">${urgencyIcon}</div>
      </div>
      ${mainImage}
      <div class="item-card-content">
        <h3 class="item-title">${item.itemName}</h3>
        <p class="item-category">${category.name}</p>
        <p class="item-description">${item.description}</p>
        <div class="item-location">
          <span class="location-icon">📍</span>
          <span>${item.location}</span>
        </div>
        ${item.currentLocation && item.type === 'found' ? `
          <div class="item-current-location">
            <span class="location-icon">📍</span>
            <span>Currently at: ${item.currentLocation}</span>
          </div>
        ` : ''}
        ${item.additionalNotes ? `
          <div class="item-notes">
            <p>${item.additionalNotes}</p>
          </div>
        ` : ''}
      </div>
      <div class="item-card-footer">
        <span class="item-date">${date}${item.reporterName ? ` by ${item.reporterName}` : ''}</span>
      </div>
    </div>
  `;
}