import { updateCalcUI } from './main.js';

// INIEZIONE CSS GLOBALE PER CAROSELLO UNIVERSALE SU TUTTI I DISPOSITIVI
const universalCarouselCss = document.createElement('style');
universalCarouselCss.textContent = `
    #carousel-track { position: relative !important; flex: 1 !important; width: 100% !important; overflow: hidden !important; display: grid !important; grid-template-columns: 100% !important; grid-template-rows: 100% !important; touch-action: pan-y !important; }
    .carousel-panel { grid-area: 1 / 1 !important; position: relative !important; width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; padding: 0 5px !important; box-sizing: border-box !important; visibility: visible !important; }
    #carousel-track > * { min-width: 0 !important; overflow-x: hidden !important; }
    #carousel-track #zerodiv-overlay, #carousel-track #calc-formula-menu { position: relative !important; top: auto !important; bottom: auto !important; left: auto !important; right: auto !important; width: 100% !important; height: 100% !important; border: none !important; background: transparent !important; box-shadow: none !important; border-radius: 0 !important; display: flex !important; z-index: 1 !important; max-height: none !important; transform: none !important; }
    #carousel-track #close-zerodiv-overlay, #carousel-track #zerodiv-overlay > div:first-child { display: none !important; }
    #calc-modal > #zerodiv-overlay, .calc-body > #calc-formula-menu { display: none !important; }
`;
document.head.appendChild(universalCarouselCss);

// --- SWIPE GESTURES (CAROUSEL MOBILE E PC) ---
let swipeStartX = 0;
let swipeCurrentX = 0;
let isSwipingCarousel = false;
window.currentSwipeState = 1; // 0: Formule, 1: Calc, 2: Divisori

window.setupCarouselDOM = function () {
    if (document.getElementById('carousel-track')) return;
    const calcBody = document.querySelector('.calc-body');
    const track = document.createElement('div');
    track.id = 'carousel-track';

    const p0 = document.createElement('div'); p0.className = 'carousel-panel'; p0.id = 'carousel-p0';
    const p1 = document.createElement('div'); p1.className = 'carousel-panel'; p1.id = 'carousel-p1';
    const p2 = document.createElement('div'); p2.className = 'carousel-panel'; p2.id = 'carousel-p2';

    const formMenu = document.getElementById('calc-formula-menu');
    if (formMenu) p0.appendChild(formMenu);

    const keypad = document.getElementById('view-keypad');
    const vars = document.getElementById('view-vars');
    if (keypad) p1.appendChild(keypad);
    if (vars) p1.appendChild(vars);

    const zdOverlay = document.getElementById('zerodiv-overlay');
    if (zdOverlay) p2.appendChild(zdOverlay);

    track.appendChild(p0);
    track.appendChild(p1);
    track.appendChild(p2);
    calcBody.appendChild(track);
};

window.updateCarouselPositions = function (dragDelta = 0, animate = false) {
    const panels = [document.getElementById('carousel-p0'), document.getElementById('carousel-p1'), document.getElementById('carousel-p2')];
    if (!panels[0]) return;

    panels.forEach((panel, i) => {
        let offset = i - window.currentSwipeState;
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

        panel.style.setProperty('transform', `translate3d(calc(${offset * 100}% + ${dragDelta}px), 0, 0)`, 'important');
        panel.dataset.lastOffset = offset;
    });
};

window.applySwipeState = function (state) {
    window.setupCarouselDOM();

    const formulasMenu = document.getElementById('calc-formula-menu');
    const zdContentGrid = document.getElementById('zerodiv-content-grid');
    if (formulasMenu && formulasMenu.innerHTML.trim() === '') updateCalcUI(15);
    if (zdContentGrid && zdContentGrid.innerHTML.trim() === '') updateCalcUI(15);

    window.currentSwipeState = state;
    window.updateCarouselPositions(0, true);

    const navL = document.getElementById('swipe-nav-left');
    const navR = document.getElementById('swipe-nav-right');
    const mobileHelpBtn = document.getElementById('zerodiv-explain-label-mobile');
    const formHelpBtn = document.getElementById('formula-explain-label-mobile');

    const fcb = document.getElementById('formula-explain-check-mobile');
    if (fcb && fcb.checked) {
        fcb.checked = false;
        if (window.toggleFormulaExplain) window.toggleFormulaExplain(false);
    }

    const calcHelperBtn = document.getElementById('calc-helper-label-mobile');

    if (state === 0) {
        if (navL) navL.innerHTML = '&laquo; Divisori dello zero';
        if (navR) navR.innerHTML = 'Calcolatrice &raquo;';
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'none';
        if (formHelpBtn) formHelpBtn.style.display = 'flex';
        if (calcHelperBtn) calcHelperBtn.style.display = 'none';
    } else if (state === 2) {
        if (navL) navL.innerHTML = '&laquo; Calcolatrice';
        if (navR) navR.innerHTML = 'Formule &raquo;';
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'flex';
        if (formHelpBtn) formHelpBtn.style.display = 'none';
        if (calcHelperBtn) calcHelperBtn.style.display = 'none';
    } else {
        if (navL) navL.innerHTML = '&laquo; Formule';
        if (navR) navR.innerHTML = 'Divisori dello zero &raquo;';
        if (mobileHelpBtn) mobileHelpBtn.style.display = 'none';
        if (formHelpBtn) formHelpBtn.style.display = 'none';
        if (calcHelperBtn) calcHelperBtn.style.display = 'flex';
    }
};

window.toggleFormulaExplain = function (isActive) {
    const panel = document.getElementById('formula-explanation-panel');
    const label = document.getElementById('formula-explain-label-mobile');
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
};

window.currentZdPage = 1;
window.changeZdPage = function (dir) {
    window.currentZdPage += dir;
    if (window.currentZdPage < 1) window.currentZdPage = 1;
    if (window.currentZdPage > 4) window.currentZdPage = 4;

    for (let i = 1; i <= 4; i++) {
        const page = document.getElementById('zd-page-' + i);
        if (page) page.style.display = (i === window.currentZdPage) ? 'block' : 'none';
    }

    const prevBtn = document.getElementById('zd-prev-btn');
    const nextBtn = document.getElementById('zd-next-btn');
    const ind = document.getElementById('zd-page-indicator');

    if (prevBtn) prevBtn.style.visibility = (window.currentZdPage === 1) ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.style.visibility = (window.currentZdPage === 4) ? 'hidden' : 'visible';
    if (ind) ind.innerText = window.currentZdPage + ' / 4';

    const panel = document.getElementById('zerodiv-explanation-panel');
    if (panel) panel.scrollTop = 0;
};

window.currentCalcHelperPage = 1;
window.changeCalcHelperPage = function (dir) {
    window.currentCalcHelperPage += dir;
    if (window.currentCalcHelperPage < 1) window.currentCalcHelperPage = 1;
    if (window.currentCalcHelperPage > 5) window.currentCalcHelperPage = 5;

    for (let i = 1; i <= 5; i++) {
        const page = document.getElementById('ch-page-' + i);
        if (page) page.style.display = (i === window.currentCalcHelperPage) ? 'block' : 'none';
    }

    const prevBtn = document.getElementById('ch-prev-btn');
    const nextBtn = document.getElementById('ch-next-btn');
    const ind = document.getElementById('ch-page-indicator');

    if (prevBtn) prevBtn.style.visibility = (window.currentCalcHelperPage === 1) ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.style.visibility = (window.currentCalcHelperPage === 5) ? 'hidden' : 'visible';
    if (ind) ind.innerText = window.currentCalcHelperPage + ' / 5';

    const panel = document.getElementById('calc-helper-panel');
    if (panel) panel.scrollTop = 0;
};


let swipeStartY = 0;
let swipeDirectionDetermined = false;
let isHorizontalSwipe = false;

const startCarouselDrag = (x, y) => {
    window.setupCarouselDOM();
    isSwipingCarousel = true;
    swipeDirectionDetermined = false;
    isHorizontalSwipe = false;
    swipeStartX = x;
    swipeStartY = y;
    swipeCurrentX = x;
};

const moveCarouselDrag = (x, y, e) => {
    if (!isSwipingCarousel) return;

    swipeCurrentX = x;
    const deltaX = swipeCurrentX - swipeStartX;
    const deltaY = y - swipeStartY;

    if (!swipeDirectionDetermined) {
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 5) {
            swipeDirectionDetermined = true;
            isHorizontalSwipe = Math.abs(deltaX) * 1.5 > Math.abs(deltaY);
        }
    }

    if (swipeDirectionDetermined) {
        if (isHorizontalSwipe) {
            if (e && e.cancelable) e.preventDefault();
            window.updateCarouselPositions(deltaX, false);
        } else {
            isSwipingCarousel = false;
            window.updateCarouselPositions(0, true);
        }
    }
};

const endCarouselDrag = () => {
    if (!isSwipingCarousel) return;
    isSwipingCarousel = false;

    if (swipeDirectionDetermined && !isHorizontalSwipe) return;

    const delta = swipeCurrentX - swipeStartX;
    const trackWidth = document.getElementById('carousel-track').offsetWidth || 300;

    if (delta > trackWidth * 0.15) {
        window.applySwipeState((window.currentSwipeState + 2) % 3);
    } else if (delta < -trackWidth * 0.15) {
        window.applySwipeState((window.currentSwipeState + 1) % 3);
    } else {
        window.updateCarouselPositions(0, true);
    }
};

const isValidDragTarget = (target) => {
    const track = document.getElementById('carousel-track');
    if (!track || !track.contains(target)) return false;
    if (target.closest('input') || target.closest('.display-area')) return false;
    return true;
};

const calcModal = document.getElementById('calc-modal');

if (calcModal) {
    calcModal.addEventListener('touchstart', e => {
        if (e.touches.length !== 1 || !isValidDragTarget(e.target)) return;
        startCarouselDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    calcModal.addEventListener('mousedown', e => {
        if (!isValidDragTarget(e.target)) return;
        startCarouselDrag(e.clientX, e.clientY);
    });
}

document.addEventListener('touchmove', e => {
    if (isSwipingCarousel && e.touches.length === 1) {
        moveCarouselDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    if (isSwipingCarousel) endCarouselDrag();
});
document.addEventListener('touchcancel', () => {
    if (isSwipingCarousel) endCarouselDrag();
});

document.addEventListener('mousemove', e => {
    if (isSwipingCarousel && e.buttons === 1) moveCarouselDrag(e.clientX, e.clientY, e);
});
document.addEventListener('mouseup', () => {
    if (isSwipingCarousel) endCarouselDrag();
});

const forceCarouselInit = () => {
    if (window.applySwipeState) {
        const track = document.getElementById('carousel-track');
        if (!track) {
            window.applySwipeState(1);
        }
    }
};

const calcModalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) {
            forceCarouselInit();
        }
    });
});

const calcModalElObserverTarget = document.getElementById('calc-modal');
if (calcModalElObserverTarget) {
    calcModalObserver.observe(calcModalElObserverTarget, { attributes: true, attributeFilter: ['class'] });
}

setTimeout(forceCarouselInit, 300);