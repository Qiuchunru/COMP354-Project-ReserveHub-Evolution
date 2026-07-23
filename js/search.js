document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    // Stores the current translations.
    let translations = {};
    // Returns a translated string for a given key.
    const t = (key, fallback) => translations[key] || fallback;
    
    const keywordInput = document.getElementById('filterKeyword');
    const locationSelect = document.getElementById('filterLocation');
    const timeInput = document.getElementById('filterTime');
    const applyBtn = document.getElementById('applyFiltersBtn');
    
    if (initialQuery) {
        keywordInput.value = initialQuery;
    }

    // Fetch initial results
    fetchResults();

    applyBtn.addEventListener('click', fetchResults);

    // Add Enter key listener for all filter inputs
    const filterInputs = document.querySelectorAll('.search-sidebar input, .search-sidebar select');
    filterInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchResults();
            }
        });
    });

    function fetchResults() {
        const q = keywordInput.value.trim();
        const loc = locationSelect.value;
        const time = timeInput.value;
        const halal = document.getElementById('filterHalal').value;

        const grid = document.getElementById('restaurantsGrid');
        const countHeader = document.getElementById('resultsCount');
        
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--orange)"></i><br><br>${t('search.results.searching', 'Searching...')}</div>`;

        let apiURL = `../api/search.php?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&time=${encodeURIComponent(time)}&halal=${encodeURIComponent(halal)}`;

        fetch(apiURL)
            .then(res => res.json())
            .then(res => {
                if(res.success) {
                    const data = res.data;
                    const foundTemplate = data.length === 1
                        ? t('search.results.foundSingle', 'Found {count} Restaurant')
                        : t('search.results.foundPlural', 'Found {count} Restaurants');
                    countHeader.textContent = foundTemplate.replace('{count}', data.length);
                    grid.innerHTML = '';

                    if(data.length === 0) {
                        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted)">${t('search.results.none', 'No restaurants found matching your criteria.')}</div>`;
                        return;
                    }

                    data.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'restaurant-card';
                        card.innerHTML = `
                            <div class="card-image">
                                <img src="${item.image_url}" alt="${item.name}" onerror="this.onerror=null; this.src=''; this.parentElement.classList.add('no-image');" style="width:100%; height:100%; object-fit:cover;">
                                <div class="no-image-overlay"><i class="fa-solid fa-utensils"></i><span>${t('search.card.noImage', 'No Image Available')}</span></div>
                                <div class="card-img-overlay">
                                    <span class="halal-tag" style="background: ${item.is_halal == 1 ? '#27ae60' : '#e74c3c'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; position: absolute; top: 10px; left: 10px;">${item.is_halal == 1 ? t('search.card.halal', 'HALAL') : t('search.card.nonHalal', 'NON-HALAL')}</span>
                                    <button class="wishlist-btn" data-id="${item.id}" aria-label="${t('search.card.wishlist', 'Add to wishlist')}"><i class="fa-regular fa-heart"></i></button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="card-top">
                                    <h3 class="card-name">${item.name}</h3>
                                    <span class="card-price">${item.price_range}</span>
                                </div>
                                <div class="card-meta">
                                    <span><i class="fa-solid fa-star"></i> ${item.rating}</span>
                                    <span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
                                    <span><i class="fa-regular fa-clock"></i> ${item.opening_time.slice(0,5)} - ${item.closing_time.slice(0,5)}</span>
                                </div>
                                <p class="card-desc">${item.description}</p>
                                <button class="reserve-btn" onclick="window.location.href='restaurant.html?id=${item.id}'">${t('search.card.reserve', 'Reserve a Table')}</button>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                } else {
                    countHeader.textContent = t('search.results.errorTitle', 'Error loading results');
                    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--error-color)">${res.message}</div>`;
                }
            })
            .catch(err => {
                countHeader.textContent = t('search.results.networkTitle', 'Network Error');
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--error-color)">${t('search.results.networkBody', 'Could not connect to the server.')}</div>`;
            });
    }

    // Listen for global language changes
    window.addEventListener('reservehub:languageChanged', event => {
        translations = event?.detail?.translations || {};
        fetchResults();
    });

    // ===== WISHLIST TOGGLE =====
    document.addEventListener('click', e => {
        const btn = e.target.closest('.wishlist-btn');
        if (!btn) return;

        const userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
        if (!userStr) {
            window.location.href = 'login-signup.html';
            return;
        }

        const user = JSON.parse(userStr);
        const restId = btn.dataset.id;
        if (!restId) return;

        // Visual feedback immediately
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        const currentlyLiked = btn.classList.contains('liked');
        icon.className = currentlyLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        icon.style.color = currentlyLiked ? '#ff4757' : '';

        fetch('../api/toggle_save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_id: restId, user_id: user.id })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                // Revert if failed
                btn.classList.toggle('liked');
                icon.className = !currentlyLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                icon.style.color = !currentlyLiked ? '#ff4757' : '';
                
                // If there's a toast function, show error
                if(typeof showToast === 'function') {
                    showToast(data.message, 'error');
                } else {
                    alert(data.message);
                }
            }
        })
        .catch(err => {
            console.error(err);
        });
    });
});
