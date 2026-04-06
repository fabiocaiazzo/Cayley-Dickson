# Piano di Test — Progetto Refactoring Cayley-Dickson

> **Legenda:**  
> 🖥️ = Test da eseguire su **PC** (browser desktop, finestra larga ≥ 769px)  
> 📱 = Test da eseguire su **Mobile** (DevTools in modalità mobile, o dispositivo reale, larghezza ≤ 768px)  
> ✅ = Atteso risultato corretto  
> ❌ = Possibile bug se il comportamento è diverso

---

## 1. `index.html`

Il file HTML è il punto d'ingresso. I test qui verificano la struttura, l'ordine di caricamento e la presenza di tutti gli elementi.

| # | Test | PC | Mobile |
|---|---|---|---|
| 1.1 | Apri la console del browser (F12 → Console): non devono comparire errori rossi all'avvio | 🖥️ | 📱 |
| 1.2 | La pagina carica senza schermata bianca o blocco | 🖥️ | 📱 |
| 1.3 | Il grafico 3D con le sfere è visibile subito | 🖥️ | 📱 |
| 1.4 | I bottoni nella dock in basso sono visibili e cliccabili | 🖥️ | 📱 |
| 1.5 | La barra H/O/S in alto a sinistra è visibile | 🖥️ | 📱 |
| 1.6 | `algebra.js` si carica **dopo** `main.js`: nella console non deve apparire nessun `ReferenceError` legato a funzioni di algebra (es. `tableLookup`, `POSITIVE_TRIPLETS`) | 🖥️ | 📱 |

---

## 2. `css/base.css`

Copre: layout generale, sfondo, top bar (algebra switcher), barra H/O/S, help modal, carousel mobile, animazione `waterAnim`, `fadeIn`.

| # | Test | PC | Mobile |
|---|---|---|---|
| 2.1 | Lo sfondo del `body` è `#1a1a1a` al caricamento | 🖥️ | 📱 |
| 2.2 | Il layout occupa tutta l'altezza dello schermo senza barre di scorrimento | 🖥️ | 📱 |
| 2.3 | La barra in alto a sinistra (H/O/S) ha bordo sinistro blu, sfondo semi-trasparente | 🖥️ | 📱 |
| 2.4 | Cliccando il bottone `?` (Guida), si apre il pannello **Help Modal** centrato sullo schermo con sfondo scurito | 🖥️ | 📱 |
| 2.5 | Sfondo Acqua (Water Flow): cambia sfondo fino a quello animato — il gradiente si muove in loop | 🖥️ | 📱 |
| 2.6 | Le pagine della guida hanno animazione fade-in quando si passa da una all'altra | 🖥️ | 📱 |
| 2.7 | Le etichette 3D sulle sfere (e1, e2 ... e15) sono bianche, in corsivo, senza eventi al click | 🖥️ | 📱 |
| 2.8 | **MOBILE ONLY:** La barra H/O/S mostra solo l'icona `𝕊` (o `ℍ`/`𝕆`) e non la lista completa dei cerchietti affiancati | 📱 |
| 2.9 | **MOBILE ONLY:** Il carousel della calcolatrice (pannelli scorrevoli Formule / Calc / Divisori) occupa tutta la larghezza senza straripare | 📱 |

---

## 3. `css/dock.css`

Copre: dock in basso, pulsanti UI (`.ui-btn`), tooltip, menu impostazioni, slider velocità/opacità, `#settings-mobile-btn`, regole mobile.

| # | Test | PC | Mobile |
|---|---|---|---|
| 3.1 | La dock è centrata in basso e ha bordi arrotondati in alto | 🖥️ | 📱 |
| 3.2 | Passando il mouse su un pulsante dock, compare un **tooltip** con il testo corretto sopra il pulsante | 🖥️ | — |
| 3.3 | **MOBILE:** Il tooltip NON appare al semplice hover (che su touch equivale a tocco) | — | 📱 |
| 3.4 | Cliccando il pulsante ⚙️ (ingranaggio) nella dock, si apre il menu impostazioni sopra la dock | 🖥️ | — |
| 3.5 | **MOBILE:** Il pulsante ⚙️ della dock è **nascosto** (visibile solo quello in alto a destra) | — | 📱 |
| 3.6 | **MOBILE:** Il pulsante impostazioni in alto a destra (angolo) è visibile e apre il menu | — | 📱 |
| 3.7 | Lo slider Velocità modifica la velocità dell'animazione in tempo reale | 🖥️ | 📱 |
| 3.8 | Lo slider Opacità modifica l'opacità delle linee neon in tempo reale | 🖥️ | 📱 |
| 3.9 | Il pulsante play/pausa ▶/⏸ ferma e riprende l'animazione | 🖥️ | 📱 |
| 3.10 | I pulsanti `.ui-btn` nella dock hanno effetto `glow` al click/hover | 🖥️ | 📱 |
| 3.11 | Il pulsante attivo (es. calcolatrice aperta) rimane evidenziato in verde-turchese | 🖥️ | 📱 |
| 3.12 | **MOBILE:** Gli hover dei `.ui-btn` non lasciano "stuck highlight" dopo il tocco | — | 📱 |
| 3.13 | Il selettore del testo (evidenziazione blu) non appare quando si clicca sui pulsanti della dock | 🖥️ | 📱 |

---

## 4. `css/sidebar.css`

Copre: pannello sidebar, resizer, tabs (Terne/Fano/Tabella), bottone chiudi, stili terne, fano-btn, zerodiv-btn, stili mobile della calcolatrice.

| # | Test | PC | Mobile |
|---|---|---|---|
| 4.1 | La sidebar è chiusa (larghezza 0) all'avvio | 🖥️ | 📱 |
| 4.2 | Cliccando il pulsante `▦` (database) nella dock, la sidebar si apre con animazione fluida | 🖥️ | 📱 |
| 4.3 | La sidebar ha effetto vetro (glassmorphism): sfondo semi-trasparente con blur | 🖥️ | 📱 |
| 4.4 | La linea verticale neon (gradiente blu) è visibile sul bordo sinistro della sidebar aperta | 🖥️ | 📱 |
| 4.5 | Le tabs "Terne" e "Tabella" sono cliccabili e cambiano il pannello visualizzato | 🖥️ | 📱 |
| 4.6 | La tab attiva ha bordo inferiore blu e sfondo con sfumatura | 🖥️ | 📱 |
| 4.7 | Il resizer (barra blu verticale) permette di ridimensionare la sidebar trascinandola | 🖥️ | — |
| 4.8 | **MOBILE:** Il resizer è nascosto; la sidebar si apre a schermo intero | — | 📱 |
| 4.9 | **MOBILE:** Il bottone `×` di chiusura sidebar è visibile e funzionante | — | 📱 |
| 4.10 | I bottoni terna (es. `e1·e2·e3`) sono visibili come chip con bordo colorato | 🖥️ | 📱 |
| 4.11 | Il clic su un bottone terna lo evidenzia in blu e isola la terna nel grafico 3D | 🖥️ | 📱 |
| 4.12 | **MOBILE:** La calcolatrice ha `top: 130px`, non copre la barra H/O/S, e non supera la dock in basso | — | 📱 |
| 4.13 | **MOBILE:** Il padding della `.calc-body` si riduce (da 12px a 6px) per guadagnare spazio | — | 📱 |
| 4.14 | **MOBILE:** I tasti della tastiera calcolatrice riempiono uniformemente 6 righe nella griglia | — | 📱 |

---

## 5. `css/table.css`

Copre: tabella moltiplicativa sedenioni, header sticky, colonna fissa, evidenziazioni fano, hint in basso.

| # | Test | PC | Mobile |
|---|---|---|---|
| 5.1 | Aprendo la tab "Tabella" nella sidebar, la tabella 17×17 è visibile | 🖥️ | 📱 |
| 5.2 | Scorrendo la tabella, la riga di intestazione rimane fissa (sticky) | 🖥️ | 📱 |
| 5.3 | Scorrendo orizzontalmente, la prima colonna rimane fissa (sticky) | 🖥️ | 📱 |
| 5.4 | L'angolo in alto a sinistra (intersezione header riga + colonna) rimane sempre sopra tutto | 🖥️ | 📱 |
| 5.5 | Cliccando una cella **interna** della tabella, la terna corrispondente viene isolata nel grafico 3D | 🖥️ | 📱 |
| 5.6 | Cliccando un'**intestazione** (header) di riga o colonna, vengono evidenziate tutte le terne collegate | 🖥️ | 📱 |
| 5.7 | Dopo aver selezionato un piano Fano, le celle della tabella mostrano `fano-selected` (bordo bianco) e `fano-dimmed` (grigio) | 🖥️ | 📱 |
| 5.8 | Il testo in basso "Convenzione: Colonna (Sx) × Riga (Alto)" è visibile con sfondo scuro | 🖥️ | 📱 |
| 5.9 | **PC:** Tenendo `Ctrl` + scroll del mouse sulla tabella, si esegue lo zoom | 🖥️ | — |
| 5.10 | **MOBILE:** Due dita sulla tabella eseguono il pinch-to-zoom | — | 📱 |

---

## 6. `css/calculator.css`

Copre: il modale calcolatrice (`#calc-modal`), display, tastiera, variabili, tasti shift, history overlay, steps overlay, kernel overlay, menu formule, overlay divisori zero.

| # | Test | PC | Mobile |
|---|---|---|---|
| 6.1 | Cliccando il pulsante calcolatrice nella dock, appare il pannello HUD in vetro | 🖥️ | 📱 |
| 6.2 | Il pannello ha bordo superiore blu spesso (3px) e sfondo quasi opaco | 🖥️ | 📱 |
| 6.3 | Il display (campo espressione) mostra il testo allineato a destra | 🖥️ | 📱 |
| 6.4 | Il risultato (`#result-display`) è verde e in monospace | 🖥️ | 📱 |
| 6.5 | I tasti numerici (0–9) hanno sfondo scuro (#1a1a1a), i tasti operatori (#2a2a2a) | 🖥️ | 📱 |
| 6.6 | Il tasto `=` (verde) e il tasto `⌫` (rosso scuro) hanno colori distinti | 🖥️ | 📱 |
| 6.7 | Premendo **Shift**, i tasti mostrano le funzioni secondarie (inv, conj, norm, ecc.) | 🖥️ | 📱 |
| 6.8 | Il tasto Shift attivo diventa giallo-dorato | 🖥️ | 📱 |
| 6.9 | I tab "Var A/B/C/D" nella vista variabili sono cliccabili e cambiano la griglia | 🖥️ | 📱 |
| 6.10 | La barra tabs "Formule ▲ / a·b=0" è visibile sopra la tastiera | 🖥️ | — |
| 6.11 | **MOBILE:** La barra tabs "Formule / a·b=0" è **nascosta** (display: none) | — | 📱 |
| 6.12 | Aprendo la cronologia (icona orologio), l'overlay scorre da destra | 🖥️ | 📱 |
| 6.13 | Aprendo i Passaggi (Step-by-Step), l'overlay copre tutta la calcolatrice | 🖥️ | 📱 |
| 6.14 | Aprendo l'overlay Kernel, lo sfondo è verde scuro e il testo verde chiaro | 🖥️ | 📱 |
| 6.15 | Aprendo i Divisori Zero, l'overlay rosso scuro copre tutta la calcolatrice | 🖥️ | 📱 |
| 6.16 | Il menu Formule (dropdown) appare sopra la tab "Formule" e mostra i 5 esempi | 🖥️ | — |
| 6.17 | **MOBILE:** Il menu Formule appare dal basso (sopra la dock) centrato | — | 📱 |
| 6.18 | L'`.icon-btn` di cronologia e pop-out sono nella posizione corretta (angolo in alto a sx) | 🖥️ | 📱 |
| 6.19 | **PC:** Il pulsante pop-out (apri in nuova finestra) è visibile | 🖥️ | — |
| 6.20 | **MOBILE:** Il pulsante pop-out è nascosto; al suo posto c'è l'icona "Variabili" | — | 📱 |

---

## 7. `js/data.js`

Contiene i dati statici: tabella di moltiplicazione (`tableLookup`), liste terne (`POSITIVE_TRIPLETS`), dati divisori zero, ecc.

| # | Test | PC | Mobile |
|---|---|---|---|
| 7.1 | Aprire la console e digitare `tableLookup[1][2]` — deve restituire `{i: 3, s: 1}` (o simile) senza errori | 🖥️ | 📱 |
| 7.2 | Digitare `POSITIVE_TRIPLETS.length` nella console — deve restituire `35` | 🖥️ | 📱 |
| 7.3 | Il grafico 3D carica tutte le 35 terne (visibili cliccando "Terne (35)" nella sidebar) | 🖥️ | 📱 |
| 7.4 | La tabella 17×17 si popola correttamente (nessuna cella vuota o `undefined`) | 🖥️ | 📱 |

---

## 8. `js/algebra.js`

Contiene la logica algebrica di supporto (es. funzioni di calcolo, normalizzazione). Viene caricato come script normale, dopo `data.js` e `main.js`.

| # | Test | PC | Mobile |
|---|---|---|---|
| 8.1 | Aprire la console: nessun `ReferenceError` all'avvio relativo ad algebra | 🖥️ | 📱 |
| 8.2 | Eseguire un calcolo nella calcolatrice (es. `a*b`) con variabili non zero — il risultato è corretto | 🖥️ | 📱 |
| 8.3 | Eseguire `inv(a)` con `a = e1` (valore 1 in posizione 1) — deve restituire il contrario dell'inverso sedenionico | 🖥️ | 📱 |
| 8.4 | Verificare nella console che `tableLookup` sia accessibile quando viene usato dall'algebra (nessun crash silenzioso) | 🖥️ | 📱 |

---

## 9. `js/scene.js`

Inizializza la scena Three.js: telecamera, renderer, luci, materiali delle sfere, shader neon.

| # | Test | PC | Mobile |
|---|---|---|---|
| 9.1 | Il canvas 3D occupa tutto lo spazio del `#canvas-container` | 🖥️ | 📱 |
| 9.2 | Le sfere hanno materiale blu-grigio di default, la sfera centrale (e8) è più luminosa | 🖥️ | 📱 |
| 9.3 | Le linee neon animano con luce che scorre (visibile con animazione non in pausa) | 🖥️ | 📱 |
| 9.4 | Ridimensionando la finestra del browser, il canvas si adatta senza deformare la scena | 🖥️ | 📱 |
| 9.5 | I controlli OrbitControls funzionano: rotazione con click+trascina, zoom con scroll | 🖥️ | — |
| 9.6 | **MOBILE:** Rotazione con un dito, zoom con due dita (pinch) | — | 📱 |

---

## 10. `js/graph.js`

Gestisce la visualizzazione 3D: aggiornamento colori cicli, isolamento terne, camera animation, piani Fano.

| # | Test | PC | Mobile |
|---|---|---|---|
| 10.1 | Cliccando su un **bottone terna** nella sidebar, solo quella terna rimane luminosa nel grafico | 🖥️ | 📱 |
| 10.2 | Cliccando un **piano Fano** nella sidebar, il grafico mostra le 7 terne del piano con la camera che ruota | 🖥️ | 📱 |
| 10.3 | Cliccando **"Reset Vista"** nel menu impostazioni, la camera torna alla posizione iniziale | 🖥️ | 📱 |
| 10.4 | Cliccando il pulsante **"Mostra tutto"** (occhio), tutte le terne tornano visibili | 🖥️ | 📱 |
| 10.5 | Cliccando una **sfera** nel grafico (click rapido), la sfera viene aggiunta alla selezione per la chiusura algebrica | 🖥️ | 📱 |
| 10.6 | Tenendo premuto su una sfera (hold), vengono evidenziate tutte le connessioni di quella sfera | 🖥️ | 📱 |
| 10.7 | Cambiando algebra (H/O/S), il grafico mostra solo le sfere e le terne dell'algebra selezionata | 🖥️ | 📱 |

---

## 11. `js/table.js`

Gestisce la generazione HTML della tabella moltiplicativa e le interazioni click su celle/header.

| # | Test | PC | Mobile |
|---|---|---|---|
| 11.1 | Aprendo la tab "Tabella" nella sidebar, la tabella appare con intestazioni blu | 🖥️ | 📱 |
| 11.2 | Passando da Sedenioni (S) a Quaternioni (H), la tabella si restringe a 4×4 | 🖥️ | 📱 |
| 11.3 | Passando a Ottetti (O), la tabella diventa 8×8 | 🖥️ | 📱 |
| 11.4 | Il click su un'intestazione evidenzia la riga/colonna e isola le terne connesse nel grafico | 🖥️ | 📱 |
| 11.5 | Il click su una cella interna isola la terna specifica nel grafico 3D | 🖥️ | 📱 |
| 11.6 | Cliccando un piano Fano, le celle della tabella mostrano stato `fano-selected` e `fano-dimmed` | 🖥️ | 📱 |

---

## 12. `js/sidebar.js`

Gestisce l'apertura/chiusura sidebar, tabs, resizer, bottone chiudi, click sui bottoni terna/fano.

| # | Test | PC | Mobile |
|---|---|---|---|
| 12.1 | Il clic sul pulsante `▦` della dock apre la sidebar con animazione | 🖥️ | 📱 |
| 12.2 | Un secondo clic sullo stesso pulsante chiude la sidebar | 🖥️ | 📱 |
| 12.3 | I tabs Terne/Fano/Tabella cambiano il pannello attivo | 🖥️ | 📱 |
| 12.4 | La tab "Piani Fano" è visibile solo quando si è in modalità Sedenioni (S) | 🖥️ | 📱 |
| 12.5 | **PC:** Il resizer risponde al trascinamento e la sidebar cambia larghezza | 🖥️ | — |
| 12.6 | **MOBILE:** Il bottone `×` (close) nella sidebar chiude il pannello | — | 📱 |
| 12.7 | Nella sidebar con tab "Terne": il numero di terne nella tab corrisponde all'algebra selezionata (1/7/35) | 🖥️ | 📱 |
| 12.8 | I bottoni terna hanno il bordo sinistro colorato (ogni terna ha un colore distinto) | 🖥️ | 📱 |

---

## 13. `js/ui.js`

Gestisce: menu impostazioni (sfondo, griglia, help), slider velocità/opacità, play/pause, logica sfondi/stelle.

| # | Test | PC | Mobile |
|---|---|---|---|
| 13.1 | Il bottone ⚙️ apre il menu impostazioni | 🖥️ | 📱 |
| 13.2 | Il bottone "Sfondo" cicla tra 6 sfondi: Slate Mist → Cyber Gradient → Blueprint → Stellato → Dark Default → Water Flow | 🖥️ | 📱 |
| 13.3 | Lo sfondo "Stellato" mostra puntini bianchi che ruotano lentamente | 🖥️ | 📱 |
| 13.4 | Lo sfondo "Blueprint" mostra una griglia di puntini su sfondo blu scuro | 🖥️ | 📱 |
| 13.5 | Il bottone "Griglia" attiva/disattiva la griglia 3D orizzontale nella scena | 🖥️ | 📱 |
| 13.6 | Il bottone "Guida" apre il modal di aiuto | 🖥️ | 📱 |
| 13.7 | La guida ha 5 pagine navigabili con "Avanti" e "Indietro" e indicatori a pallini | 🖥️ | 📱 |
| 13.8 | Cliccando fuori dalla guida (overlay scuro), si chiude | 🖥️ | 📱 |
| 13.9 | Premendo **Spazio** (senza focus su un input), l'animazione si mette in pausa | 🖥️ | — |
| 13.10 | Premendo **Invio**, la camera torna alla posizione iniziale | 🖥️ | — |
| 13.11 | Premendo **↑/↓**, il valore dello slider velocità aumenta/diminuisce di 0.1 | 🖥️ | — |
| 13.12 | Trascinando uno slider, il pannello impostazioni diventa semitrasparente (dimmed) | 🖥️ | 📱 |
| 13.13 | Dopo aver rilasciato lo slider, il pannello torna opaco | 🖥️ | 📱 |

---

## 14. `js/mobile.js`

Gestisce le gesture swipe del carousel mobile, la navigazione tra pannelli (Formule/Calc/Divisori).

| # | Test | PC | Mobile |
|---|---|---|---|
| 14.1 | **MOBILE ONLY:** Con la calcolatrice aperta, strisciando a sinistra si va al pannello "Divisori dello zero" | — | 📱 |
| 14.2 | **MOBILE ONLY:** Strisciando a destra si va al pannello "Formule" | — | 📱 |
| 14.3 | **MOBILE ONLY:** Le frecce `«` e `»` nella navigation bar cambiano pannello senza usare le gesture | — | 📱 |
| 14.4 | **MOBILE ONLY:** La navigazione swipe non interferisce con lo scroll verticale dei pannelli | — | 📱 |
| 14.5 | **MOBILE ONLY:** Il trascinamento verticale della calcolatrice funziona senza triggerare lo swipe orizzontale | — | 📱 |
| 14.6 | **PC:** Ridimensionando a < 769px, il carousel si attiva; ritornando > 769px, i pannelli si resettano in posizione statica | 🖥️ | — |
| 14.7 | **MOBILE ONLY:** Cambiando pannello dal tasto "Formule" nella navigation bar, compare l'icona `?` (spiegazione) | — | 📱 |
| 14.8 | **MOBILE ONLY:** Nel pannello "Divisori zero", compare l'icona `?` specifica per i divisori | — | 📱 |

---

## 15. `js/parser.js`

Il motore matematico: parsing espressioni, operazioni sedenioniche, gestione variabili.

| # | Test | PC | Mobile |
|---|---|---|---|
| 15.1 | Digitare `a*b` nella calcolatrice con a e b non-zero → il risultato compare in verde | 🖥️ | 📱 |
| 15.2 | Digitare `a+b` → la somma componente per componente è corretta | 🖥️ | 📱 |
| 15.3 | Digitare `inv(a)` con a non-zero → il risultato è l'inverso sedenionico (verificabile con `a*inv(a)` = 1) | 🖥️ | 📱 |
| 15.4 | Digitare `norm(a)` → restituisce la norma (numero reale) | 🖥️ | 📱 |
| 15.5 | Digitare `[a,b]` → il commutatore (non zero per quaternioni non paralleli) | 🖥️ | 📱 |
| 15.6 | Digitare `[a,b,c]` → l'associatore (non zero per ottetti non banali) | 🖥️ | 📱 |
| 15.7 | Digitare `a == b` → risposta `TRUE` se a e b sono uguali, `FALSE` altrimenti | 🖥️ | 📱 |
| 15.8 | Digitare `a =? 0` → risposta `TRUE` se a è il vettore zero | 🖥️ | 📱 |
| 15.9 | Digitare `a=5` (assegnazione) → la variabile a assume il valore (5,0,0,...) | 🖥️ | 📱 |
| 15.10 | Digitare `e_(1)` → restituisce il vettore base e1 | 🖥️ | 📱 |
| 15.11 | Digitare `1/a` → errore o risultato di divisione sedenica | 🖥️ | 📱 |
| 15.12 | Parentesi sbilanciate (es. `a*(b+c`) → il display mostra "Parentesi non bilanciate" in giallo | 🖥️ | 📱 |

---

## 16. `js/calculator/calculator_core.js`

Valutazione in tempo reale, `calcAction`, gestione della cronologia.

| # | Test | PC | Mobile |
|---|---|---|---|
| 16.1 | Digitando nel campo espressione, il risultato si aggiorna **in tempo reale** senza premere `=` | 🖥️ | 📱 |
| 16.2 | Premendo `=`, il risultato viene confermato e aggiunto alla **cronologia** | 🖥️ | 📱 |
| 16.3 | Premendo Invio da tastiera fisica, si valuta l'espressione | 🖥️ | — |
| 16.4 | Il campo espressione vuoto mostra `0` nel risultato | 🖥️ | 📱 |
| 16.5 | Espressione con errore (es. `a**b`) → il risultato mostra `Err` in rosso | 🖥️ | 📱 |
| 16.6 | Espressione ambigua (es. `a*b*c` senza parentesi tra ottetti) → mostra "Ambiguo, usa le parentesi" in giallo | 🖥️ | 📱 |

---

## 17. `js/calculator/calculator_history.js`

Cronologia risultati (log).

| # | Test | PC | Mobile |
|---|---|---|---|
| 17.1 | Cliccando l'icona orologio, si apre la cronologia da destra | 🖥️ | 📱 |
| 17.2 | Ogni calcolo confermato con `=` appare nella cronologia | 🖥️ | 📱 |
| 17.3 | Cliccando una voce della cronologia, l'espressione `Ans1`, `Ans2`... viene inserita nel campo | 🖥️ | 📱 |
| 17.4 | Il pulsante "Pulisci" (icona cestino) svuota la cronologia e azzera i valori `Ans` | 🖥️ | 📱 |
| 17.5 | Cliccando `×` nella cronologia, si torna alla calcolatrice | 🖥️ | 📱 |

---

## 18. `js/calculator/calculator_input.js`

Gestione tastiera virtuale, shift, parentesi smart, highlight delle parentesi.

| # | Test | PC | Mobile |
|---|---|---|---|
| 18.1 | Premendo un tasto numerico, il carattere appare nel campo espressione alla posizione del cursore | 🖥️ | 📱 |
| 18.2 | Il tasto `()` inserisce `(` se non ci sono parentesi aperte, inserisce `)` se c'è già una parentesi aperta | 🖥️ | 📱 |
| 18.3 | Shift + `()` → inserisce `[` o `]` (commutatore/associatore) | 🖥️ | 📱 |
| 18.4 | Con il cursore vicino a una parentesi, le due parentesi corrispondenti si **evidenziano in blu** | 🖥️ | 📱 |
| 18.5 | Con parentesi non bilanciata, la parentesi isolata si evidenzia in **rosso** | 🖥️ | 📱 |
| 18.6 | Il tasto `⌫` cancella il carattere a sinistra del cursore | 🖥️ | 📱 |
| 18.7 | Shift + `⌫` → cancella tutto il campo (AC) | 🖥️ | 📱 |
| 18.8 | Tenendo premuto `=` per > 400ms, si apre il menu popup (Scrivi = / =? / Calcola) | 🖥️ | 📱 |
| 18.9 | Premendo un tasto lettera sulla tastiera fisica, la calcolatrice si apre e il carattere viene inserito | 🖥️ | — |

---

## 19. `js/calculator/calculator_kernel.js`

Calcolo del Kernel (spazio annullatore).

| # | Test | PC | Mobile |
|---|---|---|---|
| 19.1 | Digitare `Ker(a)` con a non-zero e premere `=` → si apre il pannello verde Kernel | 🖥️ | 📱 |
| 19.2 | Il pannello Kernel mostra la formula e gli input parametrici | 🖥️ | 📱 |
| 19.3 | Modificando un parametro nel kernel, il vettore generato si aggiorna | 🖥️ | 📱 |
| 19.4 | I bottoni `a b c d` salvano il vettore kernel nella variabile corrispondente | 🖥️ | 📱 |
| 19.5 | Il pulsante `×` chiude il pannello kernel e torna alla calcolatrice | 🖥️ | 📱 |

---

## 20. `js/calculator/calculator_popout.js`

Pop-out della calcolatrice in una finestra separata.

| # | Test | PC | Mobile |
|---|---|---|---|
| 20.1 | **PC ONLY:** Cliccando l'icona pop-out (freccia diagonale), si apre la calcolatrice in una nuova finestra | 🖥️ | — |
| 20.2 | **PC ONLY:** Chiudendo la finestra pop-out, la calcolatrice nella finestra principale torna disponibile | 🖥️ | — |
| 20.3 | **MOBILE:** Il pulsante pop-out non è visibile | — | 📱 |

---

## 21. `js/calculator/calculator_steps.js`

Overlay Step-by-Step dei passaggi di calcolo.

| # | Test | PC | Mobile |
|---|---|---|---|
| 21.1 | Shift + `=` (o lunga pressione → "Calcola") apre l'overlay dei passaggi | 🖥️ | 📱 |
| 21.2 | L'overlay mostra ogni passaggio del calcolo in righe alternate (bianche/grigie) | 🖥️ | 📱 |
| 21.3 | Il pulsante `×` chiude l'overlay e torna alla calcolatrice | 🖥️ | 📱 |
| 21.4 | L'overlay è scrollabile se i passaggi sono molti | 🖥️ | 📱 |

---

## 22. `js/calculator/calculator_ui.js`

Setup griglia variabili, aggiornamento indicatori, cambio view (tastiera/variabili).

| # | Test | PC | Mobile |
|---|---|---|---|
| 22.1 | La griglia variabili (16 input da e0 a e15) si popola correttamente all'apertura | 🖥️ | 📱 |
| 22.2 | Modificando un valore nella griglia, la variabile si aggiorna in tempo reale | 🖥️ | 📱 |
| 22.3 | I tasti freccia (↑↓←→) navigano tra le celle della griglia | 🖥️ | — |
| 22.4 | Il bottone "Azzera" resetta tutti i valori della variabile corrente a 0 | 🖥️ | 📱 |
| 22.5 | "Rand ℍ" genera valori random solo per le prime 4 componenti (0-3) | 🖥️ | 📱 |
| 22.6 | "Rand 𝕆" genera valori random per le prime 8 componenti (0-7) | 🖥️ | 📱 |
| 22.7 | "Rand 𝕊" genera valori random per tutte le 16 componenti (0-15) | 🖥️ | 📱 |
| 22.8 | I tab variabili A/B/C/D che hanno valori non-zero mostrano un **pallino verde** sull'icona nella tastiera | 🖥️ | 📱 |
| 22.9 | Cliccando un tab variabile già attivo, si torna alla tastiera | 🖥️ | 📱 |
| 22.10 | **MOBILE:** Il pulsante "Variabili" (icona ≡) apre la vista griglia | — | 📱 |
| 22.11 | **PC:** Il pulsante "← Torna alla tastiera" nella vista variabili è visibile e funzionante | 🖥️ | — |

---

## 23. `js/calculator/calculator_zerodiv.js`

Generazione e interazione con i divisori dello zero (overlay rosso).

| # | Test | PC | Mobile |
|---|---|---|---|
| 23.1 | Cliccando il tab "a·b=0" (con i sedenioni attivi), si apre l'overlay rosso | 🖥️ | 📱 |
| 23.2 | L'overlay mostra una griglia 3 colonne con gli 84 divisori dello zero | 🖥️ | 📱 |
| 23.3 | Cliccando un divisore, le variabili A e B vengono impostate automaticamente | 🖥️ | 📱 |
| 23.4 | Cliccando un divisore, il grafico 3D si aggiorna mostrando il piano di Fano corrispondente | 🖥️ | 📱 |
| 23.5 | Il pulsante `?` apre la guida a 4 pagine dei divisori dello zero | 🖥️ | 📱 |
| 23.6 | I 4 pulsanti "Indietro/Avanti" della guida navigano le pagine correttamente | 🖥️ | 📱 |
| 23.7 | Il pulsante `×` (rosso) chiude l'overlay e torna alla calcolatrice | 🖥️ | 📱 |
| 23.8 | In modalità Quaternioni o Ottetti (non Sedenioni), il tab "a·b=0" non è visibile | 🖥️ | 📱 |

---

## 24. `js/ions32.js`

Visualizzazione dei Trigintaduenioni (32-ioni, funzione beta).

| # | Test | PC | Mobile |
|---|---|---|---|
| 24.1 | Cliccando il pulsante "𝕋 32-ioni (beta)" nel menu impostazioni, il grafico 3D cambia in modalità 32-ioni | 🖥️ | 📱 |
| 24.2 | In modalità 32-ioni, i nodi del grafo sono diversi (struttura diversa) | 🖥️ | 📱 |
| 24.3 | Cliccando un nodo in modalità 32-ioni, il grafico si ricalcola con quel nodo al centro | 🖥️ | 📱 |
| 24.4 | Cliccando nuovamente "𝕋 32-ioni" si esce dalla modalità e si torna alla vista sedenica | 🖥️ | 📱 |
| 24.5 | Cambiando algebra (H/O/S) mentre si è in modalità 32-ioni, si esce dalla modalità automaticamente | 🖥️ | 📱 |

---

## 25. Test di Regressione Globale

Questi test verificano che il comportamento complessivo del refactoring sia identico all'originale.

| # | Test | PC | Mobile |
|---|---|---|---|
| 25.1 | Aprire l'originale `vers 20.14 (riferimento).html` e il nuovo `index.html` fianco a fianco — ogni funzionalità testata deve avere lo stesso aspetto visivo | 🖥️ | 📱 |
| 25.2 | Eseguire la stessa espressione (es. `[a,b,c]`) su entrambe le versioni con le stesse variabili → i risultati devono coincidere | 🖥️ | 📱 |
| 25.3 | Verificare che la **chiusura algebrica** (seleziona 2 sfere → genera chiusura) produca la stessa animazione e lo stesso risultato | 🖥️ | 📱 |
| 25.4 | La console del browser **non deve mostrare nessun errore** durante l'uso normale | 🖥️ | 📱 |
| 25.5 | Tutti gli sfondi (6 temi) hanno lo stesso aspetto nelle due versioni | 🖥️ | 📱 |
| 25.6 | Il ciclo Formule (es. `[a,b] ≠ 0`) esegue la demo correttamente: imposta variabili random, carica l'espressione e calcola | 🖥️ | 📱 |
