document.addEventListener('DOMContentLoaded', () => {
    const certificationsContainer = document.getElementById('certifications');
    const searchInput = document.getElementById('search');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const sortByNameButton = document.getElementById('sortByName');
    const sortByDateButton = document.getElementById('sortByDate');
    const countBadge = document.getElementById('count');
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const filtersSection = document.getElementById('filtersSection');
    const toggleIcon = document.getElementById('toggleIcon');
    const loadingState = document.getElementById('loadingState');
    const activeFiltersSection = document.getElementById('activeFilters');
    const filterTags = document.getElementById('filterTags');
    const clearAllFiltersBtn = document.getElementById('clearAllFilters');
    const clearSearchBtn = document.getElementById('clearSearch');
    const dateError = document.getElementById('dateError');

    let certifications = [];
    let filteredCerts = [];
    let currentSort = { field: 'date', order: 'desc' };

    // Principle 1: Visibility of System Status
    async function fetchCertifications() {
        loadingState.style.display = 'block';
        try {
            const response = await fetch('certificates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            certifications = await response.json();
            
            // Add highlight property for demonstration (top certifications)
            if (certifications.length > 0) certifications[0].highlight = true;
            if (certifications.length > 6) certifications[6].highlight = true;
            if (certifications.length > 11) certifications[11].highlight = true;
            
            filteredCerts = [...certifications];
            loadingState.style.display = 'none';
            applySortAndRender();
        } catch (error) {
            // Principle 9: Help Users Recognize, Diagnose, and Recover from Errors
            console.error('Error fetching certifications:', error);
            loadingState.innerHTML = `
                <div style="color: var(--text-dark);">
                    <p style="font-size: 2rem; margin-bottom: 10px;">⚠️</p>
                    <p style="font-weight: 600; margin-bottom: 10px;">Unable to load certifications</p>
                    <p style="color: var(--text-light); font-size: 0.9rem;">The certificates.json file could not be loaded. Please check:</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 10px; color: var(--text-light); font-size: 0.9rem;">
                        <li>The file exists in the public folder</li>
                        <li>Your internet connection</li>
                        <li>The browser console for more details</li>
                    </ul>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🔄 Try Again</button>
                </div>
            `;
        }
    }

    // Principle 6: Recognition Rather Than Recall
    function renderCertifications(certs) {
        certificationsContainer.innerHTML = '';
        countBadge.textContent = certs.length;
        
        // Sort highlighted certs first, then by current sort
        const displayCerts = [...certs].sort((a, b) => {
            if (a.highlight && !b.highlight) return -1;
            if (!a.highlight && b.highlight) return 1;
            return 0;
        });

        // Principle 2: Match between System and Real World
        if (displayCerts.length === 0) {
            certificationsContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-light); grid-column: 1/-1; padding: 40px 20px;">
                    <p style="font-size: 2rem; margin-bottom: 10px;">🔍</p>
                    <p style="font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">No certifications found</p>
                    <p style="font-size: 0.9rem;">Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        displayCerts.forEach(cert => {
            const certElement = document.createElement('div');
            certElement.classList.add('certification');

            if (cert.highlight) {
                certElement.classList.add('highlight');
            }

            if (!cert.link || cert.link === 'undefined') {
                certElement.classList.add('no-link');
            }

            const title = document.createElement('h3');
            title.textContent = cert.title;

            const enterprise = document.createElement('p');
            enterprise.innerHTML = `<strong>🏢 Enterprise:</strong> ${cert.enterprise}`;

            const expeditionDate = document.createElement('p');
            const expDate = new Date(cert.expeditionDate.replace(/\//g, '-'));
            expeditionDate.innerHTML = `<strong>📅 Issued:</strong> ${expDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            
            certElement.appendChild(title);
            certElement.appendChild(enterprise);
            certElement.appendChild(expeditionDate);

            if (cert.expiryDate) {
                const expiryDate = document.createElement('p');
                const expiry = new Date(cert.expiryDate.replace(/\//g, '-'));
                expiryDate.innerHTML = `<strong>⏰ Expires:</strong> ${expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                certElement.appendChild(expiryDate);
            }

            if (cert.link && cert.link !== 'undefined') {
                const link = document.createElement('a');
                link.href = cert.link;
                link.textContent = '🔗 View Certificate';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                certElement.appendChild(link);
            }

            certificationsContainer.appendChild(certElement);
        });
    }

    function applyFilters() {
        filteredCerts = [...certifications];

        // Principle 5: Error Prevention - Date validation
        if (startDateInput.value && endDateInput.value) {
            const start = new Date(startDateInput.value);
            const end = new Date(endDateInput.value);
            if (start > end) {
                dateError.style.display = 'block';
                endDateInput.style.borderColor = '#ef4444';
                updateActiveFilters();
                return;
            }
        }
        dateError.style.display = 'none';
        endDateInput.style.borderColor = '';

        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filteredCerts = filteredCerts.filter(cert => 
                cert.title.toLowerCase().includes(searchTerm) || 
                cert.enterprise.toLowerCase().includes(searchTerm)
            );
        }

        const startDate = startDateInput.value;
        if (startDate) {
            filteredCerts = filteredCerts.filter(cert => 
                new Date(cert.expeditionDate.replace(/\//g, '-')) >= new Date(startDate)
            );
        }

        const endDate = endDateInput.value;
        if (endDate) {
            filteredCerts = filteredCerts.filter(cert => 
                new Date(cert.expeditionDate.replace(/\//g, '-')) <= new Date(endDate)
            );
        }
        
        updateActiveFilters();
        applySortAndRender();
    }

    function applySortAndRender() {
        const sorted = [...filteredCerts].sort((a, b) => {
            if (currentSort.field === 'name') {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();
                return currentSort.order === 'asc' 
                    ? titleA.localeCompare(titleB)
                    : titleB.localeCompare(titleA);
            } else {
                // Convert YYYY/MM/DD format to proper date
                const dateA = new Date(a.expeditionDate.replace(/\//g, '-'));
                const dateB = new Date(b.expeditionDate.replace(/\//g, '-'));
                return currentSort.order === 'asc' 
                    ? dateA - dateB
                    : dateB - dateA;
            }
        });
        
        renderCertifications(sorted);
    }

    // Principle 1 & 6: System Status + Recognition
    function updateActiveFilters() {
        filterTags.innerHTML = '';
        let hasFilters = false;

        if (searchInput.value.trim()) {
            hasFilters = true;
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.innerHTML = `Search: "${searchInput.value}" <span class="remove-tag" data-filter="search">×</span>`;
            filterTags.appendChild(tag);
        }

        if (startDateInput.value) {
            hasFilters = true;
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            const date = new Date(startDateInput.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            tag.innerHTML = `From: ${date} <span class="remove-tag" data-filter="startDate">×</span>`;
            filterTags.appendChild(tag);
        }

        if (endDateInput.value) {
            hasFilters = true;
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            const date = new Date(endDateInput.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            tag.innerHTML = `To: ${date} <span class="remove-tag" data-filter="endDate">×</span>`;
            filterTags.appendChild(tag);
        }

        activeFiltersSection.style.display = hasFilters ? 'flex' : 'none';

        // Add click handlers for remove buttons
        filterTags.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterType = btn.getAttribute('data-filter');
                if (filterType === 'search') searchInput.value = '';
                else if (filterType === 'startDate') startDateInput.value = '';
                else if (filterType === 'endDate') endDateInput.value = '';
                applyFilters();
            });
        });
    }

    function updateSortIndicators() {
        [sortByNameButton, sortByDateButton].forEach(btn => {
            btn.setAttribute('data-active', 'false');
            btn.querySelector('.sort-indicator').textContent = '';
        });

        const activeButton = currentSort.field === 'name' ? sortByNameButton : sortByDateButton;
        activeButton.setAttribute('data-active', 'true');
        activeButton.querySelector('.sort-indicator').textContent = currentSort.order === 'asc' ? '▲' : '▼';
    }

    function sortByName() {
        if (currentSort.field === 'name') {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = { field: 'name', order: 'asc' };
        }
        updateSortIndicators();
        applySortAndRender();
    }

    function sortByDate() {
        if (currentSort.field === 'date') {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = { field: 'date', order: 'desc' };
        }
        updateSortIndicators();
        applySortAndRender();
    }

    // Principle 3: User Control and Freedom
    function clearAllFilters() {
        searchInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        dateError.style.display = 'none';
        endDateInput.style.borderColor = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    }

    // Toggle filters section
    toggleFiltersBtn.addEventListener('click', () => {
        filtersSection.classList.toggle('collapsed');
        toggleIcon.classList.toggle('collapsed');
    });

    // Principle 3: User Control and Freedom
    clearAllFiltersBtn.addEventListener('click', clearAllFilters);
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    });

    // Show/hide clear search button
    searchInput.addEventListener('input', () => {
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        applyFilters();
    });

    // Event listeners
    startDateInput.addEventListener('change', applyFilters);
    endDateInput.addEventListener('change', applyFilters);
    sortByNameButton.addEventListener('click', sortByName);
    sortByDateButton.addEventListener('click', sortByDate);

    // Principle 7: Flexibility and Efficiency of Use - Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to clear filters
        if (e.key === 'Escape') {
            if (searchInput.value || startDateInput.value || endDateInput.value) {
                clearAllFilters();
            }
        }
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            if (filtersSection.classList.contains('collapsed')) {
                filtersSection.classList.remove('collapsed');
                toggleIcon.classList.remove('collapsed');
            }
        }
    });

    // Initialize
    fetchCertifications();
});
