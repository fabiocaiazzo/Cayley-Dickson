import { EPSILON, storedVars, createZeroVector, formatVec } from '../math/parser.js';
import { currentVar, setGrid, updateVarIndicators } from './calculator_ui.js';
import { vecAdd, vecSub, vecMul, vecInv, vecNorm, vecConj, vecScale, vecPow, vecDot, vecComm, vecAssoc, createBaseVec, createRandomVec, computeKernelBasis } from '../math/algebra.js';
import { calculateRealTime } from './calculator_core.js';
import { t } from '../core/i18n.js';
import { CalcBridge } from './calculator_popout.js';

// --- RISOLUTORE DEL KERNEL (ANNICHILATORI DI A) CON UI INTERATTIVA ---
let currentKernelBasis = []; // Variabile globale per memorizzare la base corrente

// Setup pulsante chiusura pannello kernel
const closeKBtn = CalcBridge.getElementById('close-kernel-ui');
if (closeKBtn) {
    closeKBtn.addEventListener('click', () => {
        CalcBridge.getElementById('kernel-overlay').style.display = 'none';
    });
}

export let currentKernelVector = null;

export function saveKernelToVar(varName) {
    if (!currentKernelVector) return;
    storedVars[varName] = [...currentKernelVector];
    if (currentVar === varName) setGrid(storedVars[varName]);
    updateVarIndicators();
    
    calculateRealTime();

    const confirmSpan = CalcBridge.getElementById('kernel-save-confirm');
    if (confirmSpan) {
        confirmSpan.style.display = 'inline';
        setTimeout(() => { confirmSpan.style.display = 'none'; }, 1500);
    }
}

// Binda i tasti di salvataggio del Kernel
setTimeout(() => {
    const doc = CalcBridge;
    doc.querySelectorAll('.btn-save-ker').forEach(btn => {
        btn.addEventListener('click', (e) => {
            saveKernelToVar(e.target.dataset.var);
        });
    });
}, 500);

export function openKernelUI(A, originalExpr = 'a') {
    // Validazione: controlla che il vettore inserito non sia composto da soli zeri
    if (vecNorm(A) < EPSILON) {
        alert(t('err_null_expr'));
        return;
    }

    // Mostriamo l'overlay indipendente
    CalcBridge.getElementById('kernel-overlay').style.display = 'flex';

    // Calcola la base dello spazio nullo usando la funzione centralizzata in algebra.js
    const basis = typeof computeKernelBasis !== 'undefined' ? computeKernelBasis(A) : [];

    const inputsContainer = CalcBridge.getElementById('kernel-inputs-container');
    const formulaLbl = CalcBridge.getElementById('kernel-formula-display');

    if (basis.length === 0) {
        inputsContainer.innerHTML = '';
        formulaLbl.innerHTML = t('kn_empty');
        CalcBridge.getElementById('kernel-result-display').innerHTML = "0";
    } else {
        currentKernelBasis = basis; // Salva globalmente

        // --- SETUP UI INTERATTIVA ---
        inputsContainer.innerHTML = '';

        // Crea stringa formula (q1*t1 + q2*t2 ...)
        let formulaHTML = "v = ";

        // Genera Input Verdi
        basis.forEach((vec, idx) => {
            // 1. Aggiorna Label Formula
            let vShort = formatVec(vec);

            if (idx > 0) formulaHTML += " + ";
            formulaHTML += `(<span style="color:#aaa;">${vShort}</span>)t<sub>${idx + 1}</sub>`;

            // 2. Crea Gruppo Input
            const wrapper = document.createElement('div');
            wrapper.className = 'input-group';
            wrapper.style.borderColor = '#00ff00'; // Bordo Verde
            wrapper.style.background = 'rgba(0, 50, 0, 0.5)';

            // Genera valore random iniziale per il parametro t
            const randVal = Math.floor(Math.random() * 5) + 1; // 1 to 5

            wrapper.innerHTML = `
                            <span style="font-size:10px; color:#00ff00; width:20px; text-align:center;">t<sub>${idx + 1}</sub></span>
                            <input class="num-input kernel-param" data-idx="${idx}" value="${randVal}" 
                                   style="color:#00ffaa; text-shadow:0 0 5px rgba(0,255,170,0.5);">
                        `;
            inputsContainer.appendChild(wrapper);
        });

        formulaLbl.innerHTML = formulaHTML;

        // Listener per aggiornamento real-time
        const updateBFromKernel = () => {
            const params = document.querySelectorAll('.kernel-param');
            const finalV = createZeroVector();

            params.forEach(inp => {
                const kIdx = parseInt(inp.dataset.idx);
                const tVal = parseFloat(inp.value) || 0;
                const basisVec = currentKernelBasis[kIdx];

                // v += t * basisVec
                for (let i = 0; i < 32; i++) {
                    finalV[i] += basisVec[i] * tVal;
                }
            });

            // Aggiorna solo il display visivo del Kernel
            CalcBridge.getElementById('kernel-result-display').innerHTML = formatVec(finalV);
            currentKernelVector = [...finalV];
        };

        // Attacca listener
        inputsContainer.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', updateBFromKernel);
            // Supporto frecce su/giù per modificare valore
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    let v = parseFloat(e.target.value) || 0;
                    v += (e.key === 'ArrowUp' ? 1 : -1);
                    e.target.value = v;
                    updateBFromKernel();
                }
            });
        });

        // Esegui primo calcolo
        updateBFromKernel();
    }
};