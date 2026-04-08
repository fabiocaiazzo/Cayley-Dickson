// === MOTORE MATEMATICO E PARSER ===
import { t } from './i18n.js';

export const storedVars = {
    a: new Array(16).fill(0), b: new Array(16).fill(0), c: new Array(16).fill(0),
    d: new Array(16).fill(0)
};
export const storedAns = [];

window.preprocessExpr = function (str) {
    let s = str.replace(/rand\s*\(\s*h\s*\)/gi, 'rand(4)')
        .replace(/rand\s*\(\s*o\s*\)/gi, 'rand(8)')
        .replace(/rand\s*\(\s*s\s*\)/gi, 'rand(16)');
    s = s.replace(/e_(\d+)/g, 'e_($1)');
    s = s.replace(/rand/gi, '@!@')
        .replace(/norm/gi, '@?@')
        .replace(/conj/gi, '@:@')
        .replace(/inv/gi, '@;@')
        .replace(/comm/gi, '@<@')
        .replace(/Ans/g, '@>@')
        .replace(/e_/g, '@^@');
    s = s.replace(/([\d\)\]])\s*([a-zA-Z_\(\[@])/g, '$1*$2');
    s = s.replace(/([a-zA-Z\)\]])\s*([\d\.]+)/g, '$1*$2');
    let temp = "";
    while (temp !== s) {
        temp = s;
        s = s.replace(/([a-zA-Z])\s*([a-zA-Z_\(\[@])/g, '$1*$2');
    }
    return s.replace(/@!@/g, 'rand')
        .replace(/@\?@/g, 'norm')
        .replace(/@:@/g, 'conj')
        .replace(/@;@/g, 'inv')
        .replace(/@<@/g, 'comm')
        .replace(/@>@/g, 'Ans')
        .replace(/@\^@/g, 'e_');
};

const ops = {
    '+': { prec: 2, assoc: 'L', fn: vecAdd },
    '-': { prec: 2, assoc: 'L', fn: vecSub },
    '*': { prec: 3, assoc: 'L', fn: vecMul },
    '/': { prec: 3, assoc: 'L', fn: (a, b) => vecMul(a, vecInv(b)) },
    '^': { prec: 5, assoc: 'R', fn: vecPow },
    '~': { prec: 5, assoc: 'R', fn: (a) => vecScale(a, -1) },
    ',': { prec: 1, assoc: 'L', fn: null },
    'norm': { type: 'func', fn: vecNorm },
    'conj': { type: 'func', fn: vecConj },
    'inv': { type: 'func', fn: vecInv },
    'e_': { type: 'func', fn: createBaseVec },
    'rand': { type: 'func', fn: createRandomVec },
    'comm': { type: 'func_var', fn: null },
    'comm2': { type: 'func', fn: vecComm },
    'comm3': { type: 'func', fn: vecAssoc }
};

export function validateAssociativity(exprStr) {
    exprStr = exprStr.replace(/\[/g, 'comm(').replace(/\]/g, ')');
    exprStr = exprStr.replace(/\s+/g, '');
    exprStr = exprStr.replace(/e_\(([^)]+)\)/g, 'e_$1');

    const getVectorValue = (token) => {
        if (!token || typeof token !== 'string') return null;
        if (storedVars[token]) return storedVars[token];
        if (token.startsWith('Ans')) {
            const idx = parseInt(token.substring(3)) - 1;
            return storedAns[idx] || null;
        }
        if (token.startsWith('e_')) {
            const idx = parseInt(token.split('_')[1]);
            const v = new Array(16).fill(0);
            if (!isNaN(idx) && idx >= 0 && idx < 16) v[idx] = 1;
            return v;
        }
        if (!isNaN(parseFloat(token))) {
            const v = new Array(16).fill(0); v[0] = parseFloat(token);
            return v;
        }
        return null;
    };

    const getMaxIndex = (v) => {
        if (v && typeof v === 'object' && v.isGroup) return v.dim;
        if (Array.isArray(v)) {
            for (let i = 15; i >= 0; i--) if (Math.abs(v[i]) > 1e-9) return i;
            return 0;
        }
        return 15;
    };

    const getBase = (v) => {
        if (typeof v !== 'string') return v;
        return v.replace(/^(inv|conj|norm)\((.*)\)$/, '$2');
    };

    const validateChain = (chain) => {
        if (chain.length < 3) return;
        const hasZero = chain.some(t => {
            if (typeof t !== 'string') return false;
            const v = getVectorValue(getBase(t));
            return v && v.every(x => Math.abs(x) < 1e-9);
        });
        if (hasZero) return;

        const base0 = getBase(chain[0]);
        const isMono = chain.every(val => (typeof val === 'string') && getBase(val) === base0);
        if (isMono) return;

        if (chain.length > 3) {
            throw t('err_ambig_chain_1') + chain.length + t('err_ambig_chain_2');
        }

        const [A, B, C] = chain;
        const vA = getVectorValue(getBase(A));
        const vB = getVectorValue(getBase(B));
        const vC = getVectorValue(getBase(C));

        const maxA = getMaxIndex(vA || A);
        const maxB = getMaxIndex(vB || B);
        const maxC = getMaxIndex(vC || C);

        const effectiveDimension = Math.max(maxA, maxB, maxC);
        let isValid = false;

        if (effectiveDimension <= 3) isValid = true;
        else if (effectiveDimension <= 7) {
            if (getBase(A) === getBase(B) || getBase(B) === getBase(C) || getBase(A) === getBase(C)) isValid = true;
        }
        else {
            if (getBase(A) === getBase(C)) isValid = true;
        }

        if (!isValid) {
            throw t('err_ambig_dim') + effectiveDimension + ".\n" + t('err_ambiguous');
        }
    };

    let tokens = exprStr.split(/([+\-*/^(),]|\bcomm\b|\bnorm\b|\bconj\b|\binv\b|\brand\b)/).filter(t => t);
    let level = 0;
    let chain = [];
    let lastWasOperand = false;
    let pendingInverse = false;
    let groupDims = {};
    let activeFuncs = {};

    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i];

        if (['norm', 'conj', 'inv', 'comm', 'rand'].includes(t)) {
            activeFuncs[level + 1] = t;
            if (level === 0) lastWasOperand = false;
            continue;
        }

        if (t === '(') {
            level++;
            groupDims[level] = 0;
            if (level === 1) lastWasOperand = false;
        }
        else if (t === ')') {
            let innerDim = groupDims[level] || 0;

            if (activeFuncs[level]) {
                if (activeFuncs[level] === 'norm') innerDim = 0;
                if (activeFuncs[level] === 'rand') innerDim = 15;
                activeFuncs[level] = null;
            }
            level--;
            if (level === 0) {
                if (innerDim > 0) chain.push({ isGroup: true, dim: innerDim });
                lastWasOperand = true;
            } else {
                if (!groupDims[level]) groupDims[level] = 0;
                groupDims[level] = Math.max(groupDims[level], innerDim);
            }
        }
        else {
            if (level > 0) {
                const v = getVectorValue(t);
                if (v) {
                    const dim = getMaxIndex(v);
                    if (!groupDims[level]) groupDims[level] = 0;
                    groupDims[level] = Math.max(groupDims[level], dim);
                }
            } else {
                if (t === '+' || t === '-' || t === ',') {
                    if (lastWasOperand) {
                        validateChain(chain);
                        chain = [];
                        lastWasOperand = false;
                    }
                }
                else if (t === '*' || t === '/' || t === '^') {
                    if (t === '/') pendingInverse = true;
                    else pendingInverse = false;
                    lastWasOperand = false;
                    continue;
                }
                else {
                    const v = getVectorValue(t);
                    const isScalar = v && getMaxIndex(v) === 0;
                    const isZero = v && v.every(x => Math.abs(x) < 1e-9);

                    if (!isScalar || isZero) {
                        if (pendingInverse) {
                            chain.push("inv(" + (typeof t === 'string' ? t : 'Expr') + ")");
                            pendingInverse = false;
                        } else {
                            chain.push(t);
                        }
                    }
                    lastWasOperand = true;
                }
            }
        }
    }
    if (chain.length > 0) validateChain(chain);
}

export function evaluateExpression(exprStr, trace = false) {
    const stepsLog = [];
    let processedStr = "";
    let bracketDepth = 0;

    for (let i = 0; i < exprStr.length; i++) {
        const char = exprStr[i];
        if (char === '[') {
            bracketDepth++;
            processedStr += char;
        } else if (char === ']') {
            if (bracketDepth > 0) bracketDepth--;
            processedStr += char;
        } else if (char === ',') {
            if (bracketDepth > 0) processedStr += ',';
            else processedStr += '.';
        } else {
            processedStr += char;
        }
    }

    exprStr = processedStr.replace(/\[/g, 'comm(').replace(/\]/g, ')');
    const rawTokens = exprStr.replace(/\s+/g, '').split(/([+\-*/^(),]|norm|conj|inv|comm|e_|rand)/).filter(t => t);
    let tokens = [];

    for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        if (token === '+' || token === '-') {
            const prev = i > 0 ? rawTokens[i - 1] : null;
            const isUnary = (i === 0) || (['+', '-', '*', '/', '^', '(', 'comm', ','].includes(prev));
            if (isUnary) {
                if (token === '-') tokens.push('~');
            } else {
                tokens.push(token);
            }
        } else {
            tokens.push(token);
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === 'comm') {
            let localLevel = 0;
            let commCount = 0;
            for (let j = i + 1; j < tokens.length; j++) {
                if (tokens[j] === '(') localLevel++;
                else if (tokens[j] === ')') {
                    localLevel--;
                    if (localLevel === 0) break;
                }
                else if (tokens[j] === ',' && localLevel === 1) {
                    commCount++;
                }
            }
            if (commCount === 1) tokens[i] = 'comm2';
            else if (commCount === 2) tokens[i] = 'comm3';
            else throw t('err_comm_args');
        }
    }

    const finalQueue = [];
    const finalStack = [];

    for (let token of tokens) {
        if (storedVars[token] || token.startsWith('Ans') || !isNaN(parseFloat(token))) {
            finalQueue.push(token);
        } else if (ops[token] && ops[token].type === 'func') {
            finalStack.push(token);
        } else if (token === ',') {
            while (finalStack.length > 0 && finalStack[finalStack.length - 1] !== '(') {
                finalQueue.push(finalStack.pop());
            }
        } else if (ops[token]) {
            while (finalStack.length > 0) {
                const top = finalStack[finalStack.length - 1];
                if (top === '(') break;
                if ((ops[token].assoc === 'L' && ops[token].prec <= ops[top].prec) ||
                    (ops[token].assoc === 'R' && ops[token].prec < ops[top].prec)) {
                    finalQueue.push(finalStack.pop());
                } else { break; }
            }
            finalStack.push(token);
        } else if (token === '(') {
            finalStack.push(token);
        } else if (token === ')') {
            while (finalStack.length > 0 && finalStack[finalStack.length - 1] !== '(') {
                finalQueue.push(finalStack.pop());
            }
            finalStack.pop();
            const topToken = finalStack[finalStack.length - 1];
            if (finalStack.length > 0 && ops[topToken] && ops[topToken].type === 'func') {
                finalQueue.push(finalStack.pop());
            }
        } else {
            throw t('err_token') + token;
        }
    }

    if (finalQueue.length === 0 && finalStack.length === 0) throw t('err_expr_empty');
    while (finalStack.length > 0) finalQueue.push(finalStack.pop());

    const evalStack = [];
    const getV = (tParam) => {
        if (typeof tParam !== 'string') return tParam;
        if (storedVars[tParam]) return storedVars[tParam];
        if (tParam.startsWith('Ans')) {
            const idx = parseInt(tParam.substring(3)) - 1;
            if (!storedAns[idx]) throw t('err_ans_not_calc') + tParam;
            return storedAns[idx];
        }
        const num = parseFloat(tParam);
        if (!isNaN(num)) { const v = createZeroVector(); v[0] = num; return v; }
        throw t('err_unknown_sym') + tParam;
    };

    for (let token of finalQueue) {
        if (ops[token]) {
            let res, opLabel, args = [];
            if (token === '~') {
                const a = getV(evalStack.pop());
                res = ops[token].fn(a);
                args = [a]; opLabel = "Neg";
            }
            else if (token === 'comm3') {
                const c = getV(evalStack.pop());
                const b = getV(evalStack.pop());
                const a = getV(evalStack.pop());
                res = ops[token].fn(a, b, c);
                args = [a, b, c]; opLabel = "[a,b,c]";
            }
            else if (ops[token].type === 'func') {
                if (token === 'comm2') {
                    const b = getV(evalStack.pop());
                    const a = getV(evalStack.pop());
                    res = ops[token].fn(a, b);
                    args = [a, b]; opLabel = "[a,b]";
                } else {
                    const a = getV(evalStack.pop());
                    res = ops[token].fn(a);
                    args = [a]; opLabel = token;
                }
            } else {
                const b = getV(evalStack.pop());
                const a = getV(evalStack.pop());
                if (!a || !b) throw t('err_syntax');
                res = ops[token].fn(a, b);
                args = [a, b]; opLabel = token;
            }

            evalStack.push(res);
            if (trace) stepsLog.push({ op: opLabel, args: args, res: res });
        } else {
            evalStack.push(token);
        }
    }

    if (trace) return stepsLog;
    return getV(evalStack[0]);
}

// --- FUNZIONE DI FORMATTAZIONE GLOBALE ---
window.formatVecGlobal = function (v) {
    if (!v) return "Err";
    if (v.some(x => isNaN(x))) return "NaN";
    if (v.some(x => !isFinite(x))) return "Infinity";

    let s = [];
    let allZero = true;

    v.forEach((val, i) => {
        let absVal = Math.abs(val);
        if (absVal > 1e-9) {
            allZero = false;
            let valStr;
            let useScientific = false;

            if (absVal < 0.001 || absVal >= 1e9) {
                useScientific = true;
                let parts = absVal.toExponential(3).split('e');
                let mantissa = parseFloat(parts[0]);
                let exponent = parseInt(parts[1]);
                valStr = mantissa + "&middot;10<sup>" + exponent + "</sup>";
            } else {
                valStr = parseFloat(absVal.toFixed(3));
            }

            if (i > 0 && valStr === 1 && !useScientific) valStr = "";

            // Genera il segno "-" normalmente, ma usa il "+" SOLO se c'è già almeno un pezzo inserito
            let sign = val < 0 ? "-" : (s.length > 0 ? "+" : "");
            
            // Crea il blocco compatibile e senza interruzioni di riga
            let term = "<span style='white-space: nowrap;'>" + sign + valStr;
            if (i > 0) term += "<span style='color:#ffdd00'>e<sub>" + i + "</sub></span>";
            term += "</span>";
            s.push(term);


        }
    });

    if (allZero) return "0";
    let str = s.join(' ');
    if (str.startsWith('+')) str = str.substring(1);
    return str;
};