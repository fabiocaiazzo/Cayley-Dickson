import { currentAlgState, resetView } from '../main.js';
import { currentVar, saveVar } from './calculator_ui.js';
import { evaluateExpression } from '../parser.js';
import { highlightConnections } from '../graph.js';
import { t } from '../i18n.js';

// --- LOGICA PASSAGGI (STEP-BY-STEP) COMPLETA ---
const stepsOverlay = document.getElementById('steps-overlay');
const stepsContent = document.getElementById('steps-content');

document.getElementById('close-steps-btn').addEventListener('click', () => {
    stepsOverlay.style.display = 'none';
    resetView(); // Ripristina la visualizzazione normale uscendo dai passaggi
});

// FIX: Funzione globale per gestire il cambio tab nella visualizzazione passaggi
window.switchMulTab = function (uid, k, btn) {
    const container = document.getElementById(`mul-container-${uid}`);
    if (!container) return;

    // Nasconde tutti i contenuti
    container.querySelectorAll('.mul-content').forEach(el => el.style.display = 'none');
    // Mostra quello selezionato
    const target = document.getElementById(`mul-content-${uid}-${k}`);
    if (target) target.style.display = 'block';

    // Reset stile bottoni
    container.querySelectorAll('.mul-tab-btn').forEach(b => {
        b.style.background = '#333';
        b.style.color = '#888';
        b.style.borderColor = '#444';
    });
    // Attiva bottone cliccato
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
};

// 1. Spiegazione Moltiplicazione (Rifatta con layout Sedenioni e Font più grandi)
window.explainMul = function (A, B) {
    const uid = Math.floor(Math.random() * 1000000);

    let groups = new Array(16).fill(null).map(() => []);
    let activeIndices = [];

    // 1. Calcolo
    for (let i = 0; i < 16; i++) {
        if (Math.abs(A[i]) < 1e-9) continue;
        for (let j = 0; j < 16; j++) {
            if (Math.abs(B[j]) < 1e-9) continue;

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
    let html = `<div id="mul-container-${uid}" style="margin-top:8px; background:#181818; padding:10px; border-radius:6px; border-left:3px solid #555;">`;

    // --- GENERAZIONE TABS (Layout differenziato) ---
    const currentAlg = currentAlgState;

    // Funzione helper per creare un singolo bottone
    const createBtn = (k, isFirst, customStyle = "") => {
        const label = k === 0 ? "1" : `e<sub>${k}</sub>`;
        const bg = isFirst ? '#0066cc' : '#333';
        const col = isFirst ? 'white' : '#888';
        const bord = isFirst ? '#0088ff' : '#444';
        return `<button class="mul-tab-btn" 
                    onclick="switchMulTab('${uid}', ${k}, this)"
                    style="background:${bg}; color:${col}; border:1px solid ${bord}; 
                    padding:6px 2px; border-radius:4px; cursor:pointer; font-size:14px; font-weight:bold; font-family:'Times New Roman', serif; width:100%; ${customStyle}">
                    ${label}
                </button>`;
    };

    // Container header
    html += `<div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #333;">`;
    html += `<div style="font-size:13px; color:#aaa; margin-bottom:8px;">${t('step_active_comp')}</div>`;

    if (currentAlg === 15) {
        // LAYOUT SEDENIONI: GRIGLIA 6 colonne x 3 righe
        html += `<div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px;">`;

        activeIndices.forEach((k, idx) => {
            let gridArea = "";
            if (k === 0) gridArea = "1 / 1 / 2 / 2"; 
            else if (k <= 5) gridArea = `1 / ${k + 1} / 2 / ${k + 2}`; 
            else if (k <= 10) gridArea = `2 / ${k - 6 + 2} / 3 / ${k - 6 + 3}`; 
            else gridArea = `3 / ${k - 11 + 2} / 4 / ${k - 11 + 3}`; 

            html += createBtn(k, k === activeIndices[0], `grid-area: ${gridArea};`);
        });

        html += `</div>`;

    } else {
        // LAYOUT COMPATTO
        html += `<div style="display:flex; gap:2px; width:100%;">`;
        html += activeIndices.map((k, i) => createBtn(k, i === 0, "flex:1; min-width:0; padding:6px 0;")).join('');
        html += `</div>`;
    }

    html += `</div>`;

    // --- CONTENUTI ---
    activeIndices.forEach((k, i) => {
        const displayStyle = i === 0 ? 'block' : 'none';
        const label = k === 0 ? t('step_real') : `e<sub>${k}</sub>`;
        let totalSum = 0;
        let sumParts = [];

        html += `<div id="mul-content-${uid}-${k}" class="mul-content" style="display:${displayStyle}; animation: fadeIn 0.2s;">`;
        html += `<div style="color:#88ffff; font-size:16px; margin-bottom:10px; font-weight:bold;">${t('step_detail')} ${label}</div>`;

        groups[k].forEach(item => {
            html += `<div style="color:#e0e0e0; font-family:monospace; font-size:15px; margin-bottom:6px; padding-left:10px; border-left:3px solid #444; line-height:1.4;">${item.line}</div>`;
            totalSum += item.val;

            let vStr = parseFloat(item.val.toFixed(3));
            if (vStr >= 0 && sumParts.length > 0) vStr = "+ " + vStr;
            else if (vStr < 0 && sumParts.length > 0) vStr = "- " + Math.abs(vStr);
            sumParts.push(vStr);
        });

        // Somma finale
        html += `<div style="background:#252525; margin-top:12px; padding:8px; border-radius:4px; color:#fff; font-size:14px; border:1px solid #333;">`;
        if (groups[k].length > 1) {
            html += `<span style="color:#aaa;">${t('step_sum')} </span> ${sumParts.join(' ')} = <span style="color:#0f8; font-weight:bold; font-size:16px; margin-left:5px;">${parseFloat(totalSum.toFixed(3))}</span>`;
        } else {
            html += `${t('step_total')} <span style="color:#0f8; font-weight:bold; font-size:16px; margin-left:5px;">${parseFloat(totalSum.toFixed(3))}</span>`;
        }
        html += `</div></div>`;
    });

    html += `</div>`;
    return html;
};

// 2. Spiegazione Norma
window.explainNorm = function (v) {
    let squares = [];
    let sumSq = 0;
    v.forEach((val, i) => {
        if (Math.abs(val) > 1e-9) {
            squares.push(`(${parseFloat(val.toFixed(3))})<sup>2</sup>`);
            sumSq += val * val;
        }
    });
    return `<div style="margin-top:5px; background:#111; padding:8px; border-radius:4px; font-size:12px; border-left:2px solid #0088ff;">
                <div style="color:#aaa; font-style:italic;">${t('step_formula')} &radic;(&sum; v<sub>i</sub><sup>2</sup>)</div>
                <div style="color:#ddd; margin-top:3px;">&radic;( ${squares.join(' + ')} )</div>
                <div style="color:#ddd;">= &radic;( ${parseFloat(sumSq.toFixed(4))} )</div>
                <div style="color:#0f8; font-weight:bold; margin-top:2px;">= ${Math.sqrt(sumSq).toFixed(4)}</div>
            </div>`;
};

// 3. Spiegazione Inverso
window.explainInv = function (v) {
    let n2 = 0;
    v.forEach(val => n2 += val * val);
    const conjStr = window.formatVecGlobal(vecConj(v));
    return `<div style="margin-top:5px; background:#111; padding:8px; border-radius:4px; font-size:12px; border-left:2px solid #ffaa00;">
                <div style="color:#aaa; font-style:italic;">${t('step_formula')} v<sup>-1</sup> = ${t('step_conj').toLowerCase()}(v) / |v|<sup>2</sup></div>
                <div style="color:#ddd; margin-top:3px;">|v|<sup>2</sup> = ${parseFloat(n2.toFixed(3))}</div>
                <div style="color:#ddd;">${t('step_conj')} = ( ${conjStr} )</div>
                <div style="color:#fff; margin-top:3px;">${t('step_res')} = ( ${conjStr} ) / ${parseFloat(n2.toFixed(3))}</div>
            </div>`;
};

// 4. Spiegazione Commutatore [a,b]
window.explainComm = function (a, b) {
    const ab = vecMul(a, b);
    const ba = vecMul(b, a);
    const abStr = window.formatVecGlobal(ab);
    const baStr = window.formatVecGlobal(ba);

    return `<div style="margin-top:5px; background:#111; padding:8px; border-radius:4px; font-size:12px; border-left:2px solid #ff5555;">
                <div style="color:#aaa; font-style:italic;">${t('step_formula')} [a,b] = (a &middot; b) - (b &middot; a)</div>
                <div style="margin-top:5px;">1. ${t('step_calc')} A&middot;B = <span style="color:#88ffff">${abStr}</span></div>
                <div>2. ${t('step_calc')} B&middot;A = <span style="color:#ff88ff">${baStr}</span></div>
                <div style="margin-top:4px; border-top:1px solid #444; padding-top:4px;">
                    3. ${t('step_sub')} (<span style="color:#88ffff">${abStr}</span>) - (<span style="color:#ff88ff">${baStr}</span>)
                </div>
            </div>`;
};

// 5. Spiegazione Associatore [a,b,c]
window.explainAssoc = function (a, b, c) {
    const ab = vecMul(a, b);
    const ab_c = vecMul(ab, c); 

    const bc = vecMul(b, c);
    const a_bc = vecMul(a, bc); 

    const t1 = window.formatVecGlobal(ab_c);
    const t2 = window.formatVecGlobal(a_bc);

    return `<div style="margin-top:5px; background:#111; padding:8px; border-radius:4px; font-size:12px; border-left:2px solid #aa55ff;">
                <div style="color:#aaa; font-style:italic;">${t('step_formula')} [a,b,c] = (a&middot;b)&middot;c - a&middot;(b&middot;c)</div>
                <div style="margin-top:5px;">1. ${t('step_group')} (AB)C:</div>
                <div style="padding-left:10px; color:#888;">a&middot;b = ${window.formatVecGlobal(ab)}</div>
                <div style="padding-left:10px; color:#88ffff;">${t('step_res')} (AB)C = ${t1}</div>
                
                <div style="margin-top:5px;">2. ${t('step_group')} A(BC):</div>
                <div style="padding-left:10px; color:#888;">b&middot;c = ${window.formatVecGlobal(bc)}</div>
                <div style="padding-left:10px; color:#ff88ff;">${t('step_res')} A(BC) = ${t2}</div>

                <div style="margin-top:4px; border-top:1px solid #444; padding-top:4px;">
                    3. ${t('step_sub')} (<span style="color:#88ffff">${t1}</span>) - (<span style="color:#ff88ff">${t2}</span>)
                </div>
            </div>`;
};

// --- FUNZIONE PRINCIPALE CALCSTEPS ---
window.calcSteps = function () {
    window.randCacheIndex = 0; 
    saveVar(currentVar);
    const disp = document.getElementById('expression-display');
    let val = disp.value.trim();

    if (!val) return;

    if (val.includes('=?') || val.includes('?=') || val.includes('==')) {
        stepsContent.innerHTML = `<div style="text-align:center; padding:20px; color:#ffaa00; font-style:italic;">${t('step_err_cmp')}</div>`;
        stepsOverlay.style.display = 'flex';
        return;
    }

    if (val.includes('=')) {
        const parts = val.split('=');
        val = parts[parts.length - 1].trim(); 
    }

    val = window.preprocessExpr(val);

    try {
        const log = evaluateExpression(val, true);

        stepsContent.innerHTML = '';
        if (!log || log.length === 0) {
            stepsContent.innerHTML = `<div style="text-align:center; padding:20px; color:#aaa; font-style:italic;">${t('step_err_no_step')}</div>`;
        } else {
            log.forEach((step, i) => {
                let argsHtml = '';
                let detailHtml = '';

                if (step.args.length === 3 && (step.op === 'comm3' || step.op === '[a,b,c]')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">[</span> 
                                        <span class="step-val">${window.formatVecGlobal(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${window.formatVecGlobal(step.args[1])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${window.formatVecGlobal(step.args[2])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">]</span>`;
                }
                else if (step.args.length === 2 && (step.op === 'comm2' || step.op === '[a,b]')) {
                    argsHtml = `<span class="step-op" style="font-size:1.3em; margin-right:2px;">[</span> 
                                        <span class="step-val">${window.formatVecGlobal(step.args[0])}</span> <span class="step-op" style="color:#888;">,</span> 
                                        <span class="step-val">${window.formatVecGlobal(step.args[1])}</span> 
                                        <span class="step-op" style="font-size:1.3em; margin-left:2px;">]</span>`;
                }
                else if (step.args.length === 2) {
                    const v1Str = window.formatVecGlobal(step.args[0]);
                    const v2Str = window.formatVecGlobal(step.args[1]);
                    if (step.op === '^') {
                        argsHtml = `<span class="step-val">(${v1Str})</span><span class="step-op" style="margin:0 2px;"><sup>${v2Str}</sup></span>`;
                    } else {
                        argsHtml = `<span class="step-val">(${v1Str})</span> <span class="step-op">${step.op}</span> <span class="step-val">(${v2Str})</span>`;
                    }
                }
                else {
                    if (step.op === 'Neg') {
                        argsHtml = `<span class="step-op">-</span><span class="step-val">(${window.formatVecGlobal(step.args[0])})</span>`;
                    } else {
                        argsHtml = `${step.op}(` + step.args.map(a => window.formatVecGlobal(a)).join(', ') + `)`;
                    }
                }

                if (step.op === '*' || step.op === 'mul') {
                    detailHtml = window.explainMul(step.args[0], step.args[1]);
                } else if (step.op === 'norm') {
                    detailHtml = window.explainNorm(step.args[0]);
                } else if (step.op === 'inv') {
                    detailHtml = window.explainInv(step.args[0]);
                } else if (step.op === 'comm2' || step.op === '[a,b]') {
                    detailHtml = window.explainComm(step.args[0], step.args[1]);
                } else if (step.op === 'comm3' || step.op === '[a,b,c]') {
                    detailHtml = window.explainAssoc(step.args[0], step.args[1], step.args[2]);
                }

                const row = document.createElement('div');
                row.className = 'step-row';
                row.innerHTML = `
                            <div class="step-idx">${t('step_pass')} ${i + 1}</div>
                            <div style="display:flex; flex-wrap:wrap; align-items:center; margin-bottom:4px;">
                                ${argsHtml}
                                <span class="step-arrow">&#10142;</span>
                                <span class="step-res">${window.formatVecGlobal(step.res)}</span>
                            </div>
                            ${detailHtml}
                        `;
                stepsContent.appendChild(row);
            });
        }
        stepsOverlay.style.display = 'flex';

    } catch (e) {
        alert(t('step_err_catch') + " " + e);
        console.error(e);
    }
};