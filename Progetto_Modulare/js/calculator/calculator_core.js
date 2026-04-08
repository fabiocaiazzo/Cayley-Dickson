import { storedVars, storedAns, evaluateExpression, validateAssociativity } from '../parser.js';
import { currentVar, saveVar, setGrid, updateVarIndicators } from './calculator_ui.js';
import { t } from '../i18n.js';

const exprDisplay = document.getElementById('expression-display');

// Listener per calcolo in tempo reale durante la digitazione
if (exprDisplay) {
    exprDisplay.addEventListener('input', () => {
        window.calculateRealTime();
    });

    // Gestione tasto Invio per la calcolatrice
    exprDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.calcAction('eval');
        }
    });
}

/**
 * Nuova funzione Core per il calcolo in tempo reale.
 * Intercetta errori specifici: Bilanciamento Parentesi, Divisione per 0, Ambiguità.
 */
window.calculateRealTime = function () {
    const disp = document.getElementById('expression-display');
    let val = disp.value.trim();

    // NUOVA LOGICA AVANZATA: Tracciamento posizionale dei rand()
    const rawVal = disp.value;
    const currentMatches = [...rawVal.matchAll(/rand\s*\([^)]*\)/gi)];
    const cursor = disp.selectionStart;

    if (!window.lastRandMatches) window.lastRandMatches = [];
    if (window.lastRawVal === undefined) window.lastRawVal = "";

    for (let i = 0; i < window.lastRandMatches.length; i++) {
        if (window.randCache && window.randCache[i]) {
            window.lastRandMatches[i].val = window.randCache[i];
        }
    }

    const diff = rawVal.length - window.lastRawVal.length;
    let newCache = [];

    for (let i = 0; i < currentMatches.length; i++) {
        const cMatch = currentMatches[i];
        let bestMatchIdx = -1;
        let bestDist = Infinity;

        for (let j = 0; j < window.lastRandMatches.length; j++) {
            const lMatch = window.lastRandMatches[j];
            if (!lMatch || lMatch.str !== cMatch[0]) continue;

            if (diff < 0 && lMatch.index >= cursor && lMatch.index < cursor - diff) continue;

            let expectedIdx = lMatch.index;
            if (lMatch.index >= cursor) expectedIdx += diff; 

            const dist = Math.abs(cMatch.index - expectedIdx);
            if (dist < bestDist) {
                bestDist = dist;
                bestMatchIdx = j;
            }
        }

        if (bestMatchIdx !== -1 && bestDist <= Math.abs(diff) + 5) {
            newCache[i] = window.lastRandMatches[bestMatchIdx].val;
            window.lastRandMatches[bestMatchIdx] = null; 
        }
    }

    window.randCache = newCache;
    window.lastRandMatches = currentMatches.map(m => ({ str: m[0], index: m.index }));
    window.lastRawVal = rawVal;

    window.randCacheIndex = 0; 
    const resDisp = document.getElementById('result-display');

    if (!val) {
        resDisp.innerText = '0';
        resDisp.style.color = '#0f0';
        return null;
    }

    if (val.includes('=?') || val.includes('?=')) return null;
    if (val.includes('==')) return null;

    if (val.includes('=')) {
        const assignMatch = val.match(/^([abcd])\s*=(?!=)(.*)/);
        if (assignMatch && assignMatch[2].trim() !== '') {
            val = assignMatch[2].trim();
        } else {
            return null;
        }
    }

    if (val.toLowerCase().includes('ker(')) {
        try {
            const kerMatch = val.match(/^\s*ker\((.*)\)\s*$/i);
            if (!kerMatch) {
                resDisp.innerHTML = t('err_syn_ker');
                resDisp.style.color = "#ffaa00";
                return null;
            }
            let inner = kerMatch[1].trim();
            if (!inner) {
                resDisp.innerHTML = t('msg_await_expr');
                resDisp.style.color = "#aaa";
                return null;
            }
            let expr = window.preprocessExpr(inner);
            evaluateExpression(expr, false);
            resDisp.innerHTML = t('msg_press_eq_ker');
            resDisp.style.color = "#00ffaa";
            return null;
        } catch (e) {
            resDisp.innerHTML = "Err";
            resDisp.style.color = "#ff5555";
            return null;
        }
    }

    let checkVal = val.replace(/\[/g, '(').replace(/\]/g, ')');
    const openP = (checkVal.match(/\(/g) || []).length;
    const closeP = (checkVal.match(/\)/g) || []).length;

    if (openP !== closeP) {
        resDisp.innerHTML = t('err_unbal_paren');
        resDisp.style.color = "#ffaa00"; 
        return null;
    }

    val = window.preprocessExpr(val);

    try {
        validateAssociativity(val);
        const res = evaluateExpression(val, false);
        const resString = window.formatVecGlobal(res);

        resDisp.innerHTML = resString;
        resDisp.style.color = "#0f0"; 
        return res;

    } catch (e) {
        let errStr = e.toString();
        let msg = "Err";
        let color = "#ff5555"; 

        if (errStr.includes("Division") || errStr.includes("Divisione")) {
            msg = t('err_div_zero');
        }
        else if (errStr.includes("reale") || errStr.includes("Real")) {
            msg = t('err_exp_real');
            color = "#ffaa00"; 
        }
        else if (errStr.includes("intero") || errStr.includes("Integer")) {
            msg = t('err_exp_int');
            color = "#ffaa00"; 
        }
        else if (errStr.includes("ambigua") || errStr.includes("associativa") || errStr.includes("Ambiguous")) {
            msg = t('err_ambiguous');
            color = "#ffaa00"; 
        }
        else if (errStr.includes("Sintassi") || errStr.includes("Token") || errStr.includes("Simbolo") || errStr.includes("Syntax") || errStr.includes("Unknown")) {
            msg = "...";
            color = "#666"; 
        }
        else {
            msg = t('err_calc');
        }

        resDisp.innerHTML = msg;
        resDisp.style.color = color;
        return null;
    }
};

window.calcAction = function (action) {
    const disp = document.getElementById('expression-display');
    const resDisp = document.getElementById('result-display');

    if (action === 'clear') {
        window.randCache = []; 
        disp.value = '';
        resDisp.innerText = '0';
        resDisp.style.color = '#0f0';
        disp.focus();
        disp.dispatchEvent(new Event('input')); 
    }

    if (action === 'back') {
        const start = disp.selectionStart;
        const end = disp.selectionEnd;
        const text = disp.value;

        if (start !== end) {
            disp.value = text.substring(0, start) + text.substring(end);
            disp.setSelectionRange(start, start);
        } else if (start > 0) {
            disp.value = text.substring(0, start - 1) + text.substring(end);
            disp.setSelectionRange(start - 1, start - 1);
        }
        disp.focus();
        disp.dispatchEvent(new Event('input')); 
    }

    if (action === 'eval') {
        const kOverlay = document.getElementById('kernel-overlay');
        if (kOverlay) kOverlay.style.display = 'none';

        saveVar(currentVar); 

        let val = disp.value.trim();

        if (val.includes('=?') || val.includes('?=') || val.includes('==')) {
            try {
                let parts = val.split(/\s*=\?|\s*\?=\s*|\s*==\s*/);
                if (parts.length === 2) {
                    window.randCacheIndex = 0;
                    const process = (v) => window.preprocessExpr(v);
                    const res1 = evaluateExpression(process(parts[0]));
                    const res2 = evaluateExpression(process(parts[1]));
                    const isEqual = res1.every((val, i) => Math.abs(val - res2[i]) < 1e-9);
                    resDisp.innerHTML = isEqual ? "<span style='color:#0f0'>TRUE</span>" : "<span style='color:#f00'>FALSE</span>";
                    window.randCache = []; 
                }
            } catch (e) { resDisp.innerText = "Err"; }
            return;
        }

        if (val.toLowerCase().includes('ker(')) {
            try {
                const kerMatch = val.match(/^\s*ker\((.*)\)\s*$/i);
                if (!kerMatch) throw t('err_syn_ker');
                let inner = kerMatch[1].trim();
                if (!inner) throw t('err_expr_empty');

                window.randCacheIndex = 0;
                let expr = window.preprocessExpr(inner);

                const resVector = evaluateExpression(expr);
                if(typeof window.openKernelUI === 'function') window.openKernelUI(resVector, inner);
                resDisp.innerHTML = t('msg_ker_calc');
                window.randCache = []; 
            } catch (e) { resDisp.innerHTML = "Err"; resDisp.style.color = "#f55"; }
            return;
        }

        const assignMatch = val.match(/^([abcd])\s*=(?!=)(.+)/);
        if (assignMatch) {
            try {
                const targetAssign = assignMatch[1];
                let expr = assignMatch[2];
                expr = window.preprocessExpr(expr);

                const res = evaluateExpression(expr);
                storedVars[targetAssign] = res;
                if (currentVar === targetAssign) setGrid(res);
                updateVarIndicators();

                // 1. Svuota l'input e resetta lo stato del motore real-time
                disp.value = '';
                disp.dispatchEvent(new Event('input')); 

                // 2. Visualizza il risultato dell'assegnazione DOPO il reset
                const resString = window.formatVecGlobal(res);
                resDisp.innerHTML = `<b>${targetAssign}</b> = ${resString}`;
                resDisp.style.color = "#0f0"; // Forza il colore verde successo
                
                window.randCache = []; 
            } catch (e) { alert(t('err_assign') + e); }
            return;
        }

        const res = window.calculateRealTime();

        if (res) {
            const ansId = storedAns.length + 1;
            storedAns.push(res);
            const resString = window.formatVecGlobal(res);

            const log = document.getElementById('calc-log');
            if (log && log.children.length === 1 && log.children[0].innerText.includes('Nessun')) log.innerHTML = '';

            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `<div class="log-expr">Ans${ansId}: ${disp.value}</div><div class="log-res">= ${resString}</div>`;
            entry.addEventListener('click', () => {
                const input = document.getElementById('expression-display');
                const vStr = `Ans${ansId}`;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = input.value.substring(0, start) + vStr + input.value.substring(end);
                
                // Chiusura menu cronologia isolata
                const hOverlay = document.getElementById('history-overlay');
                const hBtn = document.getElementById('toggle-history-btn');
                if (hOverlay) hOverlay.classList.remove('open');
                if (hBtn) {
                    hBtn.classList.remove('active');
                    hBtn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`;
                }
                
                input.focus();
                window.calculateRealTime(); 
            });
            if (log) log.prepend(entry);

            window.randCache = []; 
        } else {
            if (resDisp.innerText === "" || resDisp.innerText === "0") {
                resDisp.innerText = "Err";
                resDisp.style.color = '#f55';
            }
        }
    }
};

const btnClearLog = document.getElementById('btn-clear-log');
if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
        const log = document.getElementById('calc-log');
        if(log) log.innerHTML = `<div style="text-align:center; color:#555; margin-top:20px; font-size:12px;">${t('msg_no_calc')}</div>`;
        storedAns.length = 0; 
    });
}