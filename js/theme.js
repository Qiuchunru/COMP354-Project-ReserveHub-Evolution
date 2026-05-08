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

        const toggleTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('reservehub-theme', newTheme);
            
            // Smooth transition effect
            document.documentElement.classList.add('theme-transition');
            setTimeout(() => document.documentElement.classList.remove('theme-transition'), 1000);
        };

        themeBtn?.addEventListener('click', toggleTheme);
        mobThemeBtn?.addEventListener('click', toggleTheme);
    });
})();
