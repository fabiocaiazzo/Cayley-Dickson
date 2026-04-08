import { storedVars } from '../parser.js';
import { switchVar } from './calculator_ui.js';

window.isShiftActive = false;

window.toggleShift = function () {
    window.isShiftActive = !window.isShiftActive;
    const keypad = document.getElementById('main-keypad');
    const btn = document.getElementById('btn-shift');
    if (window.isShiftActive) {
        keypad.classList.add('shift-active');
        btn.classList.add('active');
    } else {
        keypad.classList.remove('shift-active');
        btn.classList.remove('active');
    }
};

window.handleKey = function (key) {
    if (window.isShiftActive) {
        switch (key) {
            case 'canc': window.calcAction('clear'); break;
            case '()': window.calcBracket(); break;
            case 'e_n': window.calcInput('Ker('); break;
            case '/': window.calcInput('inv('); break;
            case '*': window.calcInput('^'); break;
            case '-': window.calcInput('conj('); break;
            case '+': window.calcInput('norm('); break;
            case '.': window.calcInput(','); break;
            case '=': window.calcSteps(); break;
            default: doNormalKey(key);
        }
        if (key !== '2nd') {
            // Controlla il bilanciamento delle parentesi quadre per mantenere lo Shift
            const disp = document.getElementById('expression-display');
            const text = disp.value;
            const openCount = (text.match(/\[/g) || []).length;
            const closeCount = (text.match(/\]/g) || []).length;

            if (openCount === closeCount) {
                window.toggleShift(); // Spegnimento automatico solo se non ci sono commutatori aperti
            }
        }
    } else {
        doNormalKey(key);
    }
};

function doNormalKey(key) {
    switch (key) {
        case 'a': case 'b': case 'c': case 'd':
            const isDefined = storedVars[key].some(val => Math.abs(val) > 1e-9);
            if (!isDefined) {
                window.switchCalcView('vars');
                switchVar(key);
            } else {
                window.calcInput(key);
            }
            break;
        case 'canc': window.calcAction('back'); break;
        case '()': window.calcSmartParen(); break;
        case 'e_n': window.calcInput('e_('); break;
        case '/': window.calcInput('/'); break;
        case '*': window.calcInput('*'); break;
        case '-': window.calcInput('-'); break;
        case '+': window.calcInput('+'); break;
        case '.': window.calcInput('.'); break;
        case 'assign': window.calcInput('='); break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
            window.calcInput(key); break;
        case '=': window.calcAction('eval'); break;
        case '==': window.calcInput('=='); break;
        case '=?': window.calcInput('=?'); break;
    }
}

let evalPressTimer = null;
let evalPopupOpen = false;

window.startEvalPress = function (e) {
    if (window.isShiftActive) {
        window.handleKey('=');
        return;
    }
    evalPressTimer = setTimeout(() => {
        document.getElementById('eval-popup').style.display = 'flex';
        evalPopupOpen = true;
    }, 400); // 400ms per mostrare il menu
};

window.endEvalPress = function (e) {
    e.preventDefault();
    if (evalPressTimer) {
        clearTimeout(evalPressTimer);
        evalPressTimer = null;
    }
    if (!evalPopupOpen && !window.isShiftActive) {
        window.handleKey('=');
    }
};

window.cancelEvalPress = function (e) {
    if (evalPressTimer) {
        clearTimeout(evalPressTimer);
        evalPressTimer = null;
    }
};

window.hideEvalPopup = function () {
    const popup = document.getElementById('eval-popup');
    if (popup) popup.style.display = 'none';
    setTimeout(() => { evalPopupOpen = false; }, 100);
};


// ================== LOGICA LONG PRESS (Variabili e Cancella Tutto) ==================

let varPressTimer = null;
let varPressHandled = false;

window.startVarPress = function (e, key) {
    varPressHandled = false;
    varPressTimer = setTimeout(() => {
        varPressHandled = true;
        // Apri la vista variabili se è definita (ha il pallino verde)
        const isDefined = storedVars[key].some(val => Math.abs(val) > 1e-9);
        if (isDefined) {
            window.switchCalcView('vars');
            switchVar(key);
        }
    }, 400); // 400ms per riconoscere la pressione prolungata
};

window.endVarPress = function (e, key) {
    e.preventDefault();
    if (varPressTimer) { clearTimeout(varPressTimer); varPressTimer = null; }
    
    // Se non è scattato il tocco lungo, comportati come tocco singolo
    if (!varPressHandled) {
        varPressHandled = true; // Previene doppie esecuzioni
        window.handleKey(key);
    }
};

window.cancelVarPress = function (e) {
    if (varPressTimer) { clearTimeout(varPressTimer); varPressTimer = null; }
    // Rimossa la forzatura di varPressHandled = true. 
    // Ora i micro-movimenti del dito su mobile non annulleranno più un tap intenzionale.
};

let cancPressTimer = null;
let cancPressHandled = false;

window.startCancPress = function (e) {
    if (window.isShiftActive) {
        window.handleKey('canc');
        return; 
    }
    cancPressHandled = false;
    cancPressTimer = setTimeout(() => {
        cancPressHandled = true;
        window.calcAction('clear'); // Esegue il reset hardware "AC"
    }, 400);
};

window.endCancPress = function (e) {
    e.preventDefault();
    if (cancPressTimer) { clearTimeout(cancPressTimer); cancPressTimer = null; }
    if (!cancPressHandled && !window.isShiftActive) {
        cancPressHandled = true;
        window.handleKey('canc');
    }
};

window.cancelCancPress = function (e) {
    if (cancPressTimer) { clearTimeout(cancPressTimer); cancPressTimer = null; }
};


window.calcSmartParen = function () {
    const input = document.getElementById('expression-display');
    if (document.activeElement !== input) input.focus();

    const cursor = input.selectionStart;
    const text = input.value;
    const left = text.substring(0, cursor);

    const openCount = (left.match(/\(/g) || []).length;
    const closeCount = (left.match(/\)/g) || []).length;

    const lastCharMatch = left.trim().match(/.$/);
    const lastChar = lastCharMatch ? lastCharMatch[0] : '';

    const isOperandEnd = /[0-9a-zA-Z_\)\]\.]$/.test(lastChar);

    if (openCount > closeCount && isOperandEnd) {
        window.calcInput(')');
    } else {
        window.calcInput('(');
    }
};

window.calcBracket = function () {
    const input = document.getElementById('expression-display');
    if (document.activeElement !== input) input.focus();

    const cursor = input.selectionStart;
    const text = input.value;
    const left = text.substring(0, cursor);

    const openCount = (left.match(/\[/g) || []).length;
    const closeCount = (left.match(/\]/g) || []).length;

    const leftTrimmed = left.trim();
    const lastCharMatch = leftTrimmed.match(/.$/);
    const lastChar = lastCharMatch ? lastCharMatch[0] : '';

    const isOperandEnd = /[0-9a-zA-Z_\)\]\.]$/.test(lastChar);

    if (openCount > closeCount && isOperandEnd) {
        window.calcInput(']');
    } else {
        window.calcInput('[');
    }
};

window.calcInput = function (val) {
    const input = document.getElementById('expression-display');
    if (document.activeElement !== input) {
        input.focus();
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.substring(0, start) + val + text.substring(end);
    const newPos = start + val.length;
    input.setSelectionRange(newPos, newPos);

    input.dispatchEvent(new Event('input'));
};

// ================== BRACKET HIGHLIGHTER ======================
const exprInput = document.getElementById('expression-display');
const highlightLayer = document.getElementById('highlight-layer');

function updateBracketHighlight() {
    if (!exprInput || !highlightLayer) return;
    const text = exprInput.value;
    const cursor = exprInput.selectionStart;

    let idx1 = -1;
    let idx2 = -1;
    let isError = false;

    const pairs = { '(': ')', '[': ']', ')': '(', ']': '[' };

    let targetIdx = -1;
    if (cursor > 0 && pairs[text[cursor - 1]]) {
        targetIdx = cursor - 1;
    } else if (cursor < text.length && pairs[text[cursor]]) {
        targetIdx = cursor;
    }

    if (targetIdx !== -1) {
        const char = text[targetIdx];
        const match = pairs[char];
        const isOpen = (char === '(' || char === '[');
        const dir = isOpen ? 1 : -1;

        idx1 = targetIdx;
        let balance = 0;

        let i = targetIdx + dir;
        while (i >= 0 && i < text.length) {
            const c = text[i];
            if (c === char) {
                balance++;
            } else if (c === match) {
                if (balance === 0) {
                    idx2 = i;
                    break;
                }
                balance--;
            }
            i += dir;
        }

        if (idx2 === -1) isError = true;
    }

    let html = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '<') char = '&lt;';
        else if (char === '>') char = '&gt;';
        else if (char === '&') char = '&amp;';

        if (i === idx1 || i === idx2) {
            const className = (isError && i === idx1) ? 'hl-error' : 'hl-match';
            html += `<span class="${className}">${char}</span>`;
        } else {
            html += char;
        }
    }
    highlightLayer.innerHTML = html;
    highlightLayer.scrollLeft = exprInput.scrollLeft;
}

if (exprInput) {
    ['input', 'click', 'keyup', 'focus', 'scroll'].forEach(evt => {
        exprInput.addEventListener(evt, () => {
            if (evt === 'scroll') {
                highlightLayer.scrollLeft = exprInput.scrollLeft;
            } else {
                updateBracketHighlight();
            }
        });
    });
}