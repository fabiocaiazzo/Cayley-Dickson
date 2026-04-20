import { EPSILON, storedVars, storedAns, evaluateExpression, validateAssociativity, preprocessExpr, formatVec } from '../math/parser.js';
import { resetRandCache, getRandCache, setRandCache, clearRandCache } from '../math/algebra.js';

let lastRandMatches = [];
let lastRawVal = "";
import { currentVar, saveVar, setGrid, updateVarIndicators } from './calculator_ui.js';
import { t } from '../core/i18n.js';
import { CalcBridge } from './calculator_popout.js';
import { openKernelUI } from './calculator_kernel.js';
import { calcInput } from './calculator_input.js';

const exprDisplay = CalcBridge.getElementById('expression-display');

// Listener per calcolo in tempo reale durante la digitazione
if (exprDisplay) {
    exprDisplay.addEventListener('input', () => {
        calculateRealTime();
    });

    // Gestione tasto Invio per la calcolatrice
    exprDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calcAction('eval');
        }
    });
}

// Funzione centralizzata per l'auto-chiusura delle parentesi
export function autoCloseBrackets(val) {
    let stack = [];
    let fixedVal = "";
    const openPairs = { '(': ')', '[': ']', '<': '>' };

    for (let i = 0; i < val.length; i++) {
        let char = val[i];
        if (openPairs[char]) {
            stack.push(openPairs[char]);
            fixedVal += char;
        } else if (char === ')' || char === ']' || char === '>') {
            let idx = stack.lastIndexOf(char);
            if (idx !== -1) {
                while (stack.length > idx + 1) {
                    fixedVal += stack.pop();
                }
                stack.pop();
                fixedVal += char;
            } else {
                fixedVal += char;
            }
        } else {
            fixedVal += char;
        }
    }

    let hasMissingParen = stack.length > 0;

    while (stack.length > 0) {
        fixedVal += stack.pop();
    }

    return { fixedVal, hasMissingParen };
}

// Funzione centralizzata per la verifica delle uguaglianze (=?, ==, ecc.)
function handleEqualityCheck(val, resDisp, isRealTime) {
    const eqMatches = val.match(/==|=\?|\?=|=(?!=)/g) || [];
    if (eqMatches.length > 1) {
        resDisp.innerHTML = "Err: serve solo un LHS e un RHS";
        resDisp.style.color = "#ffaa00";
        return true;
    }

    const isAssignRt = /^([abcd])\s*=(?!=)/.test(val);
    const hasEq = isRealTime ?
        (val.includes('=?') || val.includes('?=') || val.includes('==') || (val.includes('=') && !isAssignRt)) :
        (val.includes('=?') || val.includes('?=') || val.includes('=='));

    if (!hasEq) return false;

    try {
        const splitRegex = isRealTime ? /\s*=\?|\s*\?=\s*|\s*==\s*|\s*=(?!=)\s*/ : /\s*=\?|\s*\?=\s*|\s*==\s*/;
        let parts = val.split(splitRegex);

        if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
            resetRandCache();
            const process = (v) => preprocessExpr(v);
            const res1 = evaluateExpression(process(parts[0]));
            const res2 = evaluateExpression(process(parts[1]));
            const isEqual = res1.every((v, i) => Math.abs(v - res2[i]) < EPSILON);

            resDisp.innerHTML = isEqual ? "<span style='color:#0f0'>TRUE</span>" : "<span style='color:#f00'>FALSE</span>";
            if (!isRealTime) clearRandCache();
            return true;
        } else {
            resDisp.innerHTML = isRealTime ? "..." : "Err: serve solo un LHS e un RHS";
            resDisp.style.color = isRealTime ? "#666" : "#ffaa00";
            return true;
        }
    } catch (e) {
        resDisp.innerHTML = isRealTime ? "..." : "Err";
        resDisp.style.color = isRealTime ? "#666" : "#f55";
        return true;
    }
}

/**
 * Nuova funzione Core per il calcolo in tempo reale.
 * Intercetta errori specifici: Bilanciamento Parentesi, Divisione per 0, Ambiguità.
 */
export function calculateRealTime() {
    const disp = CalcBridge.getElementById('expression-display');
    let val = disp.value.trim();

    // NUOVA LOGICA AVANZATA: Tracciamento posizionale dei rand()
    const rawVal = disp.value;
    const currentMatches = [...rawVal.matchAll(/rand\s*\([^)]*\)/gi)];
    const cursor = disp.selectionStart;

    const currentCache = getRandCache();

    for (let i = 0; i < lastRandMatches.length; i++) {
        if (currentCache && currentCache[i]) {
            lastRandMatches[i].val = currentCache[i];
        }
    }

    const diff = rawVal.length - lastRawVal.length;
    let newCache = [];

    for (let i = 0; i < currentMatches.length; i++) {
        const cMatch = currentMatches[i];
        let bestMatchIdx = -1;
        let bestDist = Infinity;

        for (let j = 0; j < lastRandMatches.length; j++) {
            const lMatch = lastRandMatches[j];
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
            newCache[i] = lastRandMatches[bestMatchIdx].val;
            lastRandMatches[bestMatchIdx] = null;
        }
    }

    setRandCache(newCache);
    lastRandMatches = currentMatches.map(m => ({ str: m[0], index: m.index }));
    lastRawVal = rawVal;

    resetRandCache();
    const resDisp = CalcBridge.getElementById('result-display');

    if (!val) {
        resDisp.innerText = '0';
        resDisp.style.color = '#0f0';
        return null;
    }

    // AUTO-CHIUSURA INTELLIGENTE PARENTESI (Centralizzata) SPOSTATA QUI
    const bracketResult = autoCloseBrackets(val);
    val = bracketResult.fixedVal;
    let hasMissingParen = bracketResult.hasMissingParen;

    if (handleEqualityCheck(val, resDisp, true)) return null;

    if (val.includes('=')) {
        const assignMatch = val.match(/^([abcd])\s*=(?!=)(.*)/);
        if (assignMatch && assignMatch[2].trim() !== '') {
            val = assignMatch[2].trim();
        } else {
            resDisp.innerHTML = "...";
            resDisp.style.color = "#666";
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
            let expr = preprocessExpr(inner);
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

    let checkVal = val.replace(/\[/g, '(').replace(/\]/g, ')').replace(/</g, '(').replace(/>/g, ')');
    const openP = (checkVal.match(/\(/g) || []).length;
    const closeP = (checkVal.match(/\)/g) || []).length;

    // L'errore scatterà solo se ci sono troppe parentesi chiuse (es. "5+3)")
    if (openP !== closeP) {
        resDisp.innerHTML = t('err_unbal_paren');
        resDisp.style.color = "#ffaa00";
        return null;
    }

    val = preprocessExpr(val);

    try {
        validateAssociativity(val);
        const res = evaluateExpression(val, false);
        const resString = formatVec(res);

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
        else if (errStr.includes("rand") || errStr.includes("e_() accetta")) {
            msg = errStr.replace("Error: ", ""); // Rimuove il prefisso JS se presente
            color = "#ffaa00";
        }
        else if (errStr.includes("Sintassi") || errStr.includes("Token") || errStr.includes("Simbolo") || errStr.includes("Syntax") || errStr.includes("Unknown")) {
            msg = "...";
            color = "#666";
        }
        else {
            // Se c'è una parentesi non chiusa o se l'espressione finisce con un operatore aperto, nasconde l'errore grave
            if (hasMissingParen || /[+\-*/\^,\(\[\<]\s*$/.test(rawVal)) {
                msg = "...";
                color = "#666";
            } else {
                msg = t('err_calc');
            }
        }

        resDisp.innerHTML = msg;
        resDisp.style.color = color;
        return null;
    }
};

export function calcAction(action, skipHistory = false) {
    const disp = CalcBridge.getElementById('expression-display');
    const resDisp = CalcBridge.getElementById('result-display');

    if (action === 'clear') {
        clearRandCache();
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
        const kOverlay = CalcBridge.getElementById('kernel-overlay');
        if (kOverlay) kOverlay.style.display = 'none';

        saveVar(currentVar);

        let val = disp.value.trim();

        // AUTO-CHIUSURA INTELLIGENTE PARENTESI (Centralizzata)
        const bracketResult = autoCloseBrackets(val);
        if (bracketResult.fixedVal !== val) {
            val = bracketResult.fixedVal;
            disp.value = val;
            disp.dispatchEvent(new Event('input'));
        }

        if (handleEqualityCheck(val, resDisp, false)) return;

        if (val.toLowerCase().includes('ker(')) {
            try {
                const kerMatch = val.match(/^\s*ker\((.*)\)\s*$/i);
                if (!kerMatch) throw t('err_syn_ker');
                let inner = kerMatch[1].trim();
                if (!inner) throw t('err_expr_empty');

                resetRandCache();
                let expr = preprocessExpr(inner);

                const resVector = evaluateExpression(expr);
                openKernelUI(resVector, inner);
                resDisp.innerHTML = t('msg_ker_calc');
                clearRandCache();
            } catch (e) { resDisp.innerHTML = "Err"; resDisp.style.color = "#f55"; }
            return;
        }

        const assignMatch = val.match(/^([abcd])\s*=(?!=)(.+)/);
        if (assignMatch) {
            try {
                const targetAssign = assignMatch[1];
                let expr = assignMatch[2];
                expr = preprocessExpr(expr);

                const res = evaluateExpression(expr);
                storedVars[targetAssign] = res;
                if (currentVar === targetAssign) setGrid(res);
                updateVarIndicators();

                // 1. Svuota l'input e resetta lo stato del motore real-time
                disp.value = '';
                disp.dispatchEvent(new Event('input'));

                // 2. Visualizza il risultato dell'assegnazione DOPO il reset
                const resString = formatVec(res);
                resDisp.innerHTML = `<b>${targetAssign}</b> = ${resString}`;
                resDisp.style.color = "#0f0"; // Forza il colore verde successo

                clearRandCache();
            } catch (e) { alert(t('err_assign') + e); }
            return;
        }

        const res = calculateRealTime();

       if (res) {
            if (!skipHistory) {
                const ansId = storedAns.length + 1;
                storedAns.push(res);
                const resString = formatVec(res);

                const log = CalcBridge.getElementById('calc-log');
                if (log && log.children.length === 1 && log.children[0].innerText.includes('Nessun')) log.innerHTML = '';

                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.innerHTML = `<div class="log-expr">Ans${ansId}: ${disp.value}</div><div class="log-res">= ${resString}</div>`;
                entry.addEventListener('click', () => {
                    const vStr = `Ans${ansId}`;

                    // Chiusura menu cronologia isolata
                    const hOverlay = CalcBridge.getElementById('history-overlay');
                    const hBtn = CalcBridge.getElementById('toggle-history-btn');
                    if (hOverlay) hOverlay.classList.remove('open');
                    if (hBtn) {
                        hBtn.classList.remove('active');
                        hBtn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`;
                    }

                    // Usiamo calcInput che ripristina il focus prima di leggere la posizione del cursore
                    if (typeof calcInput === 'function') {
                        calcInput(vStr);
                    } else {
                        const input = CalcBridge.getElementById('expression-display');
                        input.focus();
                        const start = input.selectionStart || 0;
                        const end = input.selectionEnd || 0;
                        input.value = input.value.substring(0, start) + vStr + input.value.substring(end);
                        const newPos = start + vStr.length;
                        input.setSelectionRange(newPos, newPos);
                        input.dispatchEvent(new Event('input'));
                    }
                });
                if (log) log.prepend(entry);
            }

            clearRandCache();
        } else {
            if (resDisp.innerText === "" || resDisp.innerText === "0") {
                resDisp.innerText = t('step_err_empty');
                resDisp.style.color = '#0088ff';
            }
        }
    }
};

const btnClearLog = CalcBridge.getElementById('btn-clear-log');
if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
        const log = CalcBridge.getElementById('calc-log');
        if (log) log.innerHTML = `<div style="text-align:center; color:#555; margin-top:20px; font-size:12px;">${t('msg_no_calc')}</div>`;
        storedAns.length = 0;
    });
}