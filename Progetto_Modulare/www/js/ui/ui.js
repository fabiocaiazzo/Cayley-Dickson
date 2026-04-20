import * as THREE from 'three';
import { scene, container, camera, controls, initialCameraPos, animatedMaterials, animParams } from '../3d/scene.js';
import { t } from '../core/i18n.js';
import { isRotationMode, rotMasterGroup } from '../3d/rotation.js';

// Esportiamo le variabili per farle leggere al loop di animazione
export let gridHelper;
export let starField;

export function initUI() {
    const settingsToggle = document.getElementById('settings-toggle-btn');
    const settingsToggleMobile = document.getElementById('settings-mobile-btn');
    const settingsMenu = document.getElementById('settings-menu');

    // --- GESTIONE MENU PRINCIPALE ---
    const toggleSettingsMenu = (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('visible');
        settingsToggle.classList.toggle('active');
        if (settingsToggleMobile) settingsToggleMobile.classList.toggle('active');
    };

    settingsToggle.addEventListener('click', toggleSettingsMenu);
    if (settingsToggleMobile) settingsToggleMobile.addEventListener('click', toggleSettingsMenu);

    document.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsToggle && e.target !== settingsToggleMobile) {
            settingsMenu.classList.remove('visible');
            settingsToggle.classList.remove('active');
            if (settingsToggleMobile) settingsToggleMobile.classList.remove('active');
        }
    });

    const speedLabel = document.getElementById('speed-val');
    const speedSlider = document.getElementById('speed-slider');
    const opacityLabel = document.getElementById('opacity-val');
    const opacitySlider = document.getElementById('opacity-slider');
    const settingsMenuEl = document.getElementById('settings-menu');

    function dimSettings(activeRow) {
        settingsMenuEl.classList.add('dimmed');
        activeRow.classList.add('active-slider');
    }
    function restoreSettings(activeRow) {
        settingsMenuEl.classList.remove('dimmed');
        activeRow.classList.remove('active-slider');
    }

    ['touchstart', 'mousedown'].forEach(evt => {
        speedSlider.addEventListener(evt, () => dimSettings(speedSlider.closest('.setting-row')), { passive: true });
        opacitySlider.addEventListener(evt, () => dimSettings(opacitySlider.closest('.setting-row')), { passive: true });
    });

    ['touchend', 'mouseup', 'mouseleave'].forEach(evt => {
        speedSlider.addEventListener(evt, () => restoreSettings(speedSlider.closest('.setting-row')));
        opacitySlider.addEventListener(evt, () => restoreSettings(opacitySlider.closest('.setting-row')));
    });

    // --- RIPRISTINO VALORI SALVATI (Velocità e Opacità) ---
    const savedSpeed = localStorage.getItem('app_speed');
    if (savedSpeed !== null && speedSlider) {
        speedSlider.value = savedSpeed;
        animParams.speed = parseFloat(savedSpeed);
        if (speedLabel) speedLabel.innerText = savedSpeed + 'x';
    }

    const savedOpacity = localStorage.getItem('app_opacity');
    if (savedOpacity !== null && opacitySlider) {
        opacitySlider.value = savedOpacity;
        if (opacityLabel) opacityLabel.innerText = parseFloat(savedOpacity).toFixed(2);
        // Ritardiamo leggermente l'applicazione per assicurarci che i materiali siano pronti
        setTimeout(() => {
            animatedMaterials.forEach(mat => {
                mat.uniforms.opacity.value = parseFloat(savedOpacity);
                mat.needsUpdate = true;
            });
            window.dispatchEvent(new CustomEvent('requestForceUpdate'));
        }, 100);
    }

    speedSlider.addEventListener('input', (e) => {
        animParams.speed = parseFloat(e.target.value);
        if (speedLabel) speedLabel.innerText = animParams.speed + 'x';
        localStorage.setItem('app_speed', e.target.value);
    });

    // --- GESTIONE OPACITÀ (Semplificata e Fluida) ---
    opacitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (opacityLabel) opacityLabel.innerText = val.toFixed(2);

        animatedMaterials.forEach(mat => {
            mat.uniforms.opacity.value = val;
            mat.needsUpdate = true;
        });
        
        localStorage.setItem('app_opacity', e.target.value);

        window.dispatchEvent(new CustomEvent('requestForceUpdate'));
    });

    document.getElementById('home-btn').addEventListener('click', () => {
        controls.enableDamping = false;
        controls.update();
        camera.position.copy(initialCameraPos);
        controls.target.set(0, 3, 0);
        controls.update();
        controls.enableDamping = true;

        if (isRotationMode && rotMasterGroup) {
            rotMasterGroup.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -3 * Math.PI / 4, 'XYZ'));
        }

        window.dispatchEvent(new CustomEvent('requestForceUpdate'));
    });

    const playBtn = document.getElementById('play-pause-btn');
    const iconPlay = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    const iconPause = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

    playBtn.addEventListener('click', () => {
        animParams.paused = !animParams.paused;
        playBtn.innerHTML = animParams.paused ? iconPlay : iconPause;
        if (!animParams.paused) window.dispatchEvent(new CustomEvent('requestForceUpdate'));
    });

    // --- LOGICA SFONDI E GRIGLIA ---
    let currentTheme = parseInt(localStorage.getItem('app_theme')) || 0;
    const themeBtn = document.getElementById('theme-btn');
    const themeLabel = document.getElementById('theme-label');

    gridHelper = new THREE.GridHelper(60, 30, 0x555555, 0x222222);
    gridHelper.visible = false;
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    const boxMaterials = [
        new THREE.MeshLambertMaterial({ color: 0xd8d8d8, side: THREE.BackSide }), // Destra
        new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: THREE.BackSide }), // Sinistra
        new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.BackSide }), // Sopra
        new THREE.MeshLambertMaterial({ color: 0xbbbbbb, side: THREE.BackSide }), // Sotto
        new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: THREE.BackSide }), // Fronte
        new THREE.MeshLambertMaterial({ color: 0xe0e0e0, side: THREE.BackSide })  // Retro
    ];

    const boxGroup = new THREE.Mesh(
        new THREE.BoxGeometry(250, 250, 250),
        boxMaterials
    );
    boxGroup.visible = false;
    scene.add(boxGroup);

    const gridToggleBtn = document.getElementById('grid-toggle-btn');
    const gridLabel = document.getElementById('grid-label');

    gridToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        gridHelper.visible = !gridHelper.visible;
        gridLabel.innerText = gridHelper.visible ? t('grid_on') : t('grid_off');
        gridToggleBtn.style.borderColor = gridHelper.visible ? '#00aaff' : '';
        gridToggleBtn.style.color = gridHelper.visible ? 'white' : '';
        window.dispatchEvent(new CustomEvent('requestForceUpdate'));
    });


    const starsCount = 1000; const starsGeo = new THREE.BufferGeometry(); const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) starsPos[i] = (Math.random() - 0.5) * 100;
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    starField = new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.15, color: 0xffffff }));
    starField.visible = false;
    scene.add(starField);

    function applyTheme(themeId) {
        themeLabel.innerText = t('theme_label') + ": " + t('theme_' + themeId);

        scene.background = null;
        starField.visible = false;
        container.className = '';
        scene.fog = null;
        container.style.background = '';
        document.body.classList.remove('theme-box');
        boxGroup.visible = false;

        scene.children.forEach(c => { if (c.isGridHelper && c !== gridHelper) scene.remove(c); });

        if (themeId === 0) {
            const col = 0x2b3a42;
            scene.background = new THREE.Color(col);
            container.style.backgroundColor = '#' + col.toString(16);
            scene.fog = new THREE.Fog(col, 10, 60);
        }
        else if (themeId === 1) {
            container.classList.add('bg-deep-space');
            scene.fog = new THREE.FogExp2(0x24243e, 0.02);
        }
        else if (themeId === 2) {
            const col = 0x001a33;
            scene.background = new THREE.Color(col);
            container.style.backgroundColor = '#001a33';
            container.classList.add('bg-studio');
        }
        else if (themeId === 3) {
            const col = 0x0a0a14;
            scene.background = new THREE.Color(col);
            starField.visible = true;
            container.style.backgroundColor = '#0a0a14';
        }
        else if (themeId === 4) {
            const col = 0x111111;
            scene.background = new THREE.Color(col);
            container.style.backgroundColor = '#111111';
        }
        else if (themeId === 5) {
            scene.background = null;
            container.classList.add('bg-box');
            document.body.classList.add('theme-box');
            boxGroup.visible = true;
        }

        window.dispatchEvent(new CustomEvent('requestForceUpdate'));
    }

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTheme = (currentTheme + 1) % 6;
        localStorage.setItem('app_theme', currentTheme);
        applyTheme(currentTheme);
    });

    // Applica il tema salvato all'avvio (dopo un breve timeout per assicurarsi che i18n sia pronto)
    setTimeout(() => { applyTheme(currentTheme); }, 150);


    // --- HELP MODAL ---
    const helpModal = document.getElementById('help-modal');
    const helpBtnTrigger = document.getElementById('help-btn-trigger');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const helpNext = document.getElementById('help-next-btn');
    const helpPrev = document.getElementById('help-prev-btn');
    const helpPages = document.querySelectorAll('.help-page');
    const helpDots = document.querySelectorAll('.help-dot');
    let currentHelpPage = 0;

    function updateHelpUI() {
        helpPages.forEach((p, i) => p.classList.toggle('active', i === currentHelpPage));
        helpDots.forEach((d, i) => d.classList.toggle('active', i === currentHelpPage));
        helpPrev.disabled = currentHelpPage === 0;
        
        if (currentHelpPage === helpPages.length - 1) {
            helpNext.innerText = t('btn_close') || 'Chiudi';
            helpNext.style.backgroundColor = '#ff4444';
            helpNext.style.color = 'white';
        } else {
            helpNext.innerText = (t('btn_next') || 'Avanti') + ' >';
            helpNext.style.backgroundColor = '';
            helpNext.style.color = '';
        }

        const helpContent = document.querySelector('.help-content');
        if (helpContent) {
            helpContent.scrollTop = 0;
        }
    }
    helpBtnTrigger.addEventListener('click', () => {
        helpModal.classList.add('visible');
        settingsMenu.classList.remove('visible'); settingsToggle.classList.remove('active');
        currentHelpPage = 0; updateHelpUI();
    });
    closeHelpBtn.addEventListener('click', () => helpModal.classList.remove('visible'));
    helpNext.addEventListener('click', () => {
        if (currentHelpPage < helpPages.length - 1) { currentHelpPage++; updateHelpUI(); } else { helpModal.classList.remove('visible'); }
    });
    helpPrev.addEventListener('click', () => { if (currentHelpPage > 0) { currentHelpPage--; updateHelpUI(); } });
    helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.remove('visible'); });

    // Aggiorna i testi dinamici quando cambia la lingua
    window.addEventListener('languageChanged', () => {
        gridLabel.innerText = gridHelper.visible ? t('grid_on') : t('grid_off');
        themeLabel.innerText = t('theme_label') + ": " + t('theme_' + currentTheme);
        if (helpNext) {
            if (currentHelpPage === helpPages.length - 1) {
                helpNext.innerText = t('btn_close') || 'Chiudi';
            } else {
                helpNext.innerText = (t('btn_next') || 'Avanti') + ' >';
            }
        }
    });

    // ==========================================
    // LOGICA MUSICA DI SOTTOFONDO
    // ==========================================
    const musicBtn = document.getElementById('music-toggle-btn');
    const musicStatusText = document.getElementById('music-status-text');

// Imposta la musica recuperando lo stato salvato, altrimenti OFF di default
    let isMusicPlaying = localStorage.getItem('app_music') === 'true';

    // Assicurati che il percorso coincida con il file che inserirai
    const bgMusic = new Audio('./assets/audio/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.onerror = () => { isMusicPlaying = false; updateMusicUI(); };

    // Aggiorna lo stile del tasto
    function updateMusicUI() {
        if (isMusicPlaying) {
            if (musicStatusText) musicStatusText.innerText = 'On';
            if (musicBtn) {
                musicBtn.style.borderColor = '#00aaff';
                musicBtn.style.color = '#fff';
            }
        } else {
            if (musicStatusText) musicStatusText.innerText = 'Off';
            if (musicBtn) {
                musicBtn.style.borderColor = '#334455';
                musicBtn.style.color = '#667788';
            }
        }
    }

    // Tenta di avviare l'audio. Se bloccato dai criteri di Autoplay, aspetta un click.
    const tryPlayMusic = () => {
        if (isMusicPlaying) {
            bgMusic.play().catch(error => {
                console.log("Autoplay bloccato. In attesa del primo tocco dell'utente.");
                document.addEventListener('click', function startOnInteraction() {
                    if (isMusicPlaying) bgMusic.play();
                    document.removeEventListener('click', startOnInteraction);
                }, { once: true });
            });
        }
    };

    tryPlayMusic();
    updateMusicUI();

    if (musicBtn) {
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita la chiusura del menu impostazioni

            isMusicPlaying = !isMusicPlaying;
            localStorage.setItem('app_music', isMusicPlaying);
            
            if (isMusicPlaying) {
                bgMusic.play();
            } else {
                bgMusic.pause();
            }
            updateMusicUI();

        });
    }

    // Ferma la musica quando l'app viene messa in background (home, chiamate, ecc.)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isMusicPlaying) {
            bgMusic.pause();
        } else if (!document.hidden && isMusicPlaying) {
            bgMusic.play().catch(() => { });
        }
    });
}