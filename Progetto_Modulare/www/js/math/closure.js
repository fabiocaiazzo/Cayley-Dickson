import * as THREE from 'three';
import { t } from '../core/i18n.js';
import { ALGEBRAS, TIMINGS } from '../core/constants.js';
import { tableLookup, POSITIVE_TRIPLETS } from './data.js';
import { pointObjects, tripletVisuals, selectedNodesForClosure, sphereMat, sphereMatCenter } from '../3d/scene.js';
import { currentAlgState, tripletButtons } from '../core/state.js';

const forceUpdate = () => window.dispatchEvent(new Event('requestForceUpdate'));
const resetView = () => window.dispatchEvent(new Event('requestResetView'));

// Fase 4 Anti-Patterns: rimosse variabili globali da window.*
let closureTimer = null;
let closureFlashTimers = [];

export function abortClosureAnimations() {
    if (closureTimer) {
        clearTimeout(closureTimer);
        closureTimer = null;
    }
    if (closureFlashTimers) {
        closureFlashTimers.forEach(timer => clearTimeout(timer));
        closureFlashTimers = [];
    }
}

export function initClosureGenerator() {
    const closureBtn = document.getElementById('closure-generator-btn');
    const closureDiv = document.getElementById('closure-divider');
    
    if (!closureBtn) return;

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
        const mainTitle = (currentAlgState === ALGEBRAS.QUATERNIONS ? t('alg_quat') : (currentAlgState === ALGEBRAS.OCTONIONS ? t('alg_oct') : t('alg_sed')));
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
                closureTimer = null; // Reset timer alla fine naturale
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
                    }, TIMINGS.CLOSURE_FLASH);
                    closureFlashTimers.push(flashT);
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
            closureTimer = setTimeout(playNextGeneration, TIMINGS.CLOSURE_PLAY);
        }

        playNextGeneration();
    });
}