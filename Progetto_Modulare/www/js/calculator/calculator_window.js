import { isMobile, zManager, ALGEBRAS } from '../core/constants.js';
import { updateCalcUI } from './calculator_formulas.js';
import { updateGridVisibility, switchCalcView } from './calculator_ui.js';
import { closeHistory } from './calculator_history.js';
import { getExternalWindow } from './calculator_popout.js';
import { toggleShift, getIsShiftActive } from './calculator_input.js';
import { applySwipeState } from '../ui/mobile.js';

const calcModal = document.getElementById('calc-modal');
const calcToggle = document.getElementById('calc-toggle-btn');

export function resetCalcPosition() {
    if (isMobile()) {
        calcModal.style.top = '120px';
        calcModal.style.left = '50%';
        calcModal.style.transform = 'translateX(-50%)';
    } else {
        calcModal.style.top = '80px';
        calcModal.style.left = '30px';
        calcModal.style.transform = 'none';
    }
    calcModal.style.margin = '0';
}

export function openCalculator(preservePos = false) {
    if (!preservePos) resetCalcPosition();

    if (isMobile()) {
        applySwipeState(1);
    } else {
        calcModal.classList.remove('formulas-mobile-mode', 'zerodiv-mobile-mode');
    }

    const isOpen = calcModal.classList.contains('active');
    calcModal.style.zIndex = zManager.next();
    if (!isOpen) {
        calcModal.classList.add('active');
        calcToggle.classList.add('active');
        closeHistory();
        updateCalcUI(ALGEBRAS.SEDENIONS);
        updateGridVisibility();
        if (getIsShiftActive()) toggleShift();
        switchCalcView('keypad');
    }
}

export function initCalculatorWindow() {
    if (!calcModal || !calcToggle) return;

    function toggleCalculator() {
        const extWin = getExternalWindow();
        if (extWin && !extWin.closed) {
            extWin.close();
            return;
        }

        const currentZ = parseInt(calcModal.style.zIndex || 0);
        const isTop = currentZ === zManager.current;
        const isMobileNow = isMobile();

        if (isMobileNow) {
            const wasActive = calcModal.classList.contains('active') &&
                !calcModal.classList.contains('formulas-mobile-mode') &&
                !calcModal.classList.contains('zerodiv-mobile-mode');

            if (wasActive && !isTop) {
                calcModal.style.zIndex = zManager.next();
                return;
            }

            calcModal.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
            calcToggle.classList.remove('active');
            const formulasMenu = document.getElementById('calc-formula-menu');
            if (formulasMenu) formulasMenu.classList.remove('visible');
            const dockFormulasBtn = document.getElementById('dock-formulas-btn');
            if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
            const zdOverlay = document.getElementById('zerodiv-overlay');
            if (zdOverlay) zdOverlay.classList.remove('visible');
            const dockZdBtn = document.getElementById('dock-zerodiv-btn');
            if (dockZdBtn) dockZdBtn.classList.remove('active');
            const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
            if (zdBtnCalc) zdBtnCalc.classList.remove('active');

            if (!wasActive) {
                resetCalcPosition();
                calcModal.classList.add('active');
                calcModal.style.zIndex = zManager.next();
                calcToggle.classList.add('active');
                closeHistory();
                updateCalcUI(ALGEBRAS.SEDENIONS);
                updateGridVisibility();
                if (getIsShiftActive()) toggleShift();
                switchCalcView('keypad');
                applySwipeState(1);
            }
        } else {
            const isOpen = calcModal.classList.contains('active');

            if (isOpen && !isTop) {
                calcModal.style.zIndex = zManager.next();
                return;
            }

            if (!isOpen) calcModal.style.zIndex = zManager.next();

            if (isOpen) {
                calcModal.classList.remove('active');
                calcToggle.classList.remove('active');
                closeHistory();
            } else {
                resetCalcPosition();
                calcModal.classList.add('active');
                calcToggle.classList.add('active');
                closeHistory();
                updateCalcUI(ALGEBRAS.SEDENIONS);
                updateGridVisibility();
                if (getIsShiftActive()) toggleShift();
                switchCalcView('keypad');
            }
        }
    }

    calcToggle.addEventListener('click', toggleCalculator);

    // LOGICA TRASCINAMENTO
    calcModal.style.cursor = 'move';
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function isInteractive(target) {
        if (isMobile()) {
            return target.closest('input') || target.closest('button') || target.closest('.formula-btn') || target.closest('.zerodiv-btn') || target.closest('.fano-btn') || target.closest('label') || target.closest('#steps-content') || target.closest('#kernel-inputs-container') || target.closest('#result-display') || target.closest('#formula-explanation-panel') || target.closest('#zerodiv-explanation-panel') || target.closest('#calc-helper-panel') || target.closest('.log-entry') || target.closest('#calc-log');
        }
        return target.closest('button') || target.closest('input') || target.closest('select') || target.closest('.icon-btn') || target.closest('.var-tab') || target.closest('.log-entry') || target.closest('.display-area') || target.closest('.zerodiv-grid-btn') || target.closest('.zerodiv-toggle') || target.closest('.zerodiv-tab') || target.closest('.formula-btn') || target.closest('.zerodiv-btn') || target.closest('.fano-btn') || target.closest('#close-zerodiv-overlay') || target.closest('#btn-close-history') || target.closest('#btn-clear-log') || target.closest('label') || target.closest('.key-btn') || target.closest('#steps-overlay') || target.closest('#close-steps-btn') || target.closest('#close-kernel-ui');
    }

    function startDrag(clientX, clientY, e) {
        if (window.externalCalcWindow && !window.externalCalcWindow.closed) return;
        if (isInteractive(e.target)) return;

        isDragging = true;
        const rect = calcModal.getBoundingClientRect();

        if (isMobile()) calcModal.style.bottom = 'auto';

        calcModal.style.transform = 'none';
        calcModal.style.margin = '0';
        calcModal.style.left = rect.left + 'px';
        calcModal.style.top = rect.top + 'px';

        dragOffsetX = clientX - rect.left;
        dragOffsetY = clientY - rect.top;
    }

    calcModal.addEventListener('mousedown', (e) => {
        if (isInteractive(e.target)) return;
        e.preventDefault();
        startDrag(e.clientX, e.clientY, e);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        calcModal.style.left = (e.clientX - dragOffsetX) + 'px';
        calcModal.style.top = (e.clientY - dragOffsetY) + 'px';
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    calcModal.addEventListener('touchstart', (e) => {
        if (isInteractive(e.target)) return;
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY, e);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); 
        const touch = e.touches[0];

        if (isMobile()) {
            calcModal.style.top = (touch.clientY - dragOffsetY) + 'px';
        } else {
            calcModal.style.left = (touch.clientX - dragOffsetX) + 'px';
            calcModal.style.top = (touch.clientY - dragOffsetY) + 'px';
        }
    }, { passive: false });

    document.addEventListener('touchend', () => { isDragging = false; });
}