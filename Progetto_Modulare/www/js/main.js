import { isMobile, zManager, ALGEBRAS, THRESHOLDS, TIMINGS } from './core/constants.js';

// Importiamo gli oggetti fondamentali della scena 3D dal nuovo file
import {
    pointObjects, selectedNodesForClosure,
    sphereMat, sphereMatCenter, sphereMatSelected,
    tripletVisuals
} from './3d/scene.js';

// Importiamo i nuovi moduli core
import { initLoop } from './core/loop.js';
import { initGlobalEvents } from './core/bootstrap.js';

// Importiamo la logica della tabella
import { tableState, buildTable, activateTripletFromTable, updateTableVis } from './ui/table.js';
// Importiamo le funzioni del grafo
import {
    updateCycleColors, visualizeTripletByIndex, animateCameraToDefault,
    animateCameraToFanoPlane, visualizeFanoPlane, highlightConnections,
    highlightSingleTriplet, activeFanoIndex, setActiveFanoIndex
} from './3d/graph.js';

// Importiamo il modulo per inizializzare la Sidebar
import { initSidebar } from './ui/sidebar.js';

// Importiamo la logica e il gruppo 3D dei Trigintaduenioni
import { graph32Group, toggle32Ions, buildPG32Graph, build32IonGraph } from './3d/ions32.js';

const handleToggle32Ions = () => {
    if (isRotationMode) toggleRotationMode();
    toggle32Ions();
};

// Rimuoviamo gli Anti-Pattern HTML (onclick) sostituendoli con Event Listeners sicuri
document.querySelectorAll('[onclick="toggle32Ions()"]').forEach(btn => {
    btn.removeAttribute('onclick');
    btn.addEventListener('click', handleToggle32Ions);
});

// Listener per permettere ad altri moduli (es. state.js) di attivare/disattivare i 32-ioni
window.addEventListener('triggerToggle32Ions', handleToggle32Ions);

document.querySelectorAll('[onclick="buildPG32Graph()"]').forEach(btn => {
    btn.removeAttribute('onclick');
    btn.addEventListener('click', buildPG32Graph);
});

// Inizializziamo gli eventi e i listener mobile (Swipe / Carousel)
import { applySwipeState, currentSwipeState } from './ui/mobile.js';
// Importiamo l'inizializzazione della UI Globale (Sfondi, Impostazioni, Help)
import { initUI, starField, gridHelper } from './ui/ui.js';

import { initRotation, toggleRotationMode, isRotationMode } from './3d/rotation.js';
import { initRotationSequence } from './3d/sequence.js';
import { initClosureGenerator, abortClosureAnimations } from './math/closure.js';
import { initShortcuts } from './ui/shortcuts.js';

// Listener per resettare la vista da moduli esterni
window.addEventListener('triggerResetView', () => resetView());
window.addEventListener('requestResetView', () => {
    if (typeof resetView === 'function') resetView();
});
window.addEventListener('requestForceUpdate', () => forceUpdate());

// Importiamo il motore matematico e le variabili di memoria
import { storedVars, storedAns, evaluateExpression, validateAssociativity } from './math/parser.js';
// Importiamo i moduli della calcolatrice
import { currentVar, saveVar, setGrid, switchVar, updateGridVisibility } from './calculator/calculator_ui.js';
import './calculator/calculator_steps.js';
import './calculator/calculator_input.js';
import './calculator/calculator_kernel.js';
import './calculator/calculator_core.js';
import { closeHistory } from './calculator/calculator_history.js';
import './calculator/calculator_popout.js';
import { initZeroDivisorListeners } from './calculator/calculator_zerodiv.js';
import { t } from './core/i18n.js';
import { tableLookup, POSITIVE_TRIPLETS } from './math/data.js';
import { createZeroVector } from './math/parser.js';
import { initCalculatorWindow } from './calculator/calculator_window.js';
import { updateCalcUI, initFormulasMenu } from './calculator/calculator_formulas.js';
import { AppState, currentAlgState, setCurrentAlgState, updateAlgebraState, filterSubspace, initAppState } from './core/state.js';
import { initInteraction3D } from './3d/interaction3d.js';

// Riesportiamo le variabili di stato essenziali affinché i vecchi moduli possano leggerle
export { AppState, currentAlgState, setCurrentAlgState, filterSubspace };

// --- UI LOGIC ---
// Riferimento al testo del titolo (per aggiornamenti dinamici come Divisori Zero)
const titleElem = document.getElementById('alg-title-text');
// Abilita interazione sul titolo (necessario perché il parent #top-bar ha pointer-events: none)
titleElem.style.pointerEvents = "auto";
titleElem.style.cursor = "pointer"; // Indica visivamente che l'area è interattiva

initUI();
initSidebar();
initRotation();
initRotationSequence();
initClosureGenerator();
initShortcuts();
initFormulasMenu();
initCalculatorWindow();
initZeroDivisorListeners();
initAppState();
// Passiamo resetView come callback per evitare che interaction3d importi main
initInteraction3D({ onReset: resetView });

const rotToggleBtn = document.getElementById('rotation-toggle-btn');
if (rotToggleBtn) {
    rotToggleBtn.addEventListener('click', () => {
        // Forza l'algebra ad H (Quaternioni) e spegni i 32-ioni prima di aprire la rotazione
        if (!isRotationMode && (currentAlgState !== ALGEBRAS.QUATERNIONS || AppState.is32IonMode)) {
            updateAlgebraState(ALGEBRAS.QUATERNIONS);
        }
        toggleRotationMode();

        // Spegne il tasto sequenza e chiude la sidebar se si sta disattivando la rotazione
        if (!isRotationMode) {
            const rotSidebarBtn = document.getElementById('rot-sidebar-btn');
            if (rotSidebarBtn) rotSidebarBtn.classList.remove('active');
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                sidebar.style.width = '';
            }
        }
    });
}

import { forceUpdate, consumeRenderFlag } from './core/renderer.js';

// --- INIZIALIZZAZIONE EVENTI GLOBALI ---
initGlobalEvents();
export function resetView() {
    // Esci se siamo in modalità rotazione (per evitare sovrapposizioni)
    if (isRotationMode) return;

    // FIX: Reset indice Fano attivo
    if (typeof setActiveFanoIndex === 'function') setActiveFanoIndex(null);

    // FIX: Ferma eventuali animazioni di chiusura in corso delegando al modulo
    abortClosureAnimations();

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

document.querySelectorAll('.tab-btn, .triplet-btn, .ui-btn, .setting-action').forEach(b => {
    b.addEventListener('click', forceUpdate);
});

// --- AVVIO LOOP DI ANIMAZIONE E RENDER INIZIALE ---
initLoop();
forceUpdate();
updateCycleColors();

window.addEventListener('languageChanged', () => {
    // 1. Aggiorna il titolo principale e le sfere 3D
    if (typeof activeFanoIndex !== 'undefined' && activeFanoIndex !== null) {
        visualizeFanoPlane(activeFanoIndex, true);
    } else {
        filterSubspace(currentAlgState);
    }

    // 2. Forza la ricostruzione dinamica del menu Formule e Divisori dello zero
    if (typeof updateCalcUI === 'function') {
        updateCalcUI(ALGEBRAS.SEDENIONS);
    }

    // 3. Forza l'aggiornamento della barra Swipe su Mobile
    if (typeof applySwipeState === 'function' && currentSwipeState !== undefined) {
        applySwipeState(currentSwipeState);
    }
});

window.addEventListener('requestAlgebraChange', (e) => {
    if (typeof setCurrentAlgState === 'function') setCurrentAlgState(e.detail);
});

window.addEventListener('requestFilterSubspace', (e) => {
    if (typeof filterSubspace === 'function') filterSubspace(e.detail);
});