document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.getElementById('auth-buttons');
    if (!authButtonsContainer) return;

    // Check if user is logged in
    let userStr = localStorage.getItem('reservehub_user') || sessionStorage.getItem('reservehub_user');
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            
            // If logged in, update the navbar buttons
            authButtonsContainer.innerHTML = `
                <a href="profile.html" class="top-btn" style="color:var(--orange); border: 1px solid var(--orange);">
                    <i class="fa-solid fa-user"></i> Profile
                </a>
                <button onclick="logoutUser()" class="top-btn" style="background:transparent; color:#ff4757;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </button>
            `;
            
            // Update mobile nav if it exists
            const mobileNav = document.getElementById('mobileNav');
            if (mobileNav) {
                const mobCta = mobileNav.querySelector('.mob-cta');
                if (mobCta) {
                    mobCta.outerHTML = `
                        <a href="profile.html" class="mob-link" style="color:var(--orange);"><i class="fa-solid fa-user"></i> Profile</a>
                        <a href="#" onclick="logoutUser(); return false;" class="mob-link" style="color:#ff4757;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
                    `;
                }
            }
        } catch(e) {
            console.error("Session parse error", e);
            logoutUser();
        }
    }
});

function logoutUser() {
    localStorage.removeItem('reservehub_user');
    sessionStorage.removeItem('reservehub_user');
    window.location.href = 'index.html';
}
