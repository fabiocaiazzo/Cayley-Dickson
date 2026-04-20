import * as THREE from 'three';
import { THRESHOLDS } from '../core/constants.js';
import { AppState } from '../core/state.js';
import { camera, renderer, pointObjects, selectedNodesForClosure } from './scene.js';
import { graph32Group, build32IonGraph } from './ions32.js';
import { highlightConnections } from './graph.js';

// Fase 4 Anti-Patterns: rimossi i dataset HTML (DOM States), usiamo un oggetto JS pulito
export const holdState = {
    isHolding: false,
    targetType: null,
    targetId: null,
    holdTimer: null
};

export function initInteraction3D({ onReset }) {
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    let clickStartX = 0, clickStartY = 0;

    renderer.domElement.addEventListener('pointerdown', (e) => {
        clickStartX = e.clientX;
        clickStartY = e.clientY;

        const rect = renderer.domElement.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseVec, camera);

        const visibleMeshes = [];
        const meshData = new Map();

        if (AppState.is32IonMode) {
            graph32Group.children.forEach(child => {
                if (child.isMesh && child.userData && child.userData.type === 'node32') {
                    visibleMeshes.push(child);
                    meshData.set(child, child.userData);
                }
            });
        } else {
            for (let idStr in pointObjects) {
                const id = parseInt(idStr);
                if (pointObjects[id].mesh.visible) {
                    visibleMeshes.push(pointObjects[id].mesh);
                    meshData.set(pointObjects[id].mesh, { type: 'point', id: id });
                }
            }
        }

        const intersects = raycaster.intersectObjects(visibleMeshes);
        if (intersects.length > 0) {
            const data = meshData.get(intersects[0].object);

            if (AppState.is32IonMode && data.type === 'node32') {
                holdState.targetId = data.id;
                holdState.targetType = 'node32';
            } else if (data.type === 'point') {
                holdState.holdTimer = setTimeout(() => {
                    highlightConnections(data.id);
                    holdState.isHolding = true;
                }, THRESHOLDS.HOLD_INSPECTION_DELAY);
                holdState.targetId = data.id;
                holdState.targetType = 'point';
            }
        } else {
            holdState.targetId = null;
            holdState.targetType = null;
        }
    });

    window.addEventListener('pointerup', (e) => {
        const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);

        if (holdState.holdTimer) {
            clearTimeout(holdState.holdTimer);
            holdState.holdTimer = null;
        }

        if (AppState.is32IonMode) {
            if (dist < THRESHOLDS.DRAG_MIN_DIST && holdState.targetType === 'node32') {
                const id = parseInt(holdState.targetId);
                build32IonGraph(id);
            }
            return;
        }

        const wasHolding = holdState.isHolding;
        holdState.isHolding = false;

        if (dist < THRESHOLDS.DRAG_MIN_DIST) {
            if (holdState.targetId && holdState.targetType === 'point') {
                const id = parseInt(holdState.targetId);

                if (!wasHolding) {
                    if (selectedNodesForClosure.has(id)) {
                        selectedNodesForClosure.delete(id);
                    } else {
                        selectedNodesForClosure.add(id);
                    }
                }
                if (onReset) onReset();
            } else {
                if (selectedNodesForClosure.size > 0 || wasHolding) {
                    selectedNodesForClosure.clear();
                    if (onReset) onReset();
                }
            }
        } else {
            if (wasHolding) {
                if (onReset) onReset();
            }
        }

        const genBtn = document.getElementById('closure-generator-btn');
        const genDiv = document.getElementById('closure-divider');
        const badge = document.getElementById('closure-badge');

        if (genBtn && badge && genDiv) {
            const count = selectedNodesForClosure.size;
            if (count > 0) {
                genBtn.style.display = 'flex';
                genDiv.style.display = 'block';
                badge.innerText = count;
            } else {
                genBtn.style.display = 'none';
                genDiv.style.display = 'none';
            }
        }
    });
}