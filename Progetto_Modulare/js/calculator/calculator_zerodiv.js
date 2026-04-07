import * as THREE from 'three';
import { pointObjects, tripletVisuals, sphereMatCenter } from '../scene.js';
import { visualizeFanoPlane } from '../graph.js';
import { currentVar, saveVar, switchVar, setGrid } from './calculator_ui.js';
import { currentAlgState, setCurrentAlgState, filterSubspace, resetView, openCalculator } from '../main.js';
import { t } from '../i18n.js';

export function updateZeroDivisorUI(limitIndex) {
    const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
    const zdOverlay = document.getElementById('zerodiv-overlay');
    const zdContentGrid = document.getElementById('zerodiv-content-grid');
    const kernelBtn = document.getElementById('calc-kernel-btn');
    const titleElem = document.getElementById('alg-title-text');

    if (!zdBtnCalc || !zdContentGrid) return;

    if (limitIndex === 15) {
        zdBtnCalc.style.display = 'block';
        if (kernelBtn) kernelBtn.style.display = 'none'; // Nasconde per sempre il tasto Ker manuale
        zdContentGrid.innerHTML = ''; // Pulisci griglia

        // --- GESTIONE MODALITÀ (Switch Fulcro / Piani Fano) ---
        let isFanoMode = true; // Impostato Default su TRUE (Piani Fano)
        const quasiOctIndices = [2, 4, 6, 8, 10, 12, 14];

        const renderOverlayContent = () => {
            zdContentGrid.innerHTML = '';

            // 1. Navbar Modernizzata (A due righe per mobile)
            const navBar = document.createElement('div');
            navBar.style.gridColumn = "1 / -1";
            navBar.style.display = "flex";
            navBar.style.flexDirection = "column"; 
            navBar.style.alignItems = "center"; 
            navBar.style.gap = "10px";
            navBar.style.marginBottom = "10px";
            navBar.style.paddingBottom = "5px";
            navBar.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

            // Etichetta Toggle
            const label = document.createElement('span');
            label.className = "zerodiv-toggle";
            label.innerHTML = isFanoMode ? `${t('zd_mode_fano')} &#8646;` : `${t('zd_mode_fulcrum')} &#8646;`;
            label.style.color = isFanoMode ? "#aaaaff" : "#00aaff";
            label.style.fontWeight = "bold";
            label.style.fontSize = "13px";
            label.style.letterSpacing = "1px";
            label.style.cursor = "pointer";
            label.style.whiteSpace = "nowrap";
            label.style.flexShrink = "0";
            label.title = t('zd_mode_tooltip');
            label.onclick = () => { isFanoMode = !isFanoMode; renderOverlayContent(); };
            navBar.appendChild(label);

            const btnContainer = document.createElement('div');
            btnContainer.style.display = "flex";
            btnContainer.style.gap = "4px";
            btnContainer.style.width = "100%"; 
            btnContainer.style.justifyContent = "center"; 
            btnContainer.style.flexWrap = "wrap"; 
            navBar.appendChild(btnContainer);

            // 2. Preparazione Dati
            const currentGroups = {};
            let keys = [];

            if (!isFanoMode) {
                // MODO FULCRO: 9-15
                keys = [9, 10, 11, 12, 13, 14, 15];
                keys.forEach(k => currentGroups[k] = []);
                ZERO_DIVISORS_RAW.forEach((zd) => {
                    const t = POSITIVE_TRIPLETS.find(tr => tr.includes(zd[0]) && tr.includes(zd[1]));
                    if (t) {
                        const k = t.find(val => val !== zd[0] && val !== zd[1]);
                        if (currentGroups[k]) currentGroups[k].push(zd);
                    }
                });
            } else {
                // MODO PIANI FANO: Indici ottetti con divisori dello zero
                keys = quasiOctIndices;
                keys.forEach(k => currentGroups[k] = []);
                const planeSets = {};
                keys.forEach(idx => planeSets[idx] = new Set(FANO_PLANES[idx].flat()));

                ZERO_DIVISORS_RAW.forEach((zd) => {
                    const nodes = [zd[0], zd[1], Math.abs(zd[2]), Math.abs(zd[3])];
                    keys.forEach(idx => {
                        if (nodes.every(n => planeSets[idx].has(n))) currentGroups[idx].push(zd);
                    });
                });
            }

            // 3. Funzione Render Items
            let activeZD = null; 
            let lastActiveKey = keys[0]; 

            window.resetZeroDivisorUI = function () {
                if (activeZD !== null) {
                    activeZD = null;
                    if (window.preZDState) {
                        setCurrentAlgState(window.preZDState);
                        window.preZDState = null;
                        filterSubspace(currentAlgState);
                    }
                    if (document.getElementById('zerodiv-overlay').classList.contains('visible')) {
                        renderItems(lastActiveKey);
                    }
                }
            };

            const renderItems = (activeKey) => {
                lastActiveKey = activeKey; 

                while (zdContentGrid.lastChild !== navBar) zdContentGrid.removeChild(zdContentGrid.lastChild);

                Array.from(btnContainer.children).forEach(btn => {
                    const key = parseInt(btn.dataset.key);
                    const isActive = key === activeKey;
                    btn.style.background = isActive ? "rgba(0, 170, 255, 0.2)" : "transparent"; 
                    btn.style.color = isActive ? "#ffffff" : "#8899aa";
                    btn.style.border = isActive ? "1px solid #00aaff" : "1px solid transparent"; 
                    btn.style.opacity = isActive ? "1" : "0.7";
                });

                const items = currentGroups[activeKey] || [];
                items.forEach((zd) => {
                    const sign1 = zd[2] < 0 ? "-" : ""; const sign2 = zd[3] < 0 ? "-" : "+";
                    const txt = `(e<sub>${zd[0]}</sub>+e<sub>${zd[1]}</sub>)(${sign1}e<sub>${Math.abs(zd[2])}</sub>${sign2}e<sub>${Math.abs(zd[3])}</sub>)`;
                    const btn = document.createElement('div');
                    btn.className = 'zerodiv-grid-btn';
                    btn.innerHTML = txt;

                    const zdID = zd.join(',');

                    if (activeZD === zdID) {
                        btn.style.borderColor = '#00ffaa';
                        btn.style.backgroundColor = 'rgba(0, 170, 255, 0.25)';
                        btn.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.2)';
                        btn.style.color = '#ffffff';
                    }

                    btn.onclick = (e) => {
                        e.stopPropagation();

                        if (activeZD === zdID) {
                            activeZD = null;
                            if (window.preZDState) {
                                setCurrentAlgState(window.preZDState);
                                window.preZDState = null;
                            }
                            resetView(); 
                            renderItems(activeKey); 
                            return;
                        }

                        activeZD = zdID;

                        if (currentAlgState !== 15 && !window.preZDState) {
                            window.preZDState = currentAlgState;
                        }
                        if (currentAlgState !== 15) {
                            setCurrentAlgState(15);
                            filterSubspace(15);
                        }

                        renderItems(activeKey); 

                        openCalculator(true);
                        saveVar(currentVar); switchVar('a');
                        let vA = window.createZeroVector ? window.createZeroVector() : new Array(16).fill(0);
                        vA[zd[0]] = 1; vA[zd[1]] = 1;
                        setGrid(vA); saveVar('a');

                        switchVar('b');
                        let vB = window.createZeroVector ? window.createZeroVector() : new Array(16).fill(0);
                        vB[Math.abs(zd[2])] = Math.sign(zd[2]);
                        vB[Math.abs(zd[3])] = Math.sign(zd[3]);
                        setGrid(vB); saveVar('b');

                        document.getElementById('expression-display').value = 'a * b';
                        if (typeof window.calcAction === 'function') window.calcAction('eval');

                        const zIndices = [zd[0], zd[1], Math.abs(zd[2]), Math.abs(zd[3])];
                        const planeIdx = FANO_PLANES.findIndex(plane => {
                            const flatPlane = plane.flat();
                            return zIndices.every(val => flatPlane.includes(val));
                        });

                        if (planeIdx !== -1) {
                            visualizeFanoPlane(planeIdx, true);

                            const t = POSITIVE_TRIPLETS.find(tr => tr.includes(zd[0]) && tr.includes(zd[1]));
                            let fulcrumID = null;
                            if (t) fulcrumID = t.find(x => x !== zd[0] && x !== zd[1]);

                            if (fulcrumID && pointObjects[fulcrumID]) pointObjects[fulcrumID].mesh.material = sphereMatCenter;

                            const matBlue = new THREE.MeshPhysicalMaterial({ color: 0x0088ff, metalness: 0.2, roughness: 0.4 });
                            const matGreen = new THREE.MeshPhysicalMaterial({ color: 0x00ff00, metalness: 0.2, roughness: 0.4 });
                            const matRed = new THREE.MeshPhysicalMaterial({ color: 0xff0000, metalness: 0.2, roughness: 0.4 });

                            const f1_a = zd[0]; const f1_b = zd[1];
                            const f2_a = Math.abs(zd[2]); const f2_b = Math.abs(zd[3]);
                            const activeNodes = [f1_a, f1_b, f2_a, f2_b];

                            FANO_PLANES[planeIdx].forEach(triplet => {
                                const tIdx = POSITIVE_TRIPLETS.findIndex(pt => pt.includes(triplet[0]) && pt.includes(triplet[1]) && pt.includes(triplet[2]));
                                if (tIdx === -1) return;
                                const visual = tripletVisuals[tIdx];

                                const isFactor1 = triplet.includes(f1_a) && triplet.includes(f1_b);
                                const isFactor2 = triplet.includes(f2_a) && triplet.includes(f2_b);

                                visual.mesh.visible = true;

                                if (triplet.every(val => val <= 7)) {
                                    visual.mesh.material.uniforms.color.value.setHex(0x0088ff); 
                                    visual.mesh.material.uniforms.useHighlight.value = 1.0;

                                    triplet.forEach(n => {
                                        if (activeNodes.includes(n) && pointObjects[n]) pointObjects[n].mesh.material = matBlue;
                                    });
                                }
                                else if (fulcrumID && (isFactor1 || isFactor2)) {
                                    const node = triplet.find(x => x <= 7 && x !== fulcrumID);
                                    if (node) {
                                        const iNode = triplet.indexOf(node);
                                        const iFulcrum = triplet.indexOf(fulcrumID);
                                        const isPositive = ((iNode + 1) % 3) === iFulcrum;

                                        const colorHex = isPositive ? 0x00ff00 : 0xff0000;
                                        visual.mesh.material.uniforms.color.value.setHex(colorHex);
                                        visual.mesh.material.uniforms.useHighlight.value = 1.0;

                                        const extNode = triplet.find(x => x !== node && x !== fulcrumID);
                                        if (extNode && pointObjects[extNode]) {
                                            pointObjects[extNode].mesh.material = isPositive ? matGreen : matRed;
                                        }
                                    }
                                }
                                else {
                                    visual.mesh.material.uniforms.color.value.setHex(0x888888);
                                    visual.mesh.material.uniforms.useHighlight.value = 1.0; 
                                }
                            });

                        } else {
                            resetView();
                            zIndices.forEach(id => { if (pointObjects[id]) { pointObjects[id].mesh.visible = true; pointObjects[id].label.visible = true; } });
                        }

                        if (titleElem) titleElem.innerHTML = `${t('zd_title_single')}<div style="font-size: 13px; font-weight: normal; color: #ccc; margin-top: 5px; font-family: 'Times New Roman'; opacity: 0.9; text-transform: none;">${txt}</div>`;
                    };
                    zdContentGrid.appendChild(btn);
                });
            };

            keys.forEach((k, i) => {
                const btn = document.createElement('div');
                btn.className = "zerodiv-tab"; 
                btn.dataset.key = k;
                btn.style.cursor = "pointer";
                btn.style.fontFamily = "'Times New Roman', serif";
                btn.style.fontSize = "14px";
                btn.style.fontStyle = "italic";
                btn.style.padding = "2px 6px";
                btn.style.borderRadius = "4px";
                btn.style.transition = "all 0.2s";
                btn.style.flexShrink = "0"; 

                if (isFanoMode) {
                    btn.innerHTML = `P<sub>${i + 1}</sub>`; 
                    const planeNodes = [...new Set(FANO_PLANES[k].flat())].sort((a, b) => a - b);
                    btn.title = "{" + planeNodes.map(n => "e" + n).join(", ") + "}";
                } else {
                    btn.innerHTML = `e<sub>${k}</sub>`;
                }

                btn.onclick = () => renderItems(k);
                btnContainer.appendChild(btn);
            });

            zdContentGrid.appendChild(navBar);
            renderItems(keys[0]);
        };

        renderOverlayContent();

    } else {
        zdBtnCalc.style.display = 'none';
        if (kernelBtn) kernelBtn.style.display = 'none';
        zdContentGrid.innerHTML = ''; 

        if (zdOverlay) zdOverlay.classList.remove('visible');
        if (zdBtnCalc) zdBtnCalc.classList.remove('active');
    }
}

export function initZeroDivisorListeners() {
    const zdOverlay = document.getElementById('zerodiv-overlay');
    const zdBtnCalc = document.getElementById('calc-zerodiv-btn');
    const dockZdBtn = document.getElementById('dock-zerodiv-btn');
    const zdCloseOverlay = document.getElementById('close-zerodiv-overlay');
    const formulasMenu = document.getElementById('calc-formula-menu');
    const dockFormulasBtn = document.getElementById('dock-formulas-btn');

    if (zdOverlay) {
        const toggleZd = (e) => {
            if (formulasMenu) formulasMenu.classList.remove('visible');
            const calcModalEl = document.getElementById('calc-modal');
            const isMobile = window.innerWidth <= 768;

            const zdContentGrid = document.getElementById('zerodiv-content-grid');
            if (zdContentGrid && zdContentGrid.innerHTML.trim() === '') updateZeroDivisorUI(15);

            if (isMobile && e.currentTarget === dockZdBtn) {
                const wasActive = dockZdBtn.classList.contains('active');

                calcModalEl.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
                document.getElementById('calc-toggle-btn').classList.remove('active');
                if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
                zdOverlay.classList.remove('visible');
                if (dockZdBtn) dockZdBtn.classList.remove('active');
                if (zdBtnCalc) zdBtnCalc.classList.remove('active');

                if (!wasActive) {
                    dockZdBtn.classList.add('active');
                    calcModalEl.classList.add('active', 'zerodiv-mobile-mode');
                    calcModalEl.style.zIndex = ++window.highestZIndex;
                    zdOverlay.classList.add('visible');
                }
            } else {
                if (!calcModalEl.classList.contains('active')) {
                    openCalculator(true);
                }
                zdOverlay.classList.toggle('visible');
                if (zdBtnCalc) zdBtnCalc.classList.toggle('active');
                if (dockZdBtn) dockZdBtn.classList.toggle('active');
            }
        };
        
        if (zdBtnCalc) zdBtnCalc.addEventListener('click', toggleZd);
        if (dockZdBtn) dockZdBtn.addEventListener('click', toggleZd);

        if (zdCloseOverlay) {
            zdCloseOverlay.addEventListener('click', () => {
                zdOverlay.classList.remove('visible');
                if (zdBtnCalc) zdBtnCalc.classList.remove('active');
                if (dockZdBtn) dockZdBtn.classList.remove('active');
                const calcModalEl = document.getElementById('calc-modal');
                if (calcModalEl) calcModalEl.classList.remove('zerodiv-mobile-mode');
            });
        }

        // --- LOGICA TASTO SPIEGAZIONE ---
        const explainCheck = document.getElementById('zerodiv-explain-check');
        const explainPanel = document.getElementById('zerodiv-explanation-panel');
        const explainLabel = document.getElementById('zerodiv-explain-label');

        const explainCheckMobile = document.getElementById('zerodiv-explain-check-mobile');
        const explainLabelMobile = document.getElementById('zerodiv-explain-label-mobile');

        const syncExplainPanel = (isActive) => {
            explainPanel.style.display = isActive ? 'flex' : 'none';

            if (explainLabel) {
                if (isActive) {
                    explainLabel.style.borderColor = '#00aaff';
                    explainLabel.style.backgroundColor = '#00aaff';
                    explainLabel.style.color = '#ffffff';
                    explainLabel.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.5)';
                } else {
                    explainLabel.style.borderColor = '#667788';
                    explainLabel.style.backgroundColor = 'transparent';
                    explainLabel.style.color = '#667788';
                    explainLabel.style.boxShadow = 'none';
                }
            }

            if (explainLabelMobile) {
                if (isActive) {
                    explainLabelMobile.style.borderColor = '#00aaff';
                    explainLabelMobile.style.backgroundColor = '#00aaff';
                    explainLabelMobile.style.color = '#ffffff';
                } else {
                    explainLabelMobile.style.borderColor = '#667788';
                    explainLabelMobile.style.backgroundColor = 'transparent';
                    explainLabelMobile.style.color = '#667788';
                }
            }

            if (explainCheck) explainCheck.checked = isActive;
            if (explainCheckMobile) explainCheckMobile.checked = isActive;
        };

        if (explainCheck && explainPanel) {
            explainCheck.addEventListener('change', (e) => syncExplainPanel(e.target.checked));
        }
        if (explainCheckMobile && explainPanel) {
            explainCheckMobile.addEventListener('change', (e) => syncExplainPanel(e.target.checked));
        }
    }
}