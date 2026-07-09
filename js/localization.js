(function () {
  const STORAGE_KEY = 'reservehub-language';
  const SUPPORTED_LANGUAGES = ['en', 'fr'];

  function normalizeLanguage(lang) {
    if (!lang) return 'en';
    const normalized = String(lang).trim().toLowerCase();
    if (normalized.startsWith('fr')) return 'fr';
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'en';
  }

  function getStoredLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeLanguage(saved);
    } catch (error) {
      return 'en';
    }
  }

  function getPreferredLanguage() {
    const saved = getStoredLanguage();
    if (saved !== 'en' || localStorage.getItem(STORAGE_KEY)) {
      return saved;
    }

    const browserLang = navigator.languages?.[0] || navigator.language || navigator.userLanguage || '';
    return normalizeLanguage(browserLang);
  }

  function getTranslationPath(lang) {
    if (document.querySelector('.index-language-localization')) {
      return `../json/index-${lang}.json`;
    }
    if (document.querySelector('.about-language-localization')) {
      return `../json/about-${lang}.json`;
    }
    if (document.querySelector('.terms-language-localization')) {
      return `../json/terms-${lang}.json`;
    }
    if (document.querySelector('.policy-language-localization')) {
      return `../json/policy-${lang}.json`;
    }
    if (document.querySelector('.contact-language-localization')) {
      return `../json/contact-${lang}.json`;
    }
    if (document.querySelector('.help-language-localization')) {
      return `../json/help-center-${lang}.json`;
    }
    if (document.querySelector('.auth-language-localization')) {
      return `../json/login-signup-${lang}.json`;
    }
    if (document.querySelector('.search-language-localization')) {
      return `../json/search-${lang}.json`;
    }
    if (document.querySelector('.vendor-language-localization')) {
      return `../json/vendor-${lang}.json`;
    }
    if (document.querySelector('.profile-language-localization')) {
      return `../json/profile-${lang}.json`;
    }
    if (document.querySelector('.reset-language-localization')) {
      return `../json/reset-password-${lang}.json`;
    }
    if (document.querySelector('.restaurant-language-localization')) {
      return `../json/restaurant-${lang}.json`;
    }
    return null;
  }

  async function loadLanguage(lang, { persist = true } = {}) {
    const normalized = normalizeLanguage(lang);
    const filePath = getTranslationPath(normalized);

    if (!filePath) {
      return normalized;
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (error) {
        console.warn('Unable to save language preference:', error);
      }
    }

    document.documentElement.lang = normalized;
    document.querySelectorAll('.index-language-localization, .about-language-localization, .terms-language-localization, .policy-language-localization, .contact-language-localization, .help-language-localization, .auth-language-localization, .search-language-localization, .vendor-language-localization, .profile-language-localization, .reset-language-localization, .restaurant-language-localization').forEach(select => {
      select.value = normalized;
    });

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }

      const translations = await response.json();
      console.log(translations)
      document.querySelectorAll('[localization-key]').forEach(element => {
        const key = element.getAttribute('localization-key');
        const value = translations[key];
        if (!value) return;

        const target = element.getAttribute('localization-target') || 'text';

        if (target === 'placeholder') {
          element.setAttribute('placeholder', value);
          return;
        }
        if (target === 'content') {
          element.setAttribute('content', value);
          return;
        }
        if (target === 'html') {
          element.innerHTML = value;
          return;
        }

        element.textContent = value;
      });

      window.dispatchEvent(new CustomEvent('reservehub:languageChanged', {
        detail: {
          language: normalized,
          translations
        }
      }));
    } catch (error) {
      console.error('Failed to load translations! ', error);
    }

    if (typeof window.updateSupportStatus === 'function') {
      window.updateSupportStatus(normalized);
    }

    return normalized;
  }

  function initializeLanguageSelectors() {
    document.querySelectorAll('.index-language-localization, .about-language-localization, .terms-language-localization, .policy-language-localization, .contact-language-localization, .help-language-localization, .auth-language-localization, .search-language-localization, .vendor-language-localization, .profile-language-localization, .reset-language-localization, .restaurant-language-localization').forEach(select => {
      select.addEventListener('change', () => {
        loadLanguage(select.value, { persist: true });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeLanguageSelectors();
    loadLanguage(getPreferredLanguage(), { persist: false });
  });

  window.setLanguage = loadLanguage;
  window.getCurrentLanguage = () => getStoredLanguage();
})();