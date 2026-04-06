import { storedVars } from '../parser.js';

export let currentVar = 'a';
const inputGrid = document.getElementById('input-grid');

window.switchCalcView = function (viewName) {
    document.querySelectorAll('.calc-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');

    const varsBtn = document.getElementById('mobile-vars-btn');
    if (varsBtn) {
        if (viewName === 'vars') {
            varsBtn.classList.add('active');
        } else {
            varsBtn.classList.remove('active');
        }
    }
};

window.toggleVarsView = function () {
    const isVarsActive = document.getElementById('view-vars').classList.contains('active');
    if (isVarsActive) {
        window.switchCalcView('keypad');
    } else {
        window.switchCalcView('vars');
    }

    if (window.innerWidth <= 768 && window.applySwipeState && window.currentSwipeState !== 1) {
        window.applySwipeState(1);
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
                        <input type="text" inputmode="decimal" class="num-input" data-idx="${i}" value="0">
                    </div>`;
    }

    inputGrid.removeAttribute('data-listener-attached');

    if (!inputGrid.hasAttribute('data-listener-attached')) {
        inputGrid.addEventListener('input', (e) => {
            if (e.target.classList.contains('num-input')) {
                updateInputDimming();
                const idx = parseInt(e.target.dataset.idx);
                let val = parseFloat(e.target.value.replace(',', '.'));
                if (isNaN(val)) val = 0;

                if (storedVars && currentVar) {
                    storedVars[currentVar][idx] = val;
                    updateVarIndicators();
                }

                if (typeof window.calculateRealTime === 'function') {
                    window.calculateRealTime();
                }
            }
        });

        inputGrid.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('num-input')) return;

            const idx = parseInt(e.target.dataset.idx);
            let dest = null;

            if (e.key === 'ArrowRight') dest = idx + 1;
            else if (e.key === 'ArrowLeft') dest = idx - 1;
            else if (e.key === 'ArrowDown') dest = idx + 4;
            else if (e.key === 'ArrowUp') dest = idx - 4;
            else return;

            if (dest !== null && dest >= 0 && dest <= 15) {
                const targetEl = document.querySelector(`.num-input[data-idx="${dest}"]`);
                if (targetEl && !targetEl.parentElement.classList.contains('hidden')) {
                    e.preventDefault();
                    targetEl.focus();
                    targetEl.select();
                }
            }
        });
        inputGrid.setAttribute('data-listener-attached', 'true');
    }

    updateGridVisibility();
}

export function updateGridVisibility() {
    for (let i = 0; i <= 15; i++) {
        const el = document.getElementById(`inp-grp-${i}`);
        if (el) el.classList.remove('hidden');
    }
}

function updateInputDimming() {
    const inputs = document.querySelectorAll('#input-grid input');
    let maxIdx = 0;

    inputs.forEach(inp => {
        const val = parseFloat(inp.value.replace(',', '.'));
        if (Math.abs(val) > 1e-9 || !isFinite(val)) {
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
        const isDefined = storedVars[v] && storedVars[v].some(val => Math.abs(val) > 1e-9);

        const btn = document.querySelector(`button[onclick="handleKey('${v}')"]`) || document.querySelector(`button[onpointerdown*="'${v}'"]`);

        if (btn) {
            let indicator = btn.querySelector('.var-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'var-indicator';
                btn.appendChild(indicator);
            }
            indicator.style.display = isDefined ? 'block' : 'none';
        }

        const tab = document.querySelector(`.var-tab[data-var="${v}"]`);
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
    const inputs = document.querySelectorAll('#input-grid input');
    inputs.forEach(inp => { storedVars[varName][parseInt(inp.dataset.idx)] = parseFloat(inp.value.replace(',', '.')) || 0; });
    updateInputDimming();
    updateVarIndicators();
}

export function setGrid(vector) {
    const inputs = document.querySelectorAll('#input-grid input');
    inputs.forEach(inp => { inp.value = vector[parseInt(inp.dataset.idx)]; });
    updateInputDimming();
}

export function switchVar(newVar) {
    saveVar(currentVar);
    document.querySelectorAll('.var-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.var-tab[data-var="${newVar}"]`).classList.add('active');
    currentVar = newVar; setGrid(storedVars[newVar]);
}

document.querySelectorAll('.var-tab').forEach(tab => tab.addEventListener('click', () => {
    const newVar = tab.dataset.var;
    if (tab.classList.contains('active')) {
        window.switchCalcView('keypad');
    } else {
        switchVar(newVar);
    }
}));

document.getElementById('btn-grid-clear').addEventListener('click', () => {
    // Gestisce il richiamo di createZeroVector assumendo sia disponibile a livello globale
    setGrid(window.createZeroVector ? window.createZeroVector() : new Array(16).fill(0));
    saveVar(currentVar);
    if (typeof window.calculateRealTime === 'function') window.calculateRealTime();
});

const genRandomVar = (limit) => {
    const v = window.createZeroVector ? window.createZeroVector() : new Array(16).fill(0);
    for (let i = 0; i <= limit; i++) v[i] = Math.floor(Math.random() * 21) - 10;
    setGrid(v);
    saveVar(currentVar);
    if (typeof window.calculateRealTime === 'function') window.calculateRealTime();
};

document.getElementById('btn-rand-h').addEventListener('click', () => genRandomVar(3));
document.getElementById('btn-rand-o').addEventListener('click', () => genRandomVar(7));
document.getElementById('btn-rand-s').addEventListener('click', () => genRandomVar(15));

// --- Inizializzazione ---
// Esegue il setup della griglia automaticamente al caricamento del modulo
setupGrid();
updateVarIndicators();