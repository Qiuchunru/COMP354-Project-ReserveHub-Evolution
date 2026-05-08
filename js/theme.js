// theme.js - Global Theme Management
(function() {
    const initTheme = () => {
        const savedTheme = localStorage.getItem('reservehub-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    };
    initTheme();

    document.addEventListener('DOMContentLoaded', () => {
        const themeBtn = document.getElementById('theme-toggle');
        const mobThemeBtn = document.getElementById('mobile-theme-toggle');

        const updateLogos = (theme) => {
            const logos = document.querySelectorAll('.top-logo, .brand-logo, .admin-logo img');
            logos.forEach(logo => {
                const isDark = theme === 'dark';
                logo.src = isDark ? '../pictures/reservehub-full-logo-dark-mode.png' : '../pictures/reservehub-full-logo-light-mode.png';
            });
        };

        const toggleTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('reservehub-theme', newTheme);
            updateLogos(newTheme);
            
            // Smooth transition effect
            document.documentElement.classList.add('theme-transition');
            setTimeout(() => document.documentElement.classList.remove('theme-transition'), 1200);
        };

        // Initialize logos
        updateLogos(document.documentElement.getAttribute('data-theme') || 'light');

        themeBtn?.addEventListener('click', toggleTheme);
        mobThemeBtn?.addEventListener('click', toggleTheme);
    });
})();
