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
            const logos = document.querySelectorAll('.top-logo, .brand-logo, .footer-logo, .admin-logo img');
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

// ===== GLOBAL TOAST NOTIFICATION =====
window.showToast = function(message, type = 'error') {
    let toastContainer = document.getElementById('global-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'global-toast-container';
        Object.assign(toastContainer.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(toastContainer);

        // Add styles if not present
        if (!document.getElementById('global-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'global-toast-styles';
            style.textContent = `
                .global-toast {
                    background: var(--surface, #fff);
                    color: var(--text, #333);
                    border: 1px solid var(--border, #eee);
                    border-radius: 12px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                    transform: translateX(120%);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    min-width: 250px;
                    max-width: 400px;
                }
                [data-theme='dark'] .global-toast {
                    background: #2a2a2a;
                    color: #f1f1f1;
                    border-color: #444;
                }
                .global-toast.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                .global-toast.success { border-left: 5px solid #27ae60; }
                .global-toast.error { border-left: 5px solid #e74c3c; }
                .global-toast.info { border-left: 5px solid #3498db; }
                
                .global-toast-icon {
                    font-size: 1.2rem;
                }
                .global-toast.success .global-toast-icon { color: #27ae60; }
                .global-toast.error .global-toast-icon { color: #e74c3c; }
                .global-toast.info .global-toast-icon { color: #3498db; }
                
                .global-toast-content {
                    flex: 1;
                    font-size: 0.9rem;
                    font-weight: 500;
                    line-height: 1.4;
                }
            `;
            document.head.appendChild(style);
        }
    }

    const toast = document.createElement('div');
    toast.className = `global-toast ${type}`;
    
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `
        <div class="global-toast-icon"><i class="${iconClass}"></i></div>
        <div class="global-toast-content">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};
