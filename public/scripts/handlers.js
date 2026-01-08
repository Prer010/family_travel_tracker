// Handler Functions for Family Travel Tracker

// Global variables
let currentUserId = null;
let currentUserName = null;
let currentUserColor = null;
let deletedCountries = [];

// Autocomplete variables
let autocompleteTimeout;
let selectedIndex = -1;
let countryInput;
let autocompleteDropdown;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    countryInput = document.getElementById('countryInput');
    autocompleteDropdown = document.getElementById('autocompleteDropdown');

    // Setup autocomplete event listeners
    setupAutocomplete();

    // Setup modal event listeners
    setupModalListeners();

    // Setup context menu listeners
    setupContextMenuListeners();

    // Check for error messages in URL
    checkForErrors();
});

/**
 * Check for error message in URL and show alert
 */
function checkForErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
        alert(errorMessage);
        // Remove error parameter from URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// ============ AUTOCOMPLETE FUNCTIONS ============

/**
 * Setup autocomplete event listeners
 */
function setupAutocomplete() {
    if (!countryInput || !autocompleteDropdown) return;

    countryInput.addEventListener('input', function () {
        const query = this.value.trim();

        clearTimeout(autocompleteTimeout);

        if (query.length < 1) {
            hideAutocomplete();
            return;
        }

        // Debounce the search
        autocompleteTimeout = setTimeout(() => {
            searchCountries(query);
        }, 300);
    });

    countryInput.addEventListener('keydown', function (e) {
        const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.key === 'Escape') {
            hideAutocomplete();
        }
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', function (e) {
        if (!countryInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

/**
 * Search countries via API
 */
function searchCountries(query) {
    fetch(`/api/countries/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(countries => {
            displayAutocomplete(countries);
        })
        .catch(error => {
            console.error('Error searching countries:', error);
        });
}

/**
 * Display autocomplete results
 */
function displayAutocomplete(countries) {
    autocompleteDropdown.innerHTML = '';
    selectedIndex = -1;

    if (countries.length === 0) {
        autocompleteDropdown.innerHTML = '<div class="autocomplete-no-results">No countries found</div>';
        autocompleteDropdown.style.display = 'block';
        return;
    }

    countries.forEach((country, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = country.country_name;
        item.addEventListener('click', () => {
            countryInput.value = country.country_name;
            hideAutocomplete();
            countryInput.focus();
        });
        autocompleteDropdown.appendChild(item);
    });

    autocompleteDropdown.style.display = 'block';
}

/**
 * Update selected item in autocomplete
 */
function updateSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Hide autocomplete dropdown
 */
function hideAutocomplete() {
    autocompleteDropdown.style.display = 'none';
    autocompleteDropdown.innerHTML = '';
    selectedIndex = -1;
}

// ============ CONTEXT MENU FUNCTIONS ============

/**
 * Setup context menu listeners
 */
function setupContextMenuListeners() {
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', hideContextMenu);

    document.addEventListener('contextmenu', function (e) {
        if (!e.target.closest('.color-red, .color-orange, .color-yellow, .color-olive, .color-green, .color-teal, .color-blue, .color-violet, .color-purple, .color-pink')) {
            hideContextMenu();
        }
    });
}

/**
 * Show context menu
 */
function showContextMenu(event, userId, userName, userColor) {
    event.preventDefault();
    currentUserId = userId;
    currentUserName = userName;
    currentUserColor = userColor;

    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
}

/**
 * Hide context menu
 */
function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

// ============ EDIT MODAL FUNCTIONS ============

/**
 * Open edit modal
 */
function openEditModal() {
    hideContextMenu();
    document.getElementById('modalTitle').textContent = `Edit ${currentUserName}`;

    // Fetch user's visited countries
    fetch(`/api/user/${currentUserId}/countries`)
        .then(response => response.json())
        .then(countries => {
            populateCountriesList(countries);
            const modal = document.getElementById('editModal');
            modal.style.display = 'flex';

            // Animate modal
            animateEditModal();
        })
        .catch(error => {
            console.error('Error fetching countries:', error);
            alert('Error loading countries');
        });
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    deletedCountries = []; // Reset deleted countries when closing
}

/**
 * Populate countries list in modal
 */
function populateCountriesList(countries) {
    const countriesList = document.getElementById('countriesList');
    countriesList.innerHTML = '';
    deletedCountries = []; // Reset deleted countries array

    if (countries.length === 0) {
        countriesList.innerHTML = '<p style="text-align: center; color: #888;">No countries visited yet</p>';
        return;
    }

    countries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        countryItem.innerHTML = `
      <span class="country-name">${country.country_name}</span>
      <button class="delete-country-btn" onclick="removeCountry('${country.country_code}', this)">
        <i class="ri-delete-bin-line"></i>
      </button>
    `;
        countriesList.appendChild(countryItem);
    });
}

/**
 * Remove country from list
 */
function removeCountry(countryCode, button) {
    // Add to deletion list (stage for deletion)
    deletedCountries.push(countryCode);

    // Remove from UI immediately for visual feedback
    button.parentElement.remove();

    // Show empty message if no countries left
    const countriesList = document.getElementById('countriesList');
    if (countriesList.children.length === 0) {
        countriesList.innerHTML = '<p style="text-align: center; color: #888;">No countries visited yet</p>';
    }
}

/**
 * Save changes to countries
 */
function saveChanges() {
    // Send DELETE requests for all staged countries when Save is clicked
    if (deletedCountries.length === 0) {
        // No countries to delete, just close modal and refresh
        closeEditModal();
        location.reload();
        return;
    }

    // Send batch PATCH request with all deleted countries
    fetch(`/api/user/${currentUserId}/countries`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            deletedCountries: deletedCountries
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeEditModal();
                location.reload(); // Refresh to update the map
            } else {
                alert('Error saving changes');
            }
        })
        .catch(error => {
            console.error('Error saving changes:', error);
            alert('Error saving changes');
        });
}

// ============ RENAME MODAL FUNCTIONS ============

/**
 * Open rename modal
 */
function openRenameModal() {
    hideContextMenu();
    const newNameInput = document.getElementById('newName');
    newNameInput.value = currentUserName; // Pre-fill with current name
    const modal = document.getElementById('renameModal');
    modal.style.display = 'flex';

    // Animate modal
    animateRenameModal();

    // Focus on input after a small delay to ensure modal is visible
    setTimeout(() => {
        newNameInput.focus();
        newNameInput.select();
    }, 100);
}

/**
 * Close rename modal
 */
function closeRenameModal() {
    document.getElementById('renameModal').style.display = 'none';
    document.getElementById('newName').value = '';
}

/**
 * Save renamed family member
 */
function saveRename() {
    const newName = document.getElementById('newName').value.trim();

    if (!newName) {
        alert('Please enter a valid name');
        return;
    }

    if (newName === currentUserName) {
        alert('The new name is the same as the current name');
        return;
    }

    // Send PATCH request to update the family member's name
    fetch(`/api/user/${currentUserId}/rename`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            newName: newName
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeRenameModal();
                location.reload(); // Refresh to update the UI
            } else {
                alert(data.message || 'Error renaming family member');
            }
        })
        .catch(error => {
            console.error('Error renaming family member:', error);
            alert('Error renaming family member');
        });
}

// ============ MODAL SETUP ============

/**
 * Setup modal event listeners
 */
function setupModalListeners() {
    // Close edit modal when clicking outside
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeEditModal();
            }
        });
    }

    // Close rename modal when clicking outside
    const renameModal = document.getElementById('renameModal');
    if (renameModal) {
        renameModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeRenameModal();
            }
        });
    }
}

// ============ FAMILY MEMBER FUNCTIONS ============

/**
 * Delete family member
 */
function deleteFamilyMember() {
    hideContextMenu();

    if (confirm(`Are you sure you want to delete ${currentUserName}? This will also delete all their visited countries.`)) {
        fetch(`/api/user/${currentUserId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Error deleting family member');
                }
            })
            .catch(error => {
                console.error('Error deleting family member:', error);
                alert('Error deleting family member');
            });
    }
}

// ============ ACCOUNT FUNCTIONS ============

/**
 * Delete account
 */
function deleteAccount() {
    const confirmMessage = 'Are you sure you want to delete your account? This will permanently delete:\\n\\n• Your account\\n• All family members\\n• All visited countries data\\n\\nThis action cannot be undone!';

    if (confirm(confirmMessage)) {
        // Second confirmation for safety
        if (confirm('This is your final warning. Delete account permanently?')) {
            fetch('/api/account', {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Account deleted successfully');
                        window.location.href = '/';
                    } else {
                        alert('Error deleting account');
                    }
                })
                .catch(error => {
                    console.error('Error deleting account:', error);
                    alert('Error deleting account');
                });
        }
    }
}
