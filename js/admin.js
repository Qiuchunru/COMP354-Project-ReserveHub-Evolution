document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('.admin-nav a[data-target]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.target).classList.add('active');
            loadSection(link.dataset.target);
        });
    });

    // Forms
    document.getElementById('restForm').addEventListener('submit', saveRestaurant);
    document.getElementById('tableForm').addEventListener('submit', saveTable);

    // Initial load
    loadSection('dashboard');
    loadRestaurantSelects();
});

// Generic Fetch
async function apiFetch(endpoint, method = 'GET', data = null) {
    const options = { method };
    if (data) {
        if (data instanceof FormData) {
            options.body = data;
            // Browser sets Content-Type automatically for FormData with boundary
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        }
    }
    const res = await fetch(`../api/admin_api.php?endpoint=${endpoint}`, options);
    return res.json();
}

function loadSection(section) {
    if (section === 'dashboard') loadDashboard();
    if (section === 'restaurants') loadRestaurants();
    if (section === 'tables') loadTables();
    if (section === 'reservations') loadReservations();
    if (section === 'users') loadUsers();
}

// ===== DASHBOARD =====
let popularityChart = null;

async function loadDashboard() {
    const json = await apiFetch('analytics');
    if (json.success) {
        document.getElementById('statUsers').textContent = json.data.users;
        document.getElementById('statRes').textContent = json.data.reservations;
        document.getElementById('statRests').textContent = json.data.restaurants;

        const labels = json.data.popular.map(p => p.name);
        const data = json.data.popular.map(p => p.res_count);

        if (popularityChart) popularityChart.destroy();

        const ctx = document.getElementById('popularityChart').getContext('2d');
        popularityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reservations',
                    data: data,
                    backgroundColor: 'rgba(255, 107, 43, 0.8)',
                    borderColor: '#ff6b2b',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#151515', titleColor: '#ff6b2b', bodyColor: '#fff' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0a0', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: '#a0a0a0' } }
                }
            }
        });
    }
}

// ===== RESTAURANTS =====
let allRestaurants = [];

async function loadRestaurants() {
    const json = await apiFetch('restaurants');
    if (json.success) {
        allRestaurants = json.data;
        renderRestaurants(allRestaurants);
        loadRestaurantSelects();
    }
}

function renderRestaurants(data) {
    const grid = document.getElementById('restGrid');
    grid.innerHTML = '';
    if (data.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No restaurants found.</p>';
        return;
    }
    data.forEach(r => {
        grid.innerHTML += `
            <div style="background: var(--dark-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column;">
                <div style="height: 140px; background: ${r.image_url ? `url('${r.image_url}')` : r.image_gradient || '#222'}; background-size: cover; background-position: center;"></div>
                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin-bottom: 8px; font-size: 1.2rem;">${r.name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px;"><i class="fa-solid fa-utensils" style="color: var(--orange); width: 16px;"></i> ${r.cuisine}</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;"><i class="fa-solid fa-location-dot" style="color: var(--orange); width: 16px;"></i> ${r.location}</p>
                    <div style="margin-top: auto; display: flex; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 12px;">
                        <button class="action-btn edit" onclick='editRestaurant(${JSON.stringify(r).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="action-btn delete" onclick="deleteRestaurant(${r.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterRestaurants() {
    const q = document.getElementById('searchRestaurants').value.toLowerCase();
    const filtered = allRestaurants.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.cuisine.toLowerCase().includes(q) || 
        r.location.toLowerCase().includes(q)
    );
    renderRestaurants(filtered);
}

function loadRestaurantSelects() {
    apiFetch('restaurants').then(json => {
        if(json.success) {
            allRestaurants = json.data;
            let options = '<option value="">Select Restaurant...</option>';
            json.data.forEach(r => options += `<option value="${r.id}">${r.name}</option>`);
            document.getElementById('tableRestSelect').innerHTML = options;
            document.getElementById('tableModalRest').innerHTML = options;
        }
    });
}

function openRestaurantModal() {
    document.getElementById('restForm').reset();
    document.getElementById('restId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('restModalTitle').textContent = 'Add Restaurant';
    document.getElementById('restModal').classList.add('show');
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function editRestaurant(r) {
    document.getElementById('restId').value = r.id;
    document.getElementById('restName').value = r.name;
    document.getElementById('restDesc').value = r.description;
    document.getElementById('restCuisine').value = r.cuisine;
    document.getElementById('restLocation').value = r.location;
    document.getElementById('restPrice').value = r.price_range;
    document.getElementById('restRating').value = r.rating;
    document.getElementById('restOpen').value = r.opening_time;
    document.getElementById('restClose').value = r.closing_time;
    
    const preview = document.getElementById('imagePreview');
    if (r.image_url) {
        preview.querySelector('img').src = r.image_url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    document.getElementById('restModalTitle').textContent = 'Edit Restaurant';
    document.getElementById('restModal').classList.add('show');
}

async function saveRestaurant(e) {
    e.preventDefault();
    const id = document.getElementById('restId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('restName').value);
    formData.append('description', document.getElementById('restDesc').value);
    formData.append('cuisine', document.getElementById('restCuisine').value);
    formData.append('location', document.getElementById('restLocation').value);
    formData.append('price_range', document.getElementById('restPrice').value);
    formData.append('rating', document.getElementById('restRating').value);
    formData.append('opening_time', document.getElementById('restOpen').value);
    formData.append('closing_time', document.getElementById('restClose').value);
    
    // Pass existing image_url if we're editing and no new image is selected
    const existingPreview = document.getElementById('imagePreview').querySelector('img').src;
    if (existingPreview && !existingPreview.startsWith('data:')) {
        formData.append('image_url', existingPreview);
    }
    
    const imageFile = document.getElementById('restImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    // Note: PHP doesn't handle multipart/form-data with PUT easily.
    // We'll use POST for both create and update, but pass ID in URL for update.
    if (id) {
        await apiFetch(`restaurants&id=${id}`, 'POST', formData);
    } else {
        await apiFetch('restaurants', 'POST', formData);
    }
    
    closeModal('restModal');
    loadRestaurants();
}

async function deleteRestaurant(id) {
    if (confirm('Are you sure you want to delete this restaurant? This will delete all its tables and reservations.')) {
        await apiFetch(`restaurants&id=${id}`, 'DELETE');
        loadRestaurants();
    }
}

let allTables = [];

async function loadTables() {
    const restId = document.getElementById('tableRestSelect').value;
    const grid = document.getElementById('tablesGrid');
    if (!restId) {
        grid.innerHTML = '<p style="color:var(--text-muted);">Please select a restaurant first.</p>';
        return;
    }
    const json = await apiFetch(`tables&restaurant_id=${restId}`);
    if (json.success) {
        allTables = json.data;
        renderTables(allTables);
    }
}

function renderTables(data) {
    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = '';
    if(data.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No tables found.</p>';
        return;
    }
    data.forEach(t => {
        const isAvail = t.status === 'available';
        const statusColor = isAvail ? '#2ecc71' : '#e74c3c';
        const shapeIcon = t.shape === 'round' ? 'fa-circle' : 'fa-square';
        grid.innerHTML += `
            <div style="background: var(--dark-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 20px; position: relative;">
                <div style="position: absolute; top: 20px; right: 20px; width: 12px; height: 12px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 8px ${statusColor};" title="${t.status}"></div>
                <h3 style="font-size: 1.4rem; margin-bottom: 12px; color: var(--orange);">Table ${t.table_number}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 6px;"><i class="fa-solid fa-users" style="width: 20px;"></i> ${t.capacity} Seats</p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;"><i class="fa-regular ${shapeIcon}" style="width: 20px;"></i> ${t.shape === 'round' ? 'Round' : 'Rectangular'}</p>
                <div style="display: flex; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 16px;">
                    <button class="btn btn-secondary" style="flex: 1; font-size: 0.8rem; padding: 6px;" onclick='editTable(${JSON.stringify(t).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn" style="flex: 1; font-size: 0.8rem; padding: 6px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c;" onclick="deleteTable(${t.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    });
}

function filterTables() {
    const q = document.getElementById('searchTables').value.toLowerCase();
    const filtered = allTables.filter(t => 
        t.table_number.toLowerCase().includes(q) || 
        t.status.toLowerCase().includes(q) ||
        t.shape.toLowerCase().includes(q)
    );
    renderTables(filtered);
}

function openTableModal() {
    document.getElementById('tableForm').reset();
    document.getElementById('tableId').value = '';
    const selRest = document.getElementById('tableRestSelect').value;
    if(selRest) document.getElementById('tableModalRest').value = selRest;
    document.getElementById('tableModalTitle').textContent = 'Add Table';
    document.getElementById('tableModal').classList.add('show');
}

function editTable(t) {
    document.getElementById('tableId').value = t.id;
    document.getElementById('tableModalRest').value = t.restaurant_id;
    document.getElementById('tableNum').value = t.table_number;
    document.getElementById('tableCap').value = t.capacity;
    document.getElementById('tableShape').value = t.shape;
    document.getElementById('tableStatus').value = t.status;
    document.getElementById('tableX').value = t.x_pos;
    document.getElementById('tableY').value = t.y_pos;
    document.getElementById('tableModalTitle').textContent = 'Edit Table';
    document.getElementById('tableModal').classList.add('show');
}

async function saveTable(e) {
    e.preventDefault();
    const id = document.getElementById('tableId').value;
    const data = {
        restaurant_id: document.getElementById('tableModalRest').value,
        table_number: document.getElementById('tableNum').value,
        capacity: document.getElementById('tableCap').value,
        shape: document.getElementById('tableShape').value,
        status: document.getElementById('tableStatus').value,
        x_pos: document.getElementById('tableX').value,
        y_pos: document.getElementById('tableY').value
    };
    
    if (id) await apiFetch(`tables&id=${id}`, 'PUT', data);
    else await apiFetch('tables', 'POST', data);
    
    closeModal('tableModal');
    
    // Auto refresh if looking at same rest
    if (document.getElementById('tableRestSelect').value === data.restaurant_id) {
        loadTables();
    }
}

async function deleteTable(id) {
    if (confirm('Are you sure you want to delete this table?')) {
        await apiFetch(`tables&id=${id}`, 'DELETE');
        loadTables();
    }
}

// ===== RESERVATIONS =====
async function loadReservations() {
    const json = await apiFetch('reservations');
    if (json.success) {
        const list = document.getElementById('resList');
        list.innerHTML = '';
        if (json.data.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted);">No reservations found.</p>';
            return;
        }
        json.data.forEach(r => {
            const isPast = new Date(r.date + ' ' + r.time) < new Date();
            const statusColor = isPast ? '#888' : '#27ae60';
            const statusText = isPast ? 'Past' : 'Upcoming';

            list.innerHTML += `
                <div style="display: flex; gap: 20px; padding: 20px; background: var(--dark-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); align-items: center; transition: var(--transition);">
                    <img src="${r.image_url}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 8px;" onerror="this.src='../pictures/eating-bg.jpg'">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 1.1rem; color: #fff;">${r.restaurant_name}</h4>
                            <span style="color: ${statusColor}; font-size: 0.85rem; font-weight: 600; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">${statusText}</span>
                        </div>
                        <p style="margin: 0 0 6px 0; font-size: 0.9rem; color: #ccc;">
                            <i class="fa-solid fa-user" style="color: var(--orange); width: 16px;"></i> ${r.user_name}
                            ${r.user_phone ? `&nbsp;|&nbsp; <i class="fa-solid fa-phone" style="width: 16px;"></i> ${r.user_phone}` : ''}
                        </p>
                        <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #888;">
                            <i class="fa-regular fa-calendar" style="width: 16px;"></i> ${r.date} &nbsp;|&nbsp; 
                            <i class="fa-regular fa-clock" style="width: 16px;"></i> ${r.time.slice(0,5)}
                        </p>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--orange); font-weight: 600;">
                            Table ${r.table_number} &nbsp;|&nbsp; ${r.guests} Guests
                        </p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                        <span style="font-size: 0.75rem; color: #666;">ID: #${r.id}</span>
                        <button class="action-btn delete" onclick="deleteRes(${r.id})" title="Delete Reservation" style="margin:0; font-size: 16px;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
}

async function deleteRes(id) {
    if (confirm('Delete this reservation?')) {
        await apiFetch(`reservations&id=${id}`, 'DELETE');
        loadReservations();
    }
}

// ===== USERS =====
let allUsers = [];

async function loadUsers() {
    const json = await apiFetch('users');
    if (json.success) {
        allUsers = json.data;
        renderUsers(allUsers);
    }
}

function renderUsers(data) {
    const tbody = document.getElementById('usersTbody');
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);">No users found.</td></tr>';
        return;
    }
    data.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
}

function filterUsers() {
    const q = document.getElementById('searchUsers').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        u.id.toString().includes(q)
    );
    renderUsers(filtered);
}

// ===== MODALS =====
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}
