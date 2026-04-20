import { t } from '../core/i18n.js';

let externalCalcWindow = null;

export function getExternalWindow() {
    return externalCalcWindow;
}

export const CalcBridge = {
    getElementById: function(id) {
        let el = document.getElementById(id);
        if (!el && externalCalcWindow && !externalCalcWindow.closed) {
            el = externalCalcWindow.document.getElementById(id);
        }
        return el;
    },
    querySelector: function(sel) {
        let el = document.querySelector(sel);
        if (!el && externalCalcWindow && !externalCalcWindow.closed) {
            el = externalCalcWindow.document.querySelector(sel);
        }
        return el;
    },
    querySelectorAll: function(sel) {
        let nodes = Array.from(document.querySelectorAll(sel));
        if (externalCalcWindow && !externalCalcWindow.closed) {
            nodes = nodes.concat(Array.from(externalCalcWindow.document.querySelectorAll(sel)));
        }
        return nodes;
    }
};

const popoutCalcBtn = document.getElementById('popout-calc-btn');

if (popoutCalcBtn) {
    popoutCalcBtn.addEventListener('click', () => {
        if (externalCalcWindow && !externalCalcWindow.closed) {
            externalCalcWindow.close();
            return;
        }

        externalCalcWindow = window.open('', 'CalcWindow', 'width=380,height=550');
        if (!externalCalcWindow) {
            alert(t('err_popup_blocked'));
            return;
        }

        // 1. Copia gli stili
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
            externalCalcWindow.document.head.appendChild(style.cloneNode(true));
        });

        const extDoc = externalCalcWindow.document;
        
        // 2. Assegna la classe che gestisce il layout tramite CSS puro
        extDoc.body.classList.add('popout-window');

        // 3. Sposta fisicamente il nodo DOM
        const calcModalEl = document.getElementById('calc-modal');
        extDoc.body.appendChild(calcModalEl);

        externalCalcWindow.addEventListener('beforeunload', () => {
            // Ripristina la calcolatrice nella finestra principale
            document.body.appendChild(calcModalEl);
            calcModalEl.classList.remove('active');
            
            const toggleBtn = document.getElementById('calc-toggle-btn');
            if(toggleBtn) toggleBtn.classList.remove('active');

            // Spezza la dipendenza circolare per il reset
            import('./calculator_window.js').then(module => {
                module.resetCalcPosition();
            });

            externalCalcWindow = null;
        });
    });
}