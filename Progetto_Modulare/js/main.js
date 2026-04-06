import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Importiamo gli oggetti fondamentali della scena 3D dal nuovo file
import {
    container, scene, camera, initialCameraPos, renderer, labelRenderer, controls,
    v_e5, v_e6, v_e7, v_e12, pts, pointObjects, selectedNodesForClosure,
    sphereGeom, sphereMat, sphereMatCenter, sphereMatSelected,
    animatedMaterials, tripletVisuals, animParams, flowVertexShader, neonFragmentShader
} from './scene.js';

// Importiamo la logica della tabella
import { tableState, buildTable, activateTripletFromTable, updateTableVis } from './table.js';
// Importiamo le funzioni del grafo
import {
    updateCycleColors, visualizeTripletByIndex, animateCameraToDefault,
    animateCameraToFanoPlane, visualizeFanoPlane, highlightConnections,
    highlightSingleTriplet, activeFanoIndex, setActiveFanoIndex
} from './graph.js';

// Inizializza la profondità iniziale per portare sempre in primo piano l'ultima finestra cliccata
window.highestZIndex = 2000;

// Importiamo il modulo per inizializzare la Sidebar
import { initSidebar } from './sidebar.js';

// Importiamo la logica e il gruppo 3D dei Trigintaduenioni
import { graph32Group, toggle32Ions, buildPG32Graph, build32IonGraph } from './ions32.js';
window.toggle32Ions = toggle32Ions;
window.buildPG32Graph = buildPG32Graph;

// Inizializziamo gli eventi e i listener mobile (Swipe / Carousel)
import './mobile.js';
// Importiamo l'inizializzazione della UI Globale (Sfondi, Impostazioni, Help)
import { initUI, starField, gridHelper } from './ui.js';
// Importiamo il motore matematico e le variabili di memoria
import { storedVars, storedAns, evaluateExpression, validateAssociativity } from './parser.js';
// Importiamo i moduli della calcolatrice
import { currentVar, saveVar, setGrid, switchVar, updateGridVisibility } from './calculator/calculator_ui.js';
import './calculator/calculator_steps.js';
import './calculator/calculator_input.js';
import './calculator/calculator_kernel.js';
import './calculator/calculator_core.js';
import { closeHistory } from './calculator/calculator_history.js';
import './calculator/calculator_popout.js';
import { updateZeroDivisorUI, initZeroDivisorListeners } from './calculator/calculator_zerodiv.js';
import { t } from './i18n.js';

// --- UI LOGIC ---
// Riferimento al testo del titolo (per aggiornamenti dinamici come Divisori Zero)
const titleElem = document.getElementById('alg-title-text');
// Abilita interazione sul titolo (necessario perché il parent #top-bar ha pointer-events: none)
titleElem.style.pointerEvents = "auto";
titleElem.style.cursor = "pointer"; // Indica visivamente che l'area è interattiva

export const tripletButtons = [];
export const fanoButtons = [];
export let currentAlgState = 15;
export function setCurrentAlgState(val) { currentAlgState = val; }

// --- FORMULA DEMO LOGIC ---
window.runFormulaDemo = function (alg, expr, vars) {
    // Chiude il menu formule se aperto
    const fMenu = document.getElementById('calc-formula-menu');
    if (fMenu) fMenu.classList.remove('visible');

    // Chiude l'overlay dei divisori zero se è aperto
    const zdOverlay = document.getElementById('zerodiv-overlay');
    const zdBtn = document.getElementById('calc-zerodiv-btn');
    if (zdOverlay) zdOverlay.classList.remove('visible');
    if (zdBtn) zdBtn.classList.remove('active');

    // 1. Apri e Configura Calcolatrice
    openCalculator(true);
    updateGridVisibility();

    // 2. Genera Variabili Random (solo per quelle richieste)
    vars.forEach(vName => {
        switchVar(vName);
        const v = createZeroVector();
        // Random tra -10 e 10
        for (let i = 0; i <= alg; i++) v[i] = Math.floor(Math.random() * 21) - 10;
        setGrid(v);
        saveVar(vName);
    });

    // 3. Imposta l'espressione e calcola
    const disp = document.getElementById('expression-display');
    disp.value = expr;
    calcAction('eval');
};

// --- LOGICA CAMBIO ALGEBRA AGGIORNATA ---
function updateAlgebraState(forcedState) {
    // FIX BUG: Se siamo nei 32-ioni, usciamo spegnendo il loro grafo speciale
    if (window.is32IonMode) {
        window.toggle32Ions();
    }

    // FIX: Pulisci completamente la selezione nodi per chiusura algebrica
    // per evitare che rimangano nodi "blu" (selezionati) nel nuovo contesto.
    if (typeof selectedNodesForClosure !== 'undefined') {
        selectedNodesForClosure.clear();
        // Aggiorna anche la visibilità del bottone generatore nella dock
        const genBtn = document.getElementById('closure-generator-btn');
        const genDiv = document.getElementById('closure-divider');
        if (genBtn) genBtn.style.display = 'none';
        if (genDiv) genDiv.style.display = 'none';
    }

    if (forcedState) currentAlgState = forcedState;
    else {
        // Ciclo automatico se nessun valore forzato
        if (currentAlgState === 3) currentAlgState = 7; // H -> O
        else if (currentAlgState === 7) currentAlgState = 15; // O -> S
        else currentAlgState = 3; // S -> H
    }
    resetView(); // Aggiorna tutto (inclusa la UI)
    if (typeof forceUpdate === 'function') forceUpdate();
}

// Listener Click sui singoli cerchietti (H, O, S) e Menu Mobile
document.querySelectorAll('.alg-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita che il click si propaghi al contenitore padre

        // Gestione apertura/chiusura Menu Mobile
        if (dot.id === 'alg-mobile-trigger') {
            document.getElementById('alg-dots-list').classList.toggle('open');
            return;
        }

        // Se clicco un'algebra, chiudo il menu mobile
        const menu = document.getElementById('alg-dots-list');
        if (menu) menu.classList.remove('open');

        const target = parseInt(dot.dataset.target);
        if (!isNaN(target)) updateAlgebraState(target);
    });
});

// Chiude il menu mobile se si clicca in un punto qualsiasi dello schermo
document.addEventListener('click', (e) => {
    const menu = document.getElementById('alg-dots-list');
    if (menu && menu.classList.contains('open') && !e.target.closest('.alg-dots-wrapper')) {
        menu.classList.remove('open');
    }
});

// Listener Click sul contenitore (Ciclo sequenziale su Desktop, Apertura Menu su Mobile)
document.getElementById('algebra-switch').addEventListener('click', (e) => {
    if (window.innerWidth > 768) {
        updateAlgebraState(null);
    } else {
        // Su mobile/finestra ridotta, cliccare sull'intero contenitore apre la tendina
        e.stopPropagation();
        const menu = document.getElementById('alg-dots-list');
        if (menu) menu.classList.toggle('open');
    }
});

// Inizializzazione
filterSubspace(15);

export function filterSubspace(limitIndex) {
    // 0. FIX BUG: Pulisci la selezione dai nodi fuori dal limite attuale
    if (typeof selectedNodesForClosure !== 'undefined') {
        // Rimuovi nodi non validi
        const nodesToRemove = [];
        selectedNodesForClosure.forEach(id => {
            if (id > limitIndex) nodesToRemove.push(id);
        });
        nodesToRemove.forEach(id => selectedNodesForClosure.delete(id));

        // Aggiorna UI del bottone (nascondilo se vuoto o aggiorna numero)
        const genBtn = document.getElementById('closure-generator-btn');
        const genDiv = document.getElementById('closure-divider');
        const badge = document.getElementById('closure-badge');

        if (genBtn && badge && genDiv) {
            const count = selectedNodesForClosure.size;
            if (count > 0) {
                genBtn.style.display = 'flex';
                genDiv.style.display = 'block';
                badge.innerText = count;
            } else {
                genBtn.style.display = 'none';
                genDiv.style.display = 'none';
            }
        }
    }

    // 1. Aggiorna Testo Titolo (Pulito, senza simboli) e Tasto Mobile
    const titleTextElem = document.getElementById('alg-title-text');
    const mobileTrigger = document.getElementById('alg-mobile-trigger');

    if (limitIndex === 3) {
        titleTextElem.innerHTML = t('alg_quat');
        if (mobileTrigger) mobileTrigger.innerHTML = "ℍ";
    }
    else if (limitIndex === 7) {
        titleTextElem.innerHTML = t('alg_oct');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕆";
    }
    else {
        titleTextElem.innerHTML = t('alg_sed');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕊";
    }

    // 2. Aggiorna Cerchietti Attivi
    document.querySelectorAll('.alg-dot').forEach(dot => {
        if (dot.id === 'alg-mobile-trigger') return; // Ignora il tasto trigger mobile per la classe active
        const target = parseInt(dot.dataset.target);
        if (target === limitIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    // 3. LOGICA GRAFICA (RIPRISTINATA)
    let tripletCount = 35;
    if (limitIndex === 3) tripletCount = 1;
    if (limitIndex === 7) tripletCount = 7;

    // Aggiorna testo Tab Sidebar
    document.getElementById('tab-btn-triplets').innerText = `Terne (${tripletCount})`;
    document.getElementById('tab-btn-table').innerText = `Tabella`;
    document.getElementById('tab-btn-fano').innerText = `Piani Fano (15)`;

    // Filtro Punti 3D (VISIBILITÀ PUNTI)
    for (let idStr in pointObjects) {
        const id = parseInt(idStr);
        const visible = id <= limitIndex;
        pointObjects[id].mesh.visible = visible;
        pointObjects[id].label.visible = visible;
    }

    // Filtro Terne e Bottoni Terne (VISIBILITÀ LINEE)
    tripletVisuals.forEach((t, i) => {
        const isVisible = t.ids.every(val => val <= limitIndex);
        t.mesh.visible = isVisible;
        if (t.hitMesh) t.hitMesh.visible = isVisible;
        if (tripletButtons[i]) tripletButtons[i].style.display = isVisible ? 'block' : 'none';
    });

    tableState.activeRow = null;
    tableState.activeCol = null;
    buildTable(limitIndex);

    // Gestione Tab Fano
    const fanoTabBtn = document.getElementById('tab-btn-fano');

    if (limitIndex < 15) {
        fanoTabBtn.style.display = 'none';
        if (fanoTabBtn.classList.contains('active')) document.getElementById('tab-btn-triplets').click();
    } else {
        fanoTabBtn.style.display = 'flex';
    }

    // Gestione Tasto Divisori Zero Mobile nella Dock
    const dockZdBtn = document.getElementById('dock-zerodiv-btn');
    if (dockZdBtn) {
        dockZdBtn.style.display = (limitIndex === 15) ? 'flex' : 'none';
    }
}
// --- NUOVA FUNZIONE PER UI CALCOLATRICE ---
export function updateCalcUI(limitIndex) {
    // --- INIEZIONE FORMULE & DIVISORI ZERO ---
    const fContainer = document.getElementById('calc-formula-menu');

    // Delega la creazione della UI dei divisori zero al modulo dedicato
    updateZeroDivisorUI(limitIndex);

    // MODIFICA: Mostra SEMPRE tutte le formule divise per categoria
    if (fContainer) {
        fContainer.innerHTML = `
                    <div id="formula-explanation-panel" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(30, 30, 35, 0.98); padding:20px; z-index:20; backdrop-filter:blur(10px); color:#eee; font-size:14px; line-height:1.6; font-family:'Segoe UI', sans-serif; text-align:center; align-items:center; justify-content:center; border-radius: 6px;">
                        ${t('form_desc')}
                    </div>
                    <div class="formula-group-title" style="color:#aaaaff;">Quaternioni (&#x210D;):</div>
                    <button class="formula-btn" onclick="runFormulaDemo(3, '[a,b]', ['a','b'])">
                        <strong>[a,b] &ne; 0</strong> ${t('form_non_comm')}
                    </button>

                    <div class="formula-group-title" style="color:#aaffaa; margin-top:8px;">Ottetti (&#x1D546;):</div>
                    <button class="formula-btn" onclick="runFormulaDemo(7, '[a,b,c]', ['a','b','c'])">
                        <strong>[a,b,c] &ne; 0</strong> ${t('form_non_assoc')}
                    </button>
                    <button class="formula-btn" onclick="runFormulaDemo(7, '[a,a,b]', ['a','b'])">
                        <strong>[a,a,b] = 0</strong> ${t('form_alt')}
                    </button>

                    <div class="formula-group-title" style="color:#ffaaaa; margin-top:8px;">Sedenioni (&#x1D54A;):</div>
                    <button class="formula-btn" onclick="runFormulaDemo(15, '[a,a,b]', ['a','b'])">
                        <strong>[a,a,b] &ne; 0</strong> ${t('form_non_alt')}
                    </button>
                    <button class="formula-btn" onclick="runFormulaDemo(15, '[a,b,a]', ['a','b'])">
                        <strong>[a,b,a] = 0</strong> ${t('form_flex')}
                    </button>
                `;
    }
}

// --- GESTIONE MENU FORMULE E DIVISORI CALCOLATRICE ---
const formulasBtn = document.getElementById('calc-formulas-btn');
const formulasMenu = document.getElementById('calc-formula-menu');
const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
// NOTA: zdMenuCalc rimosso, usiamo il nuovo overlay
const zdOverlay = document.getElementById('zerodiv-overlay');
const zdContentGrid = document.getElementById('zerodiv-content-grid');
const zdCloseOverlay = document.getElementById('close-zerodiv-overlay');

const dockFormulasBtn = document.getElementById('dock-formulas-btn');
const dockZdBtn = document.getElementById('dock-zerodiv-btn');

// Setup Formule (Dropdown classico e Mobile)
if (formulasMenu) {
    const toggleFormulas = (e) => {
        e.stopPropagation();
        const calcModalEl = document.getElementById('calc-modal');
        const isMobile = window.innerWidth <= 768;

        // Genera l'HTML se non esiste ancora
        if (formulasMenu.innerHTML.trim() === '') updateCalcUI(15);

        if (isMobile && e.currentTarget === dockFormulasBtn) {
            const wasActive = dockFormulasBtn.classList.contains('active');

            // Chiudi tutto
            calcModalEl.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
            document.getElementById('calc-toggle-btn').classList.remove('active');
            formulasMenu.classList.remove('visible');
            if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');

            const zdOverlay = document.getElementById('zerodiv-overlay');
            if (zdOverlay) zdOverlay.classList.remove('visible');
            const dockZdBtn = document.getElementById('dock-zerodiv-btn');
            if (dockZdBtn) dockZdBtn.classList.remove('active');
            const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
            if (zdBtnCalc) zdBtnCalc.classList.remove('active');

            if (!wasActive) {
                dockFormulasBtn.classList.add('active');
                calcModalEl.classList.add('active', 'formulas-mobile-mode');
                calcModalEl.style.zIndex = ++window.highestZIndex;
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
        if (formulasMenu.classList.contains('visible')) {
            if (!formulasMenu.contains(e.target) && e.target !== formulasBtn && e.target !== dockFormulasBtn) {
                formulasMenu.classList.remove('visible');
                if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
                const calcModalEl = document.getElementById('calc-modal');
                if (calcModalEl && calcModalEl.classList.contains('formulas-mobile-mode')) {
                    calcModalEl.classList.remove('active', 'formulas-mobile-mode');
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (formulasMenu.classList.contains('visible')) {
            if (!formulasMenu.contains(e.target) && e.target !== formulasBtn && e.target !== dockFormulasBtn) {
                formulasMenu.classList.remove('visible');
            }
        }
    });
}

// Setup Divisori Zero (Overlay Full e Mobile) spostato nel suo modulo isolato
initZeroDivisorListeners();

// Setup Helper Calcolatrice
const calcHelperBtn = document.getElementById('calc-helper-btn');
const calcHelperOverlay = document.getElementById('calc-helper-overlay');
const closeCalcHelperBtn = document.getElementById('close-calc-helper');
const calcHelperCheckMobile = document.getElementById('calc-helper-check-mobile');
const calcHelperLabelMobile = document.getElementById('calc-helper-label-mobile');

if (calcHelperOverlay && closeCalcHelperBtn) {
    closeCalcHelperBtn.addEventListener('click', () => {
        calcHelperOverlay.style.display = 'none';
        if (calcHelperCheckMobile) calcHelperCheckMobile.checked = false;
    });
}

if (calcHelperBtn && calcHelperOverlay) {
    const toggleCalcHelper = () => {
        const calcModalEl = document.getElementById('calc-modal');
        if (!calcModalEl.classList.contains('active')) {
            openCalculator(true);
        }
        calcHelperOverlay.style.display = calcHelperOverlay.style.display === 'none' || !calcHelperOverlay.style.display ? 'flex' : 'none';

        // Reset pagina quando si apre
        if (calcHelperOverlay.style.display === 'flex') {
            window.currentCalcHelperPage = 1;
            if (window.changeCalcHelperPage) window.changeCalcHelperPage(0);
        }
    };

    calcHelperBtn.addEventListener('click', toggleCalcHelper);
}

if (calcHelperCheckMobile && calcHelperOverlay) {
    calcHelperCheckMobile.addEventListener('change', (e) => {
        if (e.target.checked) {
            calcHelperOverlay.style.display = 'flex';
            window.currentCalcHelperPage = 1;
            if (window.changeCalcHelperPage) window.changeCalcHelperPage(0);
        } else {
            calcHelperOverlay.style.display = 'none';
        }
    });
}

initUI();
initSidebar();

// ===================== ADVANCED CALCULATOR ===================

const calcModal = document.getElementById('calc-modal');
calcModal.addEventListener('pointerdown', () => {
    calcModal.style.zIndex = ++window.highestZIndex;
});

const calcToggle = document.getElementById('calc-toggle-btn');
// const calcClose = document.getElementById('close-calc'); // RIMOSSO

// --- LOGICA APERTURA / CHIUSURA (TOGGLE) ---

export function resetCalcPosition() {
    // FIX NASA HUD: Resetta alla posizione "Docked" in alto a sinistra
    // Queste coordinate devono corrispondere a quelle del CSS #calc-modal
    calcModal.style.top = '80px';
    calcModal.style.left = '30px';

    // Rimuove vecchie trasformazioni di centraggio
    calcModal.style.transform = 'none';
    calcModal.style.margin = '0';
}

// Funzione per interazione esterna (es. pulsanti formule)
export function openCalculator(preservePos = false) {
    if (!preservePos) resetCalcPosition(); // Resetta solo se non richiesto diversamente

    // Rimuove eventuali mode esclusive mobile per far vedere la calcolatrice intera
    if (window.innerWidth <= 768 && window.applySwipeState) {
        window.applySwipeState(1); // Forza lo stato centrale
    } else {
        calcModal.classList.remove('formulas-mobile-mode', 'zerodiv-mobile-mode');
    }

    const isOpen = calcModal.classList.contains('active');
    calcModal.style.zIndex = ++window.highestZIndex;
    if (!isOpen) {
        calcModal.classList.add('active');
        calcToggle.classList.add('active');
        closeHistory();

        // Aggiorna UI Calcolatrice (Forza a 15 per abilitare tutto)
        updateCalcUI(15);
        updateGridVisibility();

        // Forza lo spegnimento del tasto 2nd (Shift) all'apertura
        if (window.isShiftActive) window.toggleShift();

        // Forza la vista "tastiera" all'apertura
        switchCalcView('keypad');
    }
}

function toggleCalculator() {
    if (window.externalCalcWindow && !window.externalCalcWindow.closed) {
        window.externalCalcWindow.isDockClose = true;
        window.externalCalcWindow.close();
        return;
    }

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        const wasActive = calcModal.classList.contains('active') &&
            !calcModal.classList.contains('formulas-mobile-mode') &&
            !calcModal.classList.contains('zerodiv-mobile-mode');

        // Chiudi tutto per resettare lo stato
        calcModal.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
        calcToggle.classList.remove('active');
        const formulasMenu = document.getElementById('calc-formula-menu');
        if (formulasMenu) formulasMenu.classList.remove('visible');
        const dockFormulasBtn = document.getElementById('dock-formulas-btn');
        if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
        const zdOverlay = document.getElementById('zerodiv-overlay');
        if (zdOverlay) zdOverlay.classList.remove('visible');
        const dockZdBtn = document.getElementById('dock-zerodiv-btn');
        if (dockZdBtn) dockZdBtn.classList.remove('active');
        const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
        if (zdBtnCalc) zdBtnCalc.classList.remove('active');

        if (!wasActive) {
            resetCalcPosition();
            calcModal.classList.add('active');
            calcModal.style.zIndex = ++window.highestZIndex;
            calcToggle.classList.add('active');
            closeHistory();
            updateCalcUI(15);
            updateGridVisibility();
            if (window.isShiftActive) window.toggleShift();
            switchCalcView('keypad'); // Torna sempre alla tastiera
            if (window.applySwipeState) window.applySwipeState(1); // Forza lo stato centrale
        }
    } else {
        const isOpen = calcModal.classList.contains('active');
        if (!isOpen) calcModal.style.zIndex = ++window.highestZIndex;

        if (isOpen) {
            calcModal.classList.remove('active');
            calcToggle.classList.remove('active');
            closeHistory();
        } else {
            resetCalcPosition();
            calcModal.classList.add('active');
            calcToggle.classList.add('active');
            closeHistory();
            updateCalcUI(15);
            updateGridVisibility();
            if (window.isShiftActive) window.toggleShift();
            switchCalcView('keypad'); // Torna sempre alla tastiera
        }
    }
}

calcToggle.addEventListener('click', toggleCalculator);
// LISTENER CHIUSURA RIMOSSO
// (setupGrid e updateVarIndicators sono ora eseguiti automaticamente da calculator_ui.js)

// --- LOGICA TRASCINAMENTO ESTESA (DRAG & DROP SU TUTTO IL CORPO) ---
// Applica il cursore 'move' all'intero modale, non solo all'header
calcModal.style.cursor = 'move';

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Funzione helper per determinare se l'elemento cliccato è interattivo
function isInteractive(target) {
    // FIX MOBILE: Su mobile permettiamo il trascinamento verticale da ovunque, disabilitiamo solo per le aree scrollabili interne e input
    if (window.innerWidth <= 768) {
        return target.closest('input') || target.closest('#calc-formula-menu') || target.closest('#zerodiv-content-grid') || target.closest('#steps-content') || target.closest('#kernel-inputs-container') || target.closest('#result-display');
    }
    // Su Desktop manteniamo il blocco originale
    return target.closest('button') || target.closest('input') || target.closest('select') || target.closest('.icon-btn') || target.closest('.var-tab') || target.closest('.log-entry') || target.closest('.display-area') || target.closest('#calc-formula-menu') || target.closest('.zerodiv-grid-btn') || target.closest('.zerodiv-toggle') || target.closest('.zerodiv-tab') || target.closest('#close-zerodiv-overlay') || target.closest('#btn-close-history') || target.closest('#btn-clear-log') || target.closest('label') || target.closest('.key-btn') || target.closest('#steps-overlay') || target.closest('#close-steps-btn') || target.closest('#close-kernel-ui');
}

// Funzione unificata per iniziare il trascinamento
function startDrag(clientX, clientY, e) {
    // Se la calcolatrice è nel pop-up, disabilitiamo completamente il trascinamento
    if (window.externalCalcWindow && !window.externalCalcWindow.closed) return;

    // Se clicchiamo su qualcosa di interattivo, NON trascinare
    if (isInteractive(e.target)) return;

    isDragging = true;
    const rect = calcModal.getBoundingClientRect();

    // --- FIX DRAG MOBILE (CORRETTO) ---
    // Su mobile sganciamo solo l'ancoraggio 'bottom' per permettere il movimento verticale.
    // NON impostiamo width/height fissi per evitare bug di ridimensionamento tra desktop e mobile.
    if (window.innerWidth <= 768) {
        calcModal.style.bottom = 'auto'; // Sgancia dal fondo
    }

    // Disabilita il centraggio CSS automatico e usa coordinate assolute
    calcModal.style.transform = 'none';
    calcModal.style.margin = '0';
    calcModal.style.left = rect.left + 'px';
    calcModal.style.top = rect.top + 'px';

    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;
}

// --- MOUSE EVENTS ---
// Colleghiamo l'evento a 'calcModal' invece che a 'calcHeader'
calcModal.addEventListener('mousedown', (e) => {
    if (isInteractive(e.target)) return;

    e.preventDefault();
    startDrag(e.clientX, e.clientY, e);
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    calcModal.style.left = (e.clientX - dragOffsetX) + 'px';
    calcModal.style.top = (e.clientY - dragOffsetY) + 'px';
});

document.addEventListener('mouseup', () => { isDragging = false; });

// --- TOUCH EVENTS ---
calcModal.addEventListener('touchstart', (e) => {
    if (isInteractive(e.target)) return;

    // FIX MOBILE: Rimossa "e.preventDefault()" per permettere ai click di funzionare anche dalle zone abilitate al drag!
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY, e);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Evita scroll pagina
    const touch = e.touches[0];

    if (window.innerWidth <= 768) {
        // MOBILE: Solo verticale
        calcModal.style.top = (touch.clientY - dragOffsetY) + 'px';
    } else {
        // DESKTOP: Libero
        calcModal.style.left = (touch.clientX - dragOffsetX) + 'px';
        calcModal.style.top = (touch.clientY - dragOffsetY) + 'px';
    }
}, { passive: false });

document.addEventListener('touchend', () => { isDragging = false; });


window.addEventListener('resize', () => {
    const w = container.clientWidth; const h = container.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);

    // FIX BUG 2: Resetta gli stili inline della calcolatrice quando si ridimensiona la finestra
    // Questo permette al CSS (@media query) di riprendere il controllo del layout
    if (window.innerWidth > 768) {
        calcModal.style.width = '';
        calcModal.style.height = '';
        calcModal.style.bottom = '';
    } else {
        // Su mobile resettiamo width/height ma manteniamo top/left validi se necessario
        calcModal.style.width = '';
        calcModal.style.height = '';
    }
});

// --- NUOVO: Logica Click & Hold sulle sfere ---
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();
let isHoldingPoint = false;

let clickStartX = 0, clickStartY = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
    clickStartX = e.clientX;
    clickStartY = e.clientY;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, camera);

    const visibleMeshes = [];
    const meshData = new Map();

    // Sceglie il set di hitboxes in base alla modalità attiva
    if (window.is32IonMode) {
        graph32Group.children.forEach(child => {
            if (child.isMesh && child.userData && child.userData.type === 'node32') {
                visibleMeshes.push(child);
                meshData.set(child, child.userData);
            }
        });
    } else {
        for (let idStr in pointObjects) {
            const id = parseInt(idStr);
            if (pointObjects[id].mesh.visible) {
                visibleMeshes.push(pointObjects[id].mesh);
                meshData.set(pointObjects[id].mesh, { type: 'point', id: id });
            }
        }
    }

    const intersects = raycaster.intersectObjects(visibleMeshes);
    if (intersects.length > 0) {
        const data = meshData.get(intersects[0].object);

        if (window.is32IonMode && data.type === 'node32') {
            renderer.domElement.dataset.lastClickedNode = data.id;
            renderer.domElement.dataset.lastClickedType = 'node32';
        } else if (data.type === 'point') {
            // Logica originale di hold sui sedenioni
            renderer.domElement.dataset.holdTimer = setTimeout(() => {
                highlightConnections(data.id);
                isHoldingPoint = true;
            }, 450); // Aumentato da 200 a 450ms per supportare i click del trackpad
            renderer.domElement.dataset.lastClickedNode = data.id;
            renderer.domElement.dataset.lastClickedType = 'point';
        }
    } else {
        renderer.domElement.dataset.lastClickedNode = "";
        renderer.domElement.dataset.lastClickedType = "";
    }
});

window.addEventListener('pointerup', (e) => {
        const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);

        if (renderer.domElement.dataset.holdTimer) {
            clearTimeout(parseInt(renderer.domElement.dataset.holdTimer));
            renderer.domElement.dataset.holdTimer = null;
        }

        // GESTIONE CLICK 32-IONI
        if (window.is32IonMode) {
            if (dist < 10 && renderer.domElement.dataset.lastClickedType === 'node32') {
                const id = parseInt(renderer.domElement.dataset.lastClickedNode);
                build32IonGraph(id); // Ricalcola e rimette al centro il nodo cliccato
            }
            return; // Ferma l'esecuzione per non innescare codice relativo ai sedenioni
        }

        // GESTIONE CLICK STANDARD
        // Salviamo lo stato prima di resettarlo per capire se stavamo ispezionando un nodo
        const wasHolding = isHoldingPoint; 
        isHoldingPoint = false;

        if (dist < 10) {
            // Controlla se abbiamo cliccato un nodo
            if (renderer.domElement.dataset.lastClickedNode && renderer.domElement.dataset.lastClickedType === 'point') {
                const id = parseInt(renderer.domElement.dataset.lastClickedNode);
                
                // Seleziona il nodo SOLO se è stato un tap rapido. Se stavamo tenendo premuto per ispezionare, non selezioniamo.
                if (!wasHolding) {
                    if (selectedNodesForClosure.has(id)) {
                        selectedNodesForClosure.delete(id);
                    } else {
                        selectedNodesForClosure.add(id);
                    }
                }
                
                // Usiamo resetView per aggiornare i colori istantaneamente e ripristinare le connessioni al rilascio
                resetView();
            } else {
                // Cliccato sullo sfondo: pulisci la selezione e resetta
                if (selectedNodesForClosure.size > 0 || wasHolding) {
                    selectedNodesForClosure.clear();
                    resetView();
                }
            }
        } else {
            // Se l'utente ha mosso il grafico (dist >= 10) mentre teneva premuto, ripristina la visuale al rilascio
            if (wasHolding) {
                resetView();
            }
        }

    const genBtn = document.getElementById('closure-generator-btn');
    const genDiv = document.getElementById('closure-divider');
    const badge = document.getElementById('closure-badge');

    if (genBtn && badge && genDiv) {
        const count = selectedNodesForClosure.size;
        if (count > 0) {
            genBtn.style.display = 'flex';
            genDiv.style.display = 'block';
            badge.innerText = count;
        } else {
            genBtn.style.display = 'none';
            genDiv.style.display = 'none';
        }
    }
});

// --- OTTIMIZZAZIONE LOOP DI RENDERING ---
let renderRequested = true;

controls.addEventListener('change', () => { renderRequested = true; });
window.addEventListener('resize', () => { renderRequested = true; });
window.addEventListener('pointerup', () => { renderRequested = true; setTimeout(() => renderRequested = true, 100); });
window.addEventListener('keydown', () => { renderRequested = true; });
// Variabili globali per gestire l'animazione della chiusura
window.closureTimer = null;
window.closureFlashTimers = [];

export const resetView = () => {
    // FIX: Reset indice Fano attivo
    if (typeof setActiveFanoIndex === 'function') setActiveFanoIndex(null);

    // FIX: Ferma eventuali animazioni di chiusura in corso
    if (window.closureTimer) {
        clearTimeout(window.closureTimer);
        window.closureTimer = null;
    }

    // FIX BUG: Pulisci anche i timer dell'effetto "flash" (animazione colore)
    if (window.closureFlashTimers) {
        window.closureFlashTimers.forEach(t => clearTimeout(t));
        window.closureFlashTimers = [];
    }

    // NASCONDI TASTO DOCK
    const dockShowAllBtn = document.getElementById('dock-show-all-btn');
    if (dockShowAllBtn) dockShowAllBtn.style.display = 'none';

    document.querySelectorAll('.triplet-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.fano-btn').forEach(b => b.classList.remove('active'));

    // Reset Tabella HTML
    const table = document.getElementById('sedenion-table');
    if (table) table.querySelectorAll('td').forEach(td => td.classList.remove('fano-selected', 'fano-dimmed'));

    // Reset Divisori Zero
    document.querySelectorAll('.zerodiv-btn').forEach(b => b.style.borderColor = '#442222');

    // Reset Materiali Punti e Scala
    for (let k in pointObjects) {
        const pid = parseInt(k);

        // Reset Scala (fondamentale post-animazione)
        if (pointObjects[pid].mesh) pointObjects[pid].mesh.scale.set(1, 1, 1);

        if (typeof selectedNodesForClosure !== 'undefined' && selectedNodesForClosure.has(pid)) {
            pointObjects[pid].mesh.material = sphereMatSelected;
        } else {
            pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
        }
    }

    // Reset Materiali Linee
    tripletVisuals.forEach(t => {
        t.mesh.material.uniforms.useHighlight.value = 0.0;
    });

    if (typeof updateCycleColors === 'function') updateCycleColors();
    if (typeof filterSubspace === 'function') filterSubspace(currentAlgState);
};

// NUOVO LISTENER PER IL TASTO DOCK
const dockBtn = document.getElementById('dock-show-all-btn');
if (dockBtn) {
    // Rimuove eventuali listener vecchi per evitare duplicazioni e riattacca
    dockBtn.removeEventListener('click', resetView);
    dockBtn.addEventListener('click', resetView);
}

export const forceUpdate = () => { renderRequested = true; };
document.querySelectorAll('.tab-btn, .triplet-btn, .ui-btn, .setting-action').forEach(b => {
    b.addEventListener('click', forceUpdate);
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if (isNaN(camera.position.x) || !isFinite(camera.position.x)) {
        camera.position.copy(initialCameraPos);
        controls.target.set(0, 3, 0);
        controls.update();
    }

    const delta = Math.min(clock.getDelta(), 0.1);
    let needsRender = renderRequested;

    if (!animParams.paused && animParams.speed > 0) {
        animParams.customTime += delta * animParams.speed;
        animatedMaterials.forEach(mat => mat.uniforms.customTime.value = animParams.customTime);
        needsRender = true;
    }

    // Animazione sfondo stellato (se attivo)
    if (starField.visible) {
        starField.rotation.y += 0.0003;
        if (!animParams.paused) needsRender = true;
    }

    // FIX: Aggiorna i controlli PRIMA del render check per garantire l'inerzia (damping)
    // controls.update() restituisce true se la camera si è mossa o sta ancora decelerando
    if (controls.update()) {
        needsRender = true;
    }

    // Se necessario, renderizza
    if (needsRender) {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        renderRequested = false; // Reset flag
    }
}
animate();

renderRequested = true;
updateCycleColors();

// =================== ZOOM TABELLA (PC & MOBILE) ==============

const tScroll = document.getElementById('table-scroll');
const tTable = document.getElementById('sedenion-table');
let tZoom = 1.0;

function applyTableZoom(targetZoom) {

    const containerW = tScroll.clientWidth;
    const currentVisualWidth = tTable.getBoundingClientRect().width;
    const naturalWidth = currentVisualWidth / (tZoom || 1);

    if (naturalWidth < 10) return;

    let minZoom = containerW / naturalWidth;

    if (minZoom > 1) minZoom = 1;

    // 2. APPLICAZIONE LIMITI

    tZoom = Math.max(minZoom, Math.min(targetZoom, 3.0));

    // 3. APPLICAZIONE STILE

    if ('zoom' in tTable.style) {
        tTable.style.zoom = tZoom;
    } else {
        // Fallback per Firefox (usa transform scale)
        tTable.style.transform = `scale(${tZoom})`;
        tTable.style.transformOrigin = "0 0";
        // Corregge la larghezza in Firefox per evitare clipping
        tTable.style.width = (100 / tZoom) + "%";
    }
}

// 1. PC: Mouse/Trackpad sopra la tabella + Ctrl
tScroll.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const scaleFactor = Math.exp(-e.deltaY * 0.002);
        applyTableZoom(tZoom * scaleFactor);
    }
}, { passive: false });

// 2. MOBILE: Pinch a due dita
let startDist = 0;
let startZoom = 1.0;

tScroll.addEventListener('touchstart', (e) => {
    // Attiva solo se ci sono esattamente 2 dita (Pinch)
    if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();

        // Calcola distanza iniziale tra le due dita
        startDist = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
        startZoom = tZoom;
    }
}, { passive: false });

tScroll.addEventListener('touchmove', (e) => {
    // Continua solo se ci sono 2 dita
    if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();

        const currentDist = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );

        if (startDist > 0) {
            const ratio = currentDist / startDist;
            applyTableZoom(startZoom * ratio);
        }
    }
}, { passive: false });

// =================== SCORCIATOIE TASTIERA ====================

window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isInputActive = (activeTag === 'input' || activeTag === 'textarea');

    if (!isInputActive) {

        // 1. SPAZIO: Play/Pausa
        if (e.code === 'Space') {
            e.preventDefault();
            document.getElementById('play-pause-btn').click();
            return;
        }

        // 2. INVIO: Reset Vista Camera
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('home-btn').click();
            return;
        }

        // 3. FRECCE SU/GIU: Controllo Velocità
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const slider = document.getElementById('speed-slider');
            let val = parseFloat(slider.value);
            const step = 0.1;

            if (e.key === 'ArrowUp') {
                val = Math.min(val + step, parseFloat(slider.max));
            } else {
                val = Math.max(val - step, parseFloat(slider.min));
            }

            slider.value = val.toFixed(1);
            slider.dispatchEvent(new Event('input'));
            return;
        }

        // 4. DIGITAZIONE RAPIDA CALCOLATRICE
        const allowedKeys = /^[a-zA-Z0-9\(\)\[\]\+\-\.\?\=]$/;

        if (e.key.length === 1 && allowedKeys.test(e.key)) {
            e.preventDefault();
            openCalculator();

            const display = document.getElementById('expression-display');
            display.value += e.key;

            display.focus();
            display.setSelectionRange(display.value.length, display.value.length);
        }
    }
});

// --- GENERATORE DI CHIUSURA ALGEBRICA (MOTORE RICORSIVO E ANIMAZIONE) ---
const closureBtn = document.getElementById('closure-generator-btn');
const closureDiv = document.getElementById('closure-divider');
if (closureBtn) {
    closureBtn.addEventListener('click', () => {
        // Nessuna esecuzione se non ci sono nodi selezionati
        if (selectedNodesForClosure.size === 0) return;

        const initialNodes = Array.from(selectedNodesForClosure);
        selectedNodesForClosure.clear();

        // Nascondi bottone e divisore appena inizia l'animazione
        closureBtn.style.display = 'none';
        if (closureDiv) closureDiv.style.display = 'none';

        // 1. CALCOLO PREVENTIVO DELLA CHIUSURA (Back-end)
        let currentSet = new Set(initialNodes);
        const generations = [{ nodes: Array.from(currentSet), triplets: [] }];

        let isClosed = false;
        let failsafe = 0;

        while (!isClosed && failsafe < 10) {
            failsafe++;
            let addedNew = false;
            const prevNodes = Array.from(currentSet);
            const newNodesThisGen = new Set();
            const newTripletsThisGen = [];

            for (let i = 0; i < prevNodes.length; i++) {
                for (let j = 0; j < prevNodes.length; j++) {
                    if (i === j) continue;
                    const a = prevNodes[i];
                    const b = prevNodes[j];

                    // Guarda la tua lookupTable ottimizzata
                    const prod = tableLookup[a][b].i;

                    if (prod !== 0) {
                        const tIdx = POSITIVE_TRIPLETS.findIndex(pt => pt.includes(a) && pt.includes(b) && pt.includes(prod));

                        if (!currentSet.has(prod)) {
                            newNodesThisGen.add(prod);
                            currentSet.add(prod);
                            addedNew = true;
                        }

                        if (tIdx !== -1) {
                            const alreadyExists = generations.some(g => g.triplets.includes(tIdx)) || newTripletsThisGen.includes(tIdx);
                            if (!alreadyExists) newTripletsThisGen.push(tIdx);
                        }
                    }
                }
            }

            if (addedNew || newTripletsThisGen.length > 0) {
                generations.push({ nodes: Array.from(newNodesThisGen), triplets: newTripletsThisGen });
            }
            if (!addedNew) isClosed = true; // Fine della ricorsione
        }

        // 2. SETUP ANIMAZIONE GRAFICA
        resetView();
        document.getElementById('dock-show-all-btn').style.display = 'flex';

        const titleTextElem = document.getElementById('alg-title-text');
        const mainTitle = (currentAlgState === 3 ? t('alg_quat') : (currentAlgState === 7 ? t('alg_oct') : t('alg_sed')));
        titleTextElem.innerHTML = `${mainTitle}<div style="font-size: 13px; font-weight: normal; color: #00ffaa; margin-top: 5px; font-family: 'Times New Roman'; opacity: 0.9;">${t('gen_closure')}</div>`;

        tripletVisuals.forEach(t => { t.mesh.visible = false; if (t.hitMesh) t.hitMesh.visible = false; });
        for (let k in pointObjects) { pointObjects[k].mesh.visible = false; pointObjects[k].label.visible = false; }

        // 3. ESECUZIONE A CASCATA (TIMERS)
        let genIdx = 0;
        const matCyan = new THREE.MeshPhysicalMaterial({ color: 0x00ffff, metalness: 0.2, roughness: 0.4, emissive: 0x0088ff, emissiveIntensity: 0.5 });
        const matWhite = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.8 });

        function playNextGeneration() {
            if (genIdx >= generations.length) {
                const finalNodes = Array.from(currentSet).sort((a, b) => a - b);
                const count = finalNodes.length;

                // Creiamo una stringa degli indici per un confronto esatto
                const nodesStr = finalNodes.join(',');

                // FIX: Etichetta corretta solo se sono le algebre CANONICHE
                let fanoSubtitle = "";

                if (nodesStr === "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15") {
                    fanoSubtitle = `${t('closure_lbl')} &#x1D54A;`; // Sedenioni S
                }
                else if (nodesStr === "1,2,3,4,5,6,7") {
                    fanoSubtitle = `${t('closure_lbl')} &#x1D546;`; // Ottetti O
                }
                else if (nodesStr === "1,2,3") {
                    fanoSubtitle = `${t('closure_lbl')} &#x210D;`; // Quaternioni H
                }
                else {
                    // Caso generico (es. copia isomorfa o subalgebra non standard)
                    fanoSubtitle = `${t('closure_lbl')} {` + finalNodes.map(i => "e<sub>" + i + "</sub>").join(", ") + "}";
                }

                titleTextElem.innerHTML = `${mainTitle}<div style="font-size: 13px; font-weight: normal; color: #ccc; margin-top: 5px; font-family: 'Times New Roman'; opacity: 0.9; text-transform: none;">${fanoSubtitle}</div>`;

                // FIX: Nascondi il tasto "Mostra tutto" se la chiusura è totale (perché stiamo già mostrando tutto)
                if (count === currentAlgState) {
                    document.getElementById('dock-show-all-btn').style.display = 'none';
                }

                finalNodes.forEach(id => {
                    if (pointObjects[id]) {
                        pointObjects[id].mesh.scale.set(1, 1, 1);
                        pointObjects[id].mesh.material = (id === 8) ? sphereMatCenter : sphereMat;
                    }
                });
                forceUpdate();
                window.closureTimer = null; // Reset timer alla fine naturale
                return;
            }

            const gen = generations[genIdx];

            gen.nodes.forEach(id => {
                if (pointObjects[id]) {
                    pointObjects[id].mesh.visible = true;
                    pointObjects[id].label.visible = true;
                    pointObjects[id].mesh.material = matWhite;
                    pointObjects[id].mesh.scale.set(1.4, 1.4, 1.4);

                    const flashT = setTimeout(() => {
                        if (pointObjects[id]) {
                            pointObjects[id].mesh.material = matCyan;
                            pointObjects[id].mesh.scale.set(1.2, 1.2, 1.2);
                            forceUpdate();
                        }
                    }, 300);
                    // Registra il timer per poterlo cancellare col reset
                    if (!window.closureFlashTimers) window.closureFlashTimers = [];
                    window.closureFlashTimers.push(flashT);
                }
            });

            gen.triplets.forEach(tIdx => {
                const tObj = tripletVisuals[tIdx];
                tObj.mesh.visible = true;
                if (tObj.hitMesh) tObj.hitMesh.visible = true;
                tObj.mesh.material.uniforms.useHighlight.value = 1.0;
                if (tripletButtons[tIdx]) tripletButtons[tIdx].classList.add('active');
            });

            forceUpdate();
            genIdx++;
            // FIX: Assegna il timer alla variabile globale
            window.closureTimer = setTimeout(playNextGeneration, 800);
        }

        playNextGeneration();
    });
}

// --- FIX TOOLTIP MOBILE ---
// Rimuove il tooltip dopo 2 secondi dal tocco su qualsiasi pulsante .ui-btn
document.querySelectorAll('.ui-btn').forEach(btn => {
    btn.addEventListener('touchend', () => {
        // Aggiunge una classe temporanea che forza la scomparsa del tooltip
        btn.classList.add('hide-tooltip');

        // Rimuove la classe dopo 2 secondi, ripristinando il comportamento normale
        setTimeout(() => {
            btn.classList.remove('hide-tooltip');
        }, 2000);
    });
});