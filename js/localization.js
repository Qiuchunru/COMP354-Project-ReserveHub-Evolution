async function languageChanged(select, page) {
  try {
    const language = select.value;
    const response = await fetch(`../json/${page}-${language}.json`);

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