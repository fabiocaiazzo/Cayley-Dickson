import { EPSILON, storedVars } from '../math/parser.js';
import { switchVar, switchCalcView } from './calculator_ui.js';
import { CalcBridge } from './calculator_popout.js';
import { calcAction } from './calculator_core.js';
import { calcSteps } from './calculator_steps.js';

let isShiftActive = false;
export function getIsShiftActive() { return isShiftActive; }

export function toggleShift() {
    isShiftActive = !isShiftActive;
    const keypad = CalcBridge.getElementById('main-keypad');
    const btn = CalcBridge.getElementById('btn-shift');
    if (isShiftActive) {
        keypad.classList.add('shift-active');
        btn.classList.add('active');
        if (typeof hideEvalPopup === 'function') hideEvalPopup();
    } else {
        keypad.classList.remove('shift-active');
        btn.classList.remove('active');
    }
}

export function handleKey(key) {
    if (isShiftActive) {
        switch (key) {
            case 'canc': calcAction('clear'); break;
            case '()': 
                if (isDotProductMode) calcDotBracket();
                else calcBracket(); 
                break;
            case 'e_n': calcInput('Ker('); break;
            case '/': calcInput('inv('); break;
            case '*': calcInput('^'); break;
            case '-': calcInput('conj('); break;
            case '+': calcInput('norm('); break;
            case '.': calcInput(','); break;
            case '=': calcSteps(); break;
            default: doNormalKey(key);
        }
        if (key !== '2nd') toggleShift();
    } else {
        doNormalKey(key);
    }
}

function doNormalKey(key) {
    switch (key) {
        case 'a': case 'b': case 'c': case 'd':
            const isDefined = storedVars[key].some(val => Math.abs(val) > EPSILON);
            if (!isDefined) {
                switchCalcView('vars');
                switchVar(key);
            } else {
                calcInput(key);
            }
            break;
        case 'canc': calcAction('back'); break;
        case '()': calcSmartParen(); break;
        case 'e_n': calcInput('e_('); break;
        case '/': calcInput('/'); break;
        case '*': calcInput('*'); break;
        case '-': calcInput('-'); break;
        case '+': calcInput('+'); break;
        case '.': calcInput('.'); break;
        case 'assign': calcInput('='); break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
            calcInput(key); break;
        case '=': calcAction('eval'); break;
        case '==': calcInput('=='); break;
        case '=?': calcInput('=?'); break;
    }
}

// ================== GESTORE UNIFICATO LONG PRESS ==================

function createPressHandler(onLongPress, onShortPress) {
    let timer = null;
    let handled = false;
    return {
        start: (e, ...args) => {
            handled = false;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                handled = true;
                if (onLongPress) onLongPress(e, ...args);
            }, 400);
        },
        end: (e, ...args) => {
            if (e) e.preventDefault();
            if (timer) { clearTimeout(timer); timer = null; }
            if (!handled) {
                handled = true;
                if (onShortPress) onShortPress(e, ...args);
            }
        },
        cancel: () => {
            if (timer) { clearTimeout(timer); timer = null; }
        }
    };
}

let evalPopupOpen = false;
export function hideEvalPopup() {
    const popup = CalcBridge.getElementById('eval-popup');
    if (popup) popup.style.display = 'none';
    setTimeout(() => { evalPopupOpen = false; }, 100);
}

const evalPress = createPressHandler(
    () => {
        CalcBridge.getElementById('eval-popup').style.display = 'flex';
        evalPopupOpen = true;
    },
    () => {
        if (!evalPopupOpen) handleKey('=');
    }
);

export function startEvalPress(e) {
    if (isShiftActive) { handleKey('='); return; }
    evalPress.start(e);
}
export function endEvalPress(e) {
    if (isShiftActive) { e.preventDefault(); return; }
    evalPress.end(e);
}
export function cancelEvalPress() { evalPress.cancel(); }

const varPress = createPressHandler(
    (e, key) => {
        const isDefined = storedVars[key].some(val => Math.abs(val) > EPSILON);
        if (isDefined) {
            switchCalcView('vars');
            switchVar(key);
        }
    },
    (e, key) => handleKey(key)
);

export function startVarPress(e, key) { varPress.start(e, key); }
export function endVarPress(e, key) { varPress.end(e, key); }
export function cancelVarPress() { varPress.cancel(); }

const cancPress = createPressHandler(
    () => calcAction('clear'),
    () => handleKey('canc')
);

export function startCancPress(e) {
    if (isShiftActive) { handleKey('canc'); return; }
    cancPress.start(e);
}
export function endCancPress(e) {
    if (isShiftActive) { e.preventDefault(); return; }
    cancPress.end(e);
}
export function cancelCancPress() { cancPress.cancel(); }

export let isDotProductMode = false;
const parenPress = createPressHandler(
    () => {
        if (isShiftActive) {
            isDotProductMode = !isDotProductMode;
            const label = CalcBridge.getElementById('label-paren-shift');
            if (label) {
                label.innerHTML = isDotProductMode ? '&lang;x,y&rang;' : '[x,y]';
            }
        }
    },
    () => handleKey('()')
);

export function startParenPress(e) { parenPress.start(e); }
export function endParenPress(e) { parenPress.end(e); }
export function cancelParenPress() { parenPress.cancel(); }

function handleSmartBracket(openChar, closeChar, insertPair) {
    const input = CalcBridge.getElementById('expression-display');
    if (document.activeElement !== input) input.focus();

    const cursor = input.selectionStart;
    const left = input.value.substring(0, cursor);
    
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const openCount = (left.match(new RegExp(esc(openChar), 'g')) || []).length;
    const closeCount = (left.match(new RegExp(esc(closeChar), 'g')) || []).length;
    
    const lastChar = (left.trim().match(/.$/) || [''])[0];
    const isOperandEnd = /[0-9a-zA-Z_\)\]>\.]$/.test(lastChar);

    if (openCount > closeCount && isOperandEnd) {
        if (input.value[cursor] === closeChar) {
            input.setSelectionRange(cursor + 1, cursor + 1);
        } else {
            calcInput(closeChar);
        }
    } else {
        calcInput(insertPair);
        input.setSelectionRange(cursor + 1, cursor + 1);
        updateBracketHighlight();
    }
}

export function calcSmartParen() { handleSmartBracket('(', ')', '()'); }
export function calcBracket() { handleSmartBracket('[', ']', '[,]'); }
export function calcDotBracket() { handleSmartBracket('<', '>', '<,>'); }

export function calcInput(val) {
    const input = CalcBridge.getElementById('expression-display');
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
}

// ================== BRACKET HIGHLIGHTER ======================
const exprInput = CalcBridge.getElementById('expression-display');
const highlightLayer = CalcBridge.getElementById('highlight-layer');

function updateBracketHighlight() {
    if (!exprInput || !highlightLayer) return;
    const text = exprInput.value;
    const cursor = exprInput.selectionStart;

    let idx1 = -1;
    let idx2 = -1;
    let isError = false;

    const pairs = { '(': ')', '[': ']', ')': '(', ']': '[', '<': '>', '>': '<' };

    let targetIdx = -1;
    if (cursor > 0 && pairs[text[cursor - 1]]) {
        targetIdx = cursor - 1;
    } else if (cursor < text.length && pairs[text[cursor]]) {
        targetIdx = cursor;
    }

    let stack = [];
    const openPairs = { '(': ')', '[': ']', '<': '>' };
    let closedBy = {}; 
    let openedBy = {}; 
    let commaOwner = {}; 

    for(let i = 0; i < text.length; i++) {
        let char = text[i];
        
        const findInStack = (predicate) => {
            if (i >= cursor) {
                return stack.findIndex(predicate);
            } else {
                for (let k = stack.length - 1; k >= 0; k--) {
                    if (predicate(stack[k])) return k;
                }
                return -1;
            }
        };

        if (openPairs[char]) {
            stack.push({ char: openPairs[char], pos: i });
        } else if (char === ')' || char === ']' || char === '>') {
            let foundIdx = findInStack(item => item.char === char);
            
            if (foundIdx !== -1) {
                closedBy[i] = stack[foundIdx].pos;
                openedBy[stack[foundIdx].pos] = i;
                stack.splice(foundIdx, 1);
            }
        } else if (char === ',') {
            let foundOwnerIdx = findInStack(item => item.char === ']' || item.char === '>');
            
            if (foundOwnerIdx !== -1) {
                commaOwner[i] = stack[foundOwnerIdx].pos;
            }
        }
    }

    if (targetIdx !== -1) {
        idx1 = targetIdx;
        const char = text[targetIdx];
        const isOpen = (char === '(' || char === '[' || char === '<');
        
        if (isOpen) {
            if (openedBy[targetIdx] !== undefined) {
                idx2 = openedBy[targetIdx];
            } else {
                idx2 = -1;
                isError = false; 
            }
        } else {
            if (closedBy[targetIdx] !== undefined) {
                idx2 = closedBy[targetIdx];
            } else {
                idx2 = -1;
                isError = true; 
            }
        }
    }

    let ghostGroups = {};
    let ghostGroupsData = {};
    let totalGhosts = 0;

    for (let j = stack.length - 1; j >= 0; j--) {
        let u = stack[j];
        let insIdx = text.length;
        
        for (let k = u.pos + 1; k < text.length; k++) {
            if (closedBy[k] !== undefined && closedBy[k] < u.pos) {
                insIdx = k;
                break;
            }
            if (text[k] === ',' && commaOwner[k] !== undefined && commaOwner[k] < u.pos) {
                insIdx = k;
                break;
            }
        }
        
        if (insIdx >= cursor) {
            if (!ghostGroups[insIdx]) {
                ghostGroups[insIdx] = [];
                ghostGroupsData[insIdx] = [];
            }
            ghostGroups[insIdx].push({ char: u.char, openPos: u.pos });
            ghostGroupsData[insIdx].push(u.char);
            totalGhosts++;
        }
    }

    exprInput.dataset.ghostMap = JSON.stringify(ghostGroupsData);

    let html = '';

    for (let i = 0; i <= text.length; i++) {
        if (ghostGroups[i]) {
            let ghostHtmlStr = '';
            for (let g of ghostGroups[i]) {
                let c = g.char.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                if (g.openPos === idx1) {
                    ghostHtmlStr += `<span class="hl-match">${c}</span>`;
                } else {
                    ghostHtmlStr += c;
                }
            }
            html += `<span class="hl-ghost">${ghostHtmlStr}</span>`;
        }

        if (i < text.length) {
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
    }

    highlightLayer.innerHTML = html;
    
    if (totalGhosts > 0) {
        exprInput.style.paddingRight = `calc(4px + ${totalGhosts}ch)`;
    } else {
        exprInput.style.paddingRight = '4px';
    }

    highlightLayer.scrollLeft = exprInput.scrollLeft;
}

if (exprInput) {
    const commitGhost = () => {
        try {
            const ghostMapStr = exprInput.dataset.ghostMap;
            if (!ghostMapStr) return false;
            const ghostMap = JSON.parse(ghostMapStr);
            const cursor = exprInput.selectionStart;
            if (ghostMap[cursor] && ghostMap[cursor].length > 0) {
                calcInput(ghostMap[cursor][0]);
                return true;
            }
        } catch(e) {}
        return false;
    };

    ['input', 'click', 'keyup', 'focus', 'scroll'].forEach(evt => {
        exprInput.addEventListener(evt, (e) => {
            if (evt === 'scroll') {
                highlightLayer.scrollLeft = exprInput.scrollLeft;
                return;
            }

            if (evt === 'click') {
                const isAtEnd = exprInput.selectionStart === exprInput.value.length;
                if (isAtEnd) commitGhost();
            }

            updateBracketHighlight();
        });
    });

    exprInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            if (commitGhost()) {
                e.preventDefault(); 
            }
        }
    });
}

// --- EVENT LISTENERS (Ex-Inline HTML) ---
setTimeout(() => {
    const doc = CalcBridge;
    
    const bindPress = (el, startFn, endFn, cancelFn, arg = null) => {
        if(!el) return;
        el.addEventListener('pointerdown', (e) => startFn(e, arg));
        el.addEventListener('pointerup', (e) => endFn(e, arg));
        el.addEventListener('pointerleave', (e) => cancelFn());
        el.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    doc.querySelectorAll('.key-btn.key-var[data-var-hold]').forEach(btn => {
        bindPress(btn, startVarPress, endVarPress, cancelVarPress, btn.dataset.varHold);
    });

    bindPress(doc.getElementById('btn-keypad-canc'), startCancPress, endCancPress, cancelCancPress);
    bindPress(doc.getElementById('btn-keypad-paren'), startParenPress, endParenPress, cancelParenPress);
    bindPress(doc.getElementById('btn-keypad-eval'), startEvalPress, endEvalPress, cancelEvalPress);

    doc.querySelectorAll('.btn-handle-key').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleKey(e.currentTarget.dataset.key);
        });
    });

    const shiftBtn = doc.getElementById('btn-shift');
    if (shiftBtn) shiftBtn.addEventListener('click', () => toggleShift());

    const btnEvalAssign = doc.getElementById('btn-eval-assign');
    if (btnEvalAssign) btnEvalAssign.addEventListener('click', () => {
        handleKey('assign');
        hideEvalPopup();
    });

    const btnEvalEq = doc.getElementById('btn-eval-eq');
    if (btnEvalEq) btnEvalEq.addEventListener('click', () => {
        handleKey('=?');
        hideEvalPopup();
    });
}, 500);