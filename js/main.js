// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

hamburger?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.toggle('open');
    hamburger?.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile nav when a link is clicked
mobileNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger?.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.step-card, .restaurant-card, .testimonial-card, .section-header');
reveals.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== FILTER TABS =====
const tabs = document.querySelectorAll('.filter-tab');
const cards = document.querySelectorAll('.restaurant-card');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('hidden', !match);
        });
    });
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
        body: JSON.stringify({ user_id: user.id, restaurant_id: restId })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            // Revert if failed
            btn.classList.toggle('liked');
            icon.className = !currentlyLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            icon.style.color = !currentlyLiked ? '#ff4757' : '';
            alert(data.message);
        }
    })
    .catch(err => {
        console.error(err);
    });
});

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
