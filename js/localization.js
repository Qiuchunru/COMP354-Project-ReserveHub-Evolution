async function loadLanguage(json) {
  try {
    const response = await fetch(json);
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
}

const elements = document.querySelectorAll(".language-localization");
elements.forEach(element => {
    element.addEventListener("change", () => {
      let language = element.value;
      loadLanguage(`../json/${language}.json`);
    })
});