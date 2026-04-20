import { EPSILON, storedVars, createZeroVector } from '../math/parser.js';
import { isMobile } from '../core/constants.js';
import { CalcBridge } from './calculator_popout.js';
import { calculateRealTime } from './calculator_core.js';
import { changeCalcHelperPage, changeZdPage, applySwipeState, currentSwipeState } from '../ui/mobile.js';
import { toggle32Ions } from '../3d/ions32.js';

export let currentVar = 'a';
const inputGrid = CalcBridge.getElementById('input-grid');

export function switchCalcView(viewName) {
    CalcBridge.querySelectorAll('.calc-view').forEach(v => v.classList.remove('active'));
    CalcBridge.getElementById('view-' + viewName).classList.add('active');

    const varsBtn = CalcBridge.getElementById('mobile-vars-btn');
    if (varsBtn) {
        if (viewName === 'vars') {
            varsBtn.classList.add('active');
        } else {
            varsBtn.classList.remove('active');
        }
    }
};

export function toggleVarsView() {
    const isVarsActive = CalcBridge.getElementById('view-vars').classList.contains('active');
    if (isVarsActive) {
        switchCalcView('keypad');
    } else {
        switchCalcView('vars');
    }

    if (isMobile() && currentSwipeState !== 1) {
        applySwipeState(1);
    }
};

export function setupGrid() {
    inputGrid.innerHTML = '';
    for (let i = 0; i <= 15; i++) {
        const l = i === 0 ? '1' : 'e' + i;
        const customStyle = i === 0 ? 'border-color: #ffcc00;' : '';

        inputGrid.innerHTML += `
                    <div class="input-group" id="inp-grp-${i}" style="${customStyle}">
                        <span style="font-size:10px; color:#666; width:25px; text-align:center;">${l}</span>
                        <input type="text" inputmode="none" class="num-input" data-idx="${i}" value="" placeholder="0">
                    </div>`;
    }

    if (!inputGrid.hasAttribute('data-listener-attached')) {
        inputGrid.addEventListener('input', (e) => {
            if (e.target.classList.contains('num-input')) {
                const rawVal = e.target.value.replace(',', '.').trim();
                
                // Validazione tramite Espressione Regolare per accettare SOLO veri numeri.
                // Accettiamo '-', '+', '-.' come stati intermedi validi (l'utente sta ancora digitando).
                const isInvalid = rawVal !== '' && rawVal !== '-' && rawVal !== '+' && rawVal !== '-.' && !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(rawVal);

                if (isInvalid) {
                    e.target.style.setProperty('background-color', 'rgba(255, 80, 80, 0.4)', 'important');
                } else {
                    e.target.style.backgroundColor = 'transparent';
                }
                e.target.style.color = 'white';

                updateInputDimming();
                
                if (isInvalid) {
                    return; // Non inizializza e non calcola se l'espressione è scorretta
                }

                const idx = parseInt(e.target.dataset.idx);
                let val = Number(rawVal);
                if (isNaN(val)) val = 0;

                if (storedVars && currentVar) {
                    storedVars[currentVar][idx] = val;
                    updateVarIndicators();
                }

                calculateRealTime();
            }
        });

        inputGrid.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('num-input')) return;

            const idx = parseInt(e.target.dataset.idx);
            let dest = null;

            if (e.key === 'ArrowRight') {
                if (e.target.selectionStart === e.target.value.length) dest = idx + 1;
                else return;
            } else if (e.key === 'ArrowLeft') {
                if (e.target.selectionEnd === 0) dest = idx - 1;
                else return;
            } else if (e.key === 'ArrowDown') {
                dest = idx + 4;
            } else if (e.key === 'ArrowUp') {
                dest = idx - 4;
            } else {
                return;
            }

            if (dest !== null && dest >= 0 && dest <= 15) {
                const targetEl = CalcBridge.querySelector(`.num-input[data-idx="${dest}"]`);
                if (targetEl && !targetEl.parentElement.classList.contains('hidden')) {
                    e.preventDefault();
                    targetEl.focus();
                    targetEl.select();
                }
            }
        });
        
        // FIX ALTEZZA CALCOLATRICE MOBILE CON TASTIERA APERTA
        inputGrid.addEventListener('focusin', (e) => {
            if (isMobile() && e.target.classList.contains('num-input')) {
                const calcModal = CalcBridge.getElementById('calc-modal');
                if (calcModal) {
                    // Blocca l'altezza attuale in pixel prima che il browser la schiacci
                    const currentHeight = calcModal.offsetHeight;
                    calcModal.style.height = currentHeight + 'px';
                    calcModal.style.maxHeight = 'none';
                    calcModal.style.overflowY = 'auto'; // Permette di scorrere per vedere i tasti coperti
                }
            }
        });

        inputGrid.addEventListener('focusout', (e) => {
            if (isMobile() && e.target.classList.contains('num-input')) {
                const calcModal = CalcBridge.getElementById('calc-modal');
                if (calcModal) {
                    // Ripristina l'altezza dinamica quando la tastiera si chiude
                    calcModal.style.height = '';
                    calcModal.style.maxHeight = '';
                    calcModal.style.overflowY = 'hidden';
                }
            }
        });

        inputGrid.setAttribute('data-listener-attached', 'true');
    }

    updateGridVisibility();
}

export function updateGridVisibility() {
    for (let i = 0; i <= 15; i++) {
        const el = CalcBridge.getElementById(`inp-grp-${i}`);
        if (el) el.classList.remove('hidden');
    }
}

function updateInputDimming() {
        const inputs = CalcBridge.querySelectorAll('#input-grid input');
        let maxIdx = 0;

        inputs.forEach(inp => {
            const val = Number(inp.value.replace(',', '.'));
        if (Math.abs(val) > EPSILON || !isFinite(val)) {
            const i = parseInt(inp.dataset.idx);
            if (i > maxIdx) maxIdx = i;
        }
    });

    let threshold = 15;
    if (maxIdx <= 3) threshold = 3;
    else if (maxIdx <= 7) threshold = 7;

    inputs.forEach(inp => {
        const i = parseInt(inp.dataset.idx);
        if (i <= threshold) {
            inp.style.color = 'white';
        } else {
            inp.style.color = '#444';
        }
    });
}

export function updateVarIndicators() {
    ['a', 'b', 'c', 'd'].forEach(v => {
        const isDefined = storedVars[v] && storedVars[v].some(val => Math.abs(val) > EPSILON);

        const btn = CalcBridge.querySelector(`.btn-handle-key[data-key="${v}"]`) || CalcBridge.querySelector(`.key-var[data-var-hold="${v}"]`);

        if (btn) {
            let indicator = btn.querySelector('.var-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'var-indicator';
                btn.appendChild(indicator);
            }
            indicator.style.display = isDefined ? 'block' : 'none';
        }

        const tab = CalcBridge.querySelector(`.var-tab[data-var="${v}"]`);
        if (tab) {
            if (isDefined) {
                tab.style.color = '#00ffaa';
                tab.style.textShadow = '0 0 5px rgba(0, 255, 170, 0.3)';
            } else {
                tab.style.color = '';
                tab.style.textShadow = 'none';
            }
        }
    });
}

export function saveVar(varName) {
    const inputs = CalcBridge.querySelectorAll('#input-grid input');
    inputs.forEach(inp => { 
        let v = Number(inp.value.replace(',', '.'));
        storedVars[varName][parseInt(inp.dataset.idx)] = isNaN(v) ? 0 : v; 
    });
    updateInputDimming();
    updateVarIndicators();
}

export function setGrid(vector) {
    const inputs = CalcBridge.querySelectorAll('#input-grid input');
    inputs.forEach(inp => { 
        const val = vector[parseInt(inp.dataset.idx)];
        inp.value = val === 0 ? '' : val; 
    });
    updateInputDimming();
}

export function switchVar(newVar) {
    saveVar(currentVar);
    CalcBridge.querySelectorAll('.var-tab').forEach(t => t.classList.remove('active'));
    CalcBridge.querySelector(`.var-tab[data-var="${newVar}"]`).classList.add('active');
    currentVar = newVar; setGrid(storedVars[newVar]);
}

CalcBridge.querySelectorAll('.var-tab').forEach(tab => tab.addEventListener('click', () => {
    const newVar = tab.dataset.var;
    if (tab.classList.contains('active')) {
        switchCalcView('keypad');
    } else {
        switchVar(newVar);
    }
}));

CalcBridge.getElementById('btn-grid-clear').addEventListener('click', () => {
    setGrid(createZeroVector());
    saveVar(currentVar);
    calculateRealTime();
});

const genRandomVar = (limit) => {
    const v = createZeroVector();
    for (let i = 0; i <= limit; i++) {
        let val = 0;
        while (val === 0) val = Math.floor(Math.random() * 21) - 10;
        v[i] = val;
    }
    setGrid(v);
    saveVar(currentVar);
    calculateRealTime();
};

CalcBridge.getElementById('btn-rand-h').addEventListener('click', () => genRandomVar(3));
CalcBridge.getElementById('btn-rand-o').addEventListener('click', () => genRandomVar(7));
CalcBridge.getElementById('btn-rand-s').addEventListener('click', () => genRandomVar(15));

// --- Inizializzazione ---
// Esegue il setup della griglia automaticamente al caricamento del modulo
setupGrid();
updateVarIndicators();

// Inizializzazione Event Listeners per sostituire gli onclick inline
document.addEventListener('DOMContentLoaded', () => {
    const chPrev = CalcBridge.getElementById('ch-prev-btn');
    if (chPrev) chPrev.addEventListener('click', () => changeCalcHelperPage(-1));
    const chNext = CalcBridge.getElementById('ch-next-btn');
    if (chNext) chNext.addEventListener('click', () => changeCalcHelperPage(1));

    const zdPrev = CalcBridge.getElementById('zd-prev-btn');
    if (zdPrev) zdPrev.addEventListener('click', () => changeZdPage(-1));
    const zdNext = CalcBridge.getElementById('zd-next-btn');
    if (zdNext) zdNext.addEventListener('click', () => changeZdPage(1));

    const mbVars = CalcBridge.getElementById('mobile-vars-btn');
    if (mbVars) mbVars.addEventListener('click', () => toggleVarsView());

    const swLeft = CalcBridge.getElementById('swipe-nav-left');
    if (swLeft) swLeft.addEventListener('click', () => applySwipeState((currentSwipeState + 2) % 3));

    const swRight = CalcBridge.getElementById('swipe-nav-right');
    if (swRight) swRight.addEventListener('click', () => applySwipeState((currentSwipeState + 1) % 3));

    const toggle32Btn = CalcBridge.getElementById('toggle-32-btn');
    if (toggle32Btn) toggle32Btn.addEventListener('click', () => toggle32Ions());

    const backKeypadBtn = CalcBridge.getElementById('back-to-keypad-btn');
    if (backKeypadBtn) backKeypadBtn.addEventListener('click', () => switchCalcView('keypad'));
});