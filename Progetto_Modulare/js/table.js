import { pointObjects, sphereMatCenter, sphereMat, tripletVisuals } from './scene.js';
import { currentAlgState, tripletButtons, resetView } from './main.js';
import { updateCycleColors, highlightConnections, highlightSingleTriplet } from './graph.js';

// --- FUNZIONI TABELLA ---
export let tableState = { activeRow: null, activeCol: null };

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
    // RESET UI DIVISORI ZERO
    if (window.resetZeroDivisorUI) window.resetZeroDivisorUI();

    // MODIFICA: Reset del titolo principale
    const titleTextElem = document.getElementById('alg-title-text');
    if (currentAlgState === 3) titleTextElem.innerHTML = "QUATERNIONI";
    else if (currentAlgState === 7) titleTextElem.innerHTML = "OTTETTI";
    else titleTextElem.innerHTML = "SEDENIONI";

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
    document.getElementById('dock-show-all-btn').style.display = 'flex';

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
    // 0. RESET PREVENTIVO COLORI
    for (let k in pointObjects) {
        const pid = parseInt(k);
        pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
    }
    updateCycleColors();

    const r = tableState.activeRow;
    const c = tableState.activeCol;

    if (r === null && c === null) {
        resetView();
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

    for (let r = 0; r < rows.length; r++) {
        const tr = rows[r];
        const rowIdx = r - 1;

        for (let c = 0; c < tr.cells.length; c++) {
            tr.cells[c].classList.remove('table-intersect', 'table-highlight', 'header-active', 'fano-selected', 'fano-dimmed');
            tr.cells[c].style.opacity = '';
        }

        if (r === 0) {
            for (let c = 1; c < tr.cells.length; c++) {
                tr.cells[c].style.display = (c - 1 > limitIndex) ? 'none' : '';
            }
            continue;
        }

        if (rowIdx > limitIndex) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
            for (let c = 1; c < tr.cells.length; c++) {
                tr.cells[c].style.display = (c - 1 > limitIndex) ? 'none' : '';
            }

            if (rowIdx === tableState.activeRow) tr.cells[0].classList.add('header-active');

            for (let c = 1; c <= limitIndex + 1; c++) {
                const colIdx = c - 1;
                if (r === 1 && colIdx === tableState.activeCol) rows[0].cells[c].classList.add('header-active');

                const td = tr.cells[c];
                if (tableState.activeRow !== null || tableState.activeCol !== null) {
                    const rowMatch = (tableState.activeRow === rowIdx);
                    const colMatch = (tableState.activeCol === colIdx);
                    if (rowMatch && colMatch) td.classList.add('table-intersect');
                    else if (!rowMatch && !colMatch) td.classList.add('table-highlight');
                }
            }
        }
    }
}