import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { t } from './i18n.js';

// --- 3D SCENE ---
const container = document.getElementById('canvas-container');

// FIX FLASH: Sincronizza sfondo CSS con WebGL all'avvio per evitare il "buco nero" al resize
container.style.backgroundColor = '#2b3a42';
// FIX LABEL: Imposta il nome dello sfondo iniziale nel menu
const lblRef = document.getElementById('theme-label');
if (lblRef) lblRef.innerText = t('theme_label') + t('theme_0');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b3a42);
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
const initialCameraPos = new THREE.Vector3(14, 12, 24);
if (window.innerWidth <= 768) {
    initialCameraPos.set(22, 18, 38); // Distanza maggiore per mobile
}
camera.position.copy(initialCameraPos);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(container.clientWidth, container.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

// --- FIX ZOOM LIMITS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Rileva se il dispositivo è touch
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
controls.zoomSpeed = isTouchDevice ? 1.5 : 15;

controls.minDistance = 1;
controls.maxDistance = 60;

controls.target.set(0, 3, 0);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// --- GEOMETRIA ---
const S = 12.0;
const h_tri = S * Math.sqrt(3) / 2;
const r_center = h_tri / 3;
const R_vertex = h_tri * 2 / 3;
const H_pyr = S * Math.sqrt(2 / 3);
const v_e5 = new THREE.Vector3(-S / 2, 0, r_center);
const v_e6 = new THREE.Vector3(S / 2, 0, r_center);
const v_e7 = new THREE.Vector3(0, 0, -R_vertex);
const v_e12 = new THREE.Vector3(0, H_pyr, 0);
const mid = (v1, v2) => new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
const centroid3 = (v1, v2, v3) => new THREE.Vector3().addVectors(v1, v2).add(v3).divideScalar(3);
const pts = {};
pts[5] = v_e5; pts[6] = v_e6; pts[7] = v_e7; pts[12] = v_e12;
pts[3] = mid(v_e5, v_e6); pts[2] = mid(v_e5, v_e7); pts[1] = mid(v_e6, v_e7);
pts[4] = centroid3(v_e5, v_e6, v_e7);
pts[9] = mid(v_e5, v_e12); pts[10] = mid(v_e6, v_e12); pts[15] = centroid3(v_e5, v_e6, v_e12);
pts[11] = mid(v_e7, v_e12); pts[14] = centroid3(v_e12, v_e5, v_e7);
pts[13] = centroid3(v_e6, v_e7, v_e12);
pts[8] = new THREE.Vector3().addVectors(v_e5, v_e6).add(v_e7).add(v_e12).multiplyScalar(0.25);

const pointObjects = {};
const selectedNodesForClosure = new Set(); // Nodi selezionati per l'animazione di chiusura

const sphereGeom = new THREE.SphereGeometry(0.22, 32, 32);
const sphereMat = new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa, metalness: 0.2, roughness: 0.4 });
const sphereMatCenter = new THREE.MeshPhysicalMaterial({ color: 0xffdd00, metalness: 0.2, roughness: 0.4 });
const sphereMatSelected = new THREE.MeshPhysicalMaterial({ color: 0x00ffff, metalness: 0.1, roughness: 0.2, emissive: 0x0088ff, emissiveIntensity: 0.6 }); // Materiale Neon per evidenziare la selezione

Object.keys(pts).forEach(k => {
    const idx = parseInt(k);
    const mesh = new THREE.Mesh(sphereGeom, idx === 8 ? sphereMatCenter : sphereMat);
    mesh.position.copy(pts[k]);
    scene.add(mesh);
    const div = document.createElement('div');
    div.className = 'label';
    div.innerHTML = 'e<sub>' + idx + '</sub>';
    const label = new CSS2DObject(div);
    label.position.set(0, 0.4, 0);
    mesh.add(label);
    pointObjects[idx] = { mesh, label };
});

// --- SHADER PATHS ---
const flowVertexShader = `
            precision mediump float;
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
const flowFragmentShader = `
            uniform vec3 color; 
            uniform float customTime; 
            uniform float flowDir; 
            uniform float opacity; 
            varying vec2 vUv;
            
            void main() {
                float t = customTime; 
                float uvX = (flowDir > 0.0) ? vUv.x : (1.0 - vUv.x);
                float progress = fract(uvX - t); 
                float head = smoothstep(0.85, 1.0, progress);
                float body = smoothstep(0.0, 0.6, progress);
                vec3 tailColor = color * 0.8;
                vec3 bodyColor = color * 1.3;
                vec3 midColor = mix(tailColor, bodyColor, body);
                vec3 finalRGB = mix(midColor, vec3(1.0), head); 
                gl_FragColor = vec4(finalRGB, opacity);
            }
        `;

const neonFragmentShader = `
            uniform vec3 color; 
            uniform float customTime; 
            uniform float flowDir; 
            uniform float opacity; 
            uniform float useHighlight;
            varying vec2 vUv;
            
            void main() {
                float t = customTime; 
                float uvX = (flowDir > 0.0) ? vUv.x : (1.0 - vUv.x);
                float progress = fract(uvX - t); 
                float head = smoothstep(0.9, 1.0, progress);
                float tail = smoothstep(0.0, 0.8, progress) * 0.5 + 0.2; 
                vec3 neonColor = color * 2.0; 
                vec3 finalRGB = mix(neonColor * tail, vec3(1.5), head * useHighlight);
                gl_FragColor = vec4(finalRGB, opacity);
            }
        `;

const animatedMaterials = [];
const tripletVisuals = [];
const animParams = { speed: 0.3, paused: false, customTime: 0 };

function createTripletPath(triplet, colorHex) {
    const [i1, i2, i3] = triplet;
    const p1 = pts[i1], p2 = pts[i2], p3 = pts[i3];
    let curve;
    let isOpenCurve = false;
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
        isOpenCurve = false;
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

    const material = new THREE.ShaderMaterial({
        uniforms: {
            customTime: { value: 0 },
            color: { value: new THREE.Color(colorHex) },
            flowDir: { value: isCollinear ? -1.0 : 1.0 },
            opacity: { value: 0.4 },
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
    scene.add(mesh);

    const hitGeom = new THREE.TubeGeometry(curve, 32, 0.25, 3, !isOpenCurve);
    const hitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const hitMesh = new THREE.Mesh(hitGeom, hitMat);
    scene.add(hitMesh);

    tripletVisuals.push({ ids: triplet, mesh: mesh, hitMesh: hitMesh, color: colorHex, isCollinear: isCollinear });
}
POSITIVE_TRIPLETS.forEach((triplet, idx) => createTripletPath(triplet, palette[idx % palette.length]));

// --- ESPORTAZIONE DELLE VARIABILI PER MAIN.JS ---
export { 
    container, scene, camera, initialCameraPos, renderer, labelRenderer, controls, 
    v_e5, v_e6, v_e7, v_e12, pts, pointObjects, selectedNodesForClosure, 
    sphereGeom, sphereMat, sphereMatCenter, sphereMatSelected, 
    animatedMaterials, tripletVisuals, animParams, flowVertexShader, neonFragmentShader 
};