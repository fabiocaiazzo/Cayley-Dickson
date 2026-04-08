import { container, camera, renderer, labelRenderer, tripletVisuals } from './scene.js';
import { visualizeTripletByIndex, activeFanoIndex, animateCameraToDefault, visualizeFanoPlane } from './graph.js';
import { forceUpdate, tripletButtons, fanoButtons, resetView } from './main.js';
import { t } from './i18n.js';

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');

    // INIEZIONE CSS PER CAROUSEL SIDEBAR MOBILE
    const sidebarCarouselCss = document.createElement('style');
    sidebarCarouselCss.textContent = `
        #sidebar-content-wrapper {
            position: relative;
            flex: 1;
            width: 100%;
            overflow: hidden;
        }
        .tab-content.carousel-mode {
            display: flex !important;
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .tab-content.carousel-mode.no-transition {
            transition: none !important;
        }
        .tab-content.carousel-mode.hidden-tab {
            display: none !important;
        }
    `;
    document.head.appendChild(sidebarCarouselCss);

    // Crea un wrapper che conterrà i contenuti delle schede per farli scorrere
    const sidebarTabsWrapper = document.createElement('div');
    sidebarTabsWrapper.id = 'sidebar-content-wrapper';
    document.querySelectorAll('.tab-content').forEach(c => sidebarTabsWrapper.appendChild(c));
    sidebar.appendChild(sidebarTabsWrapper);

    const sidebarToggle = document.getElementById('sidebar-toggle-btn');
    const sidebarClose = document.getElementById('close-sidebar-btn');
    const resizer = document.getElementById('sidebar-resizer');

    function toggleSidebar() {
        const currentZ = parseInt(sidebar.style.zIndex || 0);
        const isTop = currentZ === window.highestZIndex;

        // Se è già aperta ma NON è in primo piano, portala in primo piano senza chiuderla
        if (sidebar.classList.contains('open') && !isTop) {
            sidebar.style.zIndex = ++window.highestZIndex;
            return;
        }

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
            
            // Aggiorna la posizione del carosello se siamo su mobile
            if (window.innerWidth <= 768 && window.updateSidebarCarousel) {
                window.updateSidebarCarousel(0, true);
            }
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

    // --- SWIPE GESTURES FLUIDE PER SIDEBAR (CAROUSEL) ---
    function getVisibleTabs() {
        return Array.from(document.querySelectorAll('.sidebar-tabs .tab-btn')).filter(btn => {
            return window.getComputedStyle(btn).display !== 'none' && btn.id !== 'close-sidebar-btn';
        });
    }

    window.updateSidebarCarousel = function(dragDelta = 0, animate = false) {
        if (window.innerWidth > 768) {
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('carousel-mode', 'no-transition', 'hidden-tab');
                c.style.transform = '';
            });
            return;
        }

        const visibleBtns = getVisibleTabs();
        let activeIdx = visibleBtns.findIndex(btn => btn.classList.contains('active'));
        if (activeIdx === -1) activeIdx = 0;

        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.add('carousel-mode');
            const btnIdx = visibleBtns.findIndex(btn => 'tab-' + btn.dataset.tab === c.id);
            
            if (btnIdx === -1) {
                c.classList.add('hidden-tab');
                c.style.transform = 'translate3d(200%, 0, 0)';
            } else {
                c.classList.remove('hidden-tab');
                
                if (!animate) {
                    c.classList.add('no-transition');
                } else {
                    void c.offsetWidth; // Forza reflow per far ripartire l'animazione CSS
                    c.classList.remove('no-transition');
                }
                
                const offset = btnIdx - activeIdx;
                c.style.transform = `translate3d(calc(${offset * 100}% + ${dragDelta}px), 0, 0)`;
            }
        });
    };

    // Assicura l'inizializzazione del layout fluido
    setTimeout(() => { if (window.innerWidth <= 768) window.updateSidebarCarousel(0, false); }, 100);

    window.addEventListener('resize', () => {
        if (window.updateSidebarCarousel) window.updateSidebarCarousel(0, false);
    });

    let sbSwipeStartX = 0;
    let sbSwipeStartY = 0;
    let sbSwipeCurrentX = 0;
    let isSbSwiping = false;
    let sbSwipeDirectionDetermined = false;
    let sbIsHorizontalSwipe = false;

    sidebarTabsWrapper.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return; 
        if (e.touches.length !== 1) return;
        
        // Mantieni il fix della Tabella: se tocchi esattamente la tabella (non il suo contenitore esterno)
        // lo swipe non si avvia, permettendoti di scrollarla liberamente.
        if (e.target.closest('#sedenion-table')) return;

        sbSwipeStartX = e.touches[0].clientX;
        sbSwipeStartY = e.touches[0].clientY;
        sbSwipeCurrentX = sbSwipeStartX;
        isSbSwiping = true;
        sbSwipeDirectionDetermined = false;
        sbIsHorizontalSwipe = false;
        
        window.updateSidebarCarousel(0, false); // Ferma eventuali animazioni in corso
    }, { passive: true });

    sidebarTabsWrapper.addEventListener('touchmove', (e) => {
        if (!isSbSwiping) return;
        
        sbSwipeCurrentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = sbSwipeCurrentX - sbSwipeStartX;
        const deltaY = currentY - sbSwipeStartY;

        if (!sbSwipeDirectionDetermined) {
            if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
                sbSwipeDirectionDetermined = true;
                sbIsHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            }
        }

        if (sbSwipeDirectionDetermined) {
            // Rompi il blocco se c'è un movimento ampissimo nella direzione opposta (+40px)
            if (sbIsHorizontalSwipe && Math.abs(deltaY) > Math.abs(deltaX) + 40) {
                sbIsHorizontalSwipe = false;
            } else if (!sbIsHorizontalSwipe && Math.abs(deltaX) > Math.abs(deltaY) + 40) {
                sbIsHorizontalSwipe = true;
                // Riazzera il punto di partenza per evitare salti grafici
                sbSwipeStartX = sbSwipeCurrentX;
                sbSwipeStartY = currentY;
            }

            if (sbIsHorizontalSwipe) {
                if (e.cancelable) e.preventDefault(); // Blocca lo scroll nativo verticale
                window.updateSidebarCarousel(sbSwipeCurrentX - sbSwipeStartX, false);
            } else {
                // Movimento verticale: impediamo al carosello di muoversi orizzontalmente
                window.updateSidebarCarousel(0, false);
            }
        }
    }, { passive: false });

    const endSidebarDrag = () => {
        if (!isSbSwiping) return;
        isSbSwiping = false;

        if (sbSwipeDirectionDetermined && !sbIsHorizontalSwipe) {
            window.updateSidebarCarousel(0, true); // Assicura allineamento
            return;
        }

        const deltaX = sbSwipeCurrentX - sbSwipeStartX;
        const visibleBtns = getVisibleTabs();
        let activeIdx = visibleBtns.findIndex(btn => btn.classList.contains('active'));
        if (activeIdx === -1) activeIdx = 0;

        const trackWidth = sidebarTabsWrapper.offsetWidth || 300;

        if (deltaX > trackWidth * 0.15 && activeIdx > 0) {
            // Swipe a destra -> Pagina precedente
            visibleBtns[activeIdx - 1].click();
        } else if (deltaX < -trackWidth * 0.15 && activeIdx < visibleBtns.length - 1) {
            // Swipe a sinistra -> Pagina successiva
            visibleBtns[activeIdx + 1].click();
        } else {
            // Se lo swipe è troppo corto, torna alla posizione originaria
            window.updateSidebarCarousel(0, true);
        }
    };

    sidebarTabsWrapper.addEventListener('touchend', endSidebarDrag);
    sidebarTabsWrapper.addEventListener('touchcancel', endSidebarDrag);
}