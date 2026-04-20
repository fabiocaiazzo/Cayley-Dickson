import { t } from './i18n.js';
import { isMobile, ALGEBRAS } from './constants.js';
import { selectedNodesForClosure, pointObjects, tripletVisuals } from '../3d/scene.js';
import { isRotationMode, toggleRotationMode } from '../3d/rotation.js';
import { updateTableForAlgebra } from '../ui/table.js';

// --- STATE MANAGER UNIFICATO ---
export const AppState = {
    currentAlg: ALGEBRAS.SEDENIONS,
    is32IonMode: false
};

export let currentAlgState = ALGEBRAS.SEDENIONS;
export const tripletButtons = [];
export const fanoButtons = [];

export function setCurrentAlgState(val) { 
    currentAlgState = val; 
    AppState.currentAlg = val;
}

export function computeAlgebraState(forcedState) {
    if (AppState.is32IonMode) {
        window.dispatchEvent(new Event('triggerToggle32Ions'));
    }

    if (isRotationMode) {
        toggleRotationMode();
    }

    let nextState;
    if (forcedState) nextState = forcedState;
    else {
        if (currentAlgState === ALGEBRAS.QUATERNIONS) nextState = ALGEBRAS.OCTONIONS;
        else if (currentAlgState === ALGEBRAS.OCTONIONS) nextState = ALGEBRAS.SEDENIONS;
        else nextState = ALGEBRAS.QUATERNIONS;
    }
    
    return nextState;
}

export function updateAlgebraState(forcedState) {
    const nextState = computeAlgebraState(forcedState);
    currentAlgState = nextState;
    
    // Pulizia dei nodi selezionati prima del reset view
    if (typeof selectedNodesForClosure !== 'undefined') {
        selectedNodesForClosure.clear();
    }
    
    // Richiama il reset tramite l'evento globale per evitare import circolari
    window.dispatchEvent(new Event('triggerResetView'));
    // Emette un evento resize per sfruttare il listener in main.js e forzare il render
    window.dispatchEvent(new Event('resize'));
}

export function applyAlgebraToDOM(limitIndex) {
    if (typeof selectedNodesForClosure !== 'undefined') {
        const nodesToRemove = [];
        selectedNodesForClosure.forEach(id => {
            if (id > limitIndex) nodesToRemove.push(id);
        });
        nodesToRemove.forEach(id => selectedNodesForClosure.delete(id));

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

    const titleTextElem = document.getElementById('alg-title-text');
    const mobileTrigger = document.getElementById('alg-mobile-trigger');

    if (limitIndex === ALGEBRAS.QUATERNIONS) {
        titleTextElem.innerHTML = t('alg_quat');
        if (mobileTrigger) mobileTrigger.innerHTML = "ℍ";
    }
    else if (limitIndex === ALGEBRAS.OCTONIONS) {
        titleTextElem.innerHTML = t('alg_oct');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕆";
    }
    else if (limitIndex === ALGEBRAS.SEDENIONS) {
        titleTextElem.innerHTML = t('alg_sed');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕊";
    }
    else {
        titleTextElem.innerHTML = t('alg_32');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕋";
    }

    document.querySelectorAll('.alg-dot').forEach(dot => {
        if (dot.id === 'alg-mobile-trigger') return;
        const target = parseInt(dot.dataset.target);
        if (target === limitIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    let tripletCount = 35;
    if (limitIndex === ALGEBRAS.QUATERNIONS) tripletCount = 1;
    if (limitIndex === ALGEBRAS.OCTONIONS) tripletCount = 7;

    const tabBtnTriplets = document.getElementById('tab-btn-triplets');
    const tabBtnTable = document.getElementById('tab-btn-table');
    const tabBtnFano = document.getElementById('tab-btn-fano');

    if (tabBtnTriplets) tabBtnTriplets.innerText = `${t('tab_triplets')} (${tripletCount})`;
    if (tabBtnTable) tabBtnTable.innerText = t('tab_table');
    if (tabBtnFano) tabBtnFano.innerText = `${t('tab_fano')} (15)`;

    if (limitIndex < ALGEBRAS.SEDENIONS) {
        if (tabBtnFano) {
            tabBtnFano.style.display = 'none';
            if (tabBtnFano.classList.contains('active') && tabBtnTriplets) tabBtnTriplets.click();
        }
    } else {
        if (tabBtnFano) tabBtnFano.style.display = 'flex';
    }

    const dockZdBtn = document.getElementById('dock-zerodiv-btn');
    if (dockZdBtn) {
        dockZdBtn.style.display = (limitIndex === ALGEBRAS.SEDENIONS) ? 'flex' : 'none';
    }
}

export function filterSubspace(limitIndex) {
    applyAlgebraToDOM(limitIndex);
    window.dispatchEvent(new CustomEvent('algebraChanged', { detail: { limitIndex } }));
    updateTableForAlgebra(limitIndex);
}

export function initAppState() {
    document.querySelectorAll('.alg-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dot.id === 'alg-mobile-trigger') {
                document.getElementById('alg-dots-list').classList.toggle('open');
                return;
            }
            const menu = document.getElementById('alg-dots-list');
            if (menu) menu.classList.remove('open');

            const target = parseInt(dot.dataset.target);
            if (!isNaN(target)) updateAlgebraState(target);
        });
    });

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('alg-dots-list');
        if (menu && menu.classList.contains('open') && !e.target.closest('.alg-dots-wrapper')) {
            menu.classList.remove('open');
        }
    });

    const algSwitch = document.getElementById('algebra-switch');
    if (algSwitch) {
        algSwitch.addEventListener('click', (e) => {
            if (!isMobile()) {
                updateAlgebraState(null);
            } else {
                e.stopPropagation();
                const menu = document.getElementById('alg-dots-list');
                if (menu) menu.classList.toggle('open');
            }
        });
    }

    filterSubspace(ALGEBRAS.SEDENIONS);
}