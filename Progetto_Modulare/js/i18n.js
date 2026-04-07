import it from './lang/it.js';
import en from './lang/en.js';

const dictionaries = { it, en };

// Recupera la lingua salvata, altrimenti usa l'italiano di default
let currentLang = localStorage.getItem('app_lang') || 'it';

// Funzione per tradurre usna chiave specifica (la useremo poi nei file JS)
export function t(key) {
    return dictionaries[currentLang][key] || key;
}

// Funzione che scansiona l'HTML e traduce tutti gli attributi registrati
export function translateDOM() {
    // 1. Traduce il testo interno (innerHTML)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionaries[currentLang][key]) {
            el.innerHTML = dictionaries[currentLang][key];
        }
    });

    // 2. Traduce i title (tooltip nativi del mouse)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dictionaries[currentLang][key]) {
            el.title = dictionaries[currentLang][key];
        }
    });

    // 3. Traduce i placeholder (testi di suggerimento negli input)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dictionaries[currentLang][key]) {
            el.placeholder = dictionaries[currentLang][key];
        }
    });

    // 4. Traduce i tooltip personalizzati della Dock
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        if (dictionaries[currentLang][key]) {
            el.setAttribute('data-tooltip', dictionaries[currentLang][key]);
        }
    });
}

// Funzione per cambiare la lingua e aggiornare tutto
export function setLanguage(lang) {
    if (dictionaries[lang]) {
        currentLang = lang;
        localStorage.setItem('app_lang', lang);
        translateDOM();
        
        // Emette un evento globale per avvisare gli altri script (es. ui.js) che la lingua è cambiata
        window.dispatchEvent(new Event('languageChanged'));
    }
}

export function getLanguage() {
    return currentLang;
}

// Traduzione automatica al primo caricamento della pagina
window.addEventListener('DOMContentLoaded', () => {
    translateDOM();
    
    // Imposta il menu a tendina dell'HTML (che creeremo tra poco) sulla lingua corretta
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = currentLang;
        langSelector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});