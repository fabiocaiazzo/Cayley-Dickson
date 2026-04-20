// js/constants.js
// Punto unico di verità per il breakpoint mobile.
// Usare come funzione (non costante) perché window.innerWidth
// va letto ad ogni chiamata, non al momento del caricamento.

export const ALGEBRAS = { QUATERNIONS: 3, OCTONIONS: 7, SEDENIONS: 15, IONS32: 31 };
export const THRESHOLDS = { DRAG_MIN_DIST: 10, HOLD_INSPECTION_DELAY: 450 };
export const TIMINGS = { CLOSURE_FLASH: 300, CLOSURE_PLAY: 800 };

export const MOBILE_BP = 768;
export const isMobile = () => window.innerWidth <= MOBILE_BP;

// Soglie interazione numeriche nominate per evitare magic numbers
export const LONG_PRESS_DELAY_MS = 400;
export const INPUT_LISTENER_DELAY_MS = 500;
export const SWIPE_THRESHOLD_RATIO = 0.15;
export const SWIPE_DIRECTION_MIN_PX = 8;
export const SWIPE_DIRECTION_LOCK_PX = 40;

// Gestore globale dello z-index delle finestre
export const zManager = {
    _z: 2000,
    next() { return ++this._z; },
    get current() { return this._z; }
};
