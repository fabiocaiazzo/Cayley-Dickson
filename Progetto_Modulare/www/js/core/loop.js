import * as THREE from 'three';
import { scene, camera, initialCameraPos, renderer, labelRenderer, controls, animatedMaterials, animParams } from '../3d/scene.js';
import { starField } from '../ui/ui.js';
import { consumeRenderFlag } from './renderer.js';

const clock = new THREE.Clock();

export function initLoop() {
    function animate() {
        requestAnimationFrame(animate);

        if (isNaN(camera.position.x) || !isFinite(camera.position.x)) {
            camera.position.copy(initialCameraPos);
            controls.target.set(0, 3, 0);
            controls.update();
        }

        const delta = Math.min(clock.getDelta(), 0.1);
        let needsRender = consumeRenderFlag();

        if (!animParams.paused && animParams.speed > 0) {
            animParams.customTime += delta * animParams.speed;
            animatedMaterials.forEach(mat => mat.uniforms.customTime.value = animParams.customTime);
            needsRender = true;
        }

        // Animazione sfondo stellato (se attivo)
        if (starField && starField.visible) {
            starField.rotation.y += 0.0003;
            if (!animParams.paused) needsRender = true;
        }

        // Aggiorna i controlli PRIMA del render check per garantire l'inerzia
        if (controls.update()) {
            needsRender = true;
        }

        // Se necessario, renderizza
        if (needsRender) {
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);
        }
    }
    
    animate();
}