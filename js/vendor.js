// js/vendor.js - Vendor Dashboard Controllers

document.addEventListener('DOMContentLoaded', () => {
    // 1. Session check & Security
    const userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
    if (!userStr) {
        window.location.href = 'login-signup.html';
        return;
    }

    let vendorUser;
    try {
        vendorUser = JSON.parse(userStr);
        if (vendorUser.role !== 'vendor') {
            window.location.href = 'index.html';
            return;
        }
    } catch(e) {
        window.location.href = 'login-signup.html';
        return;
    }

    const userId = vendorUser.id;
    document.getElementById('welcomeText').innerText = `Welcome back, ${vendorUser.name}!`;

    // 2. Navigation Sidebar
    const navLinks = document.querySelectorAll('.admin-nav a[data-target]');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(sec => {
                if (sec.id === target) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });

            // Load relevant data on section change
            if (target === 'dashboard') loadStats();
            if (target === 'restaurants') loadRestaurants();
            if (target === 'reservations') loadReservations();
        });
    });

    // 3. Stats & Data Loading
    let vendorRestaurants = [];
    let vendorReservations = [];

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.className = `toast-notification ${type} show`;
        toast.innerText = message;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function loadStats() {
        Promise.all([
            fetch(`../api/vendor_api.php?endpoint=restaurants&user_id=${userId}`).then(res => res.json()),
            fetch(`../api/vendor_api.php?endpoint=reservations&user_id=${userId}`).then(res => res.json())
        ])
        .then(([restRes, resRes]) => {
            if (restRes.success) {
                vendorRestaurants = restRes.data || [];
                document.getElementById('statRests').innerText = vendorRestaurants.length;
                
                const pending = vendorRestaurants.filter(r => r.status === 'pending').length;
                document.getElementById('statPendingRests').innerText = pending;
            }
            if (resRes.success) {
                vendorReservations = resRes.data || [];
                document.getElementById('statReservations').innerText = vendorReservations.length;
            }
        })
        .catch(err => {
            console.error("Error loading stats:", err);
            showToast("Failed to load dashboard data.", "error");
        });
    }

    function loadRestaurants() {
        fetch(`../api/vendor_api.php?endpoint=restaurants&user_id=${userId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    vendorRestaurants = res.data || [];
                    renderRestaurants(vendorRestaurants);
                } else {
                    showToast(res.message, "error");
                }
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load restaurants.", "error");
            });
    }

    function renderRestaurants(list) {
        const grid = document.getElementById('restGrid');
        grid.innerHTML = '';

        if (list.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; background: var(--surface); border-radius: 12px; border: 1px dashed var(--glass-border);">
                    <i class="fa-solid fa-utensils" style="font-size: 40px; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-muted);">You haven't listed any restaurants yet.</p>
                    <button class="btn btn-primary" onclick="openRestaurantModal()" style="margin-top: 15px;">+ Add Restaurant</button>
                </div>
            `;
            return;
        }

        list.forEach(rest => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.style.position = 'relative';

            const statusClass = rest.status || 'pending';
            const imgUrl = rest.image_url ? rest.image_url : '../pictures/restaurants/restaurant-placeholder.jpg';

            card.innerHTML = `
                <div class="rest-card-status">
                    <span class="status-badge ${statusClass}">${statusClass}</span>
                </div>
                <div class="admin-card-img" style="background-image: url('${imgUrl}'); height: 160px; background-size: cover; background-position: center; border-radius: 12px 12px 0 0;"></div>
                <div class="admin-card-body" style="padding: 20px;">
                    <h3 style="margin-bottom: 8px;">${rest.name}</h3>
                    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${rest.description || 'No description provided.'}</p>
                    <div style="display:flex; justify-content: space-between; font-size:12px; color: var(--text-muted); margin-bottom: 20px;">
                        <span><i class="fa-solid fa-utensils"></i> ${rest.cuisine}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${rest.location}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="flex:1; background: var(--orange);" onclick="editRestaurant(${rest.id})">Edit</button>
                        <button class="btn btn-primary" style="flex:1; background: transparent; border: 1px solid #ff4757; color: #ff4757;" onclick="deleteRestaurant(${rest.id})">Delete</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    window.filterRestaurants = () => {
        const query = document.getElementById('searchRestaurants').value.toLowerCase();
        const filtered = vendorRestaurants.filter(r => r.name.toLowerCase().includes(query) || r.cuisine.toLowerCase().includes(query) || r.location.toLowerCase().includes(query));
        renderRestaurants(filtered);
    };

    // 4. Reservations Panel
    function loadReservations() {
        fetch(`../api/vendor_api.php?endpoint=reservations&user_id=${userId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    vendorReservations = res.data || [];
                    renderReservations(vendorReservations);
                } else {
                    showToast(res.message, "error");
                }
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load reservations.", "error");
            });
    }

    function renderReservations(list) {
        const container = document.getElementById('resList');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; background: var(--surface); border-radius: 12px; border: 1px dashed var(--glass-border);">
                    <i class="fa-solid fa-book" style="font-size: 40px; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-muted);">No reservations found at your restaurants.</p>
                </div>
            `;
            return;
        }

        list.forEach(res => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'row';
            card.style.alignItems = 'center';
            card.style.padding = '20px';
            card.style.gap = '20px';
            card.style.flexWrap = 'wrap';

            const statusClass = res.status === 'confirmed' ? 'approved' : (res.status === 'pending' ? 'pending' : 'rejected');

            card.innerHTML = `
                <div style="flex: 1; min-width: 250px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <span class="status-badge ${statusClass}">${res.status}</span>
                        <span style="font-size:12px; color: var(--text-muted);"><i class="fa-solid fa-store"></i> ${res.restaurant_name}</span>
                    </div>
                    <h3 style="margin-bottom:6px;">${res.user_name}</h3>
                    <p style="color: var(--text-muted); font-size:13px;"><i class="fa-solid fa-phone"></i> ${res.user_phone}</p>
                </div>
                <div style="flex: 1; min-width: 200px; display:flex; flex-direction:column; gap:6px;">
                    <div><i class="fa-solid fa-calendar"></i> <strong>Date:</strong> ${res.date}</div>
                    <div><i class="fa-solid fa-clock"></i> <strong>Time:</strong> ${res.time}</div>
                </div>
                <div style="flex: 1; min-width: 150px; display:flex; flex-direction:column; gap:6px;">
                    <div><i class="fa-solid fa-users"></i> <strong>Guests:</strong> ${res.guests}</div>
                    <div><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${res.table_number}</div>
                </div>
                <div style="display:flex; gap:10px; min-width: 200px;">
                    ${res.status === 'pending' ? `
                        <button class="btn btn-primary" style="background:#2ecc71; border-color:#2ecc71;" onclick="updateReservation(${res.id}, 'confirmed')"><i class="fa-solid fa-check"></i> Accept</button>
                    ` : ''}
                    ${res.status !== 'cancelled' ? `
                        <button class="btn btn-primary" style="background:transparent; border: 1px solid #ff4757; color:#ff4757;" onclick="updateReservation(${res.id}, 'cancelled')"><i class="fa-solid fa-times"></i> Cancel</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.updateReservation = (reservationId, newStatus) => {
        fetch('../api/vendor_api.php?endpoint=update_reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                reservation_id: reservationId,
                status: newStatus
            })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showToast(`Reservation successfully ${newStatus === 'confirmed' ? 'accepted' : 'cancelled'}.`);
                loadReservations();
            } else {
                showToast(res.message, "error");
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Failed to update reservation status.", "error");
        });
    };

    // 5. Restaurant Add/Edit Modal Controllers
    window.openRestaurantModal = () => {
        document.getElementById('restForm').reset();
        document.getElementById('restId').value = '';
        document.getElementById('restModalTitle').innerText = 'Add New Restaurant';
        
        // Reset preview
        document.querySelector('#imagePreview img').style.display = 'none';
        document.querySelector('#imagePreview .preview-placeholder').style.display = 'flex';
        document.getElementById('fileLabelText').innerText = 'Choose Restaurant Image';
        
        document.getElementById('restModal').style.display = 'flex';
    };

    window.closeModal = (id) => {
        document.getElementById(id).style.display = 'none';
    };

    window.previewImage = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.querySelector('#imagePreview img');
                const placeholder = document.querySelector('#imagePreview .preview-placeholder');
                img.src = e.target.result;
                img.style.display = 'block';
                placeholder.style.display = 'none';
                document.getElementById('fileLabelText').innerText = input.files[0].name;
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.editRestaurant = (id) => {
        const rest = vendorRestaurants.find(r => r.id === id);
        if (!rest) return;

        document.getElementById('restId').value = rest.id;
        document.getElementById('restName').value = rest.name;
        document.getElementById('restDesc').value = rest.description || '';
        document.getElementById('restCuisine').value = rest.cuisine;
        document.getElementById('restLocation').value = rest.location;
        document.getElementById('restPrice').value = rest.price_range || '$$';

        // Extract hour & minute for inputs
        if (rest.opening_time) {
            document.getElementById('restOpen').value = rest.opening_time.substring(0, 5);
        }
        if (rest.closing_time) {
            document.getElementById('restClose').value = rest.closing_time.substring(0, 5);
        }

        const img = document.querySelector('#imagePreview img');
        const placeholder = document.querySelector('#imagePreview .preview-placeholder');
        if (rest.image_url) {
            img.src = rest.image_url;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('fileLabelText').innerText = 'Change Image';
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
            document.getElementById('fileLabelText').innerText = 'Choose Restaurant Image';
        }

        document.getElementById('restModalTitle').innerText = 'Edit Restaurant Details';
        document.getElementById('restModal').style.display = 'flex';
    };

    window.deleteRestaurant = (id) => {
        if (confirm("Are you sure you want to delete this restaurant listing? This will also remove any associated table configurations.")) {
            fetch(`../api/vendor_api.php?endpoint=restaurants&id=${id}&user_id=${userId}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    showToast("Restaurant deleted successfully.");
                    loadRestaurants();
                } else {
                    showToast(res.message, "error");
                }
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to delete restaurant.", "error");
            });
        }
    };

    // Form Submit (Multipart for file uploads)
    document.getElementById('restForm').addEventListener('submit', function (e) {
        e.preventDefault();
        
        const id = document.getElementById('restId').value;
        const formData = new FormData(this);
        formData.append('user_id', userId);

        // Fetch inputs manually to build and append
        formData.append('name', document.getElementById('restName').value);
        formData.append('description', document.getElementById('restDesc').value);
        formData.append('cuisine', document.getElementById('restCuisine').value);
        formData.append('location', document.getElementById('restLocation').value);
        formData.append('price_range', document.getElementById('restPrice').value);
        
        const openTime = document.getElementById('restOpen').value + ":00";
        const closeTime = document.getElementById('restClose').value + ":00";
        formData.append('opening_time', openTime);
        formData.append('closing_time', closeTime);
        formData.append('opening_hours', `${document.getElementById('restOpen').value} - ${document.getElementById('restClose').value}`);

        const fileInput = document.getElementById('restImage');
        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }

        const url = id ? `../api/vendor_api.php?endpoint=restaurants&id=${id}` : `../api/vendor_api.php?endpoint=restaurants`;

        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showToast(res.message);
                closeModal('restModal');
                loadRestaurants();
            } else {
                showToast(res.message, "error");
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Failed to save restaurant details.", "error");
        });
    });

    // 6. Initial Dashboard Load
    loadStats();
});
