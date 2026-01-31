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

    let certifications = [];
    let filteredCerts = [];
    let currentSort = { field: 'date', order: 'desc' };

    async function fetchCertifications() {
        try {
            const response = await fetch('certificates.json');
            certifications = await response.json();
            
            // Add highlight property for demonstration (top certifications)
            if (certifications.length > 0) certifications[0].highlight = true;
            if (certifications.length > 6) certifications[6].highlight = true;
            if (certifications.length > 11) certifications[11].highlight = true;
            
            filteredCerts = [...certifications];
            applySortAndRender();
        } catch (error) {
            console.error('Error fetching certifications:', error);
            certificationsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">⚠️ Error loading certifications. Please check the console.</p>';
        }
    }

    function renderCertifications(certs) {
        certificationsContainer.innerHTML = '';
        countBadge.textContent = certs.length;
        
        // Sort highlighted certs first, then by current sort
        const displayCerts = [...certs].sort((a, b) => {
            if (a.highlight && !b.highlight) return -1;
            if (!a.highlight && b.highlight) return 1;
            return 0;
        });

        if (displayCerts.length === 0) {
            certificationsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">🔍 No certifications found matching your criteria.</p>';
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

    // Toggle filters section
    toggleFiltersBtn.addEventListener('click', () => {
        filtersSection.classList.toggle('collapsed');
        toggleIcon.classList.toggle('collapsed');
    });

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    startDateInput.addEventListener('change', applyFilters);
    endDateInput.addEventListener('change', applyFilters);
    sortByNameButton.addEventListener('click', sortByName);
    sortByDateButton.addEventListener('click', sortByDate);

    // Initialize
    fetchCertifications();
});
