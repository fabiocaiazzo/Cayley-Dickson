import { ZERO_DIVISORS_RAW, POSITIVE_TRIPLETS, FANO_PLANES } from '../math/data.js';
import * as THREE from 'three';
import { pointObjects, tripletVisuals, sphereMatCenter } from '../3d/scene.js';
import { visualizeFanoPlane } from '../3d/graph.js';
import { currentVar, saveVar, switchVar, setGrid } from './calculator_ui.js';
import { createZeroVector, storedVars } from '../math/parser.js';
import { currentAlgState, AppState } from '../core/state.js';
import { vecMul } from '../math/algebra.js';

let cachedZD32 = null;
export function generate32ZeroDivisors() {
    if (cachedZD32) return cachedZD32;
    cachedZD32 = [];
    const vA = new Array(32).fill(0);
    const vB = new Array(32).fill(0);

    for (let i = 1; i <= 31; i++) {
        for (let j = i + 1; j <= 31; j++) {
            vA.fill(0);
            vA[i] = 1;
            vA[j] = 1;
            const x = i ^ j; // Proprietà magica dell'algebra di Cayley-Dickson
            
            for (let k = i + 1; k <= 31; k++) {
                if (k === j) continue;
                const l = x ^ k;
                if (k >= l) continue; // Evita duplicati speculari

                // Testiamo (ei + ej)(ek + el)
                vB.fill(0);
                vB[k] = 1;
                vB[l] = 1;
                let res = vecMul(vA, vB);
                let isZero = true;
                for (let r = 0; r < 32; r++) if (Math.abs(res[r]) > 1e-9) { isZero = false; break; }
                if (isZero) {
                    cachedZD32.push([i, j, k, l]);
                    continue;
                }

                // Testiamo (ei + ej)(ek - el)
                vB[l] = -1;
                res = vecMul(vA, vB);
                isZero = true;
                for (let r = 0; r < 32; r++) if (Math.abs(res[r]) > 1e-9) { isZero = false; break; }
                if (isZero) {
                    cachedZD32.push([i, j, k, -l]);
                }
            }
        }
    }
    return cachedZD32;
}

const getActiveZeroDivisors = () => {
    return (AppState && AppState.is32IonMode) ? generate32ZeroDivisors() : ZERO_DIVISORS_RAW;
};

export let resetZeroDivisorUI = null;
export let handleZeroDivisorClick = null;

const resetView = () => window.dispatchEvent(new Event('requestResetView'));
const setCurrentAlgState = (val) => window.dispatchEvent(new CustomEvent('requestAlgebraChange', { detail: val }));
const filterSubspace = (val) => window.dispatchEvent(new CustomEvent('requestFilterSubspace', { detail: val }));
import { openCalculator } from './calculator_window.js';
import { calcAction } from './calculator_core.js';
import { t } from '../core/i18n.js';

let preZDState = null;
import { isMobile, zManager } from '../core/constants.js';
import { CalcBridge } from './calculator_popout.js';

// Pre-istanzio i materiali per evitare memory leak GPU ad ogni calcolo
const matBlue = new THREE.MeshPhysicalMaterial({ color: 0x0088ff, metalness: 0.2, roughness: 0.4 });
const matGreen = new THREE.MeshPhysicalMaterial({ color: 0x00ff00, metalness: 0.2, roughness: 0.4 });
const matRed = new THREE.MeshPhysicalMaterial({ color: 0xff0000, metalness: 0.2, roughness: 0.4 });

export function updateZeroDivisorUI(limitIndex) {

    const zdBtnCalc = CalcBridge.getElementById('calc-zerodiv-btn');
    const zdOverlay = CalcBridge.getElementById('zerodiv-overlay');
    const zdContentGrid = CalcBridge.getElementById('zerodiv-content-grid');
    const kernelBtn = CalcBridge.getElementById('calc-kernel-btn');
    const titleElem = CalcBridge.getElementById('alg-title-text');

    if (!zdBtnCalc || !zdContentGrid) return;

    if (limitIndex === 15 || limitIndex === 31) {
        const is32 = limitIndex === 31;
        // Mostra i tasti di spiegazione e ricerca quando siamo nei Sedenioni o nei 32-ioni
        const searchLabel = CalcBridge.getElementById('zerodiv-search-label');
        if (searchLabel) searchLabel.style.display = 'flex';
        zdBtnCalc.style.display = 'block';
        if (kernelBtn) kernelBtn.style.display = 'none'; // Nasconde per sempre il tasto Ker manuale
        zdContentGrid.innerHTML = ''; // Pulisci griglia
        
        // Setup Event Delegation per la griglia principale
        if (!zdContentGrid.hasAttribute('data-listener-attached')) {
            zdContentGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.zerodiv-grid-btn');
                if (btn && btn.dataset.zd) {
                    const zd = JSON.parse(btn.dataset.zd);
                    const zdID = btn.dataset.zdid;
                    const activeKey = btn.dataset.activekey ? parseInt(btn.dataset.activekey) : undefined;
                    if (handleZeroDivisorClick) handleZeroDivisorClick(zd, zdID, activeKey);
                }
            });
            zdContentGrid.setAttribute('data-listener-attached', 'true');
        }

        // --- GESTIONE MODALITÀ (Switch Fulcro / Piani Fano) ---
        let isFanoMode = !is32; // Nei 32-ioni raggruppiamo semplicemente per indice primario
        const quasiOctIndices = [2, 4, 6, 8, 10, 12, 14];

        const renderOverlayContent = () => {
            zdContentGrid.innerHTML = '';

            // 1. Navbar Modernizzata (A due righe per mobile)
            const navBar = document.createElement('div');
            navBar.style.gridColumn = "1 / -1";
            navBar.style.display = "flex";
            navBar.style.flexDirection = "column";
            navBar.style.alignItems = "center";
            navBar.style.width = "100%"; // Forza larghezza piena
            navBar.style.gap = "8px"; // Ridotto gap per risparmiare spazio verticale
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
            if (is32) label.style.display = 'none';
            
            const btnContainer = document.createElement('div');
            btnContainer.style.display = is32 ? "flex" : "grid";
            if (!is32) {
                // Forziamo 7 colonne fisse per riga
                btnContainer.style.gridTemplateColumns = "repeat(7, 1fr)";
                btnContainer.style.gridTemplateRows = "repeat(2, auto)";
            }
            btnContainer.style.gap = "4px";
            btnContainer.style.width = "100%";
            btnContainer.style.boxSizing = "border-box";
            btnContainer.style.justifyContent = "center";
            btnContainer.style.flexWrap = is32 ? "wrap" : "nowrap";
            // Rimuoviamo il limite di altezza per i Sedenioni per evitare scroll interno alla navbar
            btnContainer.style.maxHeight = is32 ? "64px" : "none";
            btnContainer.style.overflowY = is32 ? "auto" : "visible";
            btnContainer.style.padding = "2px";
            navBar.appendChild(btnContainer);

            // 2. Preparazione Dati
            const currentGroups = {};
            let keys = [];

            if (is32) {
                // Nei 32-ioni raggruppiamo per indice di base da 1 a 31
                keys = Array.from({length: 31}, (_, i) => i + 1);
                keys.forEach(k => currentGroups[k] = []);
                getActiveZeroDivisors().forEach(zd => {
                    if (currentGroups[zd[0]]) currentGroups[zd[0]].push(zd);
                });
            } else if (!isFanoMode) {
                // MODO FULCRO: 1-7 e 9-15 su due righe (14 tasti totali)
                keys = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
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

            handleZeroDivisorClick = function (zd, zdID, activeKey) {
                const isCurrent32 = (AppState && AppState.is32IonMode);

                const updateSearchResultsColor = (activeID) => {
                    const searchResultsContainer = CalcBridge.getElementById('zd-search-results');
                    if (searchResultsContainer) {
                        searchResultsContainer.querySelectorAll('.zerodiv-grid-btn').forEach(btn => {
                            if (btn.dataset.zdid === activeID) {
                                btn.style.borderColor = '#00ffaa';
                                btn.style.backgroundColor = 'rgba(0, 170, 255, 0.25)';
                                btn.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.2)';
                                btn.style.color = '#ffffff';
                            } else {
                                btn.style.borderColor = 'transparent';
                                btn.style.backgroundColor = 'transparent';
                                btn.style.boxShadow = 'none';
                                btn.style.color = '';
                            }
                        });
                    }
                };

                if (activeZD === zdID) {
                    activeZD = null;
                    if (preZDState) {
                        setCurrentAlgState(preZDState);
                        preZDState = null;
                    }
                    if (!isCurrent32) {
                        resetView();
                    } else {
                        document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(b => b.classList.remove('active'));
                        document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(b => b.classList.remove('active'));
                    }
                    if (activeKey !== undefined) renderItems(activeKey);
                    updateSearchResultsColor(null);
                    return;
                }

                activeZD = zdID;

                if (!isCurrent32 && currentAlgState !== 15 && !preZDState) {
                    preZDState = currentAlgState;
                }
                if (!isCurrent32 && currentAlgState !== 15) {
                    setCurrentAlgState(15);
                    filterSubspace(15);
                }

                if (activeKey !== undefined) renderItems(activeKey);
                updateSearchResultsColor(activeZD);

                const calcModalEl = CalcBridge.getElementById('calc-modal');
                if (!calcModalEl || !calcModalEl.classList.contains('active')) {
                    openCalculator(!isCurrent32);
                }

                saveVar(currentVar); switchVar('a');
                let vA = createZeroVector();
                vA[zd[0]] = 1; vA[zd[1]] = 1;
                storedVars['a'] = vA;
                setGrid(vA);

                switchVar('b');
                let vB = createZeroVector();
                vB[Math.abs(zd[2])] = Math.sign(zd[2]);
                vB[Math.abs(zd[3])] = Math.sign(zd[3]);
                storedVars['b'] = vB;
                setGrid(vB);

                CalcBridge.getElementById('expression-display').value = 'a * b';
                CalcBridge.getElementById('expression-display').dispatchEvent(new Event('input'));
                calcAction('eval', true);

                const zIndices = [zd[0], zd[1], Math.abs(zd[2]), Math.abs(zd[3])];
                
                if (isCurrent32) {
                    // Nessun aggiornamento grafico nei 32-ioni per evitare sovrapposizioni al cono
                    let activePlaneNums = null;
                    
                    // Colora il Piano di Fano
                    document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(btn => {
                        const nums = btn.innerText.match(/\d+/g).map(Number);
                        if (zIndices.every(n => nums.includes(n))) {
                            btn.classList.add('active');
                            activePlaneNums = nums;
                        } else {
                            btn.classList.remove('active');
                        }
                    });

                    // Colora le Terne contenute nel Piano di Fano
                    document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(btn => {
                        if (activePlaneNums) {
                            const nums = btn.innerText.match(/\d+/g).map(Number);
                            if (nums.every(n => activePlaneNums.includes(n))) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                } else {
                    const planeIdx = FANO_PLANES.findIndex(plane => {
                        const flatPlane = plane.flat();
                        return zIndices.every(val => flatPlane.includes(val));
                    });

                    if (planeIdx !== -1) {
                    visualizeFanoPlane(planeIdx, true);

                    const tTri = POSITIVE_TRIPLETS.find(tr => tr.includes(zd[0]) && tr.includes(zd[1]));
                    let fulcrumID = null;
                    if (tTri) fulcrumID = tTri.find(x => x !== zd[0] && x !== zd[1]);

                    if (fulcrumID && pointObjects[fulcrumID]) pointObjects[fulcrumID].mesh.material = sphereMatCenter;

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
                } // Fine bypass 32-ioni

                if (titleElem) {
                    const sign1 = zd[2] < 0 ? "-" : ""; const sign2 = zd[3] < 0 ? "-" : "+";
                    const txt = `(e<sub>${zd[0]}</sub>+e<sub>${zd[1]}</sub>)(${sign1}e<sub>${Math.abs(zd[2])}</sub>${sign2}e<sub>${Math.abs(zd[3])}</sub>)`;
                    titleElem.innerHTML = `${t('zd_title_single')}<div style="font-size: 13px; font-weight: normal; color: #ccc; margin-top: 5px; font-family: 'Times New Roman'; opacity: 0.9; text-transform: none;">${txt}</div>`;
                }
            };

            resetZeroDivisorUI = function () {
                if (activeZD !== null) {
                    activeZD = null;
                    if (AppState && AppState.is32IonMode) {
                        document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(b => b.classList.remove('active'));
                        document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(b => b.classList.remove('active'));
                    }
                    if (preZDState) {
                        setCurrentAlgState(preZDState);
                        preZDState = null;
                        filterSubspace(currentAlgState);
                    }
                    if (CalcBridge.getElementById('zerodiv-overlay').classList.contains('visible')) {
                        renderItems(lastActiveKey);
                    }
                    const searchResultsContainer = CalcBridge.getElementById('zd-search-results');
                    if (searchResultsContainer) {
                        searchResultsContainer.querySelectorAll('.zerodiv-grid-btn').forEach(b => {
                            b.style.borderColor = 'transparent';
                            b.style.backgroundColor = 'transparent';
                            b.style.boxShadow = 'none';
                            b.style.color = '';
                        });
                    }
                }
            };

            const renderItems = (activeKey) => {
                lastActiveKey = activeKey;

                while (zdContentGrid.lastChild !== navBar) zdContentGrid.removeChild(zdContentGrid.lastChild);

                Array.from(btnContainer.children).forEach(btn => {
                    const key = parseInt(btn.dataset.key);
                    const isActive = key === activeKey;
                    
                    // Colori differenziati: Blu per e1-e7 (riga 1), Arancio per e9-e15 (riga 2)
                    const isLow = key < 8;
                    const accentColor = isLow ? "#00aaff" : "#ffaa00";
                    const bgAlpha = isLow ? "rgba(0, 170, 255, 0.2)" : "rgba(255, 170, 0, 0.2)";

                    btn.style.background = isActive ? bgAlpha : "transparent";
                    btn.style.color = isActive ? "#ffffff" : "#8899aa";
                    btn.style.border = isActive ? `1px solid ${accentColor}` : "1px solid transparent";
                    btn.style.opacity = isActive ? "1" : "0.7";
                });

                const items = currentGroups[activeKey] || [];
                items.forEach((zd) => {
                    const sign1 = zd[2] < 0 ? "-" : ""; const sign2 = zd[3] < 0 ? "-" : "+";
                    const txt = `(e<sub>${zd[0]}</sub>+e<sub>${zd[1]}</sub>)(${sign1}e<sub>${Math.abs(zd[2])}</sub>${sign2}e<sub>${Math.abs(zd[3])}</sub>)`;
                    const btn = document.createElement('div');
                    btn.className = 'zerodiv-grid-btn';
                    btn.style.boxSizing = 'border-box';
                    btn.style.border = '1px solid transparent';
                    btn.innerHTML = txt;

                    const zdID = zd.join(',');

                    if (activeZD === zdID) {
                        btn.style.borderColor = '#00ffaa';
                        btn.style.backgroundColor = 'rgba(0, 170, 255, 0.25)';
                        btn.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.2)';
                        btn.style.color = '#ffffff';
                    }

                    btn.dataset.zd = JSON.stringify(zd);
                    btn.dataset.zdid = zdID;
                    btn.dataset.activekey = activeKey;
                    
                    zdContentGrid.appendChild(btn);
                });
            };

            keys.forEach((k, i) => {
                const btn = document.createElement('div');
                btn.className = "zerodiv-tab";
                btn.dataset.key = k;
                btn.style.cursor = "pointer";
                btn.style.fontFamily = "'Times New Roman', serif";
                btn.style.fontSize = "13px"; // Ridotto leggermente per garantire l'incastro
                btn.style.fontStyle = "italic";
                btn.style.padding = "4px 1px"; // Padding orizzontale minimo
                btn.style.borderRadius = "4px";
                btn.style.transition = "all 0.2s";
                btn.style.flexShrink = "0";
                btn.style.minWidth = "0"; // Impedisce al contenuto di forzare l'allargamento
                btn.style.textAlign = "center";
                btn.style.boxSizing = "border-box";
                btn.style.minWidth = "0"; // Permette al bottone di restringersi se necessario
                btn.style.textAlign = "center";

                if (is32) {
                    btn.innerHTML = `e<sub>${k}</sub>`;
                } else if (isFanoMode) {
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
    const zdOverlay = CalcBridge.getElementById('zerodiv-overlay');
    const zdBtnCalc = CalcBridge.getElementById('calc-zerodiv-btn');
    const dockZdBtn = CalcBridge.getElementById('dock-zerodiv-btn');
    const zdCloseOverlay = CalcBridge.getElementById('close-zerodiv-overlay');
    const formulasMenu = CalcBridge.getElementById('calc-formula-menu');
    const dockFormulasBtn = CalcBridge.getElementById('dock-formulas-btn');

    if (zdOverlay) {
        const toggleZd = (e) => {
            if (formulasMenu) formulasMenu.classList.remove('visible');
            const calcModalEl = CalcBridge.getElementById('calc-modal');
            const isMobileNow = isMobile();

            const zdContentGrid = CalcBridge.getElementById('zerodiv-content-grid');
            const currentLim = (AppState && AppState.is32IonMode) ? 31 : 15;
            if (zdContentGrid && (zdContentGrid.innerHTML.trim() === '' || zdContentGrid.dataset.lim !== currentLim.toString())) {
                zdContentGrid.dataset.lim = currentLim.toString();
                updateZeroDivisorUI(currentLim);
            }

            if (isMobileNow && e.currentTarget === dockZdBtn) {
                const wasActive = dockZdBtn.classList.contains('active');

                calcModalEl.classList.remove('active', 'formulas-mobile-mode', 'zerodiv-mobile-mode');
                CalcBridge.getElementById('calc-toggle-btn').classList.remove('active');
                if (dockFormulasBtn) dockFormulasBtn.classList.remove('active');
                zdOverlay.classList.remove('visible');
                if (dockZdBtn) dockZdBtn.classList.remove('active');
                if (zdBtnCalc) zdBtnCalc.classList.remove('active');

                if (!wasActive) {
                    dockZdBtn.classList.add('active');
                    calcModalEl.classList.add('active', 'zerodiv-mobile-mode');
                    calcModalEl.style.zIndex = zManager.next();
                    zdOverlay.classList.add('visible');
                }
            } else {
                if (!calcModalEl.classList.contains('active')) {
                    openCalculator(!(AppState && AppState.is32IonMode));
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
                const calcModalEl = CalcBridge.getElementById('calc-modal');
                if (calcModalEl) calcModalEl.classList.remove('zerodiv-mobile-mode');
            });
        }

        // --- LOGICA TASTO SPIEGAZIONE ---
        const explainCheck = CalcBridge.getElementById('zerodiv-explain-check');
        const explainPanel = CalcBridge.getElementById('zerodiv-explanation-panel');
        const explainLabel = CalcBridge.getElementById('zerodiv-explain-label');

        const explainCheckMobile = CalcBridge.getElementById('zerodiv-explain-check-mobile');
        const explainLabelMobile = CalcBridge.getElementById('zerodiv-explain-label-mobile');

        const toggleLabelStyle = (el, active, withShadow = false) => {
            if (!el) return;
            el.style.borderColor = active ? '#00aaff' : '#667788';
            el.style.backgroundColor = active ? '#00aaff' : 'transparent';
            el.style.color = active ? '#ffffff' : '#667788';
            if (withShadow) el.style.boxShadow = active ? '0 0 10px rgba(0, 170, 255, 0.5)' : 'none';
        };

        const searchCheck = CalcBridge.getElementById('zerodiv-search-check');
        const searchPanel = CalcBridge.getElementById('zerodiv-search-panel');
        const searchLabel = CalcBridge.getElementById('zerodiv-search-label');

        const searchCheckMobile = CalcBridge.getElementById('zerodiv-search-check-mobile');
        const searchLabelMobile = CalcBridge.getElementById('zerodiv-search-label-mobile');

        let selectedSearchBases = new Set();

        const renderSearchKeypad = () => {
            const keypad = CalcBridge.getElementById('zd-search-keypad');
            if (!keypad) return;
            
            const is32 = AppState && AppState.is32IonMode;
            
            keypad.innerHTML = '';
            keypad.style.display = "grid";
            keypad.style.gridTemplateColumns = is32 ? "repeat(6, 1fr)" : "repeat(7, 1fr)";
            keypad.style.gap = "4px";
            keypad.style.maxHeight = "85px"; // Altezza compatta uguale per sedenioni e 32-ioni
            keypad.style.overflowY = "auto";
            keypad.style.padding = "4px";
            const bases = is32 
                ? Array.from({length: 31}, (_, i) => i + 1).filter(b => b !== 16) 
                : [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
            bases.forEach(b => {
                const btn = document.createElement('div');
                btn.innerHTML = `e<sub>${b}</sub>`;
                btn.style.textAlign = "center";
                btn.style.padding = "6px 2px";
                btn.style.borderRadius = "4px";
                btn.style.border = "1px solid #667788";
                btn.style.color = "#ccc";
                btn.style.userSelect = "none";
                btn.style.transition = "all 0.2s";
                btn.style.fontSize = "13px";

                if (selectedSearchBases.has(b)) {
                    // Stile bottone attivo
                    btn.style.background = b < 8 ? "rgba(0, 170, 255, 0.3)" : "rgba(255, 170, 0, 0.3)";
                    btn.style.borderColor = b < 8 ? "#00aaff" : "#ffaa00";
                    btn.style.color = "#fff";
                    btn.style.cursor = "pointer";
                } else {
                    // Controlla se aggiungendo 'b' avremmo ancora dei risultati validi
                    let isValid = true;
                    let lowCount = b < 8 ? 1 : 0;
                    let highCount = b > 8 ? 1 : 0;

                    selectedSearchBases.forEach(s => {
                        if (s < 8) lowCount++; else highCount++;
                    });

                    if (lowCount > 2 || highCount > 2) {
                        isValid = false; // Troppe basi per riga
                    } else {
                        // Verifichiamo se c'è almeno un divisore compatibile con la nuova possibile selezione
                        const testArr = Array.from(selectedSearchBases);
                        testArr.push(b);
                        const hasMatch = getActiveZeroDivisors().some(zd => {
                            const nodes = [zd[0], zd[1], Math.abs(zd[2]), Math.abs(zd[3])];
                            return testArr.every(t => nodes.includes(t));
                        });
                        if (!hasMatch) isValid = false;
                    }

                    if (!isValid) {
                        // Stile bottone spento
                        btn.style.opacity = "0.15";
                        btn.style.cursor = "default";
                        btn.style.borderColor = "#334455";
                        btn.style.color = "#556677";
                    } else {
                        // Stile bottone cliccabile
                        btn.style.cursor = "pointer";
                    }
                }

                btn.onclick = () => {
                    // Se non è selezionato e ha il cursore "default" (cioè è spento), ignora il click
                    if (!selectedSearchBases.has(b) && btn.style.cursor === "default") return;

                    if (selectedSearchBases.has(b)) {
                        selectedSearchBases.delete(b);
                    } else {
                        selectedSearchBases.add(b);
                    }
                    updateSearchResults();
                };
                keypad.appendChild(btn);
            });
        };

        const updateSearchResults = () => {
            const resultsContainer = CalcBridge.getElementById('zd-search-results');
            const msgs = CalcBridge.getElementById('zd-search-messages');
            if (!resultsContainer || !msgs) return;
            
            // Setup Event Delegation per i risultati di ricerca
            if (!resultsContainer.hasAttribute('data-listener-attached')) {
                resultsContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('.zerodiv-grid-btn');
                    if (btn && btn.dataset.zd) {
                        const zd = JSON.parse(btn.dataset.zd);
                        const zdID = btn.dataset.zdid;
                        if (handleZeroDivisorClick) handleZeroDivisorClick(zd, zdID);
                    }
                });
                resultsContainer.setAttribute('data-listener-attached', 'true');
            }

            renderSearchKeypad();

            msgs.innerHTML = '';
            resultsContainer.innerHTML = '';

            let matches = getActiveZeroDivisors().filter(zd => {
                const nodes = [zd[0], zd[1], Math.abs(zd[2]), Math.abs(zd[3])];
                for (let b of selectedSearchBases) {
                    if (!nodes.includes(b)) return false;
                }
                return true;
            });

            const counterElem = CalcBridge.getElementById('zd-counter-display');
            if (counterElem) {
                counterElem.innerText = `(${matches.length})`;
            }

            matches.forEach(zd => {
                const sign1 = zd[2] < 0 ? "-" : ""; const sign2 = zd[3] < 0 ? "-" : "+";
                const txt = `(e<sub>${zd[0]}</sub>+e<sub>${zd[1]}</sub>)(${sign1}e<sub>${Math.abs(zd[2])}</sub>${sign2}e<sub>${Math.abs(zd[3])}</sub>)`;
                const btn = document.createElement('div');
                btn.className = 'zerodiv-grid-btn';
                btn.style.cursor = "pointer";
                btn.style.margin = "0";
                btn.style.boxSizing = "border-box";
                btn.style.border = "1px solid transparent";
                btn.innerHTML = txt;

                const zdID = zd.join(',');
                btn.dataset.zd = JSON.stringify(zd);
                btn.dataset.zdid = zdID;

                resultsContainer.appendChild(btn);
            });
        };

        const clearBtn = CalcBridge.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                selectedSearchBases.clear();
                updateSearchResults();
            });
        }

        const syncSearchPanel = (isActive) => {
            if (searchPanel) searchPanel.style.display = isActive ? 'flex' : 'none';

            toggleLabelStyle(searchLabel, isActive, true);
            toggleLabelStyle(searchLabelMobile, isActive, false);

            if (searchCheck) searchCheck.checked = isActive;
            if (searchCheckMobile) searchCheckMobile.checked = isActive;

            if (isActive) {
                syncExplainPanel(false);
                updateSearchResults();
            }
        };

        const syncExplainPanel = (isActive) => {
            if (explainPanel) explainPanel.style.display = isActive ? 'flex' : 'none';

            toggleLabelStyle(explainLabel, isActive, true);
            toggleLabelStyle(explainLabelMobile, isActive, false);

            if (explainCheck) explainCheck.checked = isActive;
            if (explainCheckMobile) explainCheckMobile.checked = isActive;

            if (isActive && searchCheck && searchCheck.checked) {
                syncSearchPanel(false);
            }
        };

        if (explainCheck && explainPanel) explainCheck.addEventListener('change', (e) => syncExplainPanel(e.target.checked));
        if (explainCheckMobile && explainPanel) explainCheckMobile.addEventListener('change', (e) => syncExplainPanel(e.target.checked));

        if (searchCheck && searchPanel) searchCheck.addEventListener('change', (e) => syncSearchPanel(e.target.checked));
        if (searchCheckMobile && searchPanel) searchCheckMobile.addEventListener('change', (e) => syncSearchPanel(e.target.checked));
    }
}