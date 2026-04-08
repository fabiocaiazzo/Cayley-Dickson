import { storedVars } from '../parser.js';
import { currentVar, setGrid, updateVarIndicators } from './calculator_ui.js';
import { t } from '../i18n.js';

// --- RISOLUTORE DEL KERNEL (ANNICHILATORI DI A) CON UI INTERATTIVA ---
let currentKernelBasis = []; // Variabile globale per memorizzare la base corrente

// Setup pulsante chiusura pannello kernel
const closeKBtn = document.getElementById('close-kernel-ui');
if (closeKBtn) {
    closeKBtn.addEventListener('click', () => {
        document.getElementById('kernel-overlay').style.display = 'none';
    });
}

window.currentKernelVector = null;
window.saveKernelToVar = function (varName) {
    if (!window.currentKernelVector) return;
    storedVars[varName] = [...window.currentKernelVector];
    if (currentVar === varName) setGrid(storedVars[varName]);
    updateVarIndicators();

    const confirmSpan = document.getElementById('kernel-save-confirm');
    if (confirmSpan) {
        confirmSpan.style.display = 'inline';
        setTimeout(() => { confirmSpan.style.display = 'none'; }, 1500);
    }
};

window.openKernelUI = function (A, originalExpr = 'a') {
    // Si aspetta che vecNormSq, vecMul e formatVecGlobal siano accessibili globalmente 
    if (typeof vecNormSq !== 'undefined' && vecNormSq(A) < 1e-9) {
        alert(t('err_null_expr'));
        return;
    }

    // Mostriamo l'overlay indipendente
    document.getElementById('kernel-overlay').style.display = 'flex';

    // 1. Costruisce la matrice 16x16 L_A (moltiplicazione sinistra per A)
    const M = Array.from({ length: 16 }, () => new Array(16).fill(0));
    for (let j = 0; j < 16; j++) {
        const ej = new Array(16).fill(0);
        ej[j] = 1;
        const prod = typeof vecMul !== 'undefined' ? vecMul(A, ej) : new Array(16).fill(0);
        for (let i = 0; i < 16; i++) {
            M[i][j] = prod[i];
        }
    }

    // 2. Riduzione a gradini (Gauss-Jordan)
    let lead = 0;
    const pivotCols = [];
    for (let r = 0; r < 16; r++) {
        if (16 <= lead) break;
        let i = r;
        while (Math.abs(M[i][lead]) < 1e-9) {
            i++;
            if (16 === i) {
                i = r;
                lead++;
                if (16 === lead) break;
            }
        }
        if (16 <= lead) break;

        const temp = M[i];
        M[i] = M[r];
        M[r] = temp;
        pivotCols.push(lead);

        const lv = M[r][lead];
        for (let j = 0; j < 16; j++) M[r][j] /= lv;

        for (let k = 0; k < 16; k++) {
            if (k !== r) {
                const lv2 = M[k][lead];
                for (let j = 0; j < 16; j++) M[k][j] -= lv2 * M[r][j];
            }
        }
        lead++;
    }

    // 3. Estrazione Base Spazio Nullo (Con normalizzazione a interi)
    const basis = [];
    for (let c = 0; c < 16; c++) {
        if (!pivotCols.includes(c)) {
            const v = new Array(16).fill(0);
            v[c] = 1; // Variabile libera impostata a 1

            // Calcola componenti grezze
            for (let j = 0; j < pivotCols.length; j++) {
                v[pivotCols[j]] = -M[j][c]; // Manteniamo la precisione float qui
            }

            // --- RICERCA INTERI (Moltiplica per il denominatore comune) ---
            // Cerchiamo un moltiplicatore 'd' (da 1 a 10000) che renda tutti i numeri del vettore interi
            let bestScale = 1;
            let foundInt = false;
            for (let d = 1; d <= 10000; d++) {
                let allIntegers = true;
                for (let k = 0; k < 16; k++) {
                    if (Math.abs(v[k]) < 1e-9) continue; // Ignora zeri
                    const val = v[k] * d;
                    // Se la distanza dall'intero più vicino è troppo grande, scarta questo 'd'
                    if (Math.abs(val - Math.round(val)) > 1e-4) {
                        allIntegers = false;
                        break;
                    }
                }
                if (allIntegers) {
                    bestScale = d;
                    foundInt = true;
                    break;
                }
            }

            // Applica la scala e arrotonda SOLO se ha trovato un intero, altrimenti lascia i float
            for (let k = 0; k < 16; k++) {
                if (foundInt) {
                    v[k] = Math.round(v[k] * bestScale);
                }
                // Fix per pulire imperfezioni vicinissime allo zero o "-0" fastidiosi
                if (Math.abs(v[k]) < 1e-9) v[k] = 0;
            }

            basis.push(v);
        }
    }

    const inputsContainer = document.getElementById('kernel-inputs-container');
    const formulaLbl = document.getElementById('kernel-formula-display');

    if (basis.length === 0) {
        inputsContainer.innerHTML = '';
        formulaLbl.innerHTML = t('kn_empty');
        document.getElementById('kernel-result-display').innerHTML = "0";
    } else {
        currentKernelBasis = basis; // Salva globalmente

        // --- SETUP UI INTERATTIVA ---
        inputsContainer.innerHTML = '';

        // Crea stringa formula (q1*t1 + q2*t2 ...)
        let formulaHTML = "v = ";

        // Genera Input Verdi
        basis.forEach((vec, idx) => {
            // 1. Aggiorna Label Formula
            let vShort = typeof window.formatVecGlobal !== 'undefined' ? window.formatVecGlobal(vec) : "v";

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
            const finalV = new Array(16).fill(0);

            params.forEach(inp => {
                const kIdx = parseInt(inp.dataset.idx);
                const tVal = parseFloat(inp.value) || 0;
                const basisVec = currentKernelBasis[kIdx];

                // v += t * basisVec
                for (let i = 0; i < 16; i++) {
                    finalV[i] += basisVec[i] * tVal;
                }
            });

            // Aggiorna solo il display visivo del Kernel
            document.getElementById('kernel-result-display').innerHTML = typeof window.formatVecGlobal !== 'undefined' ? window.formatVecGlobal(finalV) : finalV.join(', ');
            window.currentKernelVector = [...finalV];
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