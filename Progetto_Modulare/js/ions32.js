import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene, sphereGeom, sphereMat, sphereMatCenter, animatedMaterials, flowVertexShader, neonFragmentShader, pts, pointObjects, tripletVisuals } from './scene.js';
import { forceUpdate, resetView } from './main.js';
import { t } from './i18n.js';

// --- 32-IONI LOGIC ---
window.is32IonMode = false;
export const graph32Group = new THREE.Group();
scene.add(graph32Group);

export const toggle32Ions = function () {
    window.is32IonMode = !window.is32IonMode;

    const btn32 = document.getElementById('toggle-32-btn');
    if (btn32) {
        if (window.is32IonMode) {
            btn32.style.background = 'rgba(0, 170, 255, 0.15)';
            btn32.style.borderColor = '#00aaff';
            btn32.style.color = 'white';
            btn32.style.boxShadow = '0 0 15px rgba(0, 136, 255, 0.2)';
        } else {
            btn32.style.background = '';
            btn32.style.borderColor = '';
            btn32.style.color = '';
            btn32.style.boxShadow = '';
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

        window.TRIPLETS_32 = [
            [1, 2, 3], [1, 4, 5], [1, 7, 6], [1, 8, 9], [1, 11, 10], [1, 13, 12], [1, 14, 15], [1, 16, 17], [1, 19, 18], [1, 21, 20], [1, 22, 23], [1, 25, 24], [1, 26, 27], [1, 28, 29], [1, 31, 30],
            [2, 4, 6], [2, 5, 7], [2, 8, 10], [2, 9, 11], [2, 14, 12], [2, 15, 13], [2, 16, 18], [2, 17, 19], [2, 22, 20], [2, 23, 21], [2, 26, 24], [2, 27, 25], [2, 28, 30], [2, 29, 31],
            [3, 4, 7], [3, 6, 5], [3, 8, 11], [3, 10, 9], [3, 13, 14], [3, 15, 12], [3, 16, 19], [3, 18, 17], [3, 21, 22], [3, 23, 20], [3, 25, 26], [3, 27, 24], [3, 28, 31], [3, 30, 29],
            [4, 8, 12], [4, 9, 13], [4, 10, 14], [4, 11, 15], [4, 16, 20], [4, 17, 21], [4, 18, 22], [4, 19, 23], [4, 28, 24], [4, 29, 25], [4, 30, 26], [4, 31, 27],
            [5, 8, 13], [5, 10, 15], [5, 12, 9], [5, 14, 11], [5, 16, 21], [5, 18, 23], [5, 20, 17], [5, 22, 19], [5, 25, 28], [5, 27, 30], [5, 29, 24], [5, 31, 26],
            [6, 8, 14], [6, 11, 13], [6, 12, 10], [6, 15, 9], [6, 16, 22], [6, 19, 21], [6, 20, 18], [6, 23, 17], [6, 25, 31], [6, 26, 28], [6, 29, 27], [6, 30, 24],
            [7, 8, 15], [7, 9, 14], [7, 12, 11], [7, 13, 10], [7, 16, 23], [7, 17, 22], [7, 20, 19], [7, 21, 18], [7, 26, 29], [7, 27, 28], [7, 30, 25], [7, 31, 24],
            [8, 16, 24], [8, 17, 25], [8, 18, 26], [8, 19, 27], [8, 20, 28], [8, 21, 29], [8, 22, 30], [8, 23, 31],
            [9, 16, 25], [9, 18, 27], [9, 20, 29], [9, 23, 30], [9, 24, 17], [9, 26, 19], [9, 28, 21], [9, 31, 22],
            [10, 16, 26], [10, 19, 25], [10, 20, 30], [10, 21, 31], [10, 24, 18], [10, 27, 17], [10, 28, 22], [10, 29, 23],
            [11, 16, 27], [11, 17, 26], [11, 20, 31], [11, 22, 29], [11, 24, 19], [11, 25, 18], [11, 28, 23], [11, 30, 21],
            [12, 16, 28], [12, 21, 25], [12, 22, 26], [12, 23, 27], [12, 24, 20], [12, 29, 17], [12, 30, 18], [12, 31, 19],
            [13, 16, 29], [13, 17, 28], [13, 19, 30], [13, 23, 26], [13, 24, 21], [13, 25, 20], [13, 27, 22], [13, 31, 18],
            [14, 16, 30], [14, 17, 31], [14, 18, 28], [14, 21, 27], [14, 24, 22], [14, 25, 23], [14, 26, 20], [14, 29, 19],
            [15, 16, 31], [15, 18, 29], [15, 19, 28], [15, 22, 25], [15, 24, 23], [15, 26, 21], [15, 27, 20], [15, 30, 17]
        ];
        let tripHTML = '';
        window.TRIPLETS_32.forEach(t => {
            tripHTML += `<div class="triplet-btn" style="cursor:default; border-left:4px solid #556677; color:#8899aa; background:transparent; pointer-events:none;">{${t[0]}, ${t[1]}, ${t[2]}}</div>`;
        });
        btnContainer32.innerHTML = tripHTML;
        btnContainer32.dataset.count = window.TRIPLETS_32.length;
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
                        fanoHTML += `<div class="fano-btn" style="cursor:default; border:1px solid #445566; color:#8899aa; background:transparent; pointer-events:none;">{${plane.join(', ')}}</div>`;
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

        const PG32_SETS = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23],
            [1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19, 24, 25, 26, 27],
            [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29],
            [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
            [1, 2, 3, 4, 5, 6, 7, 24, 25, 26, 27, 28, 29, 30, 31],
            [1, 2, 3, 8, 9, 10, 11, 20, 21, 22, 23, 28, 29, 30, 31],
            [1, 4, 5, 8, 9, 12, 13, 18, 19, 22, 23, 26, 27, 30, 31],
            [2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 31],
            [1, 2, 3, 12, 13, 14, 15, 16, 17, 18, 19, 28, 29, 30, 31],
            [1, 4, 5, 10, 11, 14, 15, 16, 17, 20, 21, 26, 27, 30, 31],
            [2, 4, 6, 9, 11, 13, 15, 16, 18, 20, 22, 25, 27, 29, 31],
            [1, 6, 7, 8, 9, 14, 15, 16, 17, 22, 23, 24, 25, 30, 31],
            [2, 5, 7, 8, 10, 13, 15, 16, 18, 21, 23, 24, 26, 29, 31],
            [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 27, 28, 31],
            [1, 2, 3, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27],
            [1, 4, 5, 10, 11, 14, 15, 18, 19, 22, 23, 24, 25, 28, 29],
            [2, 4, 6, 9, 11, 13, 15, 17, 19, 21, 23, 24, 26, 28, 30],
            [1, 6, 7, 8, 9, 14, 15, 18, 19, 20, 21, 26, 27, 28, 29],
            [2, 5, 7, 8, 10, 13, 15, 17, 19, 20, 22, 25, 27, 28, 30],
            [3, 4, 7, 8, 11, 12, 15, 17, 18, 21, 22, 25, 26, 29, 30],
            [1, 6, 7, 10, 11, 12, 13, 16, 17, 22, 23, 26, 27, 28, 29],
            [2, 5, 7, 9, 11, 12, 14, 16, 18, 21, 23, 25, 27, 28, 30],
            [3, 4, 7, 9, 10, 13, 14, 16, 19, 20, 23, 25, 26, 29, 30],
            [3, 5, 6, 8, 11, 13, 14, 16, 19, 21, 22, 24, 27, 29, 30],
            [1, 6, 7, 10, 11, 12, 13, 18, 19, 20, 21, 24, 25, 30, 31],
            [2, 5, 7, 9, 11, 12, 14, 17, 19, 20, 22, 24, 26, 29, 31],
            [3, 4, 7, 9, 10, 13, 14, 17, 18, 21, 22, 24, 27, 28, 31],
            [3, 5, 6, 8, 11, 13, 14, 17, 18, 20, 23, 25, 26, 28, 31],
            [3, 5, 6, 9, 10, 12, 15, 16, 19, 21, 22, 25, 26, 28, 31],
            [3, 5, 6, 9, 10, 12, 15, 17, 18, 20, 23, 24, 27, 29, 30]
        ];
        let pg32HTML = '';
        PG32_SETS.forEach(set => {
            let borderColor = '#ff4444'; 

            if (set.join(',') === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15') {
                borderColor = '#4488ff'; 
            } else if (set.includes(16)) {
                borderColor = '#00cc44'; 
            }

            pg32HTML += `<div class="fano-btn" onclick="buildPG32Graph([${set.join(', ')}], this)" style="cursor:pointer; border:2px solid ${borderColor}; color:#eeeeee; background:transparent; font-size:11px; padding:8px 4px; transition:all 0.2s;">{${set.join(', ')}}</div>`;
        });
        pg32Grid32.innerHTML = pg32HTML;
        pg32Grid32.dataset.count = PG32_SETS.length;
    }

    if (window.is32IonMode) {
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
            dot32.innerHTML = '𝕋';
            dot32.title = t('alg_32');
            dot32.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = document.getElementById('alg-dots-list');
                if (menu) menu.classList.remove('open');
                window.toggle32Ions(); 
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
            btn.style.borderLeftColor = '#556677';
            btn.style.color = '#8899aa';
            btn.style.background = 'transparent';
        });
        document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(btn => {
            btn.style.borderColor = '#445566';
            btn.style.color = '#8899aa';
            btn.style.background = 'transparent';
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

        resetView(); 
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
        for (let i = 0; i < window.TRIPLETS_32.length; i++) {
            const t = window.TRIPLETS_32[i];
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

        let curve, isOpenCurve = false;
        const v12 = new THREE.Vector3().subVectors(p2, p1);
        const v13 = new THREE.Vector3().subVectors(p3, p1);
        const normal = new THREE.Vector3().crossVectors(v12, v13);
        const isCollinear = normal.lengthSq() < 0.001;

        if (isCollinear) {
            isOpenCurve = true;
            const d12 = p1.distanceTo(p2); const d23 = p2.distanceTo(p3); const d31 = p3.distanceTo(p1);
            if (d12 >= d23 && d12 >= d31) curve = new THREE.LineCurve3(p1, p2);
            else if (d23 >= d12 && d23 >= d31) curve = new THREE.LineCurve3(p2, p3);
            else curve = new THREE.LineCurve3(p3, p1);
        } else {
            let points = [];
            const axisZ = normal.normalize();
            const v1 = new THREE.Vector3().subVectors(p2, p1);
            const v2 = new THREE.Vector3().subVectors(p3, p1);
            const v1xv2 = new THREE.Vector3().crossVectors(v1, v2);
            const lenSq = v1xv2.lengthSq();
            const centerOffset = new THREE.Vector3().addVectors(v2.clone().multiplyScalar(v1.lengthSq()).cross(v1xv2), v1xv2.clone().cross(v1.clone().multiplyScalar(v2.lengthSq()))).divideScalar(2 * lenSq);
            const Center = new THREE.Vector3().addVectors(p1, centerOffset);
            const Radius = centerOffset.length();
            const axisX = new THREE.Vector3().subVectors(p1, Center).normalize();
            const axisY = new THREE.Vector3().crossVectors(axisZ, axisX).normalize();
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                points.push(new THREE.Vector3().copy(Center).add(axisX.clone().multiplyScalar(Radius * Math.cos(theta))).add(axisY.clone().multiplyScalar(Radius * Math.sin(theta))));
            }
            curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
        }
        const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.035, 32, !isOpenCurve);

        let colorHex = 0x888888;
        const hasCenter = stdTriplet.includes(8);
        if (hasCenter) {
            colorHex = 0x00ffff; 
        } else if (!isCollinear) {
            const isFaceCircle = stdTriplet.every(id => [1, 2, 3, 9, 10, 11].includes(id));
            colorHex = isFaceCircle ? 0xff00ff : 0x00ff00; 
        } else {
            const verticesCount = stdTriplet.filter(id => [5, 6, 7, 12].includes(id)).length;
            if (verticesCount >= 2) colorHex = 0xff0000; 
            else if (verticesCount === 1) colorHex = 0xffff00; 
            else colorHex = 0x00ff00; 
        }

        let baseDir = isCollinear ? -1.0 : 1.0;
        let flowDir = isPos ? baseDir : -baseDir;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                customTime: { value: 0 },
                color: { value: new THREE.Color(colorHex) },
                flowDir: { value: flowDir },
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
        animatedMaterials.push(material);

        const mesh = new THREE.Mesh(tubeGeom, material);
        graph32Group.add(mesh);
    });

    const setSet = new Set(setArray); 

    document.querySelectorAll('#buttons-container-32 .triplet-btn').forEach(btn => {
        const nums = btn.innerText.match(/\d+/g).map(Number);
        const isActive = nums.every(n => setSet.has(n));
        if (isActive) {
            btn.style.borderLeftColor = '#00aaff';
            btn.style.color = '#ffffff';
            btn.style.background = 'rgba(0, 170, 255, 0.2)';
        } else {
            btn.style.borderLeftColor = '#556677';
            btn.style.color = '#8899aa';
            btn.style.background = 'transparent';
        }
    });

    document.querySelectorAll('#fano-grid-32 .fano-btn').forEach(btn => {
        const nums = btn.innerText.match(/\d+/g).map(Number);
        const isActive = nums.every(n => setSet.has(n));
        if (isActive) {
            btn.style.borderColor = '#00aaff';
            btn.style.color = '#ffffff';
            btn.style.background = 'rgba(0, 170, 255, 0.2)';
        } else {
            btn.style.borderColor = '#445566';
            btn.style.color = '#8899aa';
            btn.style.background = 'transparent';
        }
    });

    if (typeof forceUpdate === 'function') forceUpdate();
};