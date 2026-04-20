import { pointObjects, sphereMatCenter, sphereMat, tripletVisuals } from '../3d/scene.js';
import { currentAlgState, tripletButtons } from '../core/state.js';
import { updateCycleColors, highlightConnections, highlightSingleTriplet } from '../3d/graph.js';
import { isRotationMode, toggleRotationMode } from '../3d/rotation.js';
import { resetZeroDivisorUI } from '../calculator/calculator_zerodiv.js';
import { t } from '../core/i18n.js';
import { tableRaw, tableColors, indexToColorKey, POSITIVE_TRIPLETS } from '../math/data.js';

// --- FUNZIONI TABELLA ---
export let tableState = { activeRow: null, activeCol: null };
let prevActiveRow = null;
let prevActiveCol = null;

export function getBaseIndex(valStr) {
    let s = valStr.replace('-', '');
    if (s === '1') return 0;
    return parseInt(s.substring(1));
}

export function formatLatex(str) {
    if (str === '1' || str === '-1') return str;
    return str.replace(/e(\d+)/, 'e<sub>$1</sub>');
}

export function activateTripletFromTable(r, c) {
    if (isRotationMode) toggleRotationMode();
    // RESET UI DIVISORI ZERO
    if (resetZeroDivisorUI) resetZeroDivisorUI();

    // MODIFICA: Mostra il prodotto nel titolo principale
    const titleTextElem = document.getElementById('alg-title-text');
    const rLabel = r === 0 ? "1" : `e<sub>${r}</sub>`;
    const cLabel = c === 0 ? "1" : `e<sub>${c}</sub>`;
    const resLabel = formatLatex(tableRaw[r][c]);
    titleTextElem.innerHTML = `${rLabel} &middot; ${cLabel} = ${resLabel}`;
    titleTextElem.style.textTransform = "none";

    // 0. RESET PREVENTIVO COLORI (Per togliere residui divisori zero)
    for (let k in pointObjects) {
        const pid = parseInt(k);
        pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
    }
    updateCycleColors();

    // 1. Aggiorna lo stato della tabella per evidenziare Righe e Colonne
    tableState.activeRow = r;
    tableState.activeCol = c;

    const limit = currentAlgState;
    buildTable(limit);

    if (r === 0 || c === 0 || r === c) {
        return;
    }

    // MOSTRA TASTO DOCK
    if (currentAlgState === 3) {
        document.getElementById('dock-show-all-btn').style.display = 'none';
    } else {
        document.getElementById('dock-show-all-btn').style.display = 'flex';
    }

    // 2. Reset Totale Vista 3D
    tripletVisuals.forEach(t => {
        t.mesh.visible = false;
        if (t.hitMesh) t.hitMesh.visible = false;
    });
    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
    }
    tripletButtons.forEach(b => b.classList.remove('active'));

    // 4. Attiva la terna specifica
    const tripletIdx = POSITIVE_TRIPLETS.findIndex(t => t.includes(r) && t.includes(c));
    if (tripletIdx !== -1) {
        const triplet = POSITIVE_TRIPLETS[tripletIdx];
        if (triplet.some(v => v > limit)) return;

        const tObj = tripletVisuals[tripletIdx];
        tObj.mesh.visible = true;
        if (tObj.hitMesh) tObj.hitMesh.visible = true;

        tObj.ids.forEach(pId => {
            if (pointObjects[pId]) {
                pointObjects[pId].mesh.visible = true;
                pointObjects[pId].label.visible = true;
            }
        });

        if (tripletButtons[tripletIdx]) tripletButtons[tripletIdx].classList.add('active');
    }
}

export function updateTableVis() {
    if (isRotationMode) toggleRotationMode();
    // RESET UI DIVISORI ZERO
    if (resetZeroDivisorUI) resetZeroDivisorUI();
    
    // Ripristino titolo
    const titleTextElem = document.getElementById('alg-title-text');
    if (tableState.activeRow === null || tableState.activeCol === null) {
        if (currentAlgState === 3) titleTextElem.innerHTML = t('alg_quat');
        else if (currentAlgState === 7) titleTextElem.innerHTML = t('alg_oct');
        else titleTextElem.innerHTML = t('alg_sed');
        titleTextElem.style.textTransform = "uppercase";
    }
    
    // 0. RESET PREVENTIVO COLORI
    for (let k in pointObjects) {
        const pid = parseInt(k);
        pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
    }
    updateCycleColors();

    const r = tableState.activeRow;
    const c = tableState.activeCol;

    if (r === null && c === null) {
        window.dispatchEvent(new Event('requestResetView'));
        return;
    }

    document.getElementById('dock-show-all-btn').style.display = 'flex';

    if (r !== null && c !== null) {
        if (r === 0 || c === 0 || r === c) {
            document.querySelectorAll('.triplet-btn').forEach(b => b.classList.remove('active'));
            tripletVisuals.forEach(t => {
                const isVisible = t.ids.every(val => val <= currentAlgState);
                t.mesh.visible = isVisible;
                if (t.hitMesh) t.hitMesh.visible = isVisible;
            });
            for (let k in pointObjects) {
                const id = parseInt(k);
                const visible = id <= currentAlgState;
                pointObjects[k].mesh.visible = visible;
                pointObjects[k].label.visible = visible;
            }
        } else {
            const idx = POSITIVE_TRIPLETS.findIndex(t => t.includes(r) && t.includes(c));
            if (idx !== -1) {
                highlightSingleTriplet(idx);
            } else {
                tripletVisuals.forEach(t => {
                    t.mesh.visible = false;
                    if (t.hitMesh) t.hitMesh.visible = false;
                });
                for (let k in pointObjects) {
                    const id = parseInt(k);
                    const visible = (id === r || id === c);
                    pointObjects[k].mesh.visible = visible;
                    pointObjects[k].label.visible = visible;
                }
            }
        }
        return;
    }

    const val = (r !== null) ? r : c;
    if (val === 0) {
        document.querySelectorAll('.triplet-btn').forEach(b => b.classList.remove('active'));
        tripletVisuals.forEach(t => {
            const isVisible = t.ids.every(v => v <= currentAlgState);
            t.mesh.visible = isVisible;
            if (t.hitMesh) t.hitMesh.visible = isVisible;
        });
        for (let k in pointObjects) {
            const id = parseInt(k);
            const visible = id <= currentAlgState;
            pointObjects[k].mesh.visible = visible;
            pointObjects[k].label.visible = visible;
        }
    } else {
        highlightConnections(val);
    }
}

export function updateTableForAlgebra(limitIndex) {
    tableState.activeRow = null;
    tableState.activeCol = null;
    buildTable(limitIndex);
}

export function buildTable(limitIndex) {
    const table = document.getElementById('sedenion-table');
    const forceUpdateUI = () => { buildTable(currentAlgState); updateTableVis(); };

    if (table.rows.length === 0) {
        const maxDim = 15;
        let html = '<thead><tr><th class="first-col" data-action="reset">&times;</th>';

        for (let i = 0; i <= maxDim; i++) {
            const label = i === 0 ? "1" : "e<sub>" + i + "</sub>";
            html += `<th data-action="col" data-idx="${i}">${label}</th>`;
        }
        html += '</tr></thead><tbody>';

        for (let r = 0; r <= maxDim; r++) {
            const rowLabel = r === 0 ? "1" : "e<sub>" + r + "</sub>";
            html += `<tr data-idx="${r}"><td class="first-col" data-action="row" data-idx="${r}">${rowLabel}</td>`;

            for (let c = 0; c <= maxDim; c++) {
                const val = tableRaw[r][c];
                const style = tableColors[indexToColorKey[getBaseIndex(val)]];
                const valStr = (val === '1' || val === '-1') ? val : val.replace(/e(\d+)/, 'e<sub>$1</sub>');

                html += `<td data-action="cell" data-r="${r}" data-c="${c}" style="background-color:${style.bg}; color:${style.fg};">${valStr}</td>`;
            }
            html += '</tr>';
        }
        html += '</tbody>';

        table.innerHTML = html;

        table.addEventListener('click', (e) => {
            const target = e.target.closest('td, th');
            if (!target) return;

            const action = target.dataset.action;
            if (!action) return;

            if (action === 'cell') {
                const r = parseInt(target.dataset.r);
                const c = parseInt(target.dataset.c);

                if (tableState.activeRow === r && tableState.activeCol === c) {
                    tableState.activeRow = null;
                    tableState.activeCol = null;
                    forceUpdateUI();
                } else {
                    activateTripletFromTable(r, c);
                }
            }
            else if (action === 'col') {
                const idx = parseInt(target.dataset.idx);
                tableState.activeCol = (tableState.activeCol === idx) ? null : idx;
                forceUpdateUI();
            }
            else if (action === 'row') {
                const idx = parseInt(target.dataset.idx);
                tableState.activeRow = (tableState.activeRow === idx) ? null : idx;
                forceUpdateUI();
            }
            else if (action === 'reset') {
                tableState.activeRow = null;
                tableState.activeCol = null;
                forceUpdateUI();
            }
        });
    }

    const rows = table.rows;

    // 1. AGGIORNAMENTO VISIBILITÀ (Dimensioni tabella Sedenioni/Ottonioni)
    for (let r = 0; r < rows.length; r++) {
        const tr = rows[r];
        if (r === 0) {
            for (let c = 1; c < tr.cells.length; c++) tr.cells[c].style.display = (c - 1 > limitIndex) ? 'none' : '';
            continue;
        }
        if (r - 1 > limitIndex) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
            for (let c = 1; c < tr.cells.length; c++) tr.cells[c].style.display = (c - 1 > limitIndex) ? 'none' : '';
        }
    }

    // 2. Pulizia completa di tutte le classi interattive per evitare bug di sovrapposizione con Fano/Divisori
    const clearClasses = (td) => td && td.classList.remove('table-intersect', 'table-highlight', 'header-active', 'fano-selected', 'fano-dimmed');
    table.querySelectorAll('.table-intersect, .table-highlight, .header-active, .fano-selected, .fano-dimmed').forEach(clearClasses);

    // 3. APPLICAZIONE NUOVI STILI (Solo se c'è una selezione)
    if (tableState.activeRow !== null || tableState.activeCol !== null) {
        const rIdx = tableState.activeRow !== null ? tableState.activeRow + 1 : -1;
        const cIdx = tableState.activeCol !== null ? tableState.activeCol + 1 : -1;

        if (rIdx !== -1 && rows[rIdx]) rows[rIdx].cells[0].classList.add('header-active');
        if (cIdx !== -1 && rows[0].cells[cIdx]) rows[0].cells[cIdx].classList.add('header-active');

        for (let r = 1; r <= limitIndex + 1; r++) {
            const tr = rows[r];
            if (!tr) continue;
            for (let c = 1; c <= limitIndex + 1; c++) {
                const td = tr.cells[c];
                if (!td) continue;

                const isRowMatch = (r === rIdx);
                const isColMatch = (c === cIdx);

                if (rIdx !== -1 && cIdx !== -1) {
                    if (isRowMatch && isColMatch) td.classList.add('table-intersect');
                    else if (!isRowMatch && !isColMatch) td.classList.add('table-highlight');
                } else if (rIdx !== -1) {
                    if (!isRowMatch) td.classList.add('table-highlight');
                } else if (cIdx !== -1) {
                    if (!isColMatch) td.classList.add('table-highlight');
                }
            }
        }
    }

    // 4. SALVATAGGIO STATO ATTUALE PER IL PROSSIMO DIFF
    prevActiveRow = tableState.activeRow;
    prevActiveCol = tableState.activeCol;
}