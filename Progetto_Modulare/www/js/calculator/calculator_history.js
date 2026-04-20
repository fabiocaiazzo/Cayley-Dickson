import { t } from '../core/i18n.js';
import { CalcBridge } from './calculator_popout.js';

export const historyOverlay = CalcBridge.getElementById('history-overlay');
export const toggleHistoryBtn = CalcBridge.getElementById('toggle-history-btn');

export const iconClockSVG = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`;
export const iconCalcSVG = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V12H9V10H7M11,10V12H13V10H11M15,10V12H17V10H15M7,14V16H9V14H7M11,14V16H13V14H11M15,14V16H17V14H15M7,18V20H9V18H7M11,18V20H13V18H11M15,18V20H17V18H15Z" /></svg>`;

export function closeHistory() {
    if (historyOverlay && toggleHistoryBtn) {
        historyOverlay.classList.remove('open');
        toggleHistoryBtn.classList.remove('active');
        toggleHistoryBtn.innerHTML = iconClockSVG;
        toggleHistoryBtn.title = t('tt_history');
    }
}

// Inizializzazione degli Event Listener
if (toggleHistoryBtn) {
    toggleHistoryBtn.addEventListener('click', () => {
        if (historyOverlay.classList.contains('open')) {
            closeHistory();
        } else {
            historyOverlay.classList.add('open');
            toggleHistoryBtn.classList.add('active');
            toggleHistoryBtn.innerHTML = iconCalcSVG;
            toggleHistoryBtn.title = t('tt_back_calc');
        }
    });
}

const btnCloseHistory = CalcBridge.getElementById('btn-close-history');
if (btnCloseHistory) {
    btnCloseHistory.addEventListener('click', closeHistory);
}