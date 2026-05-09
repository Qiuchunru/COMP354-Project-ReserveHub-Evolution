document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    
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
        
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--orange)"></i><br><br>Searching...</div>';

        let apiURL = `../api/search.php?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&time=${encodeURIComponent(time)}&halal=${encodeURIComponent(halal)}`;

        fetch(apiURL)
            .then(res => res.json())
            .then(res => {
                if(res.success) {
                    const data = res.data;
                    countHeader.textContent = `Found ${data.length} Restaurant${data.length === 1 ? '' : 's'}`;
                    grid.innerHTML = '';

                    if(data.length === 0) {
                        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted)">No restaurants found matching your criteria.</div>';
                        return;
                    }

                    data.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'restaurant-card';
                        card.innerHTML = `
                            <div class="card-image">
                                <img src="${item.image_url}" alt="${item.name}" onerror="this.onerror=null; this.src=''; this.parentElement.classList.add('no-image');" style="width:100%; height:100%; object-fit:cover;">
                                <div class="no-image-overlay">NO IMAGE AVAILABLE</div>
                                <div class="card-img-overlay">
                                    <span class="halal-tag" style="background: ${item.is_halal == 1 ? '#27ae60' : '#e74c3c'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; position: absolute; top: 10px; left: 10px;">${item.is_halal == 1 ? 'HALAL' : 'NON-HALAL'}</span>
                                    <button class="wishlist-btn" data-id="${item.id}" aria-label="Add to wishlist" style="position: absolute; top: 10px; right: 10px;"><i class="fa-regular fa-heart"></i></button>
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
                                <button class="reserve-btn" onclick="window.location.href='restaurant.html?id=${item.id}'">Reserve a Table</button>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                } else {
                    countHeader.textContent = 'Error loading results';
                    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--error-color)">${res.message}</div>`;
                }
            })
            .catch(err => {
                countHeader.textContent = 'Network Error';
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--error-color)">Could not connect to the server.</div>';
            });
    }
});
