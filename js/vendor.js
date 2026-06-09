// js/vendor.js - Vendor Dashboard with 2-step Restaurant Modal + Floor Plan Editor

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. MODAL + FLOOR PLAN STATE (defined FIRST)
    // =========================================================
    let currentRestId = null;   // ID of restaurant being added/edited
    let vFloorTables  = [];     // { id, table_number, capacity, shape, x_pos, y_pos, _new, _dirty, _delete }
    let vSelectedId   = null;
    let vDragState    = null;
    let vNextTempId   = -1;

    // ── Open modal (add new) ──
    window.openRestaurantModal = () => {
        currentRestId = null;
        vFloorTables  = [];
        vSelectedId   = null;

        const form = document.getElementById('restForm');
        if (form) form.reset();
        document.getElementById('restId').value         = '';
        document.getElementById('restModalTitle').innerText = 'Add New Restaurant';
        document.getElementById('restTableLayout') && (document.getElementById('restTableLayout').value = '');

        // Reset image preview
        const img = document.querySelector('#imagePreview img');
        const ph  = document.querySelector('#imagePreview .preview-placeholder');
        if (img) img.style.display = 'none';
        if (ph)  ph.style.display  = 'flex';
        const lbl = document.getElementById('fileLabelText');
        if (lbl) lbl.innerText = 'Choose Restaurant Image';

        showStep(1);
        document.getElementById('restModal').classList.add('show');
    };

    window.closeModal = (id) => {
        document.getElementById(id)?.classList.remove('show');
    };

    window.previewImage = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.querySelector('#imagePreview img');
                const ph  = document.querySelector('#imagePreview .preview-placeholder');
                if (img) { img.src = e.target.result; img.style.display = 'block'; }
                if (ph)  ph.style.display = 'none';
                const lbl = document.getElementById('fileLabelText');
                if (lbl) lbl.innerText = input.files[0].name;
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    // Close modal on backdrop click
    document.getElementById('restModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('restModal')) window.closeModal('restModal');
    });

    // ── Step switching ──
    function showStep(n) {
        document.getElementById('stepDetails').style.display = (n === 1) ? 'block' : 'none';
        document.getElementById('stepFloor').style.display   = (n === 2) ? 'block' : 'none';

        const s1 = document.getElementById('step1dot');
        const s2 = document.getElementById('step2dot');
        const ln = document.getElementById('stepLine');

        if (n === 1) {
            s1.className = 'step-dot active';
            s2.className = 'step-dot';
            ln.className = 'step-line';
            document.getElementById('restModalContent').classList.remove('step2');
            document.getElementById('restModalTitle').innerText = currentRestId ? 'Edit Restaurant' : 'Add New Restaurant';
        } else {
            s1.className = 'step-dot done';
            s2.className = 'step-dot active';
            ln.className = 'step-line done';
            document.getElementById('restModalContent').classList.add('step2');
            document.getElementById('restModalTitle').innerText = 'Set Up Floor Plan';
        }
    }

    window.goBackToDetails = () => showStep(1);

    // =========================================================
    // 2. AUTH / SESSION CHECK
    // =========================================================
    const userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
    if (!userStr) { window.location.href = 'login-signup.html'; return; }

    let vendorUser;
    try {
        vendorUser = JSON.parse(userStr);
        if (vendorUser.role !== 'vendor') { window.location.href = 'index.html'; return; }
    } catch (e) { window.location.href = 'login-signup.html'; return; }

    const userId = vendorUser.id;
    const welcomeEl = document.getElementById('welcomeText');
    if (welcomeEl) welcomeEl.innerText = `Welcome back, ${vendorUser.name}!`;

    // =========================================================
    // 3. SIDEBAR NAVIGATION
    // =========================================================
    const navLinks = document.querySelectorAll('.admin-nav a[data-target]');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(sec => sec.classList.toggle('active', sec.id === target));
            if (target === 'dashboard')    loadStats();
            if (target === 'restaurants')  loadRestaurants();
            if (target === 'reservations') loadReservations();
        });
    });

    // =========================================================
    // 4. TOAST
    // =========================================================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.className = `toast-notification ${type} show`;
        toast.innerText = message;
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // =========================================================
    // 5. STATS
    // =========================================================
    let vendorRestaurants  = [];
    let vendorReservations = [];

    function loadStats() {
        Promise.all([
            fetch(`../api/vendor_api.php?endpoint=restaurants&user_id=${userId}`).then(r => r.json()),
            fetch(`../api/vendor_api.php?endpoint=reservations&user_id=${userId}`).then(r => r.json())
        ]).then(([rr, resr]) => {
            if (rr.success)   { vendorRestaurants  = rr.data   || []; document.getElementById('statRests').innerText = vendorRestaurants.length; document.getElementById('statPendingRests').innerText = vendorRestaurants.filter(r => r.status === 'pending').length; }
            if (resr.success) { vendorReservations = resr.data || []; document.getElementById('statReservations').innerText = vendorReservations.length; }
        }).catch(err => { console.error(err); showToast('Failed to load stats.', 'error'); });
    }

    // =========================================================
    // 6. RESTAURANTS LIST
    // =========================================================
    function loadRestaurants() {
        const grid = document.getElementById('restGrid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--orange)"></i><br><br>Loading...</div>';
        fetch(`../api/vendor_api.php?endpoint=restaurants&user_id=${userId}`)
            .then(r => r.json())
            .then(res => {
                if (res.success) { vendorRestaurants = res.data || []; renderRestaurants(vendorRestaurants); }
                else showToast(res.message, 'error');
            }).catch(() => showToast('Failed to load restaurants.', 'error'));
    }

    function renderRestaurants(list) {
        const grid = document.getElementById('restGrid');
        if (!grid) return;
        grid.innerHTML = '';
        if (list.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;background:var(--surface);border-radius:12px;border:1px dashed var(--glass-border);"><i class="fa-solid fa-utensils" style="font-size:48px;color:var(--text-muted);opacity:0.3;margin-bottom:16px;display:block;"></i><p style="color:var(--text-muted);margin-bottom:20px;">You haven't listed any restaurants yet.</p><button class="btn btn-primary" onclick="openRestaurantModal()">+ Add Your First Restaurant</button></div>`;
            return;
        }
        list.forEach(rest => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.style.cssText = 'position:relative;overflow:hidden;border-radius:12px;';
            const statusClass = rest.status || 'pending';
            const imgUrl = rest.image_url || '';
            const imgStyle = imgUrl ? `background-image:url('${imgUrl}');` : 'background:linear-gradient(135deg,#ff6b2b,#e85520);';
            card.innerHTML = `
                <div style="position:absolute;top:12px;right:12px;z-index:10;"><span class="status-badge ${statusClass}">${statusClass}</span></div>
                <div style="${imgStyle}height:180px;background-size:cover;background-position:center;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;">
                    ${!imgUrl ? '<i class="fa-solid fa-utensils" style="font-size:40px;color:rgba(255,255,255,0.6);"></i>' : ''}
                </div>
                <div style="padding:20px;">
                    <h3 style="margin-bottom:6px;font-size:17px;">${escHtml(rest.name)}</h3>
                    <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escHtml(rest.description || 'No description provided.')}</p>
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:18px;">
                        <span><i class="fa-solid fa-utensils"></i> ${escHtml(rest.cuisine || '—')}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${escHtml(rest.location || '—')}</span>
                        <span><i class="fa-solid fa-clock"></i> ${rest.opening_time ? rest.opening_time.slice(0,5) : '—'}</span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-primary" style="flex:1;font-size:13px;" onclick="editRestaurant(${rest.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn btn-primary" style="flex:1;font-size:13px;" onclick="editFloorPlan(${rest.id})"><i class="fa-solid fa-table-cells"></i> Floor Plan</button>
                        <button class="btn btn-primary" style="flex:1;font-size:13px;background:transparent;border:1px solid #ff4757;color:#ff4757;" onclick="deleteRestaurant(${rest.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
    }

    function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    window.filterRestaurants = () => {
        const q = document.getElementById('searchRestaurants')?.value.toLowerCase() || '';
        renderRestaurants(vendorRestaurants.filter(r => (r.name||'').toLowerCase().includes(q) || (r.cuisine||'').toLowerCase().includes(q) || (r.location||'').toLowerCase().includes(q)));
    };

    // =========================================================
    // 7. RESERVATIONS
    // =========================================================
    function loadReservations() {
        const container = document.getElementById('resList');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--orange)"></i></div>';
        fetch(`../api/vendor_api.php?endpoint=reservations&user_id=${userId}`)
            .then(r => r.json())
            .then(res => { if (res.success) { vendorReservations = res.data || []; renderReservations(vendorReservations); } else showToast(res.message, 'error'); })
            .catch(() => showToast('Failed to load reservations.', 'error'));
    }

    function renderReservations(list) {
        const c = document.getElementById('resList'); if (!c) return; c.innerHTML = '';
        if (list.length === 0) { c.innerHTML = `<div style="text-align:center;padding:60px;background:var(--surface);border-radius:12px;border:1px dashed var(--glass-border);"><i class="fa-solid fa-book" style="font-size:48px;color:var(--text-muted);opacity:0.3;display:block;margin-bottom:16px;"></i><p style="color:var(--text-muted);">No reservations yet.</p></div>`; return; }
        list.forEach(res => {
            const card = document.createElement('div'); card.className = 'admin-card';
            card.style.cssText = 'display:flex;flex-direction:row;align-items:center;padding:20px;gap:20px;flex-wrap:wrap;';
            const sc = res.status === 'confirmed' ? 'approved' : (res.status === 'pending' ? 'pending' : 'rejected');
            card.innerHTML = `<div style="flex:1;min-width:220px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span class="status-badge ${sc}">${res.status}</span><span style="font-size:12px;color:var(--text-muted);"><i class="fa-solid fa-store"></i> ${escHtml(res.restaurant_name)}</span></div><h3 style="margin-bottom:4px;">${escHtml(res.user_name)}</h3><p style="color:var(--text-muted);font-size:13px;"><i class="fa-solid fa-phone"></i> ${escHtml(res.user_phone||'—')}</p></div><div style="flex:1;min-width:180px;font-size:14px;display:flex;flex-direction:column;gap:6px;"><div><i class="fa-solid fa-calendar"></i> <strong>Date:</strong> ${res.date}</div><div><i class="fa-solid fa-clock"></i> <strong>Time:</strong> ${res.time}</div></div><div style="flex:1;min-width:150px;font-size:14px;display:flex;flex-direction:column;gap:6px;"><div><i class="fa-solid fa-users"></i> <strong>Guests:</strong> ${res.guests}</div><div><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${escHtml(res.table_number)}</div></div><div style="display:flex;gap:10px;flex-wrap:wrap;">${res.status==='pending'?`<button class="btn btn-primary" style="background:#2ecc71;border-color:#2ecc71;" onclick="updateReservation(${res.id},'confirmed')"><i class="fa-solid fa-check"></i> Accept</button>`:''} ${res.status!=='cancelled'?`<button class="btn btn-primary" style="background:transparent;border:1px solid #ff4757;color:#ff4757;" onclick="updateReservation(${res.id},'cancelled')"><i class="fa-solid fa-times"></i> Cancel</button>`:''}</div>`;
            c.appendChild(card);
        });
    }

    window.updateReservation = (id, status) => {
        fetch('../api/vendor_api.php?endpoint=update_reservation', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({user_id:userId,reservation_id:id,status}) })
            .then(r=>r.json()).then(res => { if(res.success){showToast(`Reservation ${status==='confirmed'?'accepted':'cancelled'}.`); loadReservations();} else showToast(res.message,'error'); })
            .catch(()=>showToast('Failed to update.','error'));
    };

    // =========================================================
    // 8. EDIT / DELETE RESTAURANT (from card)
    // =========================================================
    window.editRestaurant = (id) => {
        const rest = vendorRestaurants.find(r => r.id === id);
        if (!rest) return;
        currentRestId = id;

        document.getElementById('restId').value        = rest.id;
        document.getElementById('restName').value      = rest.name;
        document.getElementById('restDesc').value      = rest.description || '';
        document.getElementById('restCuisine').value   = rest.cuisine || '';
        document.getElementById('restLocation').value  = rest.location || '';
        document.getElementById('restPrice').value     = rest.price_range || '$$';
        document.getElementById('restHalal').value     = rest.is_halal ?? '1';

        if (rest.opening_time) document.getElementById('restOpen').value  = rest.opening_time.substring(0,5);
        if (rest.closing_time) document.getElementById('restClose').value = rest.closing_time.substring(0,5);

        // Image preview
        const img = document.querySelector('#imagePreview img');
        const ph  = document.querySelector('#imagePreview .preview-placeholder');
        const lbl = document.getElementById('fileLabelText');
        if (rest.image_url) { img.src = rest.image_url; img.style.display='block'; if(ph) ph.style.display='none'; if(lbl) lbl.innerText='Change Image'; }
        else { if(img) img.style.display='none'; if(ph) ph.style.display='flex'; if(lbl) lbl.innerText='Choose Restaurant Image'; }

        showStep(1);
        document.getElementById('restModal').classList.add('show');
    };

    // Open directly to floor plan for an existing restaurant
    window.editFloorPlan = (id) => {
        const rest = vendorRestaurants.find(r => r.id === id);
        if (!rest) return;
        currentRestId = id;
        document.getElementById('restId').value = id;
        showStep(2);
        loadVendorFloorPlan(id);
        document.getElementById('restModal').classList.add('show');
    };

    window.deleteRestaurant = (id) => {
        const rest = vendorRestaurants.find(r => r.id === id);
        if (!rest || !confirm(`Delete "${rest.name}"? This will remove all its tables and cannot be undone.`)) return;
        fetch(`../api/vendor_api.php?endpoint=restaurants&id=${id}&user_id=${userId}`, {method:'DELETE'})
            .then(r=>r.json()).then(res => { if(res.success){showToast('Restaurant deleted.'); loadRestaurants(); loadStats();} else showToast(res.message,'error'); })
            .catch(()=>showToast('Delete failed.','error'));
    };

    // =========================================================
    // 9. STEP 1 FORM SUBMIT → save restaurant → go to Step 2
    // =========================================================
    document.getElementById('restForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const id = document.getElementById('restId').value;
        const formData = new FormData();
        formData.append('user_id',       userId);
        formData.append('name',          document.getElementById('restName').value.trim());
        formData.append('description',   document.getElementById('restDesc').value.trim());
        formData.append('cuisine',       document.getElementById('restCuisine').value.trim());
        formData.append('location',      document.getElementById('restLocation').value.trim());
        formData.append('price_range',   document.getElementById('restPrice').value.trim() || '$$');
        formData.append('is_halal',      document.getElementById('restHalal').value);

        const openVal  = document.getElementById('restOpen').value;
        const closeVal = document.getElementById('restClose').value;
        formData.append('opening_time',  openVal  ? openVal  + ':00' : '11:00:00');
        formData.append('closing_time',  closeVal ? closeVal + ':00' : '22:00:00');
        formData.append('opening_hours', `${openVal||'11:00'} - ${closeVal||'22:00'}`);
        formData.append('table_layout',  '2,4,4,6'); // default; overwritten in step 2

        const fileInput = document.getElementById('restImage');
        if (fileInput && fileInput.files.length > 0) formData.append('image', fileInput.files[0]);

        const url = id ? `../api/vendor_api.php?endpoint=restaurants&id=${id}` : `../api/vendor_api.php?endpoint=restaurants`;

        try {
            const res = await fetch(url, { method: 'POST', body: formData }).then(r => r.json());
            if (!res.success) { showToast(res.message || 'Failed to save.', 'error'); btn.disabled=false; btn.innerHTML='Next — Set Up Floor Plan <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>'; return; }

            // If new restaurant, reload list to get the new ID
            if (!id) {
                const listRes = await fetch(`../api/vendor_api.php?endpoint=restaurants&user_id=${userId}`).then(r => r.json());
                if (listRes.success && listRes.data.length > 0) {
                    vendorRestaurants = listRes.data;
                    // Newest restaurant has highest id
                    const newest = listRes.data.reduce((a,b) => (b.id > a.id ? b : a));
                    currentRestId = newest.id;
                    document.getElementById('restId').value = newest.id;
                }
            } else {
                currentRestId = parseInt(id);
            }

            showToast('Restaurant details saved!');
            btn.disabled = false;
            btn.innerHTML = 'Next — Set Up Floor Plan <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>';

            // Transition to Step 2
            showStep(2);
            await loadVendorFloorPlan(currentRestId);
            loadStats();
        } catch (err) {
            console.error(err); showToast('Network error.', 'error');
            btn.disabled = false; btn.innerHTML = 'Next — Set Up Floor Plan <i class="fa-solid fa-arrow-right" style="margin-left:6px;"></i>';
        }
    });

    // =========================================================
    // 10. FLOOR PLAN EDITOR (Step 2)
    // =========================================================

    async function loadVendorFloorPlan(restId) {
        vFloorTables  = [];
        vSelectedId   = null;
        vNextTempId   = -1;
        renderVendorSidebar(null);

        const room = document.getElementById('vendorFloorRoom');
        if (room) room.querySelectorAll('.floor-table').forEach(el => el.remove());

        try {
            const res = await fetch(`../api/vendor_tables.php?restaurant_id=${restId}&user_id=${userId}`).then(r => r.json());
            if (res.success) {
                vFloorTables = (res.data || []).map(t => ({...t, _dirty:false, _new:false, _delete:false}));
                renderVendorFloorPlan();
            } else {
                showToast(res.message || 'Could not load floor plan.', 'error');
            }
        } catch (err) { console.error(err); showToast('Could not load floor plan.', 'error'); }
    }

    function renderVendorFloorPlan() {
        const room = document.getElementById('vendorFloorRoom');
        if (!room) return;
        room.querySelectorAll('.floor-table').forEach(el => el.remove());
        vFloorTables.filter(t => !t._delete).forEach(t => createVendorTableEl(t));
    }

    function createVendorTableEl(t) {
        const room = document.getElementById('vendorFloorRoom');
        if (!room) return;

        const el = document.createElement('div');
        el.className = `floor-table ${t.shape}`;
        el.dataset.id = t.id;

        const bw = t.shape === 'round' ? 80 : 110;
        const bh = t.shape === 'round' ? 80 : 70;
        const pad = 28;

        el.style.left   = t.x_pos + 'px';
        el.style.top    = t.y_pos + 'px';
        el.style.width  = (bw + pad * 2) + 'px';
        el.style.height = (bh + pad * 2) + 'px';

        const cap = parseInt(t.capacity) || 4;
        el.innerHTML = `${vendorSeatsHTML(t.shape, cap, bw, bh, pad)}<div class="table-body"><span class="table-label">T${t.table_number}</span><span class="table-cap">${cap} seats</span></div>`;

        if (t.id === vSelectedId) el.classList.add('selected');

        el.addEventListener('mousedown', (e) => { e.stopPropagation(); vStartDrag(e, t.id, el); });
        room.appendChild(el);
    }

    function vendorSeatsHTML(shape, cap, bw, bh, pad) {
        let html = '';
        const cx = pad + bw / 2, cy = pad + bh / 2;
        if (shape === 'round') {
            const r = bw / 2 + 14;
            for (let i = 0; i < cap; i++) {
                const a = (2 * Math.PI * i / cap) - Math.PI / 2;
                html += `<div class="seat" style="left:${(cx + r*Math.cos(a)-9).toFixed(1)}px;top:${(cy + r*Math.sin(a)-9).toFixed(1)}px;"></div>`;
            }
        } else {
            const top = Math.ceil(cap/2), bot = Math.floor(cap/2);
            for (let i=0;i<top;i++) html += `<div class="seat" style="left:${(pad+(bw/(top+1))*(i+1)-9).toFixed(1)}px;top:${(pad-16).toFixed(1)}px;"></div>`;
            for (let i=0;i<bot;i++) html += `<div class="seat" style="left:${(pad+(bw/(bot+1))*(i+1)-9).toFixed(1)}px;top:${(pad+bh-2).toFixed(1)}px;"></div>`;
        }
        return html;
    }

    function vStartDrag(e, id, el) {
        vSelectTable(id);
        const room = document.getElementById('vendorFloorRoom');
        const roomRect = room.getBoundingClientRect();
        const elRect   = el.getBoundingClientRect();
        const offX = e.clientX - elRect.left, offY = e.clientY - elRect.top;

        vDragState = { id, el, offX, offY };

        const onMove = (ev) => {
            if (!vDragState) return;
            const rx = ev.clientX - roomRect.left - vDragState.offX;
            const ry = ev.clientY - roomRect.top  - vDragState.offY;
            const sx = Math.round(rx/10)*10, sy = Math.round(ry/10)*10;
            const mx = room.offsetWidth  - vDragState.el.offsetWidth;
            const my = room.offsetHeight - vDragState.el.offsetHeight;
            const cx = Math.max(0, Math.min(sx, mx));
            const cy = Math.max(0, Math.min(sy, my));
            vDragState.el.style.left = cx + 'px';
            vDragState.el.style.top  = cy + 'px';
            const t = vFloorTables.find(t => t.id === vDragState.id);
            if (t) { t.x_pos = cx; t.y_pos = cy; t._dirty = true; }
        };
        const onUp = () => {
            vDragState = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            // Update position fields in sidebar if open
            const t = vFloorTables.find(t => t.id === vSelectedId);
            if (t) { const xEl = document.getElementById('vsp-x'); const yEl = document.getElementById('vsp-y'); if(xEl) xEl.value = t.x_pos; if(yEl) yEl.value = t.y_pos; }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    function vSelectTable(id) {
        vSelectedId = id;
        document.querySelectorAll('#vendorFloorRoom .floor-table').forEach(el => el.classList.remove('selected'));
        const el = document.querySelector(`#vendorFloorRoom .floor-table[data-id="${id}"]`);
        if (el) el.classList.add('selected');
        renderVendorSidebar(vFloorTables.find(t => t.id === id));
    }

    function renderVendorSidebar(t) {
        const sb = document.getElementById('vendorFloorSidebar');
        if (!sb) return;
        if (!t) {
            sb.innerHTML = `<div class="floor-sidebar-header">Properties</div><div style="flex:1;display:flex;align-items:center;justify-content:center;"><p style="color:var(--text-muted);font-size:12px;text-align:center;padding:16px;">Click a table to select and edit it</p></div>`;
            return;
        }
        sb.innerHTML = `
            <div class="floor-sidebar-header">Table ${escHtml(String(t.table_number))}</div>
            <div class="floor-sidebar-body">
                <div class="form-group">
                    <label style="font-size:11px;">Table Label</label>
                    <input type="text" class="form-control" id="vsp-num" value="${escHtml(String(t.table_number))}" style="font-size:12px;" oninput="vUpdateTable('table_number',this.value)">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">Capacity (seats)</label>
                    <input type="number" class="form-control" id="vsp-cap" value="${t.capacity}" min="1" max="20" style="font-size:12px;" oninput="vUpdateTable('capacity',this.value)">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">Shape</label>
                    <select class="form-control" id="vsp-shape" style="font-size:12px;" onchange="vUpdateTable('shape',this.value)">
                        <option value="round" ${t.shape==='round'?'selected':''}>Round</option>
                        <option value="rect"  ${t.shape==='rect' ?'selected':''}>Rectangular</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">Position (X / Y)</label>
                    <div style="display:flex;gap:6px;">
                        <input type="number" class="form-control" id="vsp-x" value="${t.x_pos}" placeholder="X" style="flex:1;font-size:12px;" oninput="vUpdatePos('x_pos',this.value)">
                        <input type="number" class="form-control" id="vsp-y" value="${t.y_pos}" placeholder="Y" style="flex:1;font-size:12px;" oninput="vUpdatePos('y_pos',this.value)">
                    </div>
                </div>
                <button class="sidebar-delete-btn" style="font-size:12px;" onclick="vDeleteTable(${t.id})"><i class="fa-solid fa-trash"></i> Delete Table</button>
            </div>`;
    }

    window.vUpdateTable = (key, value) => {
        const t = vFloorTables.find(t => t.id === vSelectedId); if (!t) return;
        t[key] = value; t._dirty = true;
        const old = document.querySelector(`#vendorFloorRoom .floor-table[data-id="${t.id}"]`);
        if (old) old.remove();
        createVendorTableEl(t);
        document.querySelector(`#vendorFloorRoom .floor-table[data-id="${t.id}"]`)?.classList.add('selected');
        const hdr = document.querySelector('#vendorFloorSidebar .floor-sidebar-header');
        if (hdr) hdr.textContent = `Table ${t.table_number}`;
    };

    window.vUpdatePos = (key, value) => {
        const t = vFloorTables.find(t => t.id === vSelectedId); if (!t) return;
        t[key] = parseInt(value)||0; t._dirty = true;
        const el = document.querySelector(`#vendorFloorRoom .floor-table[data-id="${t.id}"]`);
        if (el) { if(key==='x_pos') el.style.left = t.x_pos+'px'; if(key==='y_pos') el.style.top = t.y_pos+'px'; }
    };

    window.vDeleteTable = (id) => {
        if (!confirm('Delete this table?')) return;
        const t = vFloorTables.find(t => t.id === id); if (!t) return;
        if (t._new) { vFloorTables = vFloorTables.filter(x => x.id !== id); }
        else { t._delete = true; }
        document.querySelector(`#vendorFloorRoom .floor-table[data-id="${id}"]`)?.remove();
        vSelectedId = null; renderVendorSidebar(null);
        showToast('Table removed (save to confirm).', 'success');
    };

    window.vAddTable = (shape, capacity) => {
        if (!currentRestId) { showToast('Please save restaurant details first.', 'error'); return; }
        const count = vFloorTables.filter(t => !t._delete).length + 1;
        const newT = {
            id: vNextTempId--,
            restaurant_id: currentRestId,
            table_number: String(count),
            capacity, shape,
            x_pos: 60  + Math.floor(Math.random() * 400),
            y_pos: 60  + Math.floor(Math.random() * 300),
            _new: true, _dirty: true, _delete: false
        };
        vFloorTables.push(newT);
        createVendorTableEl(newT);
        vSelectTable(newT.id);
    };

    // ── Save all: save new/dirty tables, delete flagged ones ──
    window.vendorSaveAll = async () => {
        if (!currentRestId) { showToast('No restaurant to save.', 'error'); return; }
        const btn = document.getElementById('vendorSaveBtn');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            // 1. Delete flagged
            for (const t of vFloorTables.filter(x => x._delete && !x._new)) {
                await fetch(`../api/vendor_tables.php?id=${t.id}&user_id=${userId}`, {method:'DELETE'});
            }
            vFloorTables = vFloorTables.filter(x => !x._delete);

            // 2. Create new
            for (const t of vFloorTables.filter(x => x._new && x._dirty)) {
                const res = await fetch(`../api/vendor_tables.php?user_id=${userId}`, {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ restaurant_id: currentRestId, table_number: t.table_number, capacity: t.capacity, shape: t.shape, x_pos: t.x_pos, y_pos: t.y_pos })
                }).then(r => r.json());
                if (res.success && res.id) {
                    const el = document.querySelector(`#vendorFloorRoom .floor-table[data-id="${t.id}"]`);
                    if (el) el.dataset.id = res.id;
                    t.id = res.id;
                }
                t._new = false; t._dirty = false;
            }

            // 3. Update dirty existing
            for (const t of vFloorTables.filter(x => x._dirty && !x._new)) {
                await fetch(`../api/vendor_tables.php?id=${t.id}&user_id=${userId}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ table_number: t.table_number, capacity: t.capacity, shape: t.shape, x_pos: t.x_pos, y_pos: t.y_pos })
                });
                t._dirty = false;
            }

            showToast('Restaurant & floor plan saved successfully!');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Restaurant';
                window.closeModal('restModal');
                loadRestaurants();
                loadStats();
            }, 1200);
        } catch (err) {
            console.error(err);
            showToast('Save failed. Please try again.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Restaurant';
        }
    };

    // =========================================================
    // 11. INITIAL LOAD
    // =========================================================
    loadStats();
});
