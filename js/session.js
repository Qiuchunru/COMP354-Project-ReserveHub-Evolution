const sessionTranslations = {
    en: {
        admin: "Admin",
        vendor: "Vendor",
        adminPanel: "Admin Panel",
        vendorPanel: "Vendor Panel",
        profile: "Profile",
        logout: "Logout"
    },

    fr: {
        admin: "Administrateur",
        vendor: "Fournisseur",
        adminPanel: "Panneau administrateur",
        vendorPanel: "Panneau fournisseur",
        profile: "Profil",
        logout: "Déconnexion"
    }
};

function authT(key) {
    const lang = window.getCurrentLanguage 
        ? window.getCurrentLanguage() 
        : 'en';

    return sessionTranslations[lang]?.[key] || sessionTranslations.en[key]  || key;
}

function getCurrentUser() {
    let userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch(e) {
        console.error("Session parse error", e);
        logoutUser();
    }
}

function renderAuthButtons(user) {
    const authButtonsContainer = document.getElementById('auth-buttons');
    authButtonsContainer.innerHTML = `
        ${user.role === 'admin' ? `<a href="admin.html" class="top-btn" style="border: 1px solid #f1c40f; color:#f1c40f;"><i class="fa-solid fa-gauge"></i> ${authT('admin')}</a>` : ''}
        ${user.role === 'vendor' ? `<a href="vendor-dashboard.html" class="top-btn" style="border: 1px solid #3498db; color:#3498db;"><i class="fa-solid fa-gauge"></i> ${authT('vendor')}</a>` : ''}
        <a href="profile.html" class="top-btn" style="color:var(--orange); border: 1px solid var(--orange);">
            <i class="fa-solid fa-user"></i> ${authT('profile')}
        </a>
        <button onclick="logoutUser()" class="top-btn" style="background:transparent; color:#ff4757;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> ${authT('logout')}
        </button>
    `;
            
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        const mobCta = mobileNav.querySelector('.mob-cta');
        if (mobCta) {
            mobCta.outerHTML = `
                ${user.role === 'admin' ? `<a href="admin.html" class="mob-link" style="color:#f1c40f;"><i class="fa-solid fa-gauge"></i> ${authT('adminPanel')}</a>` : ''}
                ${user.role === 'vendor' ? `<a href="vendor-dashboard.html" class="mob-link" style="color:var(--orange);"><i class="fa-solid fa-gauge"></i> ${authT('vendorPanel')}</a>` : ''}
                <a href="profile.html" class="mob-link" style="color:var(--orange);"><i class="fa-solid fa-user"></i> ${authT('profile')}</a>
                <a href="#" onclick="logoutUser(); return false;" class="mob-link" style="color:#ff4757;"><i class="fa-solid fa-arrow-right-from-bracket"></i> ${authT('logout')}</a>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.getElementById('auth-buttons');
    const footerAdminLink = document.getElementById('footerAdminLink');

    // Hide footer admin link by default
    if (footerAdminLink) footerAdminLink.style.display = 'none';

    if (!authButtonsContainer) return;

    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) return;
            
    // Show footer admin link if admin
    if (footerAdminLink && user.role === 'admin') {
        footerAdminLink.style.display = 'inline-block';
    }
            
    // SECURITY CHECK: If on admin.html but not an admin, redirect
    if (window.location.pathname.includes('admin.html')) {
        if (user.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
    }

    // SECURITY CHECK: If on vendor-dashboard.html but not a vendor, redirect
    if (window.location.pathname.includes('vendor-dashboard.html')) {
        if (user.role !== 'vendor') {
            window.location.href = 'index.html';
            return;
        }
    }

    // HIDE SECTIONS FOR LOGGED IN USERS (HOMEPAGE)
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        const howSection = document.getElementById('how-it-works');
        const ctaSection = document.getElementById('cta-section');
        const testimonialSection = document.getElementById('testimonials-section');
        if (howSection) howSection.style.display = 'none';
        if (ctaSection) ctaSection.style.display = 'none';
        if (testimonialSection) testimonialSection.style.display = 'none';

        // Hide nav links to these sections
        document.querySelectorAll('a[href="#how-it-works"]').forEach(el => el.style.display = 'none');
    }
    
    renderAuthButtons(user);
});

window.addEventListener('reservehub:languageChanged', () => {
    const user = getCurrentUser();
    if (user) {
        renderAuthButtons(user);
    }
});

function logoutUser() {
    fetch('../api/logout.php', { method: 'POST' })
        .finally(() => {
            localStorage.removeItem('reservehub_user');
            sessionStorage.removeItem('reservehub_user');
            window.location.href = 'index.html';
        });
}
