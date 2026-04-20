import { currentAlgState } from '../core/state.js';

const resetView = () => window.dispatchEvent(new Event('requestResetView'));
import { currentVar, saveVar } from './calculator_ui.js';
import { EPSILON, evaluateExpression, preprocessExpr, formatVec } from '../math/parser.js';
import { autoCloseBrackets } from './calculator_core.js';
import { highlightConnections } from '../3d/graph.js';
import { tableLookup } from '../math/data.js';
import { vecAdd, vecSub, vecMul, vecInv, vecNorm, vecConj, vecScale, vecPow, vecDot, vecComm, vecAssoc, createBaseVec, createRandomVec, computeKernelBasis, resetRandCache } from '../math/algebra.js';
import { t } from '../core/i18n.js';
import { CalcBridge } from './calculator_popout.js';

// --- LOGICA PASSAGGI (STEP-BY-STEP) COMPLETA ---
const stepsOverlay = CalcBridge.getElementById('steps-overlay');
const stepsContent = CalcBridge.getElementById('steps-content');

CalcBridge.getElementById('close-steps-btn').addEventListener('click', () => {
    stepsOverlay.style.display = 'none';
    resetView(); // Ripristina la visualizzazione normale uscendo dai passaggi
});

// Listener delegato per i pulsanti dei tab nei passaggi della moltiplicazione
stepsContent.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'switchMulTab') {
        switchMulTab(btn.dataset.uid, parseInt(btn.dataset.k, 10), btn);
    }
});

// Funzione locale per gestire il cambio tab nella visualizzazione passaggi
function switchMulTab(uid, k, btn) {
    const container = CalcBridge.getElementById(`mul-container-${uid}`);
    if (!container) return;

    const target = CalcBridge.getElementById(`mul-content-${uid}-${k}`);
    if (!target) return;

    // Controlla se il tab che abbiamo cliccato è attualmente aperto
    const isCurrentlyOpen = target.style.display === 'block';

    // Nasconde tutti i contenuti
    container.querySelectorAll('.mul-content').forEach(el => el.style.display = 'none');

    // Reset stile di tutti i bottoni attivi (ignorando quelli disabilitati)
    container.querySelectorAll('.mul-tab-btn:not([disabled])').forEach(b => {
        b.style.background = '#333';
        b.style.color = '#888';
        b.style.borderColor = '#444';
    });

    if (!isCurrentlyOpen) {
        // Se era chiuso, lo apriamo
        target.style.display = 'block';
        btn.style.background = '#0066cc';
        btn.style.color = 'white';
        btn.style.borderColor = '#0088ff';

        // LOGICA EVIDENZIAZIONE 3D
        if (k > 0) {
            // Se clicco un vettore (e1...e15), evidenzio le sue connessioni
            if (typeof highlightConnections === 'function') highlightConnections(k);
        } else {
            // Se clicco scalare (1), resetto la vista perché non appartiene a nessun nodo specifico
            if (typeof resetView === 'function') resetView();
        }
    } else {
        // Se lo abbiamo appena chiuso deselezionandolo, resettiamo anche la vista 3D
        if (typeof resetView === 'function') resetView();
    }
};

// 1. Spiegazione Moltiplicazione (Rifatta con layout Sedenioni e Font più grandi)
function explainMul(A, B) {
    const uid = Math.floor(Math.random() * 1000000);

    let groups = new Array(16).fill(null).map(() => []);
    let activeIndices = [];

    // 1. Calcolo
    for (let i = 0; i < 16; i++) {
        if (Math.abs(A[i]) < EPSILON) continue;
        for (let j = 0; j < 16; j++) {
            if (Math.abs(B[j]) < EPSILON) continue;

            const { s, i: resIdx } = tableLookup[i][j];
            const val = A[i] * B[j] * s;

            // Formatta Fattori
            const termA = (A[i] < 0 ? "-" : "") + (Math.abs(A[i]) === 1 && i > 0 ? "" : Math.abs(A[i])) + (i === 0 ? "" : "e<sub>" + i + "</sub>");
            const termB = (B[j] < 0 ? "-" : "") + (Math.abs(B[j]) === 1 && j > 0 ? "" : Math.abs(B[j])) + (j === 0 ? "" : "e<sub>" + j + "</sub>");

            // Formatta Risultato
            let valNum = parseFloat(val.toFixed(3));
            let valStr = valNum;

            if (resIdx > 0) {
                if (Math.abs(valNum) === 1) valStr = (valNum < 0 ? "-" : "");
                valStr += "e<sub>" + resIdx + "</sub>";
            }

            groups[resIdx].push({
                line: `${termA} &middot; ${termB} = <strong>${valStr}</strong>`,
                val: val
            });
        }
    }

    groups.forEach((g, k) => { if (g.length > 0) activeIndices.push(k); });
    if (activeIndices.length === 0) return "";

    // 2. Costruzione HTML
    let html = `<div id="mul-container-${uid}" class="step-container">`;

    // --- GENERAZIONE TABS (Layout differenziato) ---
    const currentAlg = currentAlgState;

    // Funzione helper per creare un singolo bottone
    const createBtn = (k, isActive, isSelected, customStyle = "") => {
        const label = k === 0 ? "1" : `e<sub>${k}</sub>`;
        if (isActive) {
            const bg = isSelected ? '#0066cc' : '#333';
            const col = isSelected ? 'white' : '#888';
            const bord = isSelected ? '#0088ff' : '#444';
            return `<button class="mul-tab-btn" 
                        data-action="switchMulTab" data-uid="${uid}" data-k="${k}"
                        style="background:${bg}; color:${col}; border:1px solid ${bord};
                        padding:6px 2px; border-radius:4px; cursor:pointer; font-size:14px; font-weight:bold; font-family:'Times New Roman', serif; width:100%; ${customStyle}">
                        ${label}
                    </button>`;
        } else {
            return `<button class="mul-tab-btn" disabled
                        style="background:transparent; color:#555; border:1px solid #333;
                        padding:6px 2px; border-radius:4px; cursor:default; font-size:14px; font-weight:bold; font-family:'Times New Roman', serif; width:100%; opacity:0.5; ${customStyle}">
                        ${label}
                    </button>`;
        }
    };

    // Container header
    html += `<div class="step-tabs-header">`;
    html += `<div class="step-tabs-title" data-i18n="step_active_comp">${t('step_active_comp')}</div>`;

    if (currentAlg === 15) {
        // LAYOUT SEDENIONI: GRIGLIA 6 colonne x 3 righe
        html += `<div class="step-tabs-grid" style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px;">`;

        for (let k = 0; k <= 15; k++) {
            let gridArea = "";
            if (k === 0) gridArea = "1 / 1 / 2 / 2"; 
            else if (k <= 5) gridArea = `1 / ${k + 1} / 2 / ${k + 2}`; 
            else if (k <= 10) gridArea = `2 / ${k - 6 + 2} / 3 / ${k - 6 + 3}`; 
            else gridArea = `3 / ${k - 11 + 2} / 4 / ${k - 11 + 3}`; 

            const isActive = activeIndices.includes(k);
            const isSelected = false; // Nessun tab selezionato di default

            html += createBtn(k, isActive, isSelected, `grid-area: ${gridArea};`);
        }

        html += `</div>`;

    } else {
        // LAYOUT COMPATTO PER ALGEBRE MINORI
        html += `<div class="step-tabs-flex" style="display:flex; flex-wrap:wrap; gap:4px;">`;
        for (let k = 0; k <= currentAlg; k++) {
            const isActive = activeIndices.includes(k);
            const isSelected = false; // Nessun tab selezionato di default
            html += createBtn(k, isActive, isSelected, "flex:1; min-width:0; padding:6px 0;");
        }
        html += `</div>`;
    }

    html += `</div>`;

    // --- CONTENUTI ---
    activeIndices.forEach((k, i) => {
        const displayStyle = 'none'; // Nasconde tutti i contenuti di default
        const label = k === 0 ? `<span data-i18n="step_real">${t('step_real')}</span>` : `e<sub>${k}</sub>`;
        let totalSum = 0;
        let sumParts = [];

        html += `<div id="mul-content-${uid}-${k}" class="mul-content" style="display:${displayStyle}; animation: fadeIn 0.2s;">`;
        html += `<div class="step-content-title"><span data-i18n="step_detail">${t('step_detail')}</span> ${label}</div>`;

        groups[k].forEach(item => {
            html += `<div class="step-line">${item.line}</div>`;
            totalSum += item.val;

            let vStr = parseFloat(item.val.toFixed(3));
            if (vStr >= 0 && sumParts.length > 0) vStr = "+ " + vStr;
            else if (vStr < 0 && sumParts.length > 0) vStr = "- " + Math.abs(vStr);
            sumParts.push(vStr);
        });

        // Somma finale
        html += `<div class="step-sum-box">`;
        if (groups[k].length > 1) {
            html += `<span class="step-sum-label" data-i18n="step_sum">${t('step_sum')}</span> ${sumParts.join(' ')} = <span class="step-sum-result">${parseFloat(totalSum.toFixed(3))}</span>`;
        } else {
            html += `<span data-i18n="step_total">${t('step_total')}</span> <span class="step-sum-result">${parseFloat(totalSum.toFixed(3))}</span>`;
        }
        html += `</div></div>`;
    });

    html += `</div>`;
    return html;
};

// 2. Spiegazione Norma
function explainNorm(v) {
    let squares = [];
    let sumSq = 0;
    v.forEach((val, i) => {
        if (Math.abs(val) > EPSILON) {
            squares.push(`(${parseFloat(val.toFixed(3))})<sup>2</sup>`);
            sumSq += val * val;
        }
    });
    return `<div class="step-expl-box step-expl-norm">
                <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> &radic;(&sum; v<sub>i</sub><sup>2</sup>)</div>
                <div class="step-expl-line">&radic;( ${squares.join(' + ')} )</div>
                <div class="step-expl-line">= &radic;( ${parseFloat(sumSq.toFixed(4))} )</div>
                <div class="step-expl-res">= ${Math.sqrt(sumSq).toFixed(4)}</div>
            </div>`;
};

// 3. Spiegazione Inverso
function explainInv(v) {
    let n2 = 0;
    v.forEach(val => n2 += val * val);
    const conjStr = formatVec(vecConj(v));
    return `<div class="step-expl-box step-expl-inv">
                <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> v<sup>-1</sup> = <span data-i18n="step_conj">${t('step_conj')}</span>(v) / |v|<sup>2</sup></div>
                <div class="step-expl-line">|v|<sup>2</sup> = ${parseFloat(n2.toFixed(3))}</div>
                <div class="step-expl-line"><span data-i18n="step_conj">${t('step_conj')}</span> = ( ${conjStr} )</div>
                <div class="step-expl-res-inv"><span data-i18n="step_res">${t('step_res')}</span> = ( ${conjStr} ) / ${parseFloat(n2.toFixed(3))}</div>
            </div>`;
};

// 4. Spiegazione Commutatore [a,b]
function explainComm(a, b) {
    const ab = vecMul(a, b);
    const ba = vecMul(b, a);
    const abStr = formatVec(ab);
    const baStr = formatVec(ba);

    return `<div class="step-expl-box step-expl-comm">
                <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> [a,b] = (a &middot; b) - (b &middot; a)</div>
                <div style="margin-top:5px;">1. <span data-i18n="step_calc">${t('step_calc')}</span> A&middot;B = <span style="color:#88ffff">${abStr}</span></div>
                <div>2. <span data-i18n="step_calc">${t('step_calc')}</span> B&middot;A = <span style="color:#ff88ff">${baStr}</span></div>
                <div style="margin-top:4px; border-top:1px solid #444; padding-top:4px;">
                    3. <span data-i18n="step_sub">${t('step_sub')}</span> (<span style="color:#88ffff">${abStr}</span>) - (<span style="color:#ff88ff">${baStr}</span>)
                </div>
            </div>`;
};

// 5. Spiegazione Associatore [a,b,c]
function explainAssoc(a, b, c) {
    const ab = vecMul(a, b);
    const ab_c = vecMul(ab, c); 

    const bc = vecMul(b, c);
    const a_bc = vecMul(a, bc); 

    const t1 = formatVec(ab_c);
    const t2 = formatVec(a_bc);

    return `<div class="step-expl-box step-expl-assoc">
                <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> [a,b,c] = (a&middot;b)&middot;c - a&middot;(b&middot;c)</div>
                <div style="margin-top:5px;">1. <span data-i18n="step_group">${t('step_group')}</span> (AB)C:</div>
                <div style="padding-left:10px; color:#888;">a&middot;b = ${formatVec(ab)}</div>
                <div style="padding-left:10px; color:#88ffff;"><span data-i18n="step_res">${t('step_res')}</span> (AB)C = ${t1}</div>
                
                <div style="margin-top:5px;">2. <span data-i18n="step_group">${t('step_group')}</span> A(BC):</div>
                <div style="padding-left:10px; color:#888;">b&middot;c = ${formatVec(bc)}</div>
                <div style="padding-left:10px; color:#ff88ff;"><span data-i18n="step_res">${t('step_res')}</span> A(BC) = ${t2}</div>

                <div style="margin-top:4px; border-top:1px solid #444; padding-top:4px;">
                    3. <span data-i18n="step_sub">${t('step_sub')}</span> (<span style="color:#88ffff">${t1}</span>) - (<span style="color:#ff88ff">${t2}</span>)
                </div>
            </div>`;
};

// 6. Spiegazione Prodotto Scalare <a,b>
function explainDot(a, b) {
    let products = [];
    let sum = 0;
    a.forEach((valA, i) => {
        const valB = b[i];
        if (Math.abs(valA) > EPSILON && Math.abs(valB) > EPSILON) {
            products.push(`(${parseFloat(valA.toFixed(3))}) &middot; (${parseFloat(valB.toFixed(3))})`);
            sum += valA * valB;
        }
    });
    
    if (products.length === 0) {
        return `<div class="step-expl-box step-expl-dot">
                    <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> &lang;a,b&rang; = &sum; a<sub>i</sub>b<sub>i</sub></div>
                    <div class="step-expl-res" style="margin-top:3px;">= 0</div>
                </div>`;
    }
    
    return `<div class="step-expl-box step-expl-dot">
                <div class="step-expl-formula"><span data-i18n="step_formula">${t('step_formula')}</span> &lang;a,b&rang; = &sum; a<sub>i</sub>b<sub>i</sub></div>
                <div class="step-expl-line">${products.join(' + ')}</div>
                <div class="step-expl-res">= ${parseFloat(sum.toFixed(4))}</div>
            </div>`;
};

// --- FUNZIONE PRINCIPALE CALCSTEPS ---
export function calcSteps() {
    resetRandCache(); 
    saveVar(currentVar);
    const disp = CalcBridge.getElementById('expression-display');
    let val = disp.value.trim();

    const bracketResult = autoCloseBrackets(val);
    val = bracketResult.fixedVal;

    if (!val) {
        const resDisp = CalcBridge.getElementById('result-display');
        if (resDisp) {
            resDisp.setAttribute('data-i18n', 'step_err_empty');
            resDisp.innerText = t('step_err_empty');
            resDisp.style.color = '#0088ff';
        }
        return;
    }

    if (val.includes('=?') || val.includes('?=') || val.includes('==')) {
        stepsContent.innerHTML = `<div style="text-align:center; padding:20px; color:#ffaa00; font-style:italic;" data-i18n="step_err_cmp">${t('step_err_cmp')}</div>`;
        stepsOverlay.style.display = 'flex';
        return;
    }

    if (val.includes('=')) {
        const parts = val.split('=');
        val = parts[parts.length - 1].trim(); 
    }

    val = preprocessExpr(val);

    try {
        const log = evaluateExpression(val, true);

        stepsContent.innerHTML = '';
        if (!log || log.length === 0) {
            stepsContent.innerHTML = `<div style="text-align:center; padding:20px; color:#aaa; font-style:italic;" data-i18n="step_err_no_step">${t('step_err_no_step')}</div>`;
        } else {
            log.forEach((step, i) => {
                let argsHtml = '';
                let detailHtml = '';

                if (step.args.length === 3 && (step.op === 'comm3' || step.op === '[a,b,c]')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">[</span> 
                                        <span class="step-val">${formatVec(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${formatVec(step.args[1])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${formatVec(step.args[2])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">]</span>`;
                }
                else if (step.args.length === 2 && (step.op === 'dot' || step.op === '<a,b>')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">&lang;</span> 
                                        <span class="step-val">${formatVec(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${formatVec(step.args[1])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">&rang;</span>`;
                }
                else if (step.args.length === 2 && (step.op === 'dot' || step.op === '<a,b>' || step.op === '&lt;a,b&gt;' || step.op === '&lang;a,b&rang;')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">&lang;</span> 
                                        <span class="step-val">${formatVec(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${formatVec(step.args[1])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">&rang;</span>`;
                }
                else if (step.args.length === 2 && (step.op === 'comm2' || step.op === '[a,b]')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">[</span> 
                                        <span class="step-val">${formatVec(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${formatVec(step.args[1])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">]</span>`;
                }
                else if (step.args.length === 2) {
                    const v1Str = formatVec(step.args[0]);
                    const v2Str = formatVec(step.args[1]);
                    if (step.op === '^') {
                        argsHtml = `<span class="step-val">(${v1Str})</span><span class="step-op" style="margin:0 2px;"><sup>${v2Str}</sup></span>`;
                    } else {
                        argsHtml = `<span class="step-val">(${v1Str})</span> <span class="step-op">${step.op}</span> <span class="step-val">(${v2Str})</span>`;
                    }
                }
                else {
                    if (step.op === 'Neg') {
                        argsHtml = `<span class="step-op">-</span><span class="step-val">(${formatVec(step.args[0])})</span>`;
                    } else {
                        argsHtml = `${step.op}(` + step.args.map(a => formatVec(a)).join(', ') + `)`;
                    }
                }

                if (step.op === '*' || step.op === 'mul') {
                    detailHtml = explainMul(step.args[0], step.args[1]);
                } else if (step.op === 'norm') {
                    detailHtml = explainNorm(step.args[0]);
                } else if (step.op === 'dot' || step.op === '<a,b>' || step.op === '&lt;a,b&gt;' || step.op === '&lang;a,b&rang;') {
                    detailHtml = explainDot(step.args[0], step.args[1]);
                } else if (step.op === 'inv') {
                    detailHtml = explainInv(step.args[0]);
                } else if (step.op === 'comm2' || step.op === '[a,b]') {
                    detailHtml = explainComm(step.args[0], step.args[1]);
                } else if (step.op === 'comm3' || step.op === '[a,b,c]') {
                    detailHtml = explainAssoc(step.args[0], step.args[1], step.args[2]);
                }

                const row = document.createElement('div');
                row.className = 'step-row';
                row.innerHTML = `
                            <div class="step-idx"><span data-i18n="step_pass">${t('step_pass')}</span> ${i + 1}</div>
                            <div style="display:flex; flex-wrap:wrap; align-items:center; margin-bottom:4px;">
                                ${argsHtml}
                                <span class="step-arrow">&#10142;</span>
                                <span class="step-res">${formatVec(step.res)}</span>
                            </div>
                            ${detailHtml}
                        `;
                stepsContent.appendChild(row);
            });
        }
        stepsOverlay.style.display = 'flex';

    } catch (e) {
        stepsContent.innerHTML = `<div style="text-align:center; padding:20px; color:#0088ff; font-style:italic;"><span data-i18n="step_err_eval">${t('step_err_eval')}</span><br><span style="font-size:12px; color:#888; margin-top:8px; display:block;">${e}</span></div>`;
        stepsOverlay.style.display = 'flex';
        console.error(e);
    }
};