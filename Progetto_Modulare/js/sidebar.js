import { container, camera, renderer, labelRenderer, tripletVisuals } from './scene.js';
import { visualizeTripletByIndex, activeFanoIndex, animateCameraToDefault, visualizeFanoPlane } from './graph.js';
import { forceUpdate, tripletButtons, fanoButtons, resetView } from './main.js';
import { t } from './i18n.js';

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.addEventListener('pointerdown', () => {
        sidebar.style.zIndex = ++window.highestZIndex;
    });

    const sidebarToggle = document.getElementById('sidebar-toggle-btn');
    const sidebarClose = document.getElementById('close-sidebar-btn');
    const resizer = document.getElementById('sidebar-resizer');

    function toggleSidebar() {
        sidebar.style.width = '';
        sidebar.classList.toggle('open');
        sidebarToggle.classList.toggle('active');
        if (sidebar.classList.contains('open')) sidebar.style.zIndex = ++window.highestZIndex;
        setTimeout(() => {
            const w = container.clientWidth; const h = container.clientHeight;
            camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
            forceUpdate();
        }, 350);
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', () => {
        // FIX DEFINITIVO GHOSTING: Nasconde visivamente il contenuto PRIMA dell'animazione
        const content = sidebar.querySelectorAll('.sidebar-tabs, .tab-content');
        content.forEach(el => el.style.visibility = 'hidden');

        // Taglia eventuali sbavature
        sidebar.style.overflow = 'hidden';

        sidebar.classList.remove('open');
        sidebarToggle.classList.remove('active');
        sidebar.style.width = '';

        setTimeout(() => {
            // Ripristina visibilità e overflow per il prossimo utilizzo
            content.forEach(el => el.style.visibility = '');
            sidebar.style.overflow = '';

            const w = container.clientWidth; const h = container.clientHeight;
            camera.aspect = w / h; camera.updateProjectionMatrix();
            renderer.setSize(w, h); labelRenderer.setSize(w, h);
            forceUpdate();
        }, 350);
    });

    // Logica Resize (Trascinamento Mouse + Touch)
    let isResizing = false;

    function startResize(e) {
        isResizing = true;
        resizer.classList.add('active');
        sidebar.style.transition = 'none';
        document.body.style.cursor = 'ew-resize';
        if (e.type === 'mousedown') e.preventDefault();
    }

    function doResize(clientX) {
        if (!isResizing) return;
        const newWidth = window.innerWidth - clientX;

        if (newWidth < 50) {
            sidebar.style.width = '0px';
        } else {
            sidebar.style.width = newWidth + 'px';
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('open');
                sidebarToggle.classList.add('active');
            }
        }

        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
        forceUpdate();
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        resizer.classList.remove('active');
        sidebar.style.transition = '';
        document.body.style.cursor = 'default';

        if (parseInt(sidebar.style.width) === 0 || (sidebar.offsetWidth < 50)) {
            sidebar.classList.remove('open');
            sidebarToggle.classList.remove('active');
            sidebar.style.width = '';
        }

        const w = container.clientWidth; const h = container.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); labelRenderer.setSize(w, h);
        forceUpdate();
    }

    // Mouse Events
    resizer.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', (e) => doResize(e.clientX));
    document.addEventListener('mouseup', stopResize);

    // Touch Events (Nuovi)
    resizer.addEventListener('touchstart', (e) => {
        startResize(e);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (isResizing) e.preventDefault();
        doResize(e.touches[0].clientX);
    }, { passive: false });

    document.addEventListener('touchend', stopResize);

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.id === 'close-sidebar-btn') return;
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    const buttonsContainer = document.getElementById('buttons-container');

    // OTTIMIZZAZIONE: Generazione Batch HTML (1 operazione DOM invece di 35)
    buttonsContainer.innerHTML = POSITIVE_TRIPLETS.map((t, idx) => {
        const hex = tripletVisuals[idx].color.toString(16).padStart(6, '0');
        return `<div class="triplet-btn" data-idx="${idx}" style="border-left: 4px solid #${hex}">{${t.join(', ')}}</div>`;
    }).join('');

    // Salviamo i riferimenti per l'uso futuro (es. highlight) nell'array esportato da main.js
    tripletButtons.push(...buttonsContainer.children);

    // OTTIMIZZAZIONE: Event Delegation (1 listener invece di 35)
    buttonsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.triplet-btn');
        if (btn) visualizeTripletByIndex(parseInt(btn.dataset.idx));
    });

    // --- GESTIONE PIANI DI FANO ---
    const fanoGrid = document.getElementById('fano-grid');

    // Indici dei piani "Ottetti spezzati" (quelli che contengono i divisori dello zero)
    const QUASI_OCT_INDICES = [2, 4, 6, 8, 10, 12, 14];

    FANO_PLANES.forEach((plane, idx) => {
        const btn = document.createElement('div');
        btn.className = 'fano-btn';

        // Appiattisce l'array di terne, rimuove i duplicati e ordina numericamente
        const indices = [...new Set(plane.flat())].sort((a, b) => a - b);
        btn.innerText = `{${indices.join(', ')}}`;

        // LOGICA COLORE AGGIORNATA
        let color;
        let titleText;

        if (idx === 0) {
            // IL PRIMO PIANO (Ottetti Standard): BLU
            color = '#4488ff';
            titleText = t('fano_std');
        } else if (QUASI_OCT_INDICES.includes(idx)) {
            // ottetti spezzati: ROSSO
            color = '#ff4444';
            titleText = t('fano_split');
        } else {
            // ottetti di divisione: VERDE
            color = '#00cc44';
            titleText = t('fano_div');
        }

        btn.style.setProperty('--fano-color', color);
        btn.style.borderColor = color;
        btn.style.borderWidth = '2px';
        btn.style.color = '#eeeeee';

        // Tooltip aggiornato
        btn.title = titleText;

        // FIX: Logica Toggle. Se clicco lo stesso attivo, resetto la vista e torna alla camera standard.
        btn.addEventListener('click', () => {
            if (activeFanoIndex === idx) {
                resetView();
                animateCameraToDefault();
            } else {
                visualizeFanoPlane(idx);
            }
        });
        fanoGrid.appendChild(btn);
        
        // Push array esportato da main.js
        fanoButtons.push(btn);
    });
}