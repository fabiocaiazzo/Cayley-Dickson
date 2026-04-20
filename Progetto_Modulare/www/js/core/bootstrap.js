import { container, camera, renderer, labelRenderer, controls } from '../3d/scene.js';
import { forceUpdate } from './renderer.js';

export function initGlobalEvents() {
    // --- EVENTI FINESTRA ---
    controls.addEventListener('change', forceUpdate);
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
        forceUpdate();
    });
    window.addEventListener('pointerup', () => { forceUpdate(); setTimeout(forceUpdate, 100); });
    window.addEventListener('keydown', forceUpdate);

    // --- ZOOM TABELLA (PC & MOBILE) ---
    const tScroll = document.getElementById('table-scroll');
    const tTable = document.getElementById('sedenion-table');
    let tZoom = 1.0;

    function applyTableZoom(targetZoom) {
        const containerW = tScroll.clientWidth;
        const currentVisualWidth = tTable.getBoundingClientRect().width;
        const naturalWidth = currentVisualWidth / (tZoom || 1);

        if (naturalWidth < 10) return;

        let minZoom = containerW / naturalWidth;
        if (minZoom > 1) minZoom = 1;

        tZoom = Math.max(minZoom, Math.min(targetZoom, 3.0));

        if ('zoom' in tTable.style) {
            tTable.style.zoom = tZoom;
        } else {
            tTable.style.transform = `scale(${tZoom})`;
            tTable.style.transformOrigin = "0 0";
            tTable.style.width = (100 / tZoom) + "%";
        }
    }

    if (tScroll) {
        tScroll.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const scaleFactor = Math.exp(-e.deltaY * 0.002);
                applyTableZoom(tZoom * scaleFactor);
            }
        }, { passive: false });

        let startDist = 0;
        let startZoom = 1.0;

        tScroll.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                startDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                startZoom = tZoom;
            }
        }, { passive: false });

        tScroll.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                const currentDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                if (startDist > 0) {
                    const ratio = currentDist / startDist;
                    applyTableZoom(startZoom * ratio);
                }
            }
        }, { passive: false });
    }

    // --- FIX TOOLTIP MOBILE ---
    document.querySelectorAll('.ui-btn').forEach(btn => {
        btn.addEventListener('touchend', () => {
            btn.classList.add('hide-tooltip');
            setTimeout(() => {
                btn.classList.remove('hide-tooltip');
            }, 2000);
        });
    });

    // --- FIX VALIDAZIONE INPUT (Globale) ---
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
            if (e.target.id === 'expression-display' || e.target.id === 'result-display' || e.target.type === 'checkbox' || e.target.type === 'radio') {
                if (e.target.id === 'expression-display') e.target.style.backgroundColor = 'transparent';
                return;
            }

            const rawVal = e.target.value.replace(',', '.');
            const isInvalid = (rawVal !== '' && rawVal !== '-' && rawVal !== '.' && rawVal !== '-.' && isNaN(Number(rawVal)));

            if (isInvalid) {
                e.target.style.setProperty('background-color', 'rgba(255, 80, 80, 0.4)', 'important');
            } else {
                if (e.target.closest('#rotation-ui') || e.target.closest('.rot-seq-row')) {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.3)';
                } else if (e.target.classList.contains('num-input')) {
                    e.target.style.backgroundColor = 'transparent';
                } else {
                    e.target.style.backgroundColor = '';
                }
            }
        }
    });
}