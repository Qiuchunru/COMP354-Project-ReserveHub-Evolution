/**
 * ReserveHub Help Center Logic
 * Handles interactive FAQ search, highlighting, and auto-expansion.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('helpSearch');
    const faqItems = document.querySelectorAll('.faq-item');
    const categories = document.querySelectorAll('.faq-category');
    const faqGrid = document.getElementById('faqGrid');
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    const uiText = {
        noResultsTitle: 'No results found',
        noResultsBody: `We couldn't find any matches for "{term}". Please try a different search term or contact us below.`
    };

    const cacheOriginalContent = () => {
        faqItems.forEach(item => {
            const questionSpan = item.querySelector('.faq-question span');
            const answerDiv = item.querySelector('.faq-answer');
            item.dataset.originalQuestion = questionSpan.innerHTML;
            item.dataset.originalAnswer = answerDiv.innerHTML;
        });
    };

    const updateUiText = (translations = {}) => {
        uiText.noResultsTitle = translations['help.search.noResults.title'] || 'No results found';
        uiText.noResultsBody = translations['help.search.noResults.body'] || `We couldn't find any matches for "{term}". Please try a different search term or contact us below.`;
    };

    // Store original content for highlighting restoration
    cacheOriginalContent();

    // FAQ Toggle Logic
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all other items in this category
            item.parentElement.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) otherItem.classList.remove('active');
            });
            
            item.classList.toggle('active');
        });
    });

    // Search Logic
    const performSearch = (term) => {
        term = term.toLowerCase().trim();
        let hasResults = false;

        categories.forEach(category => {
            let categoryHasMatch = false;
            const itemsInCat = category.querySelectorAll('.faq-item');
            
            itemsInCat.forEach(item => {
                const questionSpan = item.querySelector('.faq-question span');
                const answerDiv = item.querySelector('.faq-answer');
                
                const questionText = item.dataset.originalQuestion;
                const answerText = item.dataset.originalAnswer;
                
                const questionMatch = questionText.toLowerCase().includes(term);
                const answerMatch = answerText.toLowerCase().includes(term);

                if (term === '') {
                    // Restore original
                    questionSpan.innerHTML = questionText;
                    answerDiv.innerHTML = answerText;
                    item.style.display = 'block';
                    item.classList.remove('active');
                    categoryHasMatch = true;
                } else if (questionMatch || answerMatch) {
                    // Highlight matches
                    questionSpan.innerHTML = highlightText(questionText, term);
                    answerDiv.innerHTML = highlightText(answerText, term);
                    
                    item.style.display = 'block';
                    categoryHasMatch = true;
                    hasResults = true;

                    // Auto-expand if term is meaningful
                    if (term.length >= 3) {
                        item.classList.add('active');
                    }
                } else {
                    item.style.display = 'none';
                    item.classList.remove('active');
                }
            });

            category.style.display = categoryHasMatch ? 'block' : 'none';
        });

        // Handle no results
        updateNoResults(hasResults, term);
    };

    const highlightText = (text, term) => {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    };

    const updateNoResults = (hasResults, term) => {
        let noResultsMsg = document.getElementById('no-results-msg');
        if (!hasResults && term !== '') {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-results-msg';
                noResultsMsg.className = 'no-results-card';
                noResultsMsg.style.textAlign = 'center';
                noResultsMsg.style.padding = '60px 20px';
                noResultsMsg.style.gridColumn = '1 / -1';
                noResultsMsg.innerHTML = `
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 20px; display: block; color: var(--orange); opacity: 0.5;"></i>
                    <h3>${uiText.noResultsTitle}</h3>
                    <p style="color: var(--text-muted);"></p>
                `;
                faqGrid.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
            noResultsMsg.querySelector('p').textContent = uiText.noResultsBody.replace('{term}', term);
        } else {
            if (noResultsMsg) noResultsMsg.style.display = 'none';
        }
    };

    // Event Listeners
    searchInput.addEventListener('input', (e) => performSearch(e.target.value));

    suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.textContent;
            performSearch(tag.textContent);
            searchInput.focus();
        });
    });

    window.addEventListener('reservehub:languageChanged', event => {
        const translations = event?.detail?.translations || {};
        updateUiText(translations);
        cacheOriginalContent();

        if (searchInput.value.trim() !== '') {
            performSearch(searchInput.value);
        }
    });
});
