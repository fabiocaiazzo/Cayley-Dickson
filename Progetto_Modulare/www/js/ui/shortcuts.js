import { openCalculator } from '../calculator/calculator_window.js';

export function initShortcuts() {
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement.tagName.toLowerCase();
        const isInputActive = (activeTag === 'input' || activeTag === 'textarea');

        if (!isInputActive) {
            // 1. SPAZIO: Play/Pausa
            if (e.code === 'Space') {
                e.preventDefault();
                const playBtn = document.getElementById('play-pause-btn');
                if (playBtn) playBtn.click();
                return;
            }

            // 2. INVIO: Reset Vista Camera
            if (e.key === 'Enter') {
                e.preventDefault();
                const homeBtn = document.getElementById('home-btn');
                if (homeBtn) homeBtn.click();
                return;
            }

            // 3. FRECCE SU/GIU: Controllo Velocità
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const slider = document.getElementById('speed-slider');
                if (slider) {
                    let val = parseFloat(slider.value);
                    const step = 0.1;

                    if (e.key === 'ArrowUp') {
                        val = Math.min(val + step, parseFloat(slider.max));
                    } else {
                        val = Math.max(val - step, parseFloat(slider.min));
                    }

                    slider.value = val.toFixed(1);
                    slider.dispatchEvent(new Event('input'));
                }
                return;
            }

            // 4. DIGITAZIONE RAPIDA CALCOLATRICE
            const allowedKeys = /^[a-zA-Z0-9\(\)\[\]\+\-\.\?\=]$/;

            if (e.key.length === 1 && allowedKeys.test(e.key)) {
                e.preventDefault();
                openCalculator();

                const display = document.getElementById('expression-display');
                if (display) {
                    display.value += e.key;
                    display.focus();
                    display.setSelectionRange(display.value.length, display.value.length);
                }
            }
        }
    });
}