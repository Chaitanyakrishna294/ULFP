
// Additional utility functions for the remove feature

// Close modal function
function closeModal(element) {
  const modal = element.closest('.modal');
  if (modal) {
    modal.remove();
  }
}

// Enhanced toast notification system
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${getToastIcon(type)}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.remove('hidden');
  }, 100);

  // Auto-hide toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function getToastIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  return icons[type] || icons.info;
}

// Enhanced item modal opening (this might already exist but here's an enhanced version)
function openItemModal(itemId) {
  const item = currentItems.find(i => i.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return;
  }

  const category = getCategoryInfo(item.category);
  const urgencyClass = getUrgencyClass(item.urgency);
  const urgencyIcon = getUrgencyIcon(item.urgency);
  const date = formatDate(item.createdAt);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${item.itemName}</h2>
        <button class="modal-close" onclick="closeModal(this)">&times;</button>
      </div>
      <div class="modal-body">
        <div class="item-detail-grid">
          <div class="item-images">
            ${item.images && item.images.length > 0 ? `
              <img src="${item.images[0]}" alt="${item.itemName}" class="item-main-image">
              ${item.images.length > 1 ? `
                <div class="item-thumbnail-grid">
                  ${item.images.slice(1).map(img => 
                    `<img src="${img}" alt="${item.itemName}" class="item-thumbnail" 
                          onclick="this.closest('.item-images').querySelector('.item-main-image').src = this.src">`
                  ).join('')}
                </div>
              ` : ''}
            ` : `
              <div class="item-main-image">${category.icon}</div>
            `}
          </div>
          <div class="item-info">
            <div class="item-header-info">
              <div class="item-type item-type--${item.type}">${item.type === 'lost' ? 'Lost' : 'Found'}</div>
              <div class="item-urgency ${urgencyClass}">${urgencyIcon} ${item.urgency} priority</div>
              ${item.status === 'resolved' ? '<div class="status-badge status-resolved">✓ Resolved</div>' : ''}
            </div>

            <div class="item-details">
              <h4>Description</h4>
              <p>${item.description}</p>

              <h4>Category</h4>
              <p>${category.name} ${category.icon}</p>

              <h4>${item.type === 'lost' ? 'Last seen at' : 'Found at'}</h4>
              <p>📍 ${item.location}</p>

              ${item.currentLocation && item.type === 'found' ? `
                <h4>Current location</h4>
                <p>📍 ${item.currentLocation}</p>
              ` : ''}

              ${item.additionalNotes ? `
                <h4>Additional notes</h4>
                <p>${item.additionalNotes}</p>
              ` : ''}

              <h4>Reported</h4>
              <p>${date}${item.reporterName ? ` by ${item.reporterName}` : ''}</p>
            </div>

            ${item.status === 'active' ? `
              <div class="contact-section">
                <h4>Contact Information</h4>
                <div class="contact-info">
                  ${item.contactEmail ? `
                    <div class="contact-item">
                      <span>📧</span>
                      <a href="mailto:${item.contactEmail}">${item.contactEmail}</a>
                    </div>
                  ` : ''}
                  ${item.contactPhone ? `
                    <div class="contact-item">
                      <span>📞</span>
                      <a href="tel:${item.contactPhone}">${item.contactPhone}</a>
                    </div>
                  ` : ''}
                </div>
                <button class="btn btn--primary contact-button" onclick="window.location.href='mailto:${item.contactEmail}?subject=Regarding ${item.type}: ${item.itemName}'">
                  Contact Reporter
                </button>
              </div>

              <div class="item-actions-section">
                <h4>Item Actions</h4>
                <div class="resolve-actions">
                  <button class="btn btn--success resolve-btn" onclick="handleResolveItem('${item.id}')">
                    ✓ Mark as Found/Resolved
                  </button>
                  <p class="action-description">Mark this item as resolved. It will remain in the system for reference.</p>

                  <button class="btn btn--danger delete-btn" onclick="handleDeleteItem('${item.id}')">
                    🗑️ Delete Permanently
                  </button>
                  <p class="action-description">Permanently delete this item from the system. This action cannot be undone.</p>
                </div>
              </div>
            ` : `
              <div class="resolved-notice">
                <p><strong>This item has been resolved.</strong></p>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.add('active');

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Search and filter functions (enhanced to handle resolved items)
function filterItems() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const selectedCategory = document.getElementById('categoryFilter')?.value || '';
  const selectedType = document.getElementById('typeFilter')?.value || '';
  const selectedUrgency = document.getElementById('urgencyFilter')?.value || '';
  const selectedStatus = document.getElementById('statusFilter')?.value || 'active'; // Default to active

  console.log('Filtering items:', { searchTerm, selectedCategory, selectedType, selectedUrgency, selectedStatus });

  filteredItems = currentItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.itemName.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm);

    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesType = !selectedType || item.type === selectedType;
    const matchesUrgency = !selectedUrgency || item.urgency === selectedUrgency;
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesType && matchesUrgency && matchesStatus;
  });

  console.log('Filtered results:', filteredItems.length);
  renderBrowseItems();
}

// Event listeners setup (call this in your DOMContentLoaded event)
function setupEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterItems, 300);
    });
  }

  // Filter dropdowns
  ['categoryFilter', 'typeFilter', 'urgencyFilter', 'statusFilter'].forEach(filterId => {
    const filter = document.getElementById(filterId);
    if (filter) {
      filter.addEventListener('change', filterItems);
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }
  });

  // Online/offline status
  window.addEventListener('online', () => {
    isOnline = true;
    showToast('Connection restored', 'success');
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    showToast('Working offline', 'info');
  });
}
