import * as THREE from 'three';
import { scene, camera, renderer, controls, pointObjects, tripletVisuals, initialCameraPos } from './scene.js';
import { forceUpdate } from '../core/renderer.js';
import { isMobile } from '../core/constants.js';

export let rotMasterGroup, rotationGroup, referenceGroup;
export let isRotationMode = false;

let axisXInput, axisYInput, axisZInput, angleSlider, angleNum;
let qWInput, qXInput, qYInput, qZInput;
let glassSphere;
let customAxisMesh; // Asse arancione

export function initRotation() {
    // --- 1. CREAZIONE GRUPPI 3D ---
    // Creiamo un gruppo contenitore ruotato di -90° per far sì che l'asse Z punti in alto
    rotMasterGroup = new THREE.Group();
    rotMasterGroup.rotation.x = -Math.PI / 2; 
    scene.add(rotMasterGroup);

    rotationGroup = new THREE.Group();
    referenceGroup = new THREE.Group();

    // Funzione helper per creare gli assi
    function createAxis(color, axisDir) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhysicalMaterial({ color: color, metalness: 0.3, roughness: 0.4 });
        
        // Corpo dell'asse (Cilindro)
        const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, 6, 16);
        const cyl = new THREE.Mesh(cylGeo, mat);
        cyl.position.y = 3;
        group.add(cyl);
        
        // Punta dell'asse (Cono)
        const coneGeo = new THREE.ConeGeometry(0.25, 0.8, 16);
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.position.y = 6.4;
        group.add(cone);
        
        // Allineamento relativo allo spazio locale (dove ora Z è l'alto)
        if (axisDir === 'x') group.rotation.z = -Math.PI / 2; // X punta a destra
        if (axisDir === 'y') {} // Y punta in profondità
        if (axisDir === 'z') group.rotation.x = Math.PI / 2; // Z punta in alto
        
        return group;
    }

    // Assi Ombra (Fissi e Semitrasparenti)
    const refX = createAxis(0xff4444, 'x');
    const refY = createAxis(0x44ff44, 'y');
    const refZ = createAxis(0x4444ff, 'z');
    [refX, refY, refZ].forEach(axis => {
        axis.children.forEach(mesh => {
            mesh.material = mesh.material.clone();
            mesh.material.transparent = true;
            mesh.material.opacity = 0.2;
        });
        referenceGroup.add(axis);
    });

    // Assi Ruotabili
    const rotX = createAxis(0xff0000, 'x');
    const rotY = createAxis(0x00ff00, 'y');
    const rotZ = createAxis(0x0000ff, 'z');
    rotationGroup.add(rotX, rotY, rotZ);

    // Asse di rotazione custom (Arancione)
    customAxisMesh = new THREE.Group();
    const orangeMat = new THREE.MeshPhysicalMaterial({ color: 0xffaa00, metalness: 0.3, roughness: 0.4 });
    
    // Accorciamo la coda: lunghezza 12, centro a y=0. 
    // La cima arriva a y=6 e la coda scende a y=-6.
    const cCylGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 16);
    const cCyl = new THREE.Mesh(cCylGeo, orangeMat);
    cCyl.position.y = 0;
    customAxisMesh.add(cCyl);
    const cConeGeo = new THREE.ConeGeometry(0.3, 1.0, 16);
    const cCone = new THREE.Mesh(cConeGeo, orangeMat);
    cCone.position.y = 6.5;
    customAxisMesh.add(cCone);
    customAxisMesh.visible = false;
    rotMasterGroup.add(customAxisMesh); // Aggiunto al gruppo master

    // Sfera armillare (Meridiani e Paralleli fissi e solidi)
    glassSphere = new THREE.Group();
    const ringMat = new THREE.MeshPhysicalMaterial({
        color: 0x88aacc, // Azzurro tenue in stile tecnico
        metalness: 0.4,
        roughness: 0.6,
        transparent: false // Rigorosamente non trasparenti e solidi
    });
    const radius = 4.5;
    const thickness = 0.025; // Spessore dei cerchi

    // FIX: 9 Meridiani (creano 18 spicchi, distribuiti a ventaglio sui poli)
    for (let i = 0; i < 9; i++) {
        const torusGeo = new THREE.TorusGeometry(radius, thickness, 8, 64);
        const ring = new THREE.Mesh(torusGeo, ringMat);
        ring.rotation.x = Math.PI / 2; // Mette in piedi il cerchio
        
        // Usiamo un pivot per aggirare il problema dell'ordine di rotazione (Gimbal lock)
        const pivot = new THREE.Group();
        pivot.rotation.z = (Math.PI / 9) * i; // Ruota il pivot sull'asse polare corretto
        pivot.add(ring);
        
        glassSphere.add(pivot);
    }

    // 13 Paralleli (1 equatore + 6 sopra + 6 sotto)
    for (let i = -6; i <= 6; i++) {
        // Dividiamo i 90 gradi dei poli in 7 segmenti (quindi i poli sono vuoti, abbiamo 6 cerchi in mezzo)
        const angle = (Math.PI / 2) * (i / 7); 
        const r = radius * Math.cos(angle);
        const zOff = radius * Math.sin(angle);
        
        const pGeo = new THREE.TorusGeometry(r, thickness, 8, 64);
        const pRing = new THREE.Mesh(pGeo, ringMat);
        pRing.position.z = zOff; // Sposta in alto/basso il parallelo
        
        glassSphere.add(pRing);
    }

    // Aggiunto al referenceGroup invece che a rotationGroup per renderlo fisso
    referenceGroup.add(glassSphere);

    // Nascondi di default e aggiungi al Master Group
    rotationGroup.visible = false;
    referenceGroup.visible = false;
    rotMasterGroup.add(rotationGroup);
    rotMasterGroup.add(referenceGroup);

    // --- 2. LOGICA INTERFACCIA UTENTE (UI) ---
    axisXInput = document.getElementById('rot-axis-x');
    axisYInput = document.getElementById('rot-axis-y');
    axisZInput = document.getElementById('rot-axis-z');
    angleSlider = document.getElementById('rot-angle-slider');
    angleNum = document.getElementById('rot-angle-num');
    
    qWInput = document.getElementById('rot-q-w');
    qXInput = document.getElementById('rot-q-x');
    qYInput = document.getElementById('rot-q-y');
    qZInput = document.getElementById('rot-q-z');

    // Funzione helper per aggiornare visivamente gli input del quaternione
    function updateQuaternionInputs(q) {
        if (!qWInput) return;
        qWInput.value = parseFloat(q.w.toFixed(3));
        qXInput.value = parseFloat(q.x.toFixed(3));
        qYInput.value = parseFloat(q.y.toFixed(3));
        qZInput.value = parseFloat(q.z.toFixed(3));
    }

    // A: L'utente ha modificato ASSE o ANGOLO
    function applyRotationFromAxisAngle() {
        if (!validateRotInput(axisXInput) || !validateRotInput(axisYInput) || 
            !validateRotInput(axisZInput) || !validateRotInput(angleNum)) return;

        let x = Number(axisXInput.value.replace(',', '.')) || 0;
        let y = Number(axisYInput.value.replace(',', '.')) || 0;
        let z = Number(axisZInput.value.replace(',', '.')) || 0;
        let angle = Number(angleNum.value.replace(',', '.')) || 0;
        
        if (x === 0 && y === 0 && z === 0) { 
            // STATO DI ERRORE: Vettore nullo (ma senza sfondo rosso)
            rotationGroup.visible = false;
            axisXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            if (qWInput) {
                qWInput.value = "0"; qXInput.value = "0"; qYInput.value = "0"; qZInput.value = "0";
            }
            if (customAxisMesh) customAxisMesh.visible = false; // Nascondi l'asse arancione
        } else {
            // STATO NORMALE
            rotationGroup.visible = true;
            axisXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            if (qWInput) {
                qWInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
                qXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
                qYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
                qZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            }
            
            const axis = new THREE.Vector3(x, y, z).normalize();
            const rad = THREE.MathUtils.degToRad(angle);
            
            rotationGroup.quaternion.setFromAxisAngle(axis, rad);
            updateQuaternionInputs(rotationGroup.quaternion); 
            
            updateOrangeAxis(axis);
            if (customAxisMesh) customAxisMesh.visible = true; // Mostra l'asse arancione
        }
        forceUpdate();
    }

    // B: L'utente ha modificato il QUATERNIONE direttamente
    function applyRotationFromQuaternion() {
        let w = Number(qWInput.value.replace(',', '.')) || 0;
        let x = Number(qXInput.value.replace(',', '.')) || 0;
        let y = Number(qYInput.value.replace(',', '.')) || 0;
        let z = Number(qZInput.value.replace(',', '.')) || 0;

        let q = new THREE.Quaternion(x, y, z, w);
        if (q.lengthSq() === 0) {
            // STATO DI ERRORE: Quaternione Nullo (0,0,0,0) (ma senza sfondo rosso)
            rotationGroup.visible = false;
            qWInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            
            axisXInput.value = "0"; axisYInput.value = "0"; axisZInput.value = "0";
            angleNum.value = "0"; angleSlider.value = "0";
            
            if (customAxisMesh) customAxisMesh.visible = false; // Nascondi l'asse arancione
        } else {
            // STATO NORMALE
            rotationGroup.visible = true;
            qWInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            qZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisXInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisYInput.style.backgroundColor = 'rgba(0,0,0,0.3)';
            axisZInput.style.backgroundColor = 'rgba(0,0,0,0.3)';

            q.normalize(); // Forza la validità per rotazioni 3D
            rotationGroup.quaternion.copy(q);

            let qClone = q.clone();
            // Rimosso il blocco del W<0 per permettere rotazioni fluide senza rimbalzi
            
            let angle = 2 * Math.acos(Math.min(Math.max(qClone.w, -1), 1));
            let s = Math.sqrt(1 - qClone.w * qClone.w);
            let axis = new THREE.Vector3(0, 0, 1); // Fallback predefinito su Z
            
            if (s > 0.001) {
                axis.set(qClone.x / s, qClone.y / s, qClone.z / s).normalize();
            }
            
            angle = THREE.MathUtils.radToDeg(angle);

            axisXInput.value = parseFloat((Math.abs(axis.x) < 0.001 ? 0 : axis.x).toFixed(3));
            axisYInput.value = parseFloat((Math.abs(axis.y) < 0.001 ? 0 : axis.y).toFixed(3));
            axisZInput.value = parseFloat((Math.abs(axis.z) < 0.001 ? 0 : axis.z).toFixed(3));
            angleNum.value = parseFloat(angle.toFixed(2));
            angleSlider.value = angle.toFixed(2);
            
            updateOrangeAxis(axis);
            if (customAxisMesh) customAxisMesh.visible = true; // Mostra l'asse arancione
        }

        forceUpdate();
    }

    function validateRotInput(el) {
        if (!el) return false;
        const rawVal = el.value.replace(',', '.').trim();
        let isValid = true;
        
        // Validazione visiva: controlliamo rigidamente se è un numero valido.
        // Accettiamo '-', '+', '-.' come stati intermedi validi (l'utente sta ancora digitando).
        const isInvalid = rawVal !== '' && rawVal !== '-' && rawVal !== '+' && rawVal !== '-.' && !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(rawVal);
        if (isInvalid) {
            el.style.setProperty('background-color', 'rgba(255, 60, 60, 0.4)', 'important');
            isValid = false;
        } else {
            el.style.backgroundColor = 'rgba(0,0,0,0.3)';
        }
        el.style.color = '#ffffff';
        return isValid;
    }

    // Listener per Asse/Angolo
    [axisXInput, axisYInput, axisZInput, angleNum].forEach(el => {
        if(el) {
            el.addEventListener('input', () => {
                validateRotInput(el);
                if (el === angleNum) angleSlider.value = angleNum.value || 0;
                applyRotationFromAxisAngle();
            });
            // Evidenzia automaticamente il testo al click per permettere la sovrascrittura
            el.addEventListener('focus', () => el.select());
        }
    });

    if(angleSlider) {
        angleSlider.addEventListener('input', () => {
            angleNum.value = angleSlider.value;
            applyRotationFromAxisAngle();
        });
    }

    // Listener per il Quaternione
    [qWInput, qXInput, qYInput, qZInput].forEach(el => {
        if(el) {
            el.addEventListener('input', () => {
                validateRotInput(el);
                applyRotationFromQuaternion();
            });
            // Evidenzia automaticamente il testo al click per permettere la sovrascrittura
            el.addEventListener('focus', () => el.select());
        }
    });

    // Eventi Modal Spiegazione (?)
    const rotHelpBtn = document.getElementById('rot-help-btn');
    const rotHelpPanel = document.getElementById('rot-help-panel');
    const closeRotHelp = document.getElementById('close-rot-help');

    if (rotHelpBtn && rotHelpPanel) {
        rotHelpBtn.addEventListener('click', () => { 
            rotHelpPanel.style.display = 'block'; 
            // Riporta la barra di scorrimento in alto
            rotHelpPanel.scrollTop = 0;
            // Se c'è un contenitore interno di scorrimento, resetta anche quello
            const innerScroll = rotHelpPanel.querySelector('div');
            if (innerScroll) innerScroll.scrollTop = 0;
        });
    }
    if (closeRotHelp && rotHelpPanel) {
        closeRotHelp.addEventListener('click', () => { rotHelpPanel.style.display = 'none'; });
    }

    // --- LOGICA TRASCINAMENTO PANNELLO UI ---
    const rotUI = document.getElementById('rotation-ui');
    let isDraggingRotUI = false;
    let rotDragOffsetX = 0;
    let rotDragOffsetY = 0;

        function startRotDrag(e) {
        // Ignora drag se interagiamo con input o tasti aiuto
        if (e.target.tagName === 'INPUT' || e.target.closest('#rot-help-btn') || e.target.id === 'close-rot-help' || e.target.closest('#rot-help-panel')) return;

        
        isDraggingRotUI = true;
        const rect = rotUI.getBoundingClientRect();
        
        // Rimuove i vincoli iniziali per permettere il posizionamento assoluto libero
        rotUI.style.transform = 'none';
        rotUI.style.bottom = 'auto'; 
        rotUI.style.right = 'auto'; // IMPORTANTE: Sgancia il lato destro per poter muovere la scheda!
        
        rotUI.style.left = rect.left + 'px';
        rotUI.style.top = rect.top + 'px';

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        rotDragOffsetX = clientX - rect.left;
        rotDragOffsetY = clientY - rect.top;
        rotUI.style.cursor = 'grabbing';
    }

    function moveRotDrag(e) {
        if (!isDraggingRotUI) return;
        e.preventDefault(); 
        
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        rotUI.style.left = (clientX - rotDragOffsetX) + 'px';
        rotUI.style.top = (clientY - rotDragOffsetY) + 'px';
    }

    function endRotDrag() {
        if (isDraggingRotUI) {
            isDraggingRotUI = false;
            rotUI.style.cursor = 'grab';
            document.removeEventListener('mousemove', moveRotDrag);
            document.removeEventListener('mouseup', endRotDrag);
            document.removeEventListener('touchmove', moveRotDrag);
            document.removeEventListener('touchend', endRotDrag);
            document.removeEventListener('touchcancel', endRotDrag);
        }
    }


    if (rotUI) {
        function bindRotDrag() {
            document.addEventListener('mousemove', moveRotDrag);
            document.addEventListener('mouseup', endRotDrag);
            document.addEventListener('touchmove', moveRotDrag, { passive: false });
            document.addEventListener('touchend', endRotDrag);
            document.addEventListener('touchcancel', endRotDrag);
        }

        rotUI.style.cursor = 'grab';
        rotUI.addEventListener('mousedown', (e) => { bindRotDrag(); startRotDrag(e); });
        rotUI.addEventListener('touchstart', (e) => { bindRotDrag(); startRotDrag(e); }, { passive: false });


        // Navigazione intelligente con le frecce tra gli input (X, Y, Z, Angolo, Quaternione)
        rotUI.addEventListener('keydown', (e) => {
            if (e.target.tagName !== 'INPUT') return;
            
            const inputs = [axisXInput, axisYInput, axisZInput, angleNum, qWInput, qXInput, qYInput, qZInput].filter(el => el);
            const idx = inputs.indexOf(e.target);
            if (idx === -1) return;

            let dest = null;
            const start = e.target.selectionStart;
            const len = e.target.value.length;

            if (e.key === 'ArrowRight' && start === len) dest = inputs[idx + 1];
            else if (e.key === 'ArrowLeft' && start === 0) dest = inputs[idx - 1];
            else if (e.key === 'ArrowDown') {
                if (idx <= 2) dest = angleNum;
                else if (idx === 3) dest = qWInput;
            } else if (e.key === 'ArrowUp') {
                if (idx >= 4) dest = angleNum;
                else if (idx === 3) dest = axisXInput;
            }

            if (dest) {
                e.preventDefault();
                dest.focus();
                dest.select();
            }
        });
    }

    // --- 3. LOGICA TRASCINAMENTO MOUSE / TOUCH (TRACKBALL CUSTOM) ---
    let isDraggingMaster = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('pointerdown', (e) => {
        if (!isRotationMode || !e.isPrimary) return; // Ignora tocchi secondari
        
        // Trattiamo ogni interazione sul canvas come una rotazione dell'intero scenario
        isDraggingMaster = true; 
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
        if (!isRotationMode || !e.isPrimary) return; // Ignora tocchi secondari
        
        if (isDraggingMaster) {
            // Trackball infinito: ruota l'intero modulo senza limiti verticali
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
            
            const qX = new THREE.Quaternion().setFromAxisAngle(camUp, deltaX * 0.01);
            const qY = new THREE.Quaternion().setFromAxisAngle(camRight, deltaY * 0.01);
            
            const deltaRot = new THREE.Quaternion().multiplyQuaternions(qX, qY);
            rotMasterGroup.quaternion.premultiply(deltaRot);

            previousMousePosition = { x: e.clientX, y: e.clientY };
            forceUpdate();
        }
    });

    window.addEventListener('pointerup', () => {
        isDraggingMaster = false;
    });
}

// Funzione helper per orientare l'asse arancione in tempo reale
export function updateOrangeAxis(axisVec) {
    if (!customAxisMesh) return;
    if (axisVec.lengthSq() < 0.0001) return;
    customAxisMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisVec.clone().normalize());
}

export function enterRotationMode() {
    isRotationMode = true;
    
    const speedRow = document.getElementById('speed-slider')?.closest('.setting-row');
    const opacityRow = document.getElementById('opacity-slider')?.closest('.setting-row');
    if (speedRow) speedRow.style.display = 'none';
    if (opacityRow) opacityRow.style.display = 'none';
    
    const ui = document.getElementById('rotation-ui');
    const btn = document.getElementById('rotation-toggle-btn');
    const rotHelpPanel = document.getElementById('rot-help-panel');
    const dbBtn = document.getElementById('sidebar-toggle-btn');
    const rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const tabTriplets = document.getElementById('tab-btn-triplets');
    const tabTable = document.getElementById('tab-btn-table');
    const tabFano = document.getElementById('tab-btn-fano');
    const tabPg32 = document.getElementById('tab-btn-pg32');
    const tabRotations = document.getElementById('tab-btn-rotations');

    // Scambia i bottoni nella dock
    if(dbBtn) dbBtn.style.display = 'none';
    if(rotSidebarBtn) rotSidebarBtn.style.display = 'flex';
    
    // Nascondi i tab superflui
    if(tabTriplets) tabTriplets.style.display = 'none';
    if(tabTable) tabTable.style.display = 'none';
    if(tabFano) tabFano.style.display = 'none';
    if(tabPg32) tabPg32.style.display = 'none';
    
    if(tabRotations) {
        tabRotations.style.display = 'none'; // Nasconde la singola linguetta
        const sidebarTabs = document.querySelector('.sidebar-tabs');
        if (sidebarTabs) sidebarTabs.style.display = 'none'; // Nasconde l'intera barra
        
        tabRotations.click(); // Autoseleziona la tab in background
    }

    // Se la sidebar era aperta, chiudila per evitare glitch
    if (sidebar && sidebar.classList.contains('open')) {
        const closeBtn = document.getElementById('close-sidebar-btn');
        if(closeBtn) closeBtn.click();
    }

    // Resetta il pannello della spiegazione se era rimasto aperto
    if (rotHelpPanel) rotHelpPanel.style.display = 'none';

    // Disabilita solo la rotazione di OrbitControls per rimuovere il limite verticale,
    // mantenendo attivo lo zoom (pinch/scroll)!
    controls.enabled = true; 
    controls.enableRotate = false;

    // Nascondi il grafo di Cayley
    for (let k in pointObjects) {
        pointObjects[k].mesh.visible = false;
        pointObjects[k].label.visible = false;
    }
    tripletVisuals.forEach(t => { t.mesh.visible = false; if (t.hitMesh) t.hitMesh.visible = false; });
    
    // Mostra il modulo di Rotazione
    rotationGroup.visible = true;
    referenceGroup.visible = true;
    
    if (customAxisMesh) {
        customAxisMesh.visible = true;
        updateOrangeAxis(new THREE.Vector3(0, 0, 1)); // FIX: Z=1 in partenza
    }

    if (ui) {
        ui.style.display = 'flex';
        // Ripristina posizione iniziale in alto al centro
        ui.style.top = '20px';
        ui.style.left = '50%';
        ui.style.transform = 'translateX(-50%)';
        ui.style.right = 'auto';
        ui.style.bottom = 'auto';
    }
    if (btn) btn.classList.add('active');
    
    // Bug 13: La vista ora è identica a quella di "Reset Vista"
    camera.position.copy(initialCameraPos);
    controls.target.set(0, 3, 0);
    camera.lookAt(0, 3, 0);
    controls.update();

    // Imposta vista perfettamente verticale (Z dritto in alto) e simmetrica per X e Y (a "V" verso lo schermo)
    rotMasterGroup.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -3 * Math.PI / 4, 'XYZ'));

    // Reimposta a zero all'apertura usando Z=1 come default
    rotationGroup.quaternion.identity();
    if(axisXInput) axisXInput.value = "0"; 
    if(axisYInput) axisYInput.value = "0"; 
    if(axisZInput) axisZInput.value = "1";
    if(angleNum) angleNum.value = "0"; 
    if(angleSlider) angleSlider.value = "0";
    if(qWInput) { qWInput.value = "1"; qXInput.value = "0"; qYInput.value = "0"; qZInput.value = "0"; }
}

export function exitRotationMode() {
    isRotationMode = false;
    
    const speedRow = document.getElementById('speed-slider')?.closest('.setting-row');
    const opacityRow = document.getElementById('opacity-slider')?.closest('.setting-row');
    if (speedRow) speedRow.style.display = '';
    if (opacityRow) opacityRow.style.display = '';
    
    const ui = document.getElementById('rotation-ui');
    const btn = document.getElementById('rotation-toggle-btn');
    const dbBtn = document.getElementById('sidebar-toggle-btn');
    const rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const tabTriplets = document.getElementById('tab-btn-triplets');
    const tabTable = document.getElementById('tab-btn-table');
    const tabRotations = document.getElementById('tab-btn-rotations');

    // Ripristina i bottoni normali nella dock
    if(dbBtn) dbBtn.style.display = 'flex';
    if(rotSidebarBtn) rotSidebarBtn.style.display = 'none';
    
    // Ripristina la visualizzazione dei tab (Fano e PG32 sono gestiti da resetView)
    if(tabTriplets) {
        tabTriplets.style.display = '';
        tabTriplets.click(); // Torna a selezionare le terne
    }
    if(tabTable) tabTable.style.display = '';
    if(tabRotations) tabRotations.style.display = 'none';

    const sidebarTabs = document.querySelector('.sidebar-tabs');
    if (sidebarTabs) sidebarTabs.style.display = ''; // Ripristina la barra per le altre modalità

    if (sidebar && sidebar.classList.contains('open')) {
        const closeBtn = document.getElementById('close-sidebar-btn');
        if(closeBtn) closeBtn.click();
    }

    // Riabilita OrbitControls per rimettere i limiti classici sugli altri grafi
    controls.enabled = true;
    controls.enableRotate = true;

    // Nascondi modulo rotazione
    rotationGroup.visible = false;
    referenceGroup.visible = false;
    if (customAxisMesh) customAxisMesh.visible = false;

    if (ui) ui.style.display = 'none';
    if (btn) btn.classList.remove('active');
    
    // Riattiva il resetView che si occuperà di far riapparire il grafo
    window.dispatchEvent(new Event('triggerResetView'));
}

// Funzione richiamata dal tasto nella dock
export function toggleRotationMode() {
    if (isRotationMode) {
        exitRotationMode();
    } else {
        enterRotationMode();
    }
    forceUpdate();
}

// Uscita automatica se l'utente cambia algebra dal menu superiore
window.addEventListener('algebraChanged', () => {
    if (isRotationMode) {
        exitRotationMode();
        forceUpdate();
    }
});