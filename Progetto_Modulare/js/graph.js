import * as THREE from 'three';
import { 
    camera, initialCameraPos, controls, v_e5, v_e6, v_e7, v_e12, pts, pointObjects, 
    sphereMat, sphereMatCenter, tripletVisuals 
} from './scene.js';
import { currentAlgState, tripletButtons, fanoButtons, forceUpdate, resetView } from './main.js';
import { buildTable, tableState } from './table.js';
import { isRotationMode, toggleRotationMode } from './rotation.js';
import { t } from './i18n.js';

// --- GESTIONE COLORI TERNE (Tema Geometrico Fisso) ---
const TETRA_VERTICES = [5, 6, 7, 12];
const MIDPOINTS = [1, 2, 3, 9, 10, 11];

export function updateCycleColors() {
    tripletVisuals.forEach((t, i) => {
        t.mesh.material.uniforms.useHighlight.value = 1.0;
        let newColorHex;
        const hasCenter = t.ids.includes(8);

        if (hasCenter) {
            newColorHex = 0x00ffff;
        } else if (!t.isCollinear) {
            const isFaceCircle = t.ids.every(id => MIDPOINTS.includes(id));
            if (isFaceCircle) {
                newColorHex = 0xff00ff; 
            } else {
                newColorHex = 0x00ff00; 
            }
        } else {
            const verticesCount = t.ids.filter(id => TETRA_VERTICES.includes(id)).length;
            if (verticesCount >= 2) {
                newColorHex = 0xff0000;
            } else if (verticesCount === 1) {
                newColorHex = 0xffff00;
            } else {
                newColorHex = 0x00ff00;
            }
        }

        t.mesh.material.uniforms.color.value.setHex(newColorHex);
        if (tripletButtons[i]) tripletButtons[i].style.borderLeftColor = '#' + newColorHex.toString(16).padStart(6, '0');
    });
    if (typeof forceUpdate === 'function') forceUpdate();
}

export function visualizeTripletByIndex(idx) {
    if (isRotationMode) toggleRotationMode();
    if (window.resetZeroDivisorUI) window.resetZeroDivisorUI();

    for (let k in pointObjects) {
        const pid = parseInt(k);
        pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
    }
    updateCycleColors();

    const titleTextElem = document.getElementById('alg-title-text');
    if (currentAlgState === 3) titleTextElem.innerHTML = t('alg_quat');
    else if (currentAlgState === 7) titleTextElem.innerHTML = t('alg_oct');
    else titleTextElem.innerHTML = t('alg_sed');

    const btn = tripletButtons[idx];
    if (btn) btn.classList.toggle('active');

    const activeIndices = [];
    tripletButtons.forEach((b, i) => {
        if (b.classList.contains('active')) activeIndices.push(i);
    });

    if (activeIndices.length === 0) {
        resetView();
        return;
    }

    let maxTriplets = 35;
    if (currentAlgState === 3) maxTriplets = 1;
    if (currentAlgState === 7) maxTriplets = 7;

    if (activeIndices.length >= maxTriplets) {
        document.getElementById('dock-show-all-btn').style.display = 'none';
    } else {
        document.getElementById('dock-show-all-btn').style.display = 'flex';
    }

    tripletVisuals.forEach(t => {
        t.mesh.visible = false;
        if (t.hitMesh) t.hitMesh.visible = false;
    });
    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
    }

    activeIndices.forEach(i => {
        const tObj = tripletVisuals[i];
        tObj.mesh.visible = true;
        if (tObj.hitMesh) tObj.hitMesh.visible = true;

        const tripletIds = POSITIVE_TRIPLETS[i];
        tripletIds.forEach(pId => {
            if (pointObjects[pId]) {
                pointObjects[pId].mesh.visible = true;
                pointObjects[pId].label.visible = true;
            }
        });
    });
}

export let activeFanoIndex = null;
export function setActiveFanoIndex(val) { activeFanoIndex = val; }

export function animateCameraToDefault() {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = initialCameraPos.clone();
    const endTarget = new THREE.Vector3(0, 3, 0);
    const duration = 800;
    const startTime = performance.now();
    controls.enableDamping = false;
    (function animStep(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.position.lerpVectors(startPos, endPos, ease);
        controls.target.lerpVectors(startTarget, endTarget, ease);
        controls.update();
        forceUpdate();
        if (t < 1) requestAnimationFrame(animStep);
        else { controls.enableDamping = true; }
    })(startTime);
}

export function animateCameraToFanoPlane(planeIdx) {
    const zoomedOutPlanes = [0, 3, 5, 6, 7, 9, 10, 11, 13, 14];
    const isMobile = window.innerWidth <= 768;
    const DIST = (isMobile && zoomedOutPlanes.includes(planeIdx)) ? 38 : 24;
    let camPos, camTarget;

    const CONES = {
        2: { apex: v_e12, base: new THREE.Vector3().addVectors(v_e5, v_e6).add(v_e7).divideScalar(3) },
        4: { apex: v_e5, base: new THREE.Vector3().addVectors(v_e6, v_e7).add(v_e12).divideScalar(3) },
        8: { apex: v_e6, base: new THREE.Vector3().addVectors(v_e5, v_e7).add(v_e12).divideScalar(3) },
        12: { apex: v_e7, base: new THREE.Vector3().addVectors(v_e5, v_e6).add(v_e12).divideScalar(3) }
    };

    if (CONES[planeIdx] !== undefined) {
        const { apex, base } = CONES[planeIdx];
        const dir = new THREE.Vector3().subVectors(apex, base).normalize();
        camPos = apex.clone().addScaledVector(dir, DIST);
        camTarget = base.clone();
    } else if (planeIdx === 0) {
        const centroid = new THREE.Vector3();
        [1, 2, 3, 4, 5, 6, 7].forEach(id => centroid.add(pts[id]));
        centroid.divideScalar(7);
        camPos = centroid.clone().add(new THREE.Vector3(0, DIST, 0.1));
        camTarget = centroid.clone();
    } else if (planeIdx === 1) {
        const allIds = [1, 2, 3, 8, 9, 10, 11];
        const centroid = new THREE.Vector3();
        allIds.forEach(id => centroid.add(pts[id]));
        centroid.divideScalar(allIds.length);
        camPos = centroid.clone().add(new THREE.Vector3(0, DIST, -0.1));
        camTarget = centroid.clone();
    } else {
        const allIds = [...new Set(FANO_PLANES[planeIdx].flat())];
        const centroid = new THREE.Vector3();
        allIds.forEach(id => centroid.add(pts[id]));
        centroid.divideScalar(allIds.length);

        let normal = new THREE.Vector3();
        const pA = pts[allIds[0]];
        outer: for (let i = 1; i < allIds.length; i++) {
            for (let j = i + 1; j < allIds.length; j++) {
                const v1 = new THREE.Vector3().subVectors(pts[allIds[i]], pA);
                const v2 = new THREE.Vector3().subVectors(pts[allIds[j]], pA);
                normal.crossVectors(v1, v2);
                if (normal.lengthSq() > 0.01) break outer;
            }
        }
        normal.normalize();

        if (normal.dot(new THREE.Vector3().subVectors(camera.position, centroid)) < 0) normal.negate();
        if (Math.abs(normal.y) > 0.85) { normal.z -= 0.25 * Math.sign(normal.y); normal.normalize(); }

        camPos = centroid.clone().addScaledVector(normal, DIST);
        camTarget = centroid.clone();
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 800;
    const startTime = performance.now();
    controls.enableDamping = false;

    (function animStep(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.position.lerpVectors(startPos, camPos, ease);
        controls.target.lerpVectors(startTarget, camTarget, ease);
        controls.update();
        forceUpdate();
        if (t < 1) requestAnimationFrame(animStep);
        else { controls.enableDamping = true; }
    })(startTime);
}

export function visualizeFanoPlane(planeIdx, fromCalculator = false) {
    if (isRotationMode) toggleRotationMode();
    if (!fromCalculator && window.resetZeroDivisorUI) window.resetZeroDivisorUI();

    activeFanoIndex = planeIdx;
    tableState.activeRow = null;
    tableState.activeCol = null;
    buildTable(currentAlgState);

    document.getElementById('dock-show-all-btn').style.display = 'flex';

    const fanoIndices = [...new Set(FANO_PLANES[planeIdx].flat())].sort((a, b) => a - b);
    const fanoSubtitle = "{" + fanoIndices.map(i => "e<sub>" + i + "</sub>").join(", ") + "}";

    const titleTextElem = document.getElementById('alg-title-text');
    const mainTitle = (currentAlgState === 3 ? t('alg_quat') : (currentAlgState === 7 ? t('alg_oct') : t('alg_sed')));
    titleTextElem.innerHTML = `${mainTitle}<div style="font-size: 13px; font-weight: normal; color: #ccc; margin-top: 5px; font-family: 'Times New Roman'; opacity: 0.9; text-transform: none;">${fanoSubtitle}</div>`;

    updateCycleColors();

    tripletVisuals.forEach(t => {
        t.mesh.visible = false;
        if (t.hitMesh) t.hitMesh.visible = false;
        t.mesh.material.uniforms.useHighlight.value = 1.0;
    });

    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
        const pid = parseInt(k);
        pointObjects[pid].mesh.material = (pid === 8) ? sphereMatCenter : sphereMat;
    }

    document.querySelectorAll('.triplet-btn').forEach(b => b.classList.remove('active'));
    fanoButtons.forEach(b => b.classList.remove('active'));

    if (fanoButtons[planeIdx]) fanoButtons[planeIdx].classList.add('active');

    const table = document.getElementById('sedenion-table');
    table.querySelectorAll('td').forEach(td => {
        td.classList.remove('fano-selected', 'fano-dimmed');
        td.style.opacity = '';
    });
    const indices = [...new Set(FANO_PLANES[planeIdx].flat())];
    indices.push(0);
    const limit = currentAlgState;
    for (let r = 0; r <= limit; r++) {
        const tr = table.rows[r + 1];
        if (!tr) continue;
        for (let c = 0; c <= limit; c++) {
            const td = tr.cells[c + 1];
            if (!td) continue;
            td.classList.add('fano-dimmed');
            if (indices.includes(r) && indices.includes(c)) {
                td.classList.remove('fano-dimmed');
                td.classList.add('fano-selected');
            }
        }
    }

    const planeTriplets = FANO_PLANES[planeIdx];

    planeTriplets.forEach(triplet => {
        const tIdx = POSITIVE_TRIPLETS.findIndex(pt =>
            pt.includes(triplet[0]) && pt.includes(triplet[1]) && pt.includes(triplet[2])
        );

        if (tIdx !== -1) {
            const tObj = tripletVisuals[tIdx];
            tObj.mesh.visible = true;
            if (tObj.hitMesh) tObj.hitMesh.visible = true;

            if (tripletButtons[tIdx]) tripletButtons[tIdx].classList.add('active');
        }

        triplet.forEach(pId => {
            if (pointObjects[pId]) {
                pointObjects[pId].mesh.visible = true;
                pointObjects[pId].label.visible = true;
            }
        });
    });

    animateCameraToFanoPlane(planeIdx);
    forceUpdate();
}

export function highlightConnections(pointId) {
    // Il tasto "Mostra tutto" non deve apparire durante la pressione prolungata temporanea

    tripletVisuals.forEach(t => {
        t.mesh.visible = false;
        if (t.hitMesh) t.hitMesh.visible = false;
    });
    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
    }

    if (pointObjects[pointId]) {
        pointObjects[pointId].mesh.visible = true;
        pointObjects[pointId].label.visible = true;
    }

    POSITIVE_TRIPLETS.forEach((triplet, idx) => {
        if (triplet.includes(pointId) && triplet.every(val => val <= currentAlgState)) {
            tripletVisuals[idx].mesh.visible = true;
            if (tripletVisuals[idx].hitMesh) tripletVisuals[idx].hitMesh.visible = true;

            triplet.forEach(pId => {
                pointObjects[pId].mesh.visible = true;
                pointObjects[pId].label.visible = true;
            });
        }
    });
}

export function highlightSingleTriplet(tripletIdx) {
    if (currentAlgState === 3) {
        document.getElementById('dock-show-all-btn').style.display = 'none';
    } else {
        document.getElementById('dock-show-all-btn').style.display = 'flex';
    }

    tripletVisuals.forEach(t => {
        t.mesh.visible = false;
        if (t.hitMesh) t.hitMesh.visible = false;
    });
    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
    }

    const tObj = tripletVisuals[tripletIdx];
    if (tObj) {
        tObj.mesh.visible = true;
        if (tObj.hitMesh) tObj.hitMesh.visible = true;
        tObj.ids.forEach(pId => {
            if (pointObjects[pId]) {
                pointObjects[pId].mesh.visible = true;
                pointObjects[pId].label.visible = true;
            }
        });
    }
}