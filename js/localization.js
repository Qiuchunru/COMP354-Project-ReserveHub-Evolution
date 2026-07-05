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

const indexElements = document.querySelectorAll(".index-language-localization");
indexElements.forEach(element => {
    element.addEventListener("change", () => {
        loadLanguage(`../json/index-${element.value}.json`);
    })
});

const contactElements = document.querySelectorAll(".contact-language-localization");
contactElements.forEach(element => {
    element.addEventListener("change", () => {
        loadLanguage(`../json/contact-${element.value}.json`);
    })
});