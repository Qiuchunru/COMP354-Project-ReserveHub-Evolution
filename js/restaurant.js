// restaurant.js — Floor Plan & Booking Logic

const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('id');

let selectedTable = null;
let restaurantData = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (!restaurantId) {
        window.location.href = 'search.html';
        return;
    }

    document.getElementById('restaurantId').value = restaurantId;

    // Set default date (today) and time (next half-hour)
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const nextHalfHour = new Date(Math.ceil(now.getTime() / 1800000) * 1800000);
    const timeStr = `${pad(nextHalfHour.getHours())}:${pad(nextHalfHour.getMinutes())}`;

    ['fpDate', 'bookDate'].forEach(id => document.getElementById(id).value = todayStr);
    ['fpTime', 'bookTime'].forEach(id => document.getElementById(id).value = timeStr);

    // Sync date/time between panels
    document.getElementById('fpDate').addEventListener('change', e => document.getElementById('bookDate').value = e.target.value);
    document.getElementById('fpTime').addEventListener('change', e => document.getElementById('bookTime').value = e.target.value);
    document.getElementById('bookDate').addEventListener('change', e => document.getElementById('fpDate').value = e.target.value);
    document.getElementById('bookTime').addEventListener('change', e => document.getElementById('fpTime').value = e.target.value);

    // Load restaurant info and floor plan
    loadRestaurant();

    document.getElementById('checkAvailabilityBtn').addEventListener('click', loadFloorPlan);
    document.getElementById('bookingForm').addEventListener('submit', submitReservation);

    // Load reviews
    loadReviews();
});

// ===== LOAD RESTAURANT =====
async function loadRestaurant() {
    try {
        const res = await fetch(`../api/restaurant.php?id=${restaurantId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        restaurantData = json.data;
        renderHero(restaurantData);
        document.title = `${restaurantData.name} | ReserveHub`;

        await loadFloorPlan();
    } catch (err) {
        console.error('Failed to load restaurant:', err);
    }
}

// ===== RENDER HERO =====
function renderHero(r) {
    document.getElementById('heroBg').style.backgroundImage = `url('${r.image_url}')`;
    document.getElementById('heroCuisine').textContent = r.cuisine;
    document.getElementById('heroName').textContent = r.name;
    document.getElementById('heroRating').textContent = r.rating;
    document.getElementById('heroLocation').textContent = r.location;
    document.getElementById('heroPrice').textContent = r.price_range;
    const open = r.opening_time.slice(0,5);
    const close = r.closing_time.slice(0,5);
    document.getElementById('heroHours').textContent = `${open} – ${close}`;
}

// ===== LOAD FLOOR PLAN =====
async function loadFloorPlan() {
    const date = document.getElementById('fpDate').value;
    const time = document.getElementById('fpTime').value;
    const group = document.getElementById('tablesGroup');
    const loadingText = document.getElementById('svgLoadingText');

    group.innerHTML = '';
    loadingText.style.display = 'block';
    selectedTable = null;
    updateBookingPanel(null);

    try {
        const res = await fetch(`../api/tables.php?restaurant_id=${restaurantId}&date=${date}&time=${time}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        loadingText.style.display = 'none';
        renderFloorPlan(json.data);
    } catch(err) {
        loadingText.textContent = 'Failed to load floor plan.';
        console.error(err);
    }
}

// ===== RENDER FLOOR PLAN SVG =====
function renderFloorPlan(tables) {
    const group = document.getElementById('tablesGroup');
    const svgNS = 'http://www.w3.org/2000/svg';

    tables.forEach(table => {
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', `table-group ${table.status}`);
        g.setAttribute('data-id', table.id);
        g.setAttribute('data-num', table.table_number);
        g.setAttribute('data-cap', table.capacity);
        g.setAttribute('data-status', table.status);

        const x = parseInt(table.x_pos);
        const y = parseInt(table.y_pos);
        const isRound = table.shape === 'round';
        const cap = parseInt(table.capacity);

        // Draw chairs first (behind table)
        drawChairs(g, svgNS, x, y, isRound, cap);

        // Draw table body
        if (isRound) {
            const r = cap <= 2 ? 28 : cap <= 4 ? 36 : 44;
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', r);
            circle.setAttribute('class', `table-body ${table.status}`);
            circle.setAttribute('stroke', 'rgba(255,255,255,0.1)');
            circle.setAttribute('stroke-width', '1.5');
            g.appendChild(circle);

            // Label
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y - 5);
            label.setAttribute('class', 'table-label');
            label.textContent = table.table_number;
            g.appendChild(label);

            const capText = document.createElementNS(svgNS, 'text');
            capText.setAttribute('x', x);
            capText.setAttribute('y', y + 9);
            capText.setAttribute('class', 'table-cap');
            capText.textContent = `${cap} seats`;
            g.appendChild(capText);
        } else {
            // Rect table
            const w = cap <= 2 ? 60 : cap <= 4 ? 80 : cap <= 6 ? 110 : 140;
            const h = cap <= 2 ? 40 : cap <= 4 ? 50 : 56;
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', x - w/2);
            rect.setAttribute('y', y - h/2);
            rect.setAttribute('width', w);
            rect.setAttribute('height', h);
            rect.setAttribute('rx', '8');
            rect.setAttribute('class', `table-body ${table.status}`);
            rect.setAttribute('stroke', 'rgba(255,255,255,0.1)');
            rect.setAttribute('stroke-width', '1.5');
            g.appendChild(rect);

            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y - 6);
            label.setAttribute('class', 'table-label');
            label.textContent = table.table_number;
            g.appendChild(label);

            const capText = document.createElementNS(svgNS, 'text');
            capText.setAttribute('x', x);
            capText.setAttribute('y', y + 8);
            capText.setAttribute('class', 'table-cap');
            capText.textContent = `${cap} seats`;
            g.appendChild(capText);
        }

        // Click handler (only for available tables)
        if (table.status === 'available') {
            g.addEventListener('click', () => selectTable(table, g));
            g.style.cursor = 'pointer';
        } else {
            g.style.cursor = 'not-allowed';
            g.style.opacity = '0.7';
        }

        group.appendChild(g);
    });
}

// ===== DRAW CHAIRS =====
function drawChairs(g, svgNS, x, y, isRound, cap) {
    const chairSize = 10;
    const positions = [];

    if (isRound) {
        const radius = cap <= 2 ? 44 : cap <= 4 ? 54 : 64;
        const numChairs = cap;
        for (let i = 0; i < numChairs; i++) {
            const angle = (i / numChairs) * Math.PI * 2 - Math.PI / 2;
            positions.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
        }
    } else {
        const w = cap <= 2 ? 60 : cap <= 4 ? 80 : cap <= 6 ? 110 : 140;
        const h = cap <= 2 ? 40 : cap <= 4 ? 50 : 56;
        const chairsPerSide = Math.ceil(cap / 2);
        for (let i = 0; i < chairsPerSide; i++) {
            const tx = x - w/2 + (w / (chairsPerSide + 1)) * (i + 1);
            positions.push([tx, y - h/2 - 12]);
            if (positions.length < cap) positions.push([tx, y + h/2 + 12]);
        }
    }

    positions.slice(0, cap).forEach(([cx, cy]) => {
        const chair = document.createElementNS(svgNS, 'circle');
        chair.setAttribute('cx', cx);
        chair.setAttribute('cy', cy);
        chair.setAttribute('r', chairSize);
        chair.setAttribute('class', 'chair');
        g.appendChild(chair);
    });
}

// ===== SELECT TABLE =====
function selectTable(table, groupEl) {
    // Deselect previous
    document.querySelectorAll('.table-group .table-body.selected').forEach(el => {
        el.classList.remove('selected');
        el.classList.add('available');
    });

    // Select new
    const body = groupEl.querySelector('.table-body');
    body.classList.remove('available');
    body.classList.add('selected');

    selectedTable = table;
    updateBookingPanel(table);
}

// ===== UPDATE BOOKING PANEL =====
function updateBookingPanel(table) {
    const display = document.getElementById('selectedTableDisplay');
    const reserveBtn = document.getElementById('reserveBtn');
    const tableIdInput = document.getElementById('selectedTableId');

    if (!table) {
        display.classList.remove('has-selection');
        reserveBtn.disabled = true;
        reserveBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Select a Table First';
        tableIdInput.value = '';
        return;
    }

    display.classList.add('has-selection');
    document.getElementById('selectedTableNum').textContent = table.table_number;
    document.getElementById('selectedTableDetails').textContent =
        `${table.shape === 'round' ? 'Round table' : 'Rectangular table'} · Up to ${table.capacity} guests`;
    tableIdInput.value = table.id;
    reserveBtn.disabled = false;
    reserveBtn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirm Reservation';
}

// ===== SUBMIT RESERVATION =====
async function submitReservation(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user') || 'null');
    if (!user || !user.id) {
        window.location.href = `login-signup.html?redirect=restaurant.html?id=${restaurantId}`;
        return;
    }

    if (!selectedTable) {
        showToast('error', 'No Table Selected', 'Please click a table on the floor plan first.');
        return;
    }

    const btn = document.getElementById('reserveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming...';

    const payload = {
        user_id: user.id,
        restaurant_id: restaurantId,
        table_id: selectedTable.id,
        date: document.getElementById('bookDate').value,
        time: document.getElementById('bookTime').value,
        guests: document.getElementById('bookGuests').value,
        special_requests: document.getElementById('bookRequests').value
    };

    try {
        const res = await fetch('../api/reserve.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            // Populate Modal
            document.getElementById('modalBookingId').textContent = `#${json.reservation_id}`;
            document.getElementById('modalPhone').textContent = user.phone || 'Not Provided';
            document.getElementById('modalDateTime').textContent = `${payload.date} at ${payload.time}`;
            document.getElementById('modalTableNum').textContent = selectedTable.table_number;
            document.getElementById('modalGuests').textContent = payload.guests;
            
            // Show Modal
            document.getElementById('successModal').style.display = 'flex';
            
            // Mark table as occupied visually
            document.querySelector(`[data-id="${selectedTable.id}"] .table-body`).classList.replace('selected', 'occupied');
            
            selectedTable = null;
            updateBookingPanel(null);
            document.getElementById('bookingForm').reset();
            
            // Also show toast just in case
            showToast('success', 'Reservation Confirmed! 🎉', 'Your table has been successfully booked.');
        } else {
            showToast('error', 'Reservation Failed', json.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirm Reservation';
        }
    } catch (err) {
        showToast('error', 'Network Error', 'Could not connect to the server.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirm Reservation';
    }
}

// ===== TOAST =====
function showToast(type, title, msg) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastIconI = document.getElementById('toastIconI');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMsg').textContent = msg;

    toast.className = `toast ${type}`;
    toastIconI.className = type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-xmark';

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
    const list = document.getElementById('reviewsList');
    try {
        const res = await fetch(`../api/get_reviews.php?restaurant_id=${restaurantId}`);
        const json = await res.json();
        
        if (json.success && json.data.length > 0) {
            list.innerHTML = '';
            json.data.forEach(rev => {
                const item = document.createElement('div');
                item.className = 'review-item';
                item.style = 'margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 15px;';
                
                let stars = '';
                for (let i = 0; i < 5; i++) {
                    stars += `<i class="fa-solid fa-star" style="color:${i < rev.rating ? '#f1c40f' : 'rgba(255,255,255,0.1)'}; font-size: 11px;"></i>`;
                }

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="font-size: 0.9rem; color: #fff;">${rev.user_name}</strong>
                        <div class="stars">${stars}</div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">"${rev.comment}"</p>
                    <small style="font-size: 0.7rem; color: rgba(255,255,255,0.2); margin-top: 8px; display: block;">${new Date(rev.created_at).toLocaleDateString()}</small>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<p class="placeholder-text">No reviews yet. Be the first to review!</p>';
        }
    } catch (err) {
        list.innerHTML = '<p class="placeholder-text" style="color:#ff4757;">Failed to load reviews.</p>';
    }
}
