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
    if (document.querySelector('.contact-language-localization')) {
      return `../json/contact-${lang}.json`;
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
    document.querySelectorAll('.index-language-localization, .contact-language-localization').forEach(select => {
      select.value = normalized;
    });

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }

      const translations = await response.json();
      document.querySelectorAll('[localization-key]').forEach(element => {
        const key = element.getAttribute('localization-key');
        if (translations[key]) {
          element.textContent = translations[key];
        }
      });
    } catch (error) {
      console.error('Failed to load translations! ', error);
    }

    if (typeof window.updateSupportStatus === 'function') {
      window.updateSupportStatus(normalized);
    }

    return normalized;
  }

  function initializeLanguageSelectors() {
    document.querySelectorAll('.index-language-localization, .contact-language-localization').forEach(select => {
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