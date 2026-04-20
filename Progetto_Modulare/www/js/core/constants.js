// js/constants.js
// Punto unico di verità per il breakpoint mobile.
// Usare come funzione (non costante) perché window.innerWidth
// va letto ad ogni chiamata, non al momento del caricamento.

export const ALGEBRAS = { QUATERNIONS: 3, OCTONIONS: 7, SEDENIONS: 15, IONS32: 31 };
export const THRESHOLDS = { DRAG_MIN_DIST: 10, HOLD_INSPECTION_DELAY: 450 };
export const TIMINGS = { CLOSURE_FLASH: 300, CLOSURE_PLAY: 800 };

export const MOBILE_BP = 768;
export const isMobile = () => window.innerWidth <= MOBILE_BP;

// Gestore globale dello z-index delle finestre
export const zManager = {
    _z: 2000,
    next() { return ++this._z; },
    get current() { return this._z; }
};
