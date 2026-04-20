import { t } from '../core/i18n.js';
import { isMobile, SWIPE_THRESHOLD_RATIO, SWIPE_DIRECTION_MIN_PX, SWIPE_DIRECTION_LOCK_PX } from '../core/constants.js';
import { updateZeroDivisorUI } from '../calculator/calculator_zerodiv.js';
import { updateCalcUI } from '../calculator/calculator_formulas.js';
import { CalcBridge } from '../calculator/calculator_popout.js';

// --- SWIPE GESTURES E STATI ---
let swipeStartX = 0;
let swipeCurrentX = 0;
let isSwipingCarousel = false;
export let currentSwipeState = 1; // 0: Formule, 1: Calc, 2: Divisori

export function setupCarouselDOM() {
    const calcBody = CalcBridge.querySelector('.calc-body');
    if (!calcBody || CalcBridge.getElementById('carousel-track')) return;
    const track = document.createElement('div');
    track.id = 'carousel-track';

    const p0 = document.createElement('div'); p0.className = 'carousel-panel'; p0.id = 'carousel-p0';
    const p1 = document.createElement('div'); p1.className = 'carousel-panel'; p1.id = 'carousel-p1';
    const p2 = document.createElement('div'); p2.className = 'carousel-panel'; p2.id = 'carousel-p2';

    const formMenu = CalcBridge.getElementById('calc-formula-menu');
    if (formMenu) p0.appendChild(formMenu);

    const keypad = CalcBridge.getElementById('view-keypad');
    const vars = CalcBridge.getElementById('view-vars');
    if (keypad) p1.appendChild(keypad);
    if (vars) p1.appendChild(vars);

    const zdOverlay = CalcBridge.getElementById('zerodiv-overlay');
    if (zdOverlay) p2.appendChild(zdOverlay);

    track.appendChild(p0);
    track.appendChild(p1);
    track.appendChild(p2);
    calcBody.appendChild(track);
}

export function updateCarouselPositions(dragDelta = 0, animate = false) {
    const panels = [CalcBridge.getElementById('carousel-p0'), CalcBridge.getElementById('carousel-p1'), CalcBridge.getElementById('carousel-p2')];
    if (!panels[0]) return;

    panels.forEach((panel, i) => {
        let offset = i - currentSwipeState;
        if (offset > 1) offset -= 3;
        if (offset < -1) offset += 3;

        let prevOffset = panel.dataset.lastOffset !== undefined ? parseFloat(panel.dataset.lastOffset) : offset;
        let isJumping = Math.abs(prevOffset - offset) > 1.5;

        if (isJumping) {
            panel.style.setProperty('transition', 'none', 'important');
            void panel.offsetWidth;
        } else {
            panel.style.setProperty('transition', animate ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none', 'important');
        }

        panel.style.setProperty('transform', `translate3d(calc(${offset * 100}% + ${dragDelta}px), 0, 0)`);
        panel.dataset.lastOffset = offset;
    });
}

export function applySwipeState(state) {
    setupCarouselDOM();

    const formulasMenu = CalcBridge.getElementById('calc-formula-menu');
    const zdContentGrid = CalcBridge.getElementById('zerodiv-content-grid');

    if (formulasMenu && formulasMenu.innerHTML.trim() === '') updateCalcUI(15);
    if (zdContentGrid && zdContentGrid.innerHTML.trim() === '') updateZeroDivisorUI(15);

    currentSwipeState = state;
    updateCarouselPositions(0, true);

    const navL = CalcBridge.getElementById('swipe-nav-left');
    const navR = CalcBridge.getElementById('swipe-nav-right');
    const mobileHelpBtn = CalcBridge.getElementById('zerodiv-explain-label-mobile');
    const formHelpBtn = CalcBridge.getElementById('formula-explain-label-mobile');

    const fcb = CalcBridge.getElementById('formula-explain-check-mobile');
    if (fcb && fcb.checked) {
        fcb.checked = false;
        toggleFormulaExplain(false);
    }

    const calcHelperBtn = CalcBridge.getElementById('calc-helper-label-mobile');
    const searchMobileBtn = CalcBridge.getElementById('zerodiv-search-label-mobile');

    if (state === 0) {
        if (navL) navL.innerHTML = `&laquo; ${t('sw_zerodiv')}`;
        if (navR) navR.innerHTML = `${t('sw_calc')} &raquo;`;
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'none';
        if (searchMobileBtn) searchMobileBtn.style.display = 'none';
        if (formHelpBtn) formHelpBtn.style.display = 'flex';
        if (calcHelperBtn) calcHelperBtn.style.display = 'none';
    } else if (state === 2) {
        if (navL) navL.innerHTML = `&laquo; ${t('sw_calc')}`;
        if (navR) navR.innerHTML = `${t('sw_formulas')} &raquo;`;
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'flex';
        if (searchMobileBtn) searchMobileBtn.style.display = 'flex';
        if (formHelpBtn) formHelpBtn.style.display = 'none';
        if (calcHelperBtn) calcHelperBtn.style.display = 'none';
    } else {
        if (navL) navL.innerHTML = `&laquo; ${t('sw_formulas')}`;
        if (navR) navR.innerHTML = `${t('sw_zerodiv')} &raquo;`;
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'none';
        if (formHelpBtn) formHelpBtn.style.display = 'none';
        if (calcHelperBtn) calcHelperBtn.style.display = 'flex';
        if (searchMobileBtn) searchMobileBtn.style.display = 'none';
    }
}

export function toggleFormulaExplain(isActive) {
    const panel = CalcBridge.getElementById('formula-explanation-panel');
    const label = CalcBridge.getElementById('formula-explain-label-mobile');
    if (panel) panel.style.display = isActive ? 'flex' : 'none';
    if (label) {
        if (isActive) {
            label.style.borderColor = '#00aaff';
            label.style.backgroundColor = '#00aaff';
            label.style.color = '#ffffff';
        } else {
            label.style.borderColor = '#667788';
            label.style.backgroundColor = 'transparent';
            label.style.color = '#667788';
        }
    }
}

export let currentZdPage = 1;
export function changeZdPage(dir) {
    currentZdPage += dir;
    if (currentZdPage < 1) currentZdPage = 1;
    if (currentZdPage > 4) currentZdPage = 4;

    for (let i = 1; i <= 4; i++) {
        const page = CalcBridge.getElementById('zd-page-' + i);
        if (page) page.style.display = (i === currentZdPage) ? 'block' : 'none';
    }

    const prevBtn = CalcBridge.getElementById('zd-prev-btn');
    const nextBtn = CalcBridge.getElementById('zd-next-btn');
    const ind = CalcBridge.getElementById('zd-page-indicator');

    if (prevBtn) prevBtn.style.visibility = (currentZdPage === 1) ? 'hidden' : 'visible';
    if (nextBtn) {
        if (currentZdPage === 4) {
            nextBtn.innerText = t('btn_close') || 'Chiudi';
            nextBtn.style.backgroundColor = '#ff4444';
            nextBtn.style.color = 'white';
        } else {
            nextBtn.innerText = (t('btn_next') || 'Avanti') + ' >';
            nextBtn.style.backgroundColor = '';
            nextBtn.style.color = '';
        }
    }
    if (ind) ind.innerText = currentZdPage + ' / 4';

    const panel = CalcBridge.getElementById('zerodiv-explanation-panel');
    if (panel) panel.scrollTop = 0;
}

export let currentCalcHelperPage = 1;
export function resetCalcHelperPage() {
    currentCalcHelperPage = 1;
    changeCalcHelperPage(0);
}
export function changeCalcHelperPage(dir) {
    currentCalcHelperPage += dir;
    if (currentCalcHelperPage < 1) currentCalcHelperPage = 1;
    if (currentCalcHelperPage > 5) currentCalcHelperPage = 5;

    for (let i = 1; i <= 5; i++) {
        const page = CalcBridge.getElementById('ch-page-' + i);
        if (page) page.style.display = (i === currentCalcHelperPage) ? 'block' : 'none';
    }

    const prevBtn = CalcBridge.getElementById('ch-prev-btn');
    const nextBtn = CalcBridge.getElementById('ch-next-btn');
    const ind = CalcBridge.getElementById('ch-page-indicator');

    if (prevBtn) prevBtn.style.visibility = (currentCalcHelperPage === 1) ? 'hidden' : 'visible';
    if (nextBtn) {
        if (currentCalcHelperPage === 5) {
            nextBtn.innerText = t('btn_close') || 'Chiudi';
            nextBtn.style.backgroundColor = '#ff4444';
            nextBtn.style.color = 'white';
        } else {
            nextBtn.innerText = (t('btn_next') || 'Avanti') + ' >';
            nextBtn.style.backgroundColor = '';
            nextBtn.style.color = '';
        }
    }
    if (ind) ind.innerText = currentCalcHelperPage + ' / 5';

    const panel = CalcBridge.getElementById('calc-helper-panel');
    if (panel) panel.scrollTop = 0;
}

// EVENT LISTENERS CHECKBOXES E TASTI
document.addEventListener('DOMContentLoaded', () => {
    const formulaCheck = CalcBridge.getElementById('formula-explain-check-mobile');
    if (formulaCheck) {
        formulaCheck.addEventListener('change', function() { toggleFormulaExplain(this.checked); });
    }

    const calcHelpCheck = CalcBridge.getElementById('calc-helper-check-mobile');
        if (calcHelpCheck) {
            calcHelpCheck.addEventListener('change', function() {
                const el = CalcBridge.getElementById('calc-helper-overlay');
                if (el) {
                    const isChecked = this.checked;
                    el.style.display = isChecked ? 'flex' : 'none';
                    if (isChecked) {
                        currentCalcHelperPage = 1;
                        changeCalcHelperPage(0);
                    }
                }
            });
        }

        // Reset pagina divisori zero
        ['zerodiv-explain-check', 'zerodiv-explain-check-mobile'].forEach(id => {
            const chk = CalcBridge.getElementById(id);
            if (chk) {
                chk.addEventListener('change', function() {
                    if (this.checked) {
                        currentZdPage = 1;
                        changeZdPage(0);
                    }
                });
            }
        });
    });

let swipeStartY = 0;
let swipeDirectionDetermined = false;
let isHorizontalSwipe = false;

const startCarouselDrag = (x, y) => {
    setupCarouselDOM();
    isSwipingCarousel = true;
    swipeDirectionDetermined = false;
    isHorizontalSwipe = false;
    swipeStartX = x;
    swipeStartY = y;
    swipeCurrentX = x;
    // Rende visibili i pannelli adiacenti durante il trascinamento
    const track = CalcBridge.getElementById('carousel-track');
    if (track) track.classList.add('is-dragging');
};

const moveCarouselDrag = (x, y, e) => {
    if (!isSwipingCarousel) return;

    swipeCurrentX = x;
    const deltaX = swipeCurrentX - swipeStartX;
    const deltaY = y - swipeStartY;

    if (!swipeDirectionDetermined) {
        if (Math.abs(deltaX) > SWIPE_DIRECTION_MIN_PX || Math.abs(deltaY) > SWIPE_DIRECTION_MIN_PX) {
            swipeDirectionDetermined = true;
            isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        }
    }

    if (swipeDirectionDetermined) {
        if (isHorizontalSwipe && Math.abs(deltaY) > Math.abs(deltaX) + SWIPE_DIRECTION_LOCK_PX) {
            isHorizontalSwipe = false;
        } else if (!isHorizontalSwipe && Math.abs(deltaX) > Math.abs(deltaY) + SWIPE_DIRECTION_LOCK_PX) {
            isHorizontalSwipe = true;
            swipeStartX = x;
            swipeStartY = y;
        }

        if (isHorizontalSwipe) {
            // Non bloccare il touch se l'utente sta toccando un elemento scrollabile verticalmente
            const touchTarget = (e && e.touches && e.touches[0])
                ? document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
                : null;
            const isOverScrollable = touchTarget && (
                touchTarget.closest('#zerodiv-content-grid') ||
                touchTarget.closest('#zd-search-results') ||
                touchTarget.closest('.zd-panel-overlay-style')
            );
            if (!isOverScrollable && e && e.cancelable) e.preventDefault();
            updateCarouselPositions(swipeCurrentX - swipeStartX, false);
        } else {
            updateCarouselPositions(0, false);
        }
    }
};

const endCarouselDrag = () => {
    if (!isSwipingCarousel) return;
    isSwipingCarousel = false;
    // Ripristina overflow nascosto al termine del trascinamento
    const track = CalcBridge.getElementById('carousel-track');
    if (track) track.classList.remove('is-dragging');

    if (swipeDirectionDetermined && !isHorizontalSwipe) {
        updateCarouselPositions(0, true);
        return;
    }

    const track = CalcBridge.getElementById('carousel-track');
    const trackWidth = track ? (track.offsetWidth || 300) : 300;
    const delta = swipeCurrentX - swipeStartX;

    if (delta > trackWidth * SWIPE_THRESHOLD_RATIO) applySwipeState((currentSwipeState + 2) % 3);
    else if (delta < -trackWidth * SWIPE_THRESHOLD_RATIO) applySwipeState((currentSwipeState + 1) % 3);
    else updateCarouselPositions(0, true);
};

const isValidDragTarget = (target) => {
    const track = CalcBridge.getElementById('carousel-track');
    if (!track || !track.contains(target)) return false;
    if (target.closest('input') || 
        target.closest('.display-area') || 
        target.closest('.zd-panel-overlay-style') || 
        target.closest('#zd-search-results') || 
        target.closest('#zerodiv-content-grid') || 
        target.closest('.calc-helper-body-wrapper') ||
        target.closest('#calc-formula-menu') ||
        target.closest('.zerodiv-grid-btn') ||
        target.closest('.hex-btn')) {
        return false;
    }
    return true;
};


// Event listeners dinamici per la UI che si può spostare
document.addEventListener('touchstart', e => {
    const calcModal = CalcBridge.getElementById('calc-modal');
    if (calcModal && calcModal.contains(e.target)) {
        if (e.touches.length !== 1 || !isValidDragTarget(e.target)) return;
        startCarouselDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

document.addEventListener('mousedown', e => {
    const calcModal = CalcBridge.getElementById('calc-modal');
    if (calcModal && calcModal.contains(e.target)) {
        if (!isMobile() || !isValidDragTarget(e.target)) return;
        startCarouselDrag(e.clientX, e.clientY);
    }
});

document.addEventListener('touchmove', e => {
    if (isSwipingCarousel && e.touches.length === 1) moveCarouselDrag(e.touches[0].clientX, e.touches[0].clientY, e);
}, { passive: false });

document.addEventListener('touchend', () => { if (isSwipingCarousel) endCarouselDrag(); });
document.addEventListener('touchcancel', () => { if (isSwipingCarousel) endCarouselDrag(); });

document.addEventListener('mousemove', e => {
    if (isSwipingCarousel && e.buttons === 1) moveCarouselDrag(e.clientX, e.clientY, e);
});
document.addEventListener('mouseup', () => { if (isSwipingCarousel) endCarouselDrag(); });

const forceCarouselInit = () => {
    const track = CalcBridge.getElementById('carousel-track');
    if (!track) applySwipeState(1);
};

const calcModalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) forceCarouselInit();
    });
});

// Impostiamo un timer per assicurarci che il nodo DOM sia pronto anche dopo un cambio di finestra
setTimeout(() => {
    const target = document.getElementById('calc-modal');
    if (target) calcModalObserver.observe(target, { attributes: true, attributeFilter: ['class'] });
    forceCarouselInit();
}, 300);

// --- CUSTOM NUMERIC KEYPAD PER MOBILE (Rimane nel main document) ---
const customKeypadHTML = `
<div id="custom-mobile-keypad">
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
        <button class="cmk-btn" data-val="1">1</button>
        <button class="cmk-btn" data-val="2">2</button>
        <button class="cmk-btn" data-val="3">3</button>
        <button class="cmk-btn cmk-action" data-val="Cance" data-i18n="mk_del">Canc</button>
        <button class="cmk-btn" data-val="4">4</button>
        <button class="cmk-btn" data-val="5">5</button>
        <button class="cmk-btn" data-val="6">6</button>
        <button class="cmk-btn cmk-action" data-val="-">+/-</button>
        <button class="cmk-btn" data-val="7">7</button>
        <button class="cmk-btn" data-val="8">8</button>
        <button class="cmk-btn" data-val="9">9</button>
        <button class="cmk-btn cmk-action" data-val=".">.</button>
        <button class="cmk-btn cmk-action" data-val="prec" data-i18n="mk_prev">prec</button>
        <button class="cmk-btn" data-val="0">0</button>
        <button class="cmk-btn cmk-action" data-val="succ" data-i18n="mk_next">succ</button>
        <button class="cmk-btn cmk-close" data-val="chiudi" data-i18n="mk_close">chiudi</button>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', customKeypadHTML);

let activeNumInput = null;

function toggleCustomKeypad(show, input = null) {
    const keypad = document.getElementById('custom-mobile-keypad');
    const dock = document.getElementById('app-dock');

    if (show && isMobile()) {
        activeNumInput = input;
        keypad.style.display = 'block';
        if (dock) dock.style.display = 'none';
    } else {
        keypad.style.display = 'none';
        if (dock) dock.style.display = 'flex';
        if (activeNumInput) {
            activeNumInput.blur();
            activeNumInput = null;
        }
    }
}

document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' && (e.target.classList.contains('num-input') || e.target.closest('#rotation-ui') || e.target.closest('#rot-sequence-list'))) {
        if (e.target.id === 'expression-display') return;
        if (isMobile()) {
            e.preventDefault();
            toggleCustomKeypad(true, e.target);
        }
    }
});

document.addEventListener('touchstart', (e) => {
    const keypad = document.getElementById('custom-mobile-keypad');
    if (keypad && keypad.style.display === 'block') {
        if (!e.target.closest('#custom-mobile-keypad') && !e.target.classList.contains('num-input') && !e.target.closest('#rotation-ui input') && !e.target.closest('#rot-sequence-list input')) {
            toggleCustomKeypad(false);
        }
    }
}, { passive: true });

document.getElementById('custom-mobile-keypad').addEventListener('touchstart', (e) => {
    e.preventDefault();
    const btn = e.target.closest('.cmk-btn');
    if (!btn || !activeNumInput) return;

    const val = btn.dataset.val;
    let currentStr = activeNumInput.value;
    let start = activeNumInput.selectionStart || currentStr.length;
    let end = activeNumInput.selectionEnd || currentStr.length;

    if (val === 'chiudi') {
        toggleCustomKeypad(false);
        return;
    } else if (val === 'Cance') {
        if (start === end && start > 0) {
            currentStr = currentStr.substring(0, start - 1) + currentStr.substring(end);
            activeNumInput.value = currentStr;
            activeNumInput.setSelectionRange(start - 1, start - 1);
        } else if (start !== end) {
            currentStr = currentStr.substring(0, start) + currentStr.substring(end);
            activeNumInput.value = currentStr;
            activeNumInput.setSelectionRange(start, start);
        }
    } else if (val === 'prec' || val === 'succ') {
        const allInputs = Array.from(document.querySelectorAll('.num-input, #rot-axis-x, #rot-axis-y, #rot-axis-z, #rot-angle-num, #rot-q-w, #rot-q-x, #rot-q-y, #rot-q-z, #rot-sequence-list input')).filter(el => el.offsetParent !== null);
        let idx = allInputs.indexOf(activeNumInput);
        if (idx !== -1) {
            let nextIdx = val === 'succ' ? idx + 1 : idx - 1;
            if (nextIdx >= 0 && nextIdx < allInputs.length) {
                allInputs[nextIdx].focus();
                allInputs[nextIdx].select();
                activeNumInput = allInputs[nextIdx];
            }
        }
    } else if (val === '.') {
        if (!currentStr.includes('.')) {
            currentStr = currentStr.substring(0, start) + val + currentStr.substring(end);
            activeNumInput.value = currentStr;
            activeNumInput.setSelectionRange(start + 1, start + 1);
        }
    } else if (val === '-') {
        if (currentStr.startsWith('-')) {
            activeNumInput.value = currentStr.substring(1);
            activeNumInput.setSelectionRange(start - 1, start - 1);
        } else {
            activeNumInput.value = '-' + currentStr;
            activeNumInput.setSelectionRange(start + 1, start + 1);
        }
    } else {
        if (start !== end) {
            currentStr = currentStr.substring(0, start) + val + currentStr.substring(end);
            activeNumInput.value = currentStr;
            activeNumInput.setSelectionRange(start + 1, start + 1);
        } else {
            if ((currentStr === '0' || currentStr === '-0') && start === currentStr.length) {
                if (currentStr === '-0') {
                    activeNumInput.value = '-' + val;
                    activeNumInput.setSelectionRange(2, 2);
                } else {
                    activeNumInput.value = val;
                    activeNumInput.setSelectionRange(1, 1);
                }
            } else {
                currentStr = currentStr.substring(0, start) + val + currentStr.substring(end);
                activeNumInput.value = currentStr;
                activeNumInput.setSelectionRange(start + 1, start + 1);
            }
        }
    }

    activeNumInput.dispatchEvent(new Event('input', { bubbles: true }));
}, { passive: false });

// Gestione click sul tasto trasformato in "Chiudi"
[CalcBridge.getElementById('ch-next-btn'), CalcBridge.getElementById('zd-next-btn')].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            if (btn.innerText.includes('Chiudi') || btn.innerText === t('btn_close')) {
                if (btn.id === 'ch-next-btn') {
                    const overlay = CalcBridge.getElementById('calc-helper-overlay');
                    if (overlay) overlay.style.display = 'none';
                    const check = CalcBridge.getElementById('calc-helper-check-mobile');
                    if (check) check.checked = false;
                } else if (btn.id === 'zd-next-btn') {
                    const explainPanel = CalcBridge.getElementById('zerodiv-explanation-panel');
                    if (explainPanel) explainPanel.style.display = 'none';
                    const checkMob = CalcBridge.getElementById('zerodiv-explain-check-mobile');
                    if (checkMob) { checkMob.checked = false; checkMob.dispatchEvent(new Event('change')); }
                    const checkDesk = CalcBridge.getElementById('zerodiv-explain-check');
                    if (checkDesk) { checkDesk.checked = false; checkDesk.dispatchEvent(new Event('change')); }
                }
            }
        });
    }
});