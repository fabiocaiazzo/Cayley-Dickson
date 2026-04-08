// Cerca questo codice e incollalo nel nuovo file js/rotation.js
import * as THREE from 'three';
import { scene, camera, renderer, controls, pointObjects, tripletVisuals } from './scene.js';

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
    
    // Allunghiamo il cilindro a 12 e ne abbassiamo il centro a y=2
    // In questo modo la cima tocca y=8 (dove c'è il cono) e la coda scende fino a y=-4
    const cCylGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 16);
    const cCyl = new THREE.Mesh(cCylGeo, orangeMat);
    cCyl.position.y = 2;
    customAxisMesh.add(cCyl);
    const cConeGeo = new THREE.ConeGeometry(0.3, 1.0, 16);
    const cCone = new THREE.Mesh(cConeGeo, orangeMat);
    cCone.position.y = 8.5;
    customAxisMesh.add(cCone);
    customAxisMesh.visible = false;
    rotMasterGroup.add(customAxisMesh); // Aggiunto al gruppo master
    
    // Funzione helper per orientare l'asse arancione in tempo reale
    window.updateOrangeAxis = function(axisVec) {
        if (!customAxisMesh) return;
        if (axisVec.lengthSq() < 0.0001) return;
        customAxisMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisVec.clone().normalize());
    };

    // Sfera di Vetro
    const sphereGeo = new THREE.SphereGeometry(4.5, 64, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.9, // Effetto Vetro
        ior: 1.5,
        thickness: 0.5,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    glassSphere = new THREE.Mesh(sphereGeo, glassMat);
    rotationGroup.add(glassSphere);

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
        qWInput.value = q.w.toFixed(2);
        qXInput.value = q.x.toFixed(2);
        qYInput.value = q.y.toFixed(2);
        qZInput.value = q.z.toFixed(2);
    }

    // A: L'utente ha modificato ASSE o ANGOLO
    function applyRotationFromAxisAngle() {
        let x = parseFloat(axisXInput.value.replace(',', '.')) || 0;
        let y = parseFloat(axisYInput.value.replace(',', '.')) || 0;
        let z = parseFloat(axisZInput.value.replace(',', '.')) || 0;
        let angle = parseFloat(angleNum.value.replace(',', '.')) || 0;
        
        if (x === 0 && y === 0 && z === 0) { 
            // STATO DI ERRORE: Vettore nullo
            rotationGroup.visible = false;
            axisXInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            axisYInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            axisZInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            if (qWInput) {
                qWInput.value = "0.00"; qXInput.value = "0.00"; qYInput.value = "0.00"; qZInput.value = "0.00";
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
            
            if (window.updateOrangeAxis) window.updateOrangeAxis(axis);
            if (customAxisMesh) customAxisMesh.visible = true; // Mostra l'asse arancione
        }
        window.dispatchEvent(new Event('forceRender'));
    }

    // B: L'utente ha modificato il QUATERNIONE direttamente
    function applyRotationFromQuaternion() {
        let w = parseFloat(qWInput.value.replace(',', '.')) || 0;
        let x = parseFloat(qXInput.value.replace(',', '.')) || 0;
        let y = parseFloat(qYInput.value.replace(',', '.')) || 0;
        let z = parseFloat(qZInput.value.replace(',', '.')) || 0;

        let q = new THREE.Quaternion(x, y, z, w);
        if (q.lengthSq() === 0) {
            // STATO DI ERRORE: Quaternione Nullo (0,0,0,0)
            rotationGroup.visible = false;
            qWInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            qXInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            qYInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            qZInput.style.backgroundColor = 'rgba(255, 60, 60, 0.4)';
            
            axisXInput.value = "0.00"; axisYInput.value = "0.00"; axisZInput.value = "0.00";
            angleNum.value = "0.0"; angleSlider.value = "0";
            
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

            axisXInput.value = (Math.abs(axis.x) < 0.01 ? 0 : axis.x).toFixed(2);
            axisYInput.value = (Math.abs(axis.y) < 0.01 ? 0 : axis.y).toFixed(2);
            axisZInput.value = (Math.abs(axis.z) < 0.01 ? 0 : axis.z).toFixed(2);
            angleNum.value = angle.toFixed(1);
            angleSlider.value = angle.toFixed(1);
            
            if (window.updateOrangeAxis) window.updateOrangeAxis(axis);
            if (customAxisMesh) customAxisMesh.visible = true; // Mostra l'asse arancione
        }

        window.dispatchEvent(new Event('forceRender'));
    }

    // Listener per Asse/Angolo
    [axisXInput, axisYInput, axisZInput, angleNum].forEach(el => {
        if(el) el.addEventListener('input', () => {
            if (el === angleNum) angleSlider.value = angleNum.value;
            applyRotationFromAxisAngle();
        });
    });

    if(angleSlider) {
        angleSlider.addEventListener('input', () => {
            angleNum.value = angleSlider.value;
            applyRotationFromAxisAngle();
        });
    }

    // Listener per il Quaternione
    [qWInput, qXInput, qYInput, qZInput].forEach(el => {
        if(el) el.addEventListener('input', () => {
            applyRotationFromQuaternion();
        });
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
        if (e.target.tagName === 'INPUT' || e.target.closest('#rot-help-btn') || e.target.id === 'close-rot-help') return;
        
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
        }
    }

    if (rotUI) {
        rotUI.style.cursor = 'grab';
        rotUI.addEventListener('mousedown', startRotDrag);
        document.addEventListener('mousemove', moveRotDrag);
        document.addEventListener('mouseup', endRotDrag);
        rotUI.addEventListener('touchstart', startRotDrag, { passive: false });
        document.addEventListener('touchmove', moveRotDrag, { passive: false });
        document.addEventListener('touchend', endRotDrag);
        document.addEventListener('touchcancel', endRotDrag);
    }

    // --- 3. LOGICA TRASCINAMENTO MOUSE / TOUCH (TRACKBALL CUSTOM) ---
    let isDraggingSphere = false;
    let isDraggingMaster = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('pointerdown', (e) => {
        if (!isRotationMode) return;
        
        // Trattiamo ogni interazione sul canvas come una rotazione dell'intero scenario
        isDraggingMaster = true; 
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
        if (!isRotationMode) return;
        
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
            window.dispatchEvent(new Event('forceRender'));
        }
    });

    window.addEventListener('pointerup', () => {
        isDraggingSphere = false;
        isDraggingMaster = false;
    });
}

// Funzione richiamata dal tasto nella dock
export function toggleRotationMode() {
    isRotationMode = !isRotationMode;
    const ui = document.getElementById('rotation-ui');
    const btn = document.getElementById('rotation-toggle-btn');
    const rotHelpPanel = document.getElementById('rot-help-panel');
    
    if (isRotationMode) {
        // Resetta il pannello della spiegazione se era rimasto aperto
        if (rotHelpPanel) rotHelpPanel.style.display = 'none';

        // Disabilita OrbitControls per rimuovere il limite verticale:
        // d'ora in poi usiamo il nostro trackball sbloccato a 360°!
        controls.enabled = false; 

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
            if (window.updateOrangeAxis) window.updateOrangeAxis(new THREE.Vector3(0, 0, 1)); // FIX: Z=1 in partenza
        }

        ui.style.display = 'flex';
        // Ripristina posizione iniziale in alto al centro
        ui.style.top = '20px';
        ui.style.left = '50%';
        ui.style.transform = 'translateX(-50%)';
        ui.style.right = 'auto';
        ui.style.bottom = 'auto';
        btn.classList.add('active');
        
        // Imposta vista perfettamente verticale (Z dritto in alto) e simmetrica per X e Y (a "V" verso lo schermo)
        rotMasterGroup.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -3 * Math.PI / 4, 'XYZ'));

        // Reimposta a zero all'apertura usando Z=1 come default
        rotationGroup.quaternion.identity();
        axisXInput.value = "0.00"; axisYInput.value = "0.00"; axisZInput.value = "1.00";
        angleNum.value = "0.0"; angleSlider.value = "0";
        if(qWInput) { qWInput.value = "1.00"; qXInput.value = "0.00"; qYInput.value = "0.00"; qZInput.value = "0.00"; }
        
    } else {
        // Riabilita OrbitControls per rimettere i limiti classici sugli altri grafi
        controls.enabled = true; 

        // Nascondi modulo rotazione
        rotationGroup.visible = false;
        referenceGroup.visible = false;
        if (customAxisMesh) customAxisMesh.visible = false;

        ui.style.display = 'none';
        btn.classList.remove('active');
        
        // Riattiva il resetView che si occuperà di far riapparire il grafo
        window.dispatchEvent(new Event('triggerResetView'));
    }
    window.dispatchEvent(new Event('forceRender'));
}