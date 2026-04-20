// js/rotations/sequence.js
import { t } from '../core/i18n.js';
import { isMobile } from '../core/constants.js';
import { vecMul, vecInv } from '../math/algebra.js';
import { createZeroVector } from '../math/parser.js';

let sequenceCount = 0;
let lastQTotHTML = "";
let lastPRotHTML = "";

// --- MATH ADAPTERS (Punto C1) ---
// Usiamo il motore di algebra.js invece di riscrivere le moltiplicazioni
function quatToVec(q) {
    const v = createZeroVector();
    v[0] = q.w || 0; v[1] = q.x || 0; v[2] = q.y || 0; v[3] = q.z || 0;
    return v;
}

function vecToQuat(v) {
    return { w: v[0] || 0, x: v[1] || 0, y: v[2] || 0, z: v[3] || 0 };
}

function multiplyQuaternions(q1, q2) {
    return vecToQuat(vecMul(quatToVec(q1), quatToVec(q2)));
}

function invertQuaternion(q) {
    const n2 = q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z;
    if (n2 === 0) return { w: 0, x: 0, y: 0, z: 0 };
    return vecToQuat(vecInv(quatToVec(q)));
}

// --- FUNZIONI ESTRATTE (Punto F1) ---
function updateResultDisplay() {
    const resDiv = document.getElementById('qtot-result');
    if (!resDiv) return;
    let html = "";
    if (lastQTotHTML) html += `<div style="margin-bottom: ${lastPRotHTML ? '10px' : '0'};">${lastQTotHTML}</div>`;
    if (lastPRotHTML) html += `<div style="border-top: ${lastQTotHTML ? '1px solid #445566' : 'none'}; padding-top: ${lastQTotHTML ? '10px' : '0'};">${lastPRotHTML}</div>`;
    resDiv.innerHTML = html;
}

function getValidQuaternions() {
    const rows = Array.from(document.querySelectorAll('.rot-seq-row'));
    const quaternions = [];
    const badRows = [];

    rows.forEach((row, index) => {
        const inputs = Array.from(row.querySelectorAll('input'));
        const isEmpty = inputs.every(i => i.value.trim() === '');

        if (!isEmpty) {
            const vals = inputs.map(i => i.value.replace(',', '.').trim());
            const nums = vals.map(v => Number(v) || 0);

            const hasInvalidText = vals.some(v => v !== '' && (isNaN(Number(v)) || v === '-'));
            const isZeroQuaternion = nums.reduce((a, b) => a + Math.abs(b), 0) === 0;

            if (hasInvalidText) badRows.push(index + 1);
            else if (!isZeroQuaternion) quaternions.push({ w: nums[0], x: nums[1], y: nums[2], z: nums[3] });
        }
    });
    return { quaternions, badRows };
}

function calculateQTot() {
    const { quaternions, badRows } = getValidQuaternions();

    if (badRows.length > 0) {
        const formattedNames = badRows.map(n => `q${n}`).join(', ');
        document.getElementById('qtot-result').innerHTML = `<span style="color:#ff5050;">${t('rot_err_invalid')} ${formattedNames}</span>`;
        return null;
    }

    if (quaternions.length === 0) {
        document.getElementById('qtot-result').innerHTML = `<span style="color:#ffaa00;">${t('rot_err_empty')}</span>`;
        return null;
    }

    let qTot = quaternions[0];
    for (let i = 1; i < quaternions.length; i++) {
        qTot = multiplyQuaternions(qTot, quaternions[i]);
    }
    return qTot;
}

// Nodi DOM a livello di modulo (Ondata 10.2)
let rotSidebarBtn, sidebar, listContainer, clearBtn, calcQtotBtn, calcProtBtn;

function fRes(num) {
    return parseFloat(num.toFixed(3));
}

// --- SOTTO-FUNZIONI ESTRATTE (Ondata 10.2) ---
function addEmptyRow() {
    sequenceCount++;
    const rowId = sequenceCount;

    const row = document.createElement('div');
    row.className = 'rot-seq-row';
    row.id = `rot-seq-row-${rowId}`;

    row.innerHTML = `
        <span class="rot-seq-label">q<sub>${rowId}</sub>=</span>
        <input type="text" class="q-w q-input-base rot-seq-input" placeholder="0" inputmode="none">
        <span class="rot-plus">+</span>
        <input type="text" class="q-x q-input-base rot-seq-input" placeholder="0" inputmode="none"><span class="rot-unit">i</span>
        <span class="rot-plus">+</span>
        <input type="text" class="q-y q-input-base rot-seq-input" placeholder="0" inputmode="none"><span class="rot-unit">j</span>
        <span class="rot-plus">+</span>
        <input type="text" class="q-z q-input-base rot-seq-input" placeholder="0" inputmode="none"><span class="rot-unit">k</span>
        <button class="row-action-btn row-action-btn-del" title="Azzera/Elimina"><svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:currentColor;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    `;

    const inputs = row.querySelectorAll('input');
    const isRowEmpty = (r) => Array.from(r.querySelectorAll('input')).every(i => i.value.trim() === '');
    const isRowNumeric = (r) => Array.from(r.querySelectorAll('input')).every(i => {
        const val = i.value.trim().replace(',', '.');
        return val === '' || /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(val);
    });
    const isRowZero = (r) => {
        const inputs = Array.from(r.querySelectorAll('input'));
        const hasContent = inputs.some(i => i.value.trim() !== '');
        const sumValues = inputs.reduce((acc, i) => acc + Math.abs(Number(i.value.replace(',', '.')) || 0), 0);
        return hasContent && sumValues === 0;
    };
    const isRowPerfect = (r) => !isRowEmpty(r) && isRowNumeric(r) && !isRowZero(r);

    const actionBtn = row.querySelector('.row-action-btn');
    const updateActionButton = () => {
        if (isRowEmpty(row)) {
            actionBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:currentColor;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
            actionBtn.title = 'Elimina';
            actionBtn.className = 'row-action-btn row-action-btn-del';
        } else {
            actionBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
            actionBtn.title = 'Azzera';
            actionBtn.className = 'row-action-btn row-action-btn-clear';
        }
    };
    updateActionButton();

    const maintainBuffer = () => {
        const allRows = Array.from(listContainer.querySelectorAll('.rot-seq-row'));
        const lastRow = allRows[allRows.length - 1];
        if (lastRow && isRowPerfect(lastRow)) {
            const hasEmptyPlaceholder = allRows.some(r => isRowEmpty(r));
            if (!hasEmptyPlaceholder) addEmptyRow();
        }
    };

    actionBtn.addEventListener('click', () => {
        if (isRowEmpty(row)) {
            row.remove();
            const allRows = Array.from(listContainer.querySelectorAll('.rot-seq-row'));
            allRows.forEach((r, idx) => {
                const label = r.querySelector('span');
                if (label) label.innerHTML = `q<sub>${idx + 1}</sub>=`;
                r.id = `rot-seq-row-${idx + 1}`;
            });
            sequenceCount = allRows.length;

            if (allRows.length === 0) addEmptyRow();
            else maintainBuffer();
            
            listContainer.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            inputs.forEach(i => { i.value = ''; i.classList.remove('input-invalid'); });
            updateActionButton();
            row.classList.add('row-empty');
            row.classList.remove('row-filled');
            maintainBuffer();
            listContainer.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(',', '.').trim();
            const isInvalid = val !== '' && !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(val);

            if (isInvalid) e.target.classList.add('input-invalid');
            else e.target.classList.remove('input-invalid');
            
            updateActionButton();

            if (isRowEmpty(row)) {
                row.classList.add('row-empty');
                row.classList.remove('row-filled');
            } else {
                row.classList.remove('row-empty');
                row.classList.add('row-filled');
            }
            maintainBuffer();
        });

        input.addEventListener('focus', () => {
            row.classList.remove('row-empty');
            row.classList.add('row-filled');
            maintainBuffer();

            const appDock = document.getElementById('app-dock');
            if (appDock && isMobile()) appDock.style.display = 'none';
        });

        input.addEventListener('blur', () => {
            const appDock = document.getElementById('app-dock');
            if (appDock && isMobile()) appDock.style.display = '';
            
            if (isRowEmpty(row)) {
                row.classList.add('row-empty');
                row.classList.remove('row-filled');
            }
        });
    });

    listContainer.appendChild(row);
    listContainer.scrollTop = listContainer.scrollHeight;
}

function addFixedQ0() {
    const row = document.createElement('div');
    row.className = 'q0-row';

    row.innerHTML = `
        <span class="q0-label">p<sub>0</sub>=</span>
        <div class="q0-spacer"></div> <span class="rot-plus rot-plus-hidden">+</span>
        <input type="text" class="q-x q-input-base q0-input" placeholder="0" inputmode="none" autocomplete="off"><span class="rot-unit">i</span>
        <span class="rot-plus">+</span>
        <input type="text" class="q-y q-input-base q0-input" placeholder="0" inputmode="none" autocomplete="off"><span class="rot-unit">j</span>
        <span class="rot-plus">+</span>
        <input type="text" class="q-z q-input-base q0-input" placeholder="0" inputmode="none" autocomplete="off"><span class="rot-unit">k</span>
        <button class="p0-action-btn row-action-btn-p0" title="Azzera"><svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
    `;

    const inputs = row.querySelectorAll('input');
    const p0Btn = row.querySelector('.p0-action-btn');
    p0Btn.addEventListener('click', () => {
        inputs.forEach(i => {
            i.value = '';
            i.classList.remove('input-invalid');
        });
        listContainer.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(',', '.').trim();
            const isInvalid = val !== '' && !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(val);

            if (isInvalid) e.target.classList.add('input-invalid');
            else e.target.classList.remove('input-invalid');
        });

        input.addEventListener('focus', () => {
            const appDock = document.getElementById('app-dock');
            if (appDock && isMobile()) appDock.style.display = 'none';
        });

        input.addEventListener('blur', () => {
            const appDock = document.getElementById('app-dock');
            if (appDock && isMobile()) appDock.style.display = '';
        });
    });

    listContainer.prepend(row);
}

function initSidebarButton() {
    if (!rotSidebarBtn) return;
    rotSidebarBtn.addEventListener('click', () => {
        const tabRot = document.getElementById('tab-btn-rotations');
        const isSidebarOpen = sidebar.classList.contains('open');
        const isTabActive = tabRot && tabRot.classList.contains('active');

        if (isSidebarOpen && isTabActive) {
            sidebar.classList.remove('open');
            sidebar.style.width = '';
        } else {
            if (tabRot) tabRot.click();
            if (!isSidebarOpen) {
                sidebar.style.width = isMobile() ? '100%' : '350px';
                sidebar.classList.add('open');
            }
        }
    });

    const syncBtnState = () => {
        const tabRot = document.getElementById('tab-btn-rotations');
        const isSidebarOpen = sidebar.classList.contains('open');
        const isTabActive = tabRot && tabRot.classList.contains('active');
        if (isSidebarOpen && isTabActive) {
            rotSidebarBtn.classList.add('active');
        } else {
            rotSidebarBtn.classList.remove('active');
        }
    };

    const observer = new MutationObserver(syncBtnState);
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    const tabRot = document.getElementById('tab-btn-rotations');
    if (tabRot) observer.observe(tabRot, { attributes: true, attributeFilter: ['class'] });
}

function initKeyboardNavigation() {
    if (!listContainer) return;
    listContainer.addEventListener('keydown', (e) => {
        if (e.target.tagName !== 'INPUT') return;

        const currentRow = e.target.closest('.rot-seq-row, .q0-row');
        if (!currentRow) return;

        const allRows = Array.from(document.querySelectorAll('.q0-row, .rot-seq-row'));
        const rowIndex = allRows.indexOf(currentRow);
        const inputsInRow = Array.from(currentRow.querySelectorAll('input'));
        const inputIndex = inputsInRow.indexOf(e.target);

        let destInput = null;

        if (e.key === 'ArrowRight') {
            if (e.target.selectionStart === e.target.value.length) {
                if (inputIndex < inputsInRow.length - 1) destInput = inputsInRow[inputIndex + 1];
            }
        } else if (e.key === 'ArrowLeft') {
            if (e.target.selectionStart === 0) {
                if (inputIndex > 0) destInput = inputsInRow[inputIndex - 1];
            }
        } else if (e.key === 'ArrowDown') {
            if (rowIndex < allRows.length - 1) {
                const targetRow = allRows[rowIndex + 1];
                const targetInputs = targetRow.querySelectorAll('input');
                let targetIndex = inputIndex;
                if (currentRow.classList.contains('q0-row') && targetRow.classList.contains('rot-seq-row')) {
                    targetIndex = inputIndex + 1;
                }
                if (targetIndex < targetInputs.length) destInput = targetInputs[targetIndex];
            }
        } else if (e.key === 'ArrowUp') {
            if (rowIndex > 0) {
                const targetRow = allRows[rowIndex - 1];
                const targetInputs = targetRow.querySelectorAll('input');
                let targetIndex = inputIndex;
                if (currentRow.classList.contains('rot-seq-row') && targetRow.classList.contains('q0-row')) {
                    targetIndex = inputIndex > 0 ? inputIndex - 1 : 0;
                }
                if (targetIndex < targetInputs.length) destInput = targetInputs[targetIndex];
            }
        }

        if (destInput) {
            e.preventDefault();
            destInput.focus();
            destInput.select();
        }
    });
}

function initCalculateButtons() {
    if (calcQtotBtn) {
        calcQtotBtn.addEventListener('click', () => {
            const qTot = calculateQTot();
            if (!qTot) {
                lastQTotHTML = "";
                updateResultDisplay();
                return;
            }
            lastQTotHTML = `
                <span style="color:#00aaff; font-weight:bold;">q<sub>tot</sub></span> = 
                ${fRes(qTot.w)} ${qTot.x >= 0 ? '+' : ''}${fRes(qTot.x)}i ${qTot.y >= 0 ? '+' : ''}${fRes(qTot.y)}j ${qTot.z >= 0 ? '+' : ''}${fRes(qTot.z)}k
            `;
            updateResultDisplay();
        });
    }

    if (calcProtBtn) {
        calcProtBtn.addEventListener('click', () => {
            const qTot = calculateQTot();
            if (!qTot) {
                lastPRotHTML = "";
                updateResultDisplay();
                return;
            }
            const q0Row = document.querySelector('.q0-row');
            const p0 = {
                w: 0,
                x: Number(q0Row.querySelector('.q-x').value.replace(',', '.')) || 0,
                y: Number(q0Row.querySelector('.q-y').value.replace(',', '.')) || 0,
                z: Number(q0Row.querySelector('.q-z').value.replace(',', '.')) || 0
            };
            const qInv = invertQuaternion(qTot);
            const temp = multiplyQuaternions(qTot, p0);
            const pRot = multiplyQuaternions(temp, qInv);
            lastPRotHTML = `
                <span style="color:#ffcc00; font-weight:bold;">p<sub>rot</sub></span> = 
                ${fRes(pRot.x)}i 
                ${pRot.y >= 0 ? '+' : ''}${fRes(pRot.y)}j 
                ${pRot.z >= 0 ? '+' : ''}${fRes(pRot.z)}k
            `;
            updateResultDisplay();
        });
    }
}

export function initRotationSequence() {
    rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    sidebar = document.getElementById('sidebar');
    listContainer = document.getElementById('rot-sequence-list');
    clearBtn = document.getElementById('rot-seq-clear');
    calcQtotBtn = document.getElementById('calc-qtot-btn');
    calcProtBtn = document.getElementById('calc-prot-btn');

    initSidebarButton();
    initKeyboardNavigation();
    
    addFixedQ0();
    addEmptyRow();

    const syncCalcButtons = () => {
        const { quaternions, badRows } = getValidQuaternions();
        const isValid = quaternions.length > 0 && badRows.length === 0;
        if (calcQtotBtn) {
            calcQtotBtn.style.opacity = isValid ? "1" : "0.3";
            calcQtotBtn.style.pointerEvents = isValid ? "auto" : "none";
        }
        if (calcProtBtn) {
            calcProtBtn.style.opacity = isValid ? "1" : "0.3";
            calcProtBtn.style.pointerEvents = isValid ? "auto" : "none";
        }
    };

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            listContainer.innerHTML = '';
            document.getElementById('qtot-result').innerHTML = '';
            lastQTotHTML = "";
            lastPRotHTML = "";
            sequenceCount = 0;
            addFixedQ0();
            addEmptyRow();
            syncCalcButtons();
        });
    }

    if (listContainer) {
        listContainer.addEventListener('input', () => {
            lastQTotHTML = "";
            lastPRotHTML = "";
            document.getElementById('qtot-result').innerHTML = "";
            syncCalcButtons();
        });
    }

    initCalculateButtons();
    syncCalcButtons(); // Inizializza lo stato corretto all'avvio
}