import { resetCalcPosition } from '../main.js';

window.externalCalcWindow = null;

export const origGetId = document.getElementById.bind(document);
document.getElementById = function (id) {
    let el = origGetId(id);
    if (!el && window.externalCalcWindow && !window.externalCalcWindow.closed) {
        el = window.externalCalcWindow.document.getElementById(id);
    }
    return el;
};

export const origQSA = document.querySelectorAll.bind(document);
document.querySelectorAll = function (sel) {
    let nodes = Array.from(origQSA(sel));
    if (window.externalCalcWindow && !window.externalCalcWindow.closed) {
        nodes = nodes.concat(Array.from(window.externalCalcWindow.document.querySelectorAll(sel)));
    }
    return nodes;
};

export const origQS = document.querySelector.bind(document);
document.querySelector = function (sel) {
    let el = origQS(sel);
    if (!el && window.externalCalcWindow && !window.externalCalcWindow.closed) {
        el = window.externalCalcWindow.document.querySelector(sel);
    }
    return el;
};

const popoutCalcBtn = document.getElementById('popout-calc-btn');

if (popoutCalcBtn) {
    popoutCalcBtn.addEventListener('click', () => {
        if (window.externalCalcWindow && !window.externalCalcWindow.closed) {
            // Se è già aperto, cliccare il tasto lo chiude (e lo fa tornare nella pagina principale)
            window.externalCalcWindow.close();
            return;
        }

        window.externalCalcWindow = window.open('', 'CalcWindow', 'width=380,height=550');
        if (!window.externalCalcWindow) {
            alert("Popup bloccato. Consenti i pop-up per poter separare la calcolatrice.");
            return;
        }

        // Copia gli stili
        const styles = origQSA('style, link[rel="stylesheet"]');
        styles.forEach(style => {
            window.externalCalcWindow.document.head.appendChild(style.cloneNode(true));
        });

        const extDoc = window.externalCalcWindow.document;
        extDoc.body.style.margin = '0';
        extDoc.body.style.padding = '0';
        extDoc.body.style.backgroundColor = '#1a1a1a';
        extDoc.body.style.display = 'block';
        extDoc.body.style.width = '100%';
        extDoc.body.style.height = '100vh';
        extDoc.body.style.overflow = 'hidden';

        const calcModalEl = origGetId('calc-modal');
        calcModalEl.style.position = 'absolute';
        calcModalEl.style.top = '0px';
        calcModalEl.style.left = '0px';
        calcModalEl.style.right = '0px';
        calcModalEl.style.bottom = '0px';
        calcModalEl.style.margin = '0px';
        calcModalEl.style.transform = 'none';
        calcModalEl.style.boxShadow = 'none';
        calcModalEl.style.border = 'none';
        calcModalEl.style.borderRadius = '0';
        calcModalEl.style.width = '100%';
        calcModalEl.style.height = '100%';
        calcModalEl.style.boxSizing = 'border-box';

        extDoc.body.appendChild(calcModalEl);

        // INIEZIONE CSS PER RISOLVERE I CONFLITTI MOBILE NEL POP-UP
        const popoutFixStyle = extDoc.createElement('style');
        popoutFixStyle.textContent = `
            /* Annulla i !important di dock.css e sidebar.css per l'altezza mobile */
            #calc-modal {
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                transform: none !important;
                border-radius: 0 !important;
            }
            /* Nasconde i tab desktop nel popout per evitare duplicati con lo swipe nav */
            .calc-view-tabs {
                display: none !important;
            }
            /* Forza la visibilità dei menu che su mobile venivano nascosti da base.css */
            #calc-modal > #zerodiv-overlay.visible,
            .calc-body > #calc-formula-menu.visible {
                display: flex !important;
            }
            /* Ripristina il posizionamento del menu formule (su mobile finiva in basso) */
            #calc-formula-menu {
                position: absolute !important;
                top: 45px !important;
                bottom: auto !important;
                left: 10px !important;
                transform: none !important;
            }
            /* Ripristina le dimensioni della barra display per liberare le icone */
            .display-area {
                padding: 12px 14px !important;
                min-height: auto !important;
            }
            /* Porta in primo piano l'icona delle variabili ed elimina quella del popout */
            #mobile-vars-btn {
                z-index: 50 !important;
            }
            #popout-calc-btn {
                display: none !important;
            }
            /* Ripristina la dimensione del testo per i divisori dello zero nel popout */
            .zerodiv-grid-btn {
                font-size: 13px !important;
                padding: 6px 4px !important;
                letter-spacing: normal !important;
            }
        `;
        extDoc.head.appendChild(popoutFixStyle);

        // Crea un ponte per far comunicare i tasti (onclick) con la finestra principale
        const proxyScript = extDoc.createElement('script');
        proxyScript.textContent = `
            ['calcInput', 'calcAction', 'switchCalcView', 'calcSteps', 'calcBracket', 'calcSmartParen', 'runFormulaDemo', 'switchMulTab', 'handleKey', 'toggleShift', 'runKernelOnResult', 'toggleVarsView', 'applySwipeState', 'toggleFormulaExplain', 'changeZdPage', 'changeCalcHelperPage', 'saveKernelToVar', 'startEvalPress', 'endEvalPress', 'cancelEvalPress', 'hideEvalPopup'].forEach(fn => {
                window[fn] = function(...args) { 
                    if(window.opener && window.opener[fn]) return window.opener[fn](...args); 
                };
            });
            // Collega anche le variabili di stato globale necessarie per i bottoni
            Object.defineProperty(window, 'currentSwipeState', {
                get: function() { return window.opener ? window.opener.currentSwipeState : 0; }
            });
        `;
        extDoc.head.appendChild(proxyScript);

        window.externalCalcWindow.addEventListener('beforeunload', () => {
            calcModalEl.style.position = 'fixed';
            calcModalEl.style.top = '';
            calcModalEl.style.left = '';
            calcModalEl.style.right = '';
            calcModalEl.style.bottom = '';
            calcModalEl.style.boxShadow = '';
            calcModalEl.style.border = '';
            calcModalEl.style.borderRadius = '';
            calcModalEl.style.width = '';
            calcModalEl.style.height = '';
            calcModalEl.style.boxSizing = '';
            calcModalEl.style.display = ''; // Rimuove il blocco invisibile
            resetCalcPosition();
            document.body.appendChild(calcModalEl);

            // Disattiva la calcolatrice e l'icona alla chiusura del pop-up (sia via X nativa che dock)
            calcModalEl.classList.remove('active');
            document.getElementById('calc-toggle-btn').classList.remove('active');

            window.externalCalcWindow = null;
        });
    });
}