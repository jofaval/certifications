document.addEventListener('DOMContentLoaded', () => {
    const certificatesContainer = document.getElementById('certificates');
    const searchInput = document.getElementById('search');
    const sortByDateBtn = document.getElementById('sortByDate');
    const sortByNameBtn = document.getElementById('sortByName');
    const resultCountEl = document.getElementById('resultCount');
    const loadingEl = document.getElementById('loading');
    const clearSearchBtn = document.getElementById('clearSearch');

    let certificates = [];
    let filteredCerts = [];
    let currentSort = { field: 'date', order: 'desc' };

    // Fuzzy search function
    function fuzzySearch(needle, haystack) {
        if (!needle) return true;
        
        needle = needle.toLowerCase();
        haystack = haystack.toLowerCase();
        
        // Exact match bonus
        if (haystack.includes(needle)) return true;
        
        // Fuzzy match
        let needleIdx = 0;
        for (let i = 0; i < haystack.length && needleIdx < needle.length; i++) {
            if (haystack[i] === needle[needleIdx]) {
                needleIdx++;
            }
        }
        return needleIdx === needle.length;
    }

    async function loadCertificates() {
        loadingEl.style.display = 'block';
        try {
            const response = await fetch('certificates.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            certificates = await response.json();
            filteredCerts = [...certificates];
            
            loadingEl.style.display = 'none';
            applySortAndRender();
        } catch (error) {
            console.error('Error loading certificates:', error);
            loadingEl.innerHTML = `
                <div style="color: var(--color-primary);">
                    <p style="font-size: 2rem; margin-bottom: 10px;">⚠️</p>
                    <p style="font-weight: 600; margin-bottom: 10px;">Error al cargar certificaciones</p>
                    <p style="color: var(--color-secondary); font-size: 0.9rem;">Verifica la consola para más detalles.</p>
                </div>
            `;
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim();
        
        filteredCerts = certificates.filter(cert => {
            const searchableText = `${cert.title} ${cert.enterprise}`.toLowerCase();
            return fuzzySearch(searchTerm, searchableText);
        });
        
        applySortAndRender();
    }

    function applySortAndRender() {
        let sorted = [...filteredCerts];
        
        if (currentSort.field === 'name') {
            sorted.sort((a, b) => {
                const nameA = a.title.toLowerCase();
                const nameB = b.title.toLowerCase();
                return currentSort.order === 'asc' 
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            });
        } else {
            sorted.sort((a, b) => {
                const dateA = new Date(a.expeditionDate.replace(/\//g, '-'));
                const dateB = new Date(b.expeditionDate.replace(/\//g, '-'));
                return currentSort.order === 'asc' 
                    ? dateA - dateB
                    : dateB - dateA;
            });
        }
        
        // Prioritize highlighted certificates
        sorted.sort((a, b) => {
            if (a.highlight && !b.highlight) return -1;
            if (!a.highlight && b.highlight) return 1;
            return 0;
        });
        
        renderCertificates(sorted);
    }

    function renderCertificates(certs) {
        certificatesContainer.innerHTML = '';
        resultCountEl.textContent = certs.length;
        
        if (certs.length === 0) {
            certificatesContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No se encontraron certificaciones</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }
        
        certs.forEach(cert => {
            const certEl = document.createElement('div');
            certEl.classList.add('certificate');
            
            if (cert.highlight) {
                certEl.classList.add('featured');
            }
            
            const hasLink = cert.link && cert.link !== 'undefined';
            const expeditionDate = new Date(cert.expeditionDate.replace(/\//g, '-'));
            const formattedDate = expeditionDate.toLocaleDateString('es-ES', {
                month: 'short',
                year: 'numeric'
            });
            
            let expireDateHTML = '';
            if (cert.expireDate) {
                const expireDate = new Date(cert.expireDate.replace(/\//g, '-'));
                const today = new Date();
                const isExpired = expireDate < today;
                const formattedExpireDate = expireDate.toLocaleDateString('es-ES', {
                    month: 'short',
                    year: 'numeric'
                });
                
                expireDateHTML = `
                    <div class="cert-expire ${isExpired ? 'expired' : ''}">
                        ${isExpired ? 'Expiró' : 'Expira'}: ${formattedExpireDate}
                    </div>
                `;
            }
            
            certEl.innerHTML = `
                <div class="cert-header">
                    <h3 class="cert-title">
                        ${hasLink 
                            ? `<a href="${cert.link}" class="cert-link" target="_blank" rel="noopener noreferrer">${cert.title}</a>`
                            : `<span class="no-link">${cert.title}</span>`
                        }
                    </h3>
                    <div class="cert-enterprise">${cert.enterprise}</div>
                </div>
                <div class="cert-meta">
                    <div class="cert-date">Expedición: ${formattedDate}</div>
                    ${expireDateHTML}
                </div>
            `;
            
            certificatesContainer.appendChild(certEl);
        });
    }

    function updateSortButtons() {
        [sortByDateBtn, sortByNameBtn].forEach(btn => btn.classList.remove('active'));
        
        if (currentSort.field === 'date') {
            sortByDateBtn.classList.add('active');
            sortByDateBtn.querySelector('.sort-indicator').textContent = currentSort.order === 'asc' ? '▲' : '▼';
            sortByNameBtn.querySelector('.sort-indicator').textContent = '';
        } else {
            sortByNameBtn.classList.add('active');
            sortByNameBtn.querySelector('.sort-indicator').textContent = currentSort.order === 'asc' ? '▲' : '▼';
            sortByDateBtn.querySelector('.sort-indicator').textContent = '';
        }
    }

    function sortByDate() {
        if (currentSort.field === 'date') {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = { field: 'date', order: 'desc' };
        }
        updateSortButtons();
        applySortAndRender();
    }

    function sortByName() {
        if (currentSort.field === 'name') {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = { field: 'name', order: 'asc' };
        }
        updateSortButtons();
        applySortAndRender();
    }

    // Event listeners
    searchInput.addEventListener('input', () => {
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    });

    sortByDateBtn.addEventListener('click', sortByDate);
    sortByNameBtn.addEventListener('click', sortByName);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            applyFilters();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Initialize
    loadCertificates();
});
