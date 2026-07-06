async function loadLanguage(language) {
  try {
    
    document.documentElement.lang = language;
    const response = await fetch(`../json/${language}.json`);

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const translations = await response.json();
    document.querySelectorAll("[localization-key]").forEach(element => {
      const key = element.getAttribute("localization-key");
      if (translations[key]) {
        element.textContent = translations[key];
      }
    });

  } catch (error) {
    console.error("Failed to load translations!", error);
  }
}

const elements = document.querySelectorAll(".language-localization");
elements.forEach(element => {
  element.addEventListener("change", () => {
    const language = element.value;
    loadLanguage(language);
  });
});