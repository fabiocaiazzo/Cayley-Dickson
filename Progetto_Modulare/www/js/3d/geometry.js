import * as THREE from 'three';
import { flowVertexShader, neonFragmentShader, animatedMaterials } from './scene.js';

/**
 * Calcola e restituisce la geometria del tubo (TubeGeometry) tra tre punti.
 * Se i punti sono collineari, crea un tubo dritto, altrimenti un arco di cerchio.
 */
export function createTubeGeometry(p1, p2, p3) {
    let curve;
    let isOpenCurve = false;
    
    const v12 = new THREE.Vector3().subVectors(p2, p1);
    const v13 = new THREE.Vector3().subVectors(p3, p1);
    const normal = new THREE.Vector3().crossVectors(v12, v13);
    const isCollinear = normal.lengthSq() < 0.001;

    if (isCollinear) {
        isOpenCurve = true;
        const d12 = p1.distanceTo(p2); 
        const d23 = p2.distanceTo(p3); 
        const d31 = p3.distanceTo(p1);

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
        const centerOffset = new THREE.Vector3().addVectors(
            v2.clone().multiplyScalar(v1.lengthSq()).cross(v1xv2), 
            v1xv2.clone().cross(v1.clone().multiplyScalar(v2.lengthSq()))
        ).divideScalar(2 * lenSq);
        
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
    
    return {
        geometry: tubeGeom,
        isCollinear: isCollinear,
        curve: curve,
        isOpenCurve: isOpenCurve
    };
}

/**
 * Crea e restituisce il materiale animato standard per le linee del grafo.
 */
export function createTubeMaterial(colorHex, isCollinear, flowDirection = null, opacity = 0.4) {
    let flowDir = flowDirection !== null ? flowDirection : (isCollinear ? -1.0 : 1.0);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            customTime: { value: 0 },
            color: { value: new THREE.Color(colorHex) },
            flowDir: { value: flowDir },
            opacity: { value: opacity },
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
    
    // Lo registriamo per l'animazione del tempo
    animatedMaterials.push(material);
    
    return material;
}