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
    document.getElementById('userForm')?.addEventListener('submit', saveUser);

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
    if (section === 'tables') loadFloorPlan();
    if (section === 'reservations') loadReservations();
    if (section === 'users') loadUsers();
    if (section === 'approvals') loadApprovals();
    if (section === 'inbox') loadInbox();
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
            const tableSelect = document.getElementById('tableRestSelect');
            if (tableSelect) tableSelect.innerHTML = options;
        }
    });
}

function openRestaurantModal() {
    document.getElementById('restForm').reset();
    document.getElementById('restId').value = '';
    const preview = document.getElementById('imagePreview');
    preview.querySelector('img').style.display = 'none';
    preview.querySelector('.preview-placeholder').style.display = 'flex';
    document.getElementById('fileLabelText').textContent = 'Choose Restaurant Image';
    document.getElementById('restModalTitle').textContent = 'Add Restaurant';
    document.getElementById('restModal').classList.add('show');
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    const placeholder = preview.querySelector('.preview-placeholder');
    const labelText = document.getElementById('fileLabelText');
    
    if (input.files && input.files[0]) {
        labelText.textContent = input.files[0].name;
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        labelText.textContent = 'Choose Restaurant Image';
    }
}

function editRestaurant(r) {
    document.getElementById('restId').value = r.id;
    document.getElementById('restName').value = r.name;
    document.getElementById('restDesc').value = r.description;
    document.getElementById('restCuisine').value = r.cuisine;
    document.getElementById('restLocation').value = r.location;
    document.getElementById('restPrice').value = r.price_range;
    document.getElementById('restRating').value = r.seed_rating ?? r.rating;
    document.getElementById('restOpen').value = r.opening_time;
    document.getElementById('restClose').value = r.closing_time;
    
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    const placeholder = preview.querySelector('.preview-placeholder');

    if (r.image_url) {
        previewImg.src = r.image_url;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        document.getElementById('fileLabelText').textContent = 'Change Restaurant Image';
    } else {
        previewImg.style.display = 'none';
        placeholder.style.display = 'flex';
        document.getElementById('fileLabelText').textContent = 'Choose Restaurant Image';
    }
    
    document.getElementById('restModalTitle').textContent = 'Edit Restaurant';
    document.getElementById('restModal').classList.add('show');
}

async function saveRestaurant(e) {
    e.preventDefault();
    const id = document.getElementById('restId').value;
    const formData = new FormData();
    const userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
    if (userStr) {
        formData.append('vendor_id', JSON.parse(userStr).id);
    }
    
    formData.append('name', document.getElementById('restName').value);
    formData.append('description', document.getElementById('restDesc').value);
    formData.append('cuisine', document.getElementById('restCuisine').value);
    formData.append('location', document.getElementById('restLocation').value);
    formData.append('price_range', document.getElementById('restPrice').value);
    formData.append('seed_rating', document.getElementById('restRating').value);
    formData.append('opening_time', document.getElementById('restOpen').value);
    formData.append('closing_time', document.getElementById('restClose').value);
    
    // Pass existing image_url if we're editing and no new image is selected
    const previewImg = document.getElementById('imagePreview').querySelector('img');
    const existingSrc = previewImg.src;
    if (existingSrc && !existingSrc.startsWith('data:') && previewImg.style.display !== 'none') {
        // Convert full URL back to relative path if needed
        const relativePath = existingSrc.includes('/pictures/') ? '../pictures/' + existingSrc.split('/pictures/')[1] : existingSrc;
        formData.append('image_url', relativePath);
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

// ===== FLOOR PLAN EDITOR =====
let floorTables = [];      // { id, table_number, capacity, shape, x_pos, y_pos, _new, _dirty, _delete }
let selectedTableId = null;
let dragState = null;
let nextTempId = -1;       // negative IDs for unsaved tables

async function loadFloorPlan() {
    const restId = document.getElementById('tableRestSelect').value;
    const room = document.getElementById('floorRoom');
    const sidebar = document.getElementById('floorSidebar');
    selectedTableId = null;
    floorTables = [];

    if (!restId) {
        room.querySelectorAll('.floor-table').forEach(e => e.remove());
        sidebar.innerHTML = `<div class="floor-empty-state"><i class="fa-solid fa-utensils"></i><p>Select a restaurant first</p></div>`;
        return;
    }

    const json = await apiFetch(`tables&restaurant_id=${restId}`);
    if (json.success) {
        floorTables = json.data.map(t => ({...t, _dirty: false, _new: false, _delete: false}));
        renderFloorPlan();
    }
    renderSidebar(null);
}

function renderFloorPlan() {
    const room = document.getElementById('floorRoom');
    // Clear existing tables (keep grid overlay)
    room.querySelectorAll('.floor-table').forEach(e => e.remove());
    floorTables.filter(t => !t._delete).forEach(t => createTableElement(t));
}

function createTableElement(t) {
    const room = document.getElementById('floorRoom');
    const el = document.createElement('div');
    el.className = `floor-table ${t.shape}`;
    el.dataset.id = t.id;

    const bodySize = t.shape === 'round' ? 80 : 110;
    const bodyH    = t.shape === 'round' ? 80 : 70;
    const padding  = 28;

    el.style.left = (t.x_pos) + 'px';
    el.style.top  = (t.y_pos) + 'px';
    el.style.width  = (bodySize + padding * 2) + 'px';
    el.style.height = (bodyH   + padding * 2) + 'px';

    // Seats
    const cap = parseInt(t.capacity) || 4;
    const seatsHTML = generateSeatsHTML(t.shape, cap, bodySize, bodyH, padding);

    el.innerHTML = `
        ${seatsHTML}
        <div class="table-body">
            <span class="table-label">T${t.table_number}</span>
            <span class="table-cap">${cap} seats</span>
        </div>
    `;

    if (t.id === selectedTableId) el.classList.add('selected');

    // Click to select
    el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startDrag(e, t.id, el);
    });

    room.appendChild(el);
}

function generateSeatsHTML(shape, cap, bw, bh, padding) {
    let html = '';
    const cx = padding + bw / 2;
    const cy = padding + bh / 2;

    if (shape === 'round') {
        const radius = bw / 2 + 14;
        for (let i = 0; i < cap; i++) {
            const angle = (2 * Math.PI * i / cap) - Math.PI / 2;
            const sx = cx + radius * Math.cos(angle) - 9;
            const sy = cy + radius * Math.sin(angle) - 9;
            html += `<div class="seat" style="left:${sx.toFixed(1)}px; top:${sy.toFixed(1)}px;"></div>`;
        }
    } else {
        // Distribute seats around rect sides
        const perSide = Math.ceil(cap / 2);
        const topSeats = Math.ceil(cap / 2);
        const bottomSeats = Math.floor(cap / 2);
        for (let i = 0; i < topSeats; i++) {
            const sx = padding + (bw / (topSeats + 1)) * (i + 1) - 9;
            html += `<div class="seat" style="left:${sx.toFixed(1)}px; top:${(padding - 16).toFixed(1)}px;"></div>`;
        }
        for (let i = 0; i < bottomSeats; i++) {
            const sx = padding + (bw / (bottomSeats + 1)) * (i + 1) - 9;
            html += `<div class="seat" style="left:${sx.toFixed(1)}px; top:${(padding + bh - 2).toFixed(1)}px;"></div>`;
        }
    }
    return html;
}

function startDrag(e, id, el) {
    // Select the table
    selectTable(id);

    const room = document.getElementById('floorRoom');
    const roomRect = room.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offsetX = e.clientX - elRect.left;
    const offsetY = e.clientY - elRect.top;

    dragState = { id, el, offsetX, offsetY };

    const onMove = (e) => {
        if (!dragState) return;
        const x = e.clientX - roomRect.left - dragState.offsetX;
        const y = e.clientY - roomRect.top  - dragState.offsetY;
        // Snap to 10px grid
        const snappedX = Math.round(x / 10) * 10;
        const snappedY = Math.round(y / 10) * 10;
        // Clamp within room
        const maxX = room.offsetWidth  - dragState.el.offsetWidth;
        const maxY = room.offsetHeight - dragState.el.offsetHeight;
        const clampedX = Math.max(0, Math.min(snappedX, maxX));
        const clampedY = Math.max(0, Math.min(snappedY, maxY));

        dragState.el.style.left = clampedX + 'px';
        dragState.el.style.top  = clampedY + 'px';

        // Update data
        const t = floorTables.find(t => t.id === dragState.id);
        if (t) { t.x_pos = clampedX; t.y_pos = clampedY; t._dirty = true; }
    };

    const onUp = () => {
        dragState = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function selectTable(id) {
    selectedTableId = id;
    document.querySelectorAll('.floor-table').forEach(el => el.classList.remove('selected'));
    const el = document.querySelector(`.floor-table[data-id="${id}"]`);
    if (el) el.classList.add('selected');
    renderSidebar(floorTables.find(t => t.id === id));
}

function renderSidebar(t) {
    const sidebar = document.getElementById('floorSidebar');
    if (!t) {
        sidebar.innerHTML = `
            <div class="floor-sidebar-header">Properties</div>
            <div style="flex:1; display:flex; align-items:center; justify-content:center;">
                <p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px;">Click a table on the floor plan to select and edit it</p>
            </div>`;
        return;
    }

    sidebar.innerHTML = `
        <div class="floor-sidebar-header">
            <span>Table ${t.table_number}</span>
        </div>
        <div class="floor-sidebar-body">
            <div class="form-group">
                <label>Table Number</label>
                <input type="text" class="form-control" id="sp-num" value="${t.table_number}" oninput="updateSelectedTable('table_number', this.value)">
            </div>
            <div class="form-group">
                <label>Capacity (seats)</label>
                <input type="number" class="form-control" id="sp-cap" value="${t.capacity}" min="1" max="20" oninput="updateSelectedTable('capacity', this.value)">
            </div>
            <div class="form-group">
                <label>Shape</label>
                <select class="form-control" id="sp-shape" onchange="updateSelectedTable('shape', this.value)">
                    <option value="round" ${t.shape==='round'?'selected':''}>Round</option>
                    <option value="rect"  ${t.shape==='rect' ?'selected':''}>Rectangular</option>
                </select>
            </div>
            <div class="form-group">
                <label>Position</label>
                <div style="display:flex; gap:8px;">
                    <input type="number" class="form-control" placeholder="X" value="${t.x_pos}" style="flex:1;" oninput="updateSelectedTablePos('x_pos', this.value)">
                    <input type="number" class="form-control" placeholder="Y" value="${t.y_pos}" style="flex:1;" oninput="updateSelectedTablePos('y_pos', this.value)">
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="saveFloorPlan()"><i class="fa-solid fa-floppy-disk"></i> Save Layout</button>
            <button class="sidebar-delete-btn" onclick="deleteFloorTable(${t.id})"><i class="fa-solid fa-trash"></i> Delete Table</button>
        </div>`;
}

function updateSelectedTable(key, value) {
    const t = floorTables.find(t => t.id === selectedTableId);
    if (!t) return;
    t[key] = value;
    t._dirty = true;
    // Re-render this table element in place
    const old = document.querySelector(`.floor-table[data-id="${t.id}"]`);
    if (old) old.remove();
    createTableElement(t);
    document.querySelector(`.floor-table[data-id="${t.id}"]`).classList.add('selected');
    // Update sidebar header
    const header = document.querySelector('.floor-sidebar-header span');
    if (header) header.textContent = `Table ${t.table_number}`;
}

function updateSelectedTablePos(key, value) {
    const t = floorTables.find(t => t.id === selectedTableId);
    if (!t) return;
    t[key] = parseInt(value) || 0;
    t._dirty = true;
    const el = document.querySelector(`.floor-table[data-id="${t.id}"]`);
    if (el) {
        if (key === 'x_pos') el.style.left = t.x_pos + 'px';
        if (key === 'y_pos') el.style.top  = t.y_pos + 'px';
    }
}

function addTableToFloor(shape, capacity) {
    const restId = document.getElementById('tableRestSelect').value;
    if (!restId) { showToast('Please select a restaurant first.', 'error'); return; }

    const count = floorTables.filter(t => !t._delete).length + 1;
    const newTable = {
        id: nextTempId--,
        restaurant_id: restId,
        table_number: String(count),
        capacity,
        shape,
        x_pos: 60 + Math.floor(Math.random() * 300),
        y_pos: 60 + Math.floor(Math.random() * 200),
        _new: true,
        _dirty: true,
        _delete: false
    };
    floorTables.push(newTable);
    createTableElement(newTable);
    selectTable(newTable.id);
}

async function deleteFloorTable(id) {
    if (!confirm('Delete this table? This will remove its reservations too.')) return;
    const t = floorTables.find(t => t.id === id);
    if (!t) return;

    if (t._new) {
        // Never saved – just remove locally
        floorTables = floorTables.filter(t => t.id !== id);
    } else {
        await apiFetch(`tables&id=${id}`, 'DELETE');
        floorTables = floorTables.filter(t => t.id !== id);
    }

    const el = document.querySelector(`.floor-table[data-id="${id}"]`);
    if (el) el.remove();
    selectedTableId = null;
    renderSidebar(null);
}

async function saveFloorPlan() {
    const restId = document.getElementById('tableRestSelect').value;
    if (!restId) return;

    const btn = document.getElementById('saveFloorBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const dirty = floorTables.filter(t => t._dirty && !t._delete);

    for (const t of dirty) {
        const payload = {
            restaurant_id: restId,
            table_number:  t.table_number,
            capacity:      t.capacity,
            shape:         t.shape,
            x_pos:         t.x_pos,
            y_pos:         t.y_pos
        };
        if (t._new) {
            const res = await apiFetch('tables', 'POST', payload);
            if (res.success && res.id) {
                const old = document.querySelector(`.floor-table[data-id="${t.id}"]`);
                if (old) { old.dataset.id = res.id; }
                t.id = res.id;
                if (selectedTableId === parseInt(t.id)) selectedTableId = res.id;
            }
            t._new = false;
        } else {
            await apiFetch(`tables&id=${t.id}`, 'PUT', payload);
        }
        t._dirty = false;
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Layout'; }, 2000);
}

// Keep old functions for backward compat if called elsewhere
function openTableModal() { addTableToFloor('round', 4); }
function loadTables() { loadFloorPlan(); }

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
        tbody.innerHTML = '<tr><td colspan="8" style="color:var(--text-muted); text-align:center;">No users found.</td></tr>';
        return;
    }
    data.forEach(u => {
        const roleColor = u.role === 'admin' ? '#e74c3c' : (u.role === 'vendor' ? '#3498db' : '#2ecc71');
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>@${u.username || 'n/a'}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td><span style="padding: 4px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; background: ${roleColor}; color: #fff;">${u.role || 'user'}</span></td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="action-btn edit" style="margin: 0; padding: 4px 8px; font-size: 12px;" onclick='editUser(${JSON.stringify(u).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete" style="margin: 0; padding: 4px 8px; font-size: 12px;" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function filterUsers() {
    const q = document.getElementById('searchUsers').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        u.id.toString().includes(q)
    );
    renderUsers(filtered);
}

function openUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    document.getElementById('userUsername').disabled = false;
    document.getElementById('userModalTitle').textContent = 'Add New Vendor/User';
    document.getElementById('userModal').classList.add('show');
}

function editUser(u) {
    document.getElementById('userId').value = u.id;
    document.getElementById('userUsername').value = u.username || '';
    document.getElementById('userUsername').disabled = true;
    document.getElementById('userName').value = u.name;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userPhone').value = u.phone || '';
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('userPassword').required = false;
    document.getElementById('userRole').value = u.role || 'vendor';
    
    document.getElementById('userModalTitle').textContent = 'Edit Account Details';
    document.getElementById('userModal').classList.add('show');
}

async function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value.trim();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;
    
    if (id) {
        // Edit existing user
        const payload = { name, email, phone, role };
        const json = await apiFetch(`users&id=${id}`, 'PUT', payload);
        if (json.success) {
            closeModal('userModal');
            loadUsers();
        } else {
            showToast(json.message || 'Failed to update user.', 'error');
        }
    } else {
        // Create new user/vendor
        const password = document.getElementById('userPassword').value.trim();
        const payload = { username, name, email, phone, password, role };
        const json = await apiFetch('users', 'POST', payload);
        if (json.success) {
            closeModal('userModal');
            loadUsers();
        } else {
            showToast(json.message || 'Failed to create user/vendor.', 'error');
        }
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user? This will delete all their reservations and vendor listings.')) {
        const json = await apiFetch(`users&id=${id}`, 'DELETE');
        if (json.success) {
            loadUsers();
        } else {
            showToast(json.message || 'Failed to delete user.', 'error');
        }
    }
}


// ===== MODALS =====
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// ===== VENDOR APPROVALS =====
let allApprovals = [];

async function loadApprovals() {
    const json = await apiFetch('approvals');
    if (json.success) {
        allApprovals = json.data;
        renderApprovals(allApprovals);
    }
}

function renderApprovals(data) {
    const list = document.getElementById('approvalsList');
    list.innerHTML = '';
    if (data.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px;">No vendor listings to review.</p>';
        return;
    }
    data.forEach(r => {
        const imgUrl = r.image_url ? r.image_url : '../pictures/restaurants/restaurant-placeholder.jpg';
        const statusClass = r.status || 'pending';
        list.innerHTML += `
            <div style="background: var(--dark-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column;">
                <div style="height: 140px; background: url('${imgUrl}'); background-size: cover; background-position: center; position: relative;">
                    <span style="position: absolute; top: 10px; right: 10px; padding: 4px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; background: ${r.status === 'approved' ? '#2ecc71' : (r.status === 'pending' ? '#f1c40f' : '#e74c3c')}; color: #fff;">
                        ${r.status}
                    </span>
                </div>
                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin-bottom: 8px; font-size: 1.15rem;">${r.name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 8px;"><strong>Owner:</strong> ${r.vendor_name} (${r.vendor_email})</p>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${r.description || 'No description'}</p>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">
                        <i class="fa-solid fa-utensils" style="color: var(--orange); width: 14px;"></i> ${r.cuisine} &nbsp;|&nbsp; 
                        <i class="fa-solid fa-location-dot" style="color: var(--orange); width: 14px;"></i> ${r.location}
                    </p>
                    
                    ${r.status === 'pending' ? `
                        <div style="margin-top: auto; display: flex; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 12px;">
                            <button class="action-btn edit" style="flex: 1; background: #2ecc71; color: #fff; text-align: center; justify-content: center; cursor: pointer; padding: 8px 12px; border-radius: 8px;" onclick="moderateListing(${r.id}, 'approved')"><i class="fa-solid fa-check"></i> Approve</button>
                            <button class="action-btn delete" style="flex: 1; background: #e74c3c; color: #fff; text-align: center; justify-content: center; cursor: pointer; padding: 8px 12px; border-radius: 8px;" onclick="moderateListing(${r.id}, 'rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                        </div>
                    ` : `
                        <div style="margin-top: auto; font-size: 12px; color: var(--text-muted); text-align: center; border-top: 1px solid var(--glass-border); padding-top: 12px;">
                            Reviewed (Status: <strong>${r.status}</strong>)
                        </div>
                    `}
                </div>
            </div>
        `;
    });
}

async function moderateListing(id, status) {
    const json = await apiFetch('approvals', 'POST', { id, status });
    if (json.success) {
        loadApprovals();
    } else {
        showToast(json.message || 'Failed to moderate listing.', 'error');
    }
}

// ===== INBOX MESSAGES =====
let allMessages = [];

async function loadInbox() {
    const json = await apiFetch('messages');
    if (json.success) {
        allMessages = json.data || [];
        renderMessages(allMessages);
    } else {
        showToast(json.message || 'Failed to load inbox messages.', 'error');
    }
}

function renderMessages(data) {
    const list = document.getElementById('messagesList');
    if (!list) return;
    
    list.innerHTML = '';
    if (data.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); padding: 20px; text-align: center;">Your inbox is empty.</p>';
        return;
    }
    
    data.forEach(r => {
        list.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 20px; background: var(--dark-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); position: relative; transition: var(--transition);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; color: #fff;">${r.subject}</h4>
                        <span style="font-size: 0.85rem; color: var(--orange); font-weight: 600;">
                            From: ${r.name} (<a href="mailto:${r.email}" style="color: var(--orange); text-decoration: underline;">${r.email}</a>)
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                        <span style="font-size: 0.8rem; color: #888;">
                            <i class="fa-regular fa-clock"></i> ${new Date(r.created_at).toLocaleString()}
                        </span>
                        <span style="font-size: 0.75rem; color: #666;">ID: #${r.id}</span>
                    </div>
                </div>
                <div style="font-size: 0.92rem; color: #ccc; line-height: 1.6; white-space: pre-wrap; padding: 5px 0 10px 0;">
                    ${r.message}
                </div>
                <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--glass-border); padding-top: 12px;">
                    <button class="action-btn delete" onclick="deleteMessage(${r.id})" title="Delete Message" style="margin: 0; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
}

function filterMessages() {
    const q = document.getElementById('searchMessages').value.toLowerCase();
    const filtered = allMessages.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.email.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.id.toString().includes(q)
    );
    renderMessages(filtered);
}

async function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        const json = await apiFetch(`messages&id=${id}`, 'DELETE');
        if (json.success) {
            loadInbox();
        } else {
            showToast(json.message || 'Failed to delete message.', 'error');
        }
    }
}
