async function loadLanguage(locale) {
  try {
    const response = await fetch(`../json/${locale}.json`);
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
    const translations = await response.json();

    document.querySelectorAll('[localization-key]').forEach(element => {
      const key = element.getAttribute('localization-key');
      if (translations[key]) {
        element.innerText = translations[key];
      }
    });
  } catch (error) {
    console.error('Failed to load translations! ', error);
  }
}

const languageSelect = document.getElementById("language-localization");

languageSelect.addEventListener("change", () => {
    loadLanguage(languageSelect.value);
});