import { isMobile, zManager, ALGEBRAS } from '../core/constants.js';
import { t } from '../core/i18n.js';
import { updateZeroDivisorUI } from './calculator_zerodiv.js';
import { openCalculator } from './calculator_window.js';
import { resetCalcHelperPage } from '../ui/mobile.js';
import { switchVar, setGrid, saveVar, updateGridVisibility } from './calculator_ui.js';
import { createZeroVector } from '../math/parser.js';
import { CalcBridge } from './calculator_popout.js';
import { calcAction } from './calculator_core.js';

export function updateCalcUI(limitIndex) {
    const fContainer = CalcBridge.getElementById('calc-formula-menu');
    updateZeroDivisorUI(limitIndex);

    if (fContainer) {
        // Array di coordinate [top, left] per generare proceduralmente gli esagoni decorativi
        // Array di coordinate [top, left] per generare proceduralmente gli esagoni decorativi
        const decorCoords = [
            // Primo anello (originale, attorno ai tasti)
            [-78, 115], [-28, 201], [22, 287], [122, 287], [222, 287], [272, 201],
            [322, 115], [272, 29], [222, -57], [122, -57], [22, -57], [-28, 29],
            // Espansione Sinistra (Colonna -3)
            [-28, -143], [72, -143], [172, -143], [272, -143],
            // Espansione Destra (Colonna +3)
            [-28, 373], [72, 373], [172, 373], [272, 373],
            // Espansione Sinistra Estrema (Colonna -4)
            [22, -229], [122, -229], [222, -229],
            // Espansione Destra Estrema (Colonna +4)
            [22, 459], [122, 459], [222, 459],
            // --- I TUOI 8 ESAGONI PER RIEMPIRE I BUCHI ---
            [-78, -229], [322, -229], // Colonna sinistra esterna (Top / Bottom)
            [-78, -57],  [322, -57],  // Colonna sinistra interna (Top / Bottom)
            [-78, 287],  [322, 287],  // Colonna destra interna (Top / Bottom)
            [-78, 459],  [322, 459]   // Colonna destra esterna (Top / Bottom)
        ];

        // Creazione compatta dell'HTML per le decorazioni tramite ciclo
        const decorHTML = decorCoords.map(c => 
            `<div class="hex-decor" style="top: ${c[0]}px; left: ${c[1]}px;">
                <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" /></svg>
            </div>`
        ).join('');

        const explanationHTML = `
            <div id="formula-explanation-panel" class="zd-panel-overlay-style" style="display:none; position:absolute; z-index:50; background:#181818; width:100%; height:100%; padding:15px; overflow-y:auto; box-sizing:border-box;">
                <h3 style="color:#00aaff; margin-top:0;" data-i18n="sw_formulas">${t('sw_formulas')}</h3>
                <ul style="color:#ddd; padding-left:20px; line-height:1.6; font-size:14px;">
                    <li style="margin-bottom:8px;" data-i18n="form_exp_ortho">${t('form_exp_ortho')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_quat">${t('form_exp_quat')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_oct1">${t('form_exp_oct1')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_oct2">${t('form_exp_oct2')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_sed1">${t('form_exp_sed1')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_sed2">${t('form_exp_sed2')}</li>
                    <li style="margin-bottom:8px;" data-i18n="form_exp_sed3">${t('form_exp_sed3')}</li>
                </ul>
            </div>
        `;

        fContainer.innerHTML = `
            <style>
                .formula-honeycomb { position: relative; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 10px; box-sizing: border-box; overflow: hidden; }
                .hex-grid { position: relative; width: 340px; height: 340px; flex-shrink: 0; }
                .hex-btn, .hex-decor { position: absolute; width: 110px; height: 96px; }
                .hex-btn { cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); z-index: 5; }
                .hex-btn:hover { transform: scale(1.1); filter: drop-shadow(0 0 15px currentColor); z-index: 10; }
                .hex-btn svg, .hex-decor svg { width: 100%; height: 100%; }
                .hex-btn polygon { fill: rgba(20, 20, 25, 0.98); stroke-width: 2.5; }
                .hex-decor polygon { fill: transparent; stroke: rgba(255, 255, 255, 0.15); stroke-width: 2; }
                .hex-decor { z-index: 1; pointer-events: none; }
                .hex-content { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: none; padding: 8px; box-sizing: border-box; }
                .hex-symbol { font-weight: bold; font-size: 15px; position: absolute; top: 8px; opacity: 0.9; }
                .hex-formula { font-family: 'Times New Roman', serif; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; }
                .hex-desc { font-size: 9px; opacity: 0.7; text-transform: uppercase; text-align: center; line-height: 1.2; position: absolute; bottom: 10px; }
                .hex-center { top: 122px; left: 115px; } .hex-top { top: 22px; left: 115px; } .hex-tr { top: 72px; left: 201px; } .hex-br { top: 172px; left: 201px; } .hex-bottom { top: 222px; left: 115px; } .hex-bl { top: 172px; left: 29px; } .hex-tl { top: 72px; left: 29px; }
            </style>
            ${explanationHTML}
            <div class="formula-honeycomb">
                <div class="hex-grid">
                    ${decorHTML}
                    <div class="hex-btn hex-center" style="color: #00aaff;" data-action="formula" data-alg="${ALGEBRAS.SEDENIONS}" data-expr="<[a,b],a>" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#00aaff" /></svg>
                        <div class="hex-content"><span class="hex-formula" style="white-space: nowrap; font-size: 14px; font-weight: normal;">&lang;<strong>[a,b],a</strong>&rang; = 0</span><span class="hex-desc" data-i18n="form_ortho">${t('form_ortho')}</span></div>
                    </div>
                    <div class="hex-btn hex-top" style="color: #aaaaff;" data-action="formula" data-alg="${ALGEBRAS.QUATERNIONS}" data-expr="[a,b]" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#aaaaff" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x210D;</span><span class="hex-formula">[a,b] &ne; 0</span><span class="hex-desc" data-i18n="form_non_comm_br">${t('form_non_comm_br')}</span></div>
                    </div>
                    <div class="hex-btn hex-tr" style="color: #aaffaa;" data-action="formula" data-alg="${ALGEBRAS.OCTONIONS}" data-expr="[a,b,c]" data-vars="a,b,c">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#aaffaa" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x1D546;</span><span class="hex-formula">[a,b,c] &ne; 0</span><span class="hex-desc" data-i18n="form_non_assoc_br">${t('form_non_assoc_br')}</span></div>
                    </div>
                    <div class="hex-btn hex-tl" style="color: #aaffaa;" data-action="formula" data-alg="${ALGEBRAS.OCTONIONS}" data-expr="[a,a,b]" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#aaffaa" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x1D546;</span><span class="hex-formula">[a,a,b] = 0</span><span class="hex-desc" data-i18n="form_alt_br">${t('form_alt_br')}</span></div>
                    </div>
                    <div class="hex-btn hex-br" style="color: #ffaaaa;" data-action="formula" data-alg="${ALGEBRAS.SEDENIONS}" data-expr="[a,a,b]" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#ffaaaa" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x1D54A;</span><span class="hex-formula">[a,a,b] &ne; 0</span><span class="hex-desc" data-i18n="form_non_alt_br">${t('form_non_alt_br')}</span></div>
                    </div>
                    <div class="hex-btn hex-bottom" style="color: #ffaaaa;" data-action="formula" data-alg="${ALGEBRAS.SEDENIONS}" data-expr="norm(a*b)=?norm(a)*norm(b)" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#ffaaaa" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x1D54A;</span><span class="hex-formula" style="white-space: nowrap; letter-spacing: -0.5px; font-size: 12px;">|a&middot;b| &ne; |a|&middot;|b|</span><span class="hex-desc" data-i18n="form_non_norm">${t('form_non_norm')}</span></div>
                    </div>
                    <div class="hex-btn hex-bl" style="color: #ffaaaa;" data-action="formula" data-alg="${ALGEBRAS.SEDENIONS}" data-expr="[a,b,a]" data-vars="a,b">
                        <svg viewBox="0 0 110 95.3"><polygon points="27.5,0 82.5,0 110,47.6 82.5,95.3 27.5,95.3 0,47.6" stroke="#ffaaaa" /></svg>
                        <div class="hex-content"><span class="hex-symbol">&#x1D54A;</span><span class="hex-formula">[a,b,a] = 0</span><span class="hex-desc" data-i18n="form_flex_br">${t('form_flex_br')}</span></div>
                    </div>
                </div>
            </div>
        `;
    }
}

export function initFormulasMenu() {
    const formulasMenuContainer = CalcBridge.getElementById('calc-formula-menu');
    
    if (formulasMenuContainer) {
        formulasMenuContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.hex-btn[data-action="formula"]');
            if (!btn) return;
            
            const alg = parseInt(btn.dataset.alg);
            const expr = btn.dataset.expr;
            const vars = btn.dataset.vars.split(',');

            // Su mobile non nascondiamo il menu formule, per permettere ulteriori test
            if (!isMobile()) {
                formulasMenuContainer.classList.remove('visible');
            }

            const zdOverlay = CalcBridge.getElementById('zerodiv-overlay');
            const zdBtn = CalcBridge.getElementById('calc-zerodiv-btn');
            if (zdOverlay) zdOverlay.classList.remove('visible');
            if (zdBtn) zdBtn.classList.remove('active');

            if (!isMobile()) {
                openCalculator(true);
            }


            updateGridVisibility();

            vars.forEach(vName => {
                switchVar(vName);
                const v = createZeroVector();
                for (let i = 0; i <= alg; i++) v[i] = Math.floor(Math.random() * 21) - 10;
                setGrid(v);
                saveVar(vName);
            });

            const disp = CalcBridge.getElementById('expression-display');
            if (disp) {
                disp.value = expr;
                disp.dispatchEvent(new Event('input'));
            }
            calcAction('eval', true);
        });
    }

    const formulasBtn = CalcBridge.getElementById('calc-formulas-btn');
    const formulasMenu = CalcBridge.getElementById('calc-formula-menu');
    const dockFormulasBtn = CalcBridge.getElementById('dock-formulas-btn');

    if (formulasMenu) {
        const toggleFormulas = (e) => {
            e.stopPropagation();
            const calcModalEl = CalcBridge.getElementById('calc-modal');
            const isMobileNow = isMobile();

            if (formulasMenu.innerHTML.trim() === '') updateCalcUI(ALGEBRAS.SEDENIONS);

            if (isMobileNow && e.currentTarget === dockFormulasBtn) {
                const wasActive = dockFormulasBtn.classList.contains('active');

                calcModalEl.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
                CalcBridge.getElementById('calc-toggle-btn').classList.remove('active');
                formulasMenu.classList.remove('visible');
                if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');

                const zdOverlay = CalcBridge.getElementById('zerodiv-overlay');
                if (zdOverlay) zdOverlay.classList.remove('visible');
                const dockZdBtn = CalcBridge.getElementById('dock-zerodiv-btn');
                if (dockZdBtn) dockZdBtn.classList.remove('active');
                const zdBtnCalc = CalcBridge.getElementById('calc-zerodiv-btn');
                if (zdBtnCalc) zdBtnCalc.classList.remove('active');

                if (!wasActive) {
                    dockFormulasBtn.classList.add('active');
                    calcModalEl.classList.add('active', 'formulas-mobile-mode');
                    calcModalEl.style.zIndex = zManager.next();
                    formulasMenu.classList.add('visible');
                }
            } else {
                if (!calcModalEl.classList.contains('active')) {
                    openCalculator(true);
                }
                formulasMenu.classList.toggle('visible');
            }
        };

        if (formulasBtn) formulasBtn.addEventListener('click', toggleFormulas);
        if (dockFormulasBtn) dockFormulasBtn.addEventListener('click', toggleFormulas);

        document.addEventListener('click', (e) => {
            if (formulasMenu.classList.contains('visible') && !formulasMenu.contains(e.target) && e.target !== formulasBtn && e.target !== dockFormulasBtn) {
                formulasMenu.classList.remove('visible');
                if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
                const calcModalEl = CalcBridge.getElementById('calc-modal');
                if (calcModalEl && calcModalEl.classList.contains('formulas-mobile-mode')) {
                    calcModalEl.classList.remove('active', 'formulas-mobile-mode');
                }
            }
        });
    }

    const calcHelperBtn = CalcBridge.getElementById('calc-helper-btn');
    const calcHelperOverlay = CalcBridge.getElementById('calc-helper-overlay');
    const closeCalcHelperBtn = CalcBridge.getElementById('close-calc-helper');
    const calcHelperCheckMobile = CalcBridge.getElementById('calc-helper-check-mobile');

    if (calcHelperOverlay && closeCalcHelperBtn) {
        closeCalcHelperBtn.addEventListener('click', () => {
            calcHelperOverlay.style.display = 'none';
            if (calcHelperCheckMobile) calcHelperCheckMobile.checked = false;
        });
    }

    if (calcHelperBtn && calcHelperOverlay) {
        calcHelperBtn.addEventListener('click', () => {
            const calcModalEl = CalcBridge.getElementById('calc-modal');
            if (!calcModalEl.classList.contains('active')) openCalculator(true);
            
            calcHelperOverlay.style.display = calcHelperOverlay.style.display === 'none' || !calcHelperOverlay.style.display ? 'flex' : 'none';

            if (calcHelperOverlay.style.display === 'flex') {
                resetCalcHelperPage();
            }
        });
    }

    if (calcHelperCheckMobile && calcHelperOverlay) {
        calcHelperCheckMobile.addEventListener('change', (e) => {
            if (e.target.checked) {
                calcHelperOverlay.style.display = 'flex';
                resetCalcHelperPage();
            } else {
                calcHelperOverlay.style.display = 'none';
            }
        });
    }
}