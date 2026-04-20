import { POSITIVE_TRIPLETS, TRIPLETS_32, PG32_SETS } from '../math/data.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene, sphereGeom, sphereMat, sphereMatCenter, pts, pointObjects, tripletVisuals, animatedMaterials, flowVertexShader, neonFragmentShader } from './scene.js';
import { createTubeGeometry, createTubeMaterial } from './geometry.js';
import { AppState } from '../core/state.js';
import { forceUpdate } from '../core/renderer.js';
import { t } from '../core/i18n.js';
import { isRotationMode, exitRotationMode } from './rotation.js';

// --- 32-IONI LOGIC ---
export const graph32Group = new THREE.Group();
scene.add(graph32Group);

export const toggle32Ions = function () {
    AppState.is32IonMode = !AppState.is32IonMode;

    if (AppState.is32IonMode && isRotationMode) {
        exitRotationMode();
    }

    const btn32 = document.getElementById('toggle-32-btn');
    if (btn32) {
        if (AppState.is32IonMode) {
            btn32.classList.add('active-32');
        } else {
            btn32.classList.remove('active-32');
        }
    }

    const btnContainer15 = document.getElementById('buttons-container');
    const fanoGrid15 = document.getElementById('fano-grid');
    const pg32Grid15 = document.getElementById('pg32-grid');
    const tabBtnTable = document.getElementById('tab-btn-table');
    const tabBtnTriplets = document.getElementById('tab-btn-triplets');
    const tabBtnFano = document.getElementById('tab-btn-fano');
    const tabBtnPG32 = document.getElementById('tab-btn-pg32');

    let btnContainer32 = document.getElementById('buttons-container-32');
    if (!btnContainer32) {
        btnContainer32 = document.createElement('div');
        btnContainer32.id = 'buttons-container-32';
        btnContainer32.className = 'triplets-grid';
        btnContainer15.parentNode.appendChild(btnContainer32);

        let tripHTML = '';
        TRIPLETS_32.forEach(t => {
            tripHTML += `<div class="triplet-btn triplet-btn-32">{${t[0]}, ${t[1]}, ${t[2]}}</div>`;
        });
        btnContainer32.innerHTML = tripHTML;
        btnContainer32.dataset.count = TRIPLETS_32.length;
    }

    let fanoGrid32 = document.getElementById('fano-grid-32');
    if (!fanoGrid32) {
        fanoGrid32 = document.createElement('div');
        fanoGrid32.id = 'fano-grid-32';
        fanoGrid32.className = 'triplets-grid';
        fanoGrid15.parentNode.appendChild(fanoGrid32);

        let fanoHTML = '';
        let planeSets = new Set();
        for (let i = 1; i <= 31; i++) {
            for (let j = i + 1; j <= 31; j++) {
                let ij = i ^ j;
                for (let k = j + 1; k <= 31; k++) {
                    if (k === ij) continue;
                    let plane = [i, j, k, ij, i ^ k, j ^ k, i ^ j ^ k].sort((a, b) => a - b);
                    let key = plane.join(',');
                    if (!planeSets.has(key)) {
                        planeSets.add(key);
                        
                        let isStandard = false;
                        if (plane.includes(16)) {
                            isStandard = true; // 35 piani: raddoppio dei quaternioni nei Sedenioni con e16
                        } else if (plane.includes(8) && plane.every(x => x < 16)) {
                            isStandard = true; // 7 piani: raddoppio dei quaternioni negli Ottetti con e8
                        } else if (plane.includes(24) && plane.filter(x => x < 8).length === 3) {
                            isStandard = true; // 7 piani: raddoppio dei quaternioni negli Ottetti con e24
                        }

                        let borderColor = '#ff4444'; // Rosso (Quasi-Ottetti non isomorfi, 105 in totale)
                        if (key === '1,2,3,4,5,6,7') {
                            borderColor = '#4488ff'; // Blu (Ottetto base, 1 in totale)
                        } else if (isStandard) {
                            borderColor = '#00cc44'; // Verde (Ottetti standard isomorfi a OL, 49 in totale)
                        }
                        
                        fanoHTML += `<div class="fano-btn fano-btn-32" style="border-width: 2px; border-style: solid; border-color:${borderColor}; --fano-color:${borderColor};">{${plane.join(', ')}}</div>`;
                    }
                }
            }
        }
        fanoGrid32.innerHTML = fanoHTML;
        fanoGrid32.dataset.count = planeSets.size;
    }

    let pg32Grid32 = document.getElementById('pg32-grid-32');
    if (!pg32Grid32) {
        pg32Grid32 = document.createElement('div');
        pg32Grid32.id = 'pg32-grid-32';
        pg32Grid32.className = 'triplets-grid';
        pg32Grid32.style.gridTemplateColumns = '1fr';
        pg32Grid15.parentNode.appendChild(pg32Grid32);

        let pg32HTML = '';
        PG32_SETS.forEach(set => {
            let borderColor = '#ff4444';

            if (set.join(',') === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15') {
                borderColor = '#4488ff';
            } else if (set.includes(16)) {
                borderColor = '#00cc44';
            }

            pg32HTML += `<div class="fano-btn pg32-btn-cell" data-set="${set.join(',')}" style="border-width: 2px; border-style: solid; border-color:${borderColor}; --fano-color:${borderColor};">{${set.join(', ')}}</div>`;
        });
        pg32Grid32.innerHTML = pg32HTML;
        pg32Grid32.dataset.count = PG32_SETS.length;
        
        // Aggiungi i listener ES6 in modo sicuro
        pg32Grid32.querySelectorAll('.pg32-btn-cell').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setArray = e.currentTarget.dataset.set.split(',').map(Number);
                buildPG32Graph(setArray, e.currentTarget);
            });
        });
    }

    if (AppState.is32IonMode) {
        for (let k in pointObjects) {
            pointObjects[k].mesh.visible = false;
            pointObjects[k].label.visible = false;
        }
        tripletVisuals.forEach(t => { t.mesh.visible = false; if (t.hitMesh) t.hitMesh.visible = false; });

        document.getElementById('alg-title-text').innerHTML = t('alg_32');

        const mobileTrigger = document.getElementById('alg-mobile-trigger');
        if (mobileTrigger) mobileTrigger.innerHTML = "𝕋";

        document.querySelectorAll('.alg-dot').forEach(dot => dot.classList.remove('active'));
        let dot32 = document.getElementById('alg-dot-32');
        if (!dot32) {
            dot32 = document.createElement('div');
            dot32.className = 'alg-dot active';
            dot32.id = 'alg-dot-32';
            dot32.innerHTML = "𝕋";
            dot32.title = t('alg_32');
            dot32.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('alg-dots-list');
            if (menu) menu.classList.remove('open');
            toggle32Ions();
        });
            document.getElementById('alg-dots-list').appendChild(dot32);
        } else {
            dot32.style.display = '';
            dot32.classList.add('active');
        }

        document.getElementById('settings-menu').classList.remove('visible');
        document.getElementById('settings-toggle-btn').classList.remove('active');

        btnContainer15.style.display = 'none';
        btnContainer32.style.display = 'grid';

        fanoGrid15.style.display = 'none';
        fanoGrid32.style.display = 'grid';

        pg32Grid15.style.display = 'none';
        pg32Grid32.style.display = 'grid';

        tabBtnTriplets.innerText = `${t('tab_triplets')} (${btnContainer32.dataset.count})`;
        tabBtnFano.innerText = `${t('tab_fano')} (${fanoGrid32.dataset.count})`;
        tabBtnPG32.innerText = `${t('tab_pg32')} (${pg32Grid32.dataset.count})`;
        tabBtnFano.style.display = 'flex';
        tabBtnPG32.style.display = 'flex';

        tabBtnTable.style.display = 'none';
        if (tabBtnTable.classList.contains('active')) {
            tabBtnTriplets.click();
        }

        document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('#pg32-grid-32 .fano-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        build32IonGraph(1);
    } else {
        const dot32 = document.getElementById('alg-dot-32');
        if (dot32) dot32.style.display = 'none';

        [...graph32Group.children].forEach(child => {
            if (child.children) {
                [...child.children].forEach(c => {
                    if (c.element) c.element.remove();
                    child.remove(c);
                });
            }
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                child.material.dispose();
                const idx = animatedMaterials.indexOf(child.material);
                if (idx > -1) animatedMaterials.splice(idx, 1);
            }
            graph32Group.remove(child);
        });

        btnContainer15.style.display = 'grid';
        btnContainer32.style.display = 'none';

        fanoGrid15.style.display = 'grid';
        fanoGrid32.style.display = 'none';

        pg32Grid15.style.display = 'grid';
        pg32Grid32.style.display = 'none';

        tabBtnPG32.style.display = 'none';
        tabBtnTable.style.display = 'flex';

        if (tabBtnPG32.classList.contains('active')) {
            tabBtnTriplets.click();
        } else {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) activeTab.click();
        }

        window.dispatchEvent(new Event('requestResetView'));
    }
};

export function build32IonGraph(centerIdx) {
    [...graph32Group.children].forEach(child => {
        if (child.children) {
            [...child.children].forEach(c => {
                if (c.element) c.element.remove();
                child.remove(c);
            });
        }
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            child.material.dispose();
            const idx = animatedMaterials.indexOf(child.material);
            if (idx > -1) animatedMaterials.splice(idx, 1);
        }
        graph32Group.remove(child);
    });

    const R = 7;
    const H = 5;
    const centerPos = new THREE.Vector3(0, 3, 0);

    const centerMesh = new THREE.Mesh(sphereGeom, sphereMatCenter);
    centerMesh.position.copy(centerPos);
    centerMesh.userData = { id: centerIdx, type: 'node32' };
    graph32Group.add(centerMesh);

    const divC = document.createElement('div');
    divC.className = 'label';
    divC.innerHTML = 'e<sub>' + centerIdx + '</sub>';
    const labelC = new CSS2DObject(divC);
    labelC.position.set(0, 0.4, 0);
    centerMesh.add(labelC);

    const pairs = [];
    for (let i = 1; i <= 31; i++) {
        if (i === centerIdx) continue;
        const j = i ^ centerIdx;
        if (i < j) pairs.push([i, j]);
    }

    const totalPairs = pairs.length;
    pairs.forEach((pair, idx) => {
        const theta = (idx / totalPairs) * Math.PI * 2;
        const offset = new THREE.Vector3(R * Math.cos(theta), H, R * Math.sin(theta));
        const p1 = centerPos.clone().sub(offset);
        const p2 = centerPos.clone().add(offset);

        [{ pos: p1, id: pair[0] }, { pos: p2, id: pair[1] }].forEach(node => {
            const mesh = new THREE.Mesh(sphereGeom, sphereMat);
            mesh.position.copy(node.pos);
            mesh.userData = { id: node.id, type: 'node32' };
            graph32Group.add(mesh);

            const div = document.createElement('div');
            div.className = 'label';
            div.innerHTML = 'e<sub>' + node.id + '</sub>';
            const label = new CSS2DObject(div);
            label.position.set(0, 0.4, 0);
            mesh.add(label);
        });

        const path = new THREE.LineCurve3(p1, p2);
        const tubeGeom = new THREE.TubeGeometry(path, 64, 0.04, 8, false);

        const tubeMat = new THREE.ShaderMaterial({
            uniforms: {
                customTime: { value: 0 },
                color: { value: new THREE.Color(0x00aaff) },
                flowDir: { value: 1.0 },
                opacity: { value: document.getElementById('opacity-slider') ? parseFloat(document.getElementById('opacity-slider').value) : 0.4 },
                useHighlight: { value: 1.0 }
            },
            vertexShader: flowVertexShader,
            fragmentShader: neonFragmentShader,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending
        });

        animatedMaterials.push(tubeMat);

        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        graph32Group.add(tube);
    });

    if (typeof forceUpdate === 'function') forceUpdate();
}

export const buildPG32Graph = function (setArray, btnElement) {
    if (btnElement) {
        document.querySelectorAll('#pg32-grid-32 .fano-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }

    [...graph32Group.children].forEach(child => {
        if (child.children) {
            [...child.children].forEach(c => {
                if (c.element) c.element.remove();
                child.remove(c);
            });
        }
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            child.material.dispose();
            const idx = animatedMaterials.indexOf(child.material);
            if (idx > -1) animatedMaterials.splice(idx, 1);
        }
        graph32Group.remove(child);
    });

    setArray.forEach((mappedId, idx) => {
        const stdId = idx + 1;
        const pos = pts[stdId];

        const mesh = new THREE.Mesh(sphereGeom, stdId === 8 ? sphereMatCenter : sphereMat);
        mesh.position.copy(pos);
        mesh.userData = { id: mappedId, stdId: stdId, type: 'node32_pg' };
        graph32Group.add(mesh);

        const div = document.createElement('div');
        div.className = 'label';
        div.innerHTML = 'e<sub>' + mappedId + '</sub>';
        const label = new CSS2DObject(div);
        label.position.set(0, 0.4, 0);
        mesh.add(label);
    });

    const checkPositive = (m_a, m_b, m_c) => {
        const isMatch = (t, a, b, c) => (t[0] === a && t[1] === b && t[2] === c);
        for (let i = 0; i < TRIPLETS_32.length; i++) {
            const t = TRIPLETS_32[i];
            if (isMatch(t, m_a, m_b, m_c) || isMatch(t, m_b, m_c, m_a) || isMatch(t, m_c, m_a, m_b)) return true;
            if (isMatch(t, m_a, m_c, m_b) || isMatch(t, m_c, m_b, m_a) || isMatch(t, m_b, m_a, m_c)) return false;
        }
        return true;
    };

    POSITIVE_TRIPLETS.forEach((stdTriplet) => {
        const [std_a, std_b, std_c] = stdTriplet;
        const m_a = setArray[std_a - 1];
        const m_b = setArray[std_b - 1];
        const m_c = setArray[std_c - 1];

        const isPos = checkPositive(m_a, m_b, m_c);

        const p1 = pts[std_a], p2 = pts[std_b], p3 = pts[std_c];

        const tubeData = createTubeGeometry(p1, p2, p3);

        let colorHex = 0x888888;
        const hasCenter = stdTriplet.includes(8);
        if (hasCenter) {
            colorHex = 0x00ffff;
        } else if (!tubeData.isCollinear) {
            const isFaceCircle = stdTriplet.every(id => [1, 2, 3, 9, 10, 11].includes(id));
            colorHex = isFaceCircle ? 0xff00ff : 0x00ff00;
        } else {
            const verticesCount = stdTriplet.filter(id => [5, 6, 7, 12].includes(id)).length;
            if (verticesCount >= 2) colorHex = 0xff0000;
            else if (verticesCount === 1) colorHex = 0xffff00;
            else colorHex = 0x00ff00;
        }

        let baseDir = tubeData.isCollinear ? -1.0 : 1.0;
        let flowDir = isPos ? baseDir : -baseDir;

        const opacity = document.getElementById('opacity-slider') ? parseFloat(document.getElementById('opacity-slider').value) : 0.4;
        const material = createTubeMaterial(colorHex, tubeData.isCollinear, flowDir, opacity);

        const mesh = new THREE.Mesh(tubeData.geometry, material);
        graph32Group.add(mesh);
    });

    const setSet = new Set(setArray);

    document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(btn => {
        const nums = btn.innerText.match(/\d+/g).map(Number);
        const isActive = nums.every(n => setSet.has(n));
        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(btn => {
        const nums = btn.innerText.match(/\d+/g).map(Number);
        const isActive = nums.every(n => setSet.has(n));
        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (typeof forceUpdate === 'function') forceUpdate();
};