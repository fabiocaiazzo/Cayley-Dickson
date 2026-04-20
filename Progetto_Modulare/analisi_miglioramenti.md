# Analisi e Piano di Miglioramento — Cayley-Dickson App

> **Data analisi:** 2026-04-20  
> **Versione di riferimento:** v2026.04.20  
> **Scope:** `Progetto_Modulare/www/`  
>
> Per ogni miglioramento sono indicate quattro metriche:
> - 🔧 **Difficoltà** — 1 (triviale) → 5 (chirurgia maggiore)
> - 📈 **Beneficio** — Basso / Medio / Alto / Critico
> - ⏱️ **Tempo stimato** — in ore di lavoro
> - ✅ **Necessità** — Facoltativo / Consigliato / Necessario / Urgente

---

## Diagramma Dipendenze tra Ondate

```
Ondata 1: Bug critici JS (zero dipendenze esterne)
   │
Ondata 2: CSS standalone (zero dipendenze da JS)
   │
Ondata 3: Riorganizzazione dati (dipende da Ondata 1)
   │
Ondata 4: Bug mobile (dipende da Ondate 1 + 2)
   │
Ondata 5: Architettura e pattern JS (dipende da Ondate 1 + 3)
   │
Ondata 6: Contenuti — Guida e Traduzioni (dipende da Ondata 5)
   │
Ondata 7: Grandi refactoring strutturali (dipende da Ondate 3 + 5)
```

---

## Ondata 1 — Bug JS Critici (zero dipendenze)

Sono i fix più urgenti: errori di comportamento visibili all'utente o bombe a orologeria nel codice. Non dipendono da nessuna altra modifica e possono essere fatti in qualsiasi ordine.

---

### 1.1 — Bug: segno `"-"` non segnalato come errore negli input numerici

**File:** `js/3d/rotation.js` (riga 265), `js/calculator/calculator_ui.js` (riga 57)

**Descrizione:**  
La regex di validazione `^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$` è applicata a input di tipo `type="number"` (assi di rotazione x/y/z, angolo, quaternione). Quando l'utente digita `-` in un campo `type="number"`, il browser restituisce `el.value = ""` (stringa vuota) perché considera `-` un'inizializzazione parziale valida di un numero negativo. Questo fa sì che la condizione `rawVal !== ''` sia `false`, annullando il check: nessun errore viene mostrato. Al contrario, digitando `+`, alcuni browser restituiscono `el.value = "+"` (stringa non vuota), che fa fallire la regex, mostrando correttamente l'errore.

**Fix:**  
Normalizzare il comportamento accettando `-` e `+` come **stati intermedi validi** (in fase di digitazione), rimuovendo il segnale di errore anche per `+` solo quando è il primo carattere. In alternativa, cambiare gli input da `type="number"` a `type="text"` con `inputmode="decimal"` (già usato nella griglia coefficienti) per avere `el.value` consistente su tutti i browser.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Medio | 30 min | **Necessario** |

---

### 1.2 — Bug: grafico 3D incoerente con il titolo dopo click su prodotto con `1` o `-1`

**File:** `js/ui/table.js` (righe 25–93)

**Descrizione:**  
In `activateTripletFromTable(r, c)`, il titolo viene aggiornato (`titleTextElem.innerHTML = ...`) prima del check `if (r === 0 || c === 0 || r === c) return;`. L'early return evita l'aggiornamento del grafico 3D, ma non resetta quello esistente. Risultato: il titolo mostra ad es. `1 · e2 = e2`, ma il grafico 3D mostra ancora l'ultima terna selezionata in precedenza.

Il caso `r === c` (es. `e1 · e1 = -1`) ha lo stesso problema: il titolo mostra il prodotto corretto, ma il grafico rimane invariato.

**1 e -1 non esistono come nodi in PG(3,2)**, quindi non è possibile mostrarli nel grafico 3D. La soluzione è:
1. Dopo aver aggiornato il titolo, se `r === 0 || c === 0 || r === c`, **resettare la vista 3D a stato neutro** (tutti i nodi visibili, nessuna terna evidenziata), invece di lasciare lo stato precedente.
2. Opzionalmente, mostrare un messaggio nel pannello 3D tipo *"1 non è un nodo del grafo"*.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Alto | 45 min | **Necessario** |

---

### 1.3 — Bug: variabile locale `t` oscura l'import `t()` (i18n) in `calculator_zerodiv.js`

**File:** `js/calculator/calculator_zerodiv.js` (riga 180)

**Descrizione:**  
La funzione di traduzione `t` è importata da `i18n.js` (riga 67), ma alla riga 180 viene dichiarata una variabile locale con lo stesso nome:

```js
const t = POSITIVE_TRIPLETS.find(tr => tr.includes(zd[0]) && tr.includes(zd[1]));
```

Questo **oscura l'import** `t` per tutto il resto dello scope della funzione `renderOverlayContent`. Qualsiasi chiamata a `t('chiave_traduzione')` dopo riga 180 dentro quella funzione chiamerebbe invece il risultato di `POSITIVE_TRIPLETS.find(...)` (che è un array o `undefined`), causando un errore silenzioso.

**Fix:** Rinominare la variabile locale in `triplet` (o `foundTriplet`).

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Critico | 5 min | **Urgente** |

---

### 1.4 — Bug: proprietà duplicate su bottoni tab in `calculator_zerodiv.js`

**File:** `js/calculator/calculator_zerodiv.js` (righe 468–472)

**Descrizione:**  
Nella funzione `renderOverlayContent`, i bottoni tab vengono creati con questa sequenza:

```js
btn.style.minWidth = "0"; // Impedisce al contenuto di forzare l'allargamento
btn.style.textAlign = "center";
btn.style.boxSizing = "border-box";
btn.style.minWidth = "0"; // Permette al bottone di restringersi se necessario   ← DUPLICATO
btn.style.textAlign = "center";                                                   ← DUPLICATO
```

Due coppie di `minWidth` e `textAlign` identiche vengono assegnate consecutivamente. Non causa un bug funzionale, ma indica manutenzione disorganizzata.

**Fix:** Rimuovere le righe duplicate (471–472).

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Basso (pulizia) | 2 min | Consigliato |

---

### 1.5 — Bug: `import` dopo codice eseguibile in `calculator_zerodiv.js`

**File:** `js/calculator/calculator_zerodiv.js` (righe 65–71)

**Descrizione:**  
ES modules permette sintatticamente di scrivere `import` in qualsiasi posizione, ma per leggibilità e manutenibilità è una best practice mettere **tutti gli import in cima al file**. In `calculator_zerodiv.js` ci sono import "spezzati" nel mezzo del file (righe 65–71), dopo che alcune costanti e closure sono già state definite. Questo rende difficile capire le dipendenze del modulo senza scorrere l'intero file.

**Fix:** Spostare tutti gli import nelle prime righe del file.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Medio (leggibilità) | 10 min | Consigliato |

---

### 1.6 — Magic numbers senza nome

**File:** `js/calculator/calculator_input.js`, `js/ui/mobile.js`, `js/3d/rotation.js`

**Descrizione:**  
Valori "magici" numerici sparsi nel codice senza costanti nominate:
- `400` ms (soglia long press) in `calculator_input.js` riga 87
- `0.15` (soglia swipe) in `mobile.js` riga 296–297
- `8` e `40` px (soglie direzione swipe) in `mobile.js` righe 259–270
- `500` ms (timer bootstrap listener) in `calculator_input.js` riga 423

Rendono il codice opaco: modificare la soglia del long press richiede di sapere dove cercare.

**Fix:** Definire costanti nel file `js/core/constants.js`:

```js
export const LONG_PRESS_DELAY_MS = 400;
export const SWIPE_THRESHOLD_RATIO = 0.15;
export const SWIPE_DIRECTION_THRESHOLD_PX = 8;
export const SWIPE_DIRECTION_CORRECTION_PX = 40;
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Medio | 30 min | Consigliato |

---

## Ondata 2 — CSS Standalone (zero dipendenze da JS)

Queste modifiche riguardano solo file CSS e possono essere fatte in parallelo con qualsiasi altra ondata.

---

### 2.1 — Bug: testo piani di Fano troppo largo su mobile (database)

**File:** `css/sidebar.css`, `css/calc/calc-layout.css`

**Descrizione:**  
I bottoni del database (tab "Piani Fano" e "PG(3,2)") mostrano il contenuto intero di un piano, ad es. `{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}`. Su schermi mobile (< 420 px) il testo fuoriesce dal bottone o il bottone diventa troppo piccolo per essere leggibile.

**Fix CSS:** Aggiungere `font-size` ridotto per mobile + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap` sui selettori `.fano-btn-32` e `.pg32-btn-cell`:

```css
@media (max-width: 480px) {
    .fano-btn-32,
    .pg32-btn-cell {
        font-size: 9px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 4px 3px;
    }
}
```

In alternativa, valutare l'uso di testo abbreviato già in fase di rendering JS (es. mostrare solo i primi 5 elementi con `...`).

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Alto (UX mobile) | 20 min | **Necessario** |

---

### 2.2 — Refactoring: split di `calc-layout.css` (843 righe)

**File:** `css/calc/calc-layout.css`

**Descrizione:**  
Il file gestisce sezioni molto diverse tra loro: modale principale, carousel mobile, overlay divisori dello zero, overlay spiegazione, overlay ricerca, stili step-by-step. Sono già state create le cartelle `css/calc/` con file dedicati (`calc-keypad.css`, `calc-history.css`, ecc.), ma `calc-layout.css` è rimasto monolitico.

**Fix — Split proposto:**

| File da creare | Contenuto | Righe stimate |
|----------------|-----------|---------------|
| `calc-modal.css` | Posizione, dimensioni, header, animazioni apertura modale | ~150 |
| `calc-carousel.css` | `#carousel-track`, `.carousel-panel`, swipe nav, media queries | ~180 |
| `calc-zerodiv-ui.css` | `#zerodiv-overlay`, `.zerodiv-grid-btn`, `.zerodiv-tab`, stili search/explain panel | ~220 |
| `calc-steps.css` | `.steps-panel`, `.step-line`, `.step-sum-box`, `.step-expl-*` | ~120 |
| `calc-layout.css` (residuo) | Solo stili comuni HUD, `.calc-body`, `.calc-header`, `.icon-btn` | ~170 |

**Aggiornare** `index.html` con i nuovi `<link>`.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Alto (manutenibilità) | 1.5 h | Consigliato |

---

### 2.3 — Refactoring: split di `sidebar.css` (659 righe) e `dock.css` (532 righe)

**File:** `css/sidebar.css`, `css/dock.css`

**Descrizione:**  
- `sidebar.css` mescola stili per: pannello sidebar, tab (triplet/fano/pg32/table), bottoni triplet, bottoni fano, griglia tabella, media queries.
- `dock.css` include stili per: dock principale, dock verticale mobile, bottoni singoli dock, badge, tooltip dock, modal settings, media queries.

**Fix — Split proposto:**

Per `sidebar.css`:
| File | Contenuto |
|------|-----------|
| `sidebar-panel.css` | Layout sidebar, apertura/chiusura, resize handle |
| `sidebar-tabs.css` | Tab buttons, triplet grid, fano grid |
| `sidebar-table.css` | Tabella moltiplicativa, highlight righe/colonne |

Per `dock.css`:
| File | Contenuto |
|------|-----------|
| `dock-layout.css` | Layout base dock + mobile dock |
| `dock-buttons.css` | Stili singoli bottoni, badge, tooltip |
| `dock-settings.css` | Modal impostazioni |

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Medio (manutenibilità) | 2 h | Consigliato |

---

## Ondata 3 — Riorganizzazione Dati (dipende da Ondata 1)

---

### 3.1 — Spostamento dati raw da `ions32.js` a `data.js`

**File:** `js/3d/ions32.js` (righe 15–156), `js/math/data.js`

**Descrizione:**  
`ions32.js` contiene due grandi array di dati puri che non hanno dipendenze comportamentali:
- `TRIPLETS_32` (righe 15–31): 155 terne degli ottetti dei 32-ioni
- `PG32_SETS` (righe 124–156): 30 sottoinsiemi dell'iperpiano proiettivo PG(3,2)

Questi dati sono analoghi a `POSITIVE_TRIPLETS`, `FANO_PLANES` e `ZERO_DIVISORS_RAW` che vivono già in `data.js`. Tenerli in `ions32.js` viola il principio di separazione (dati vs logica 3D) e aumenta il peso del file.

**Fix:**
1. Spostare `TRIPLETS_32` e `PG32_SETS` in `data.js` come export nominati.
2. Importarli in `ions32.js` da `data.js`.
3. Aggiornarli in `calculator_zerodiv.js` se già importati da lì.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 1 | Medio (architettura) | 20 min | Consigliato |

---

### 3.2 — Spostamento stili inline da `calculator_zerodiv.js` a classi CSS

**File:** `js/calculator/calculator_zerodiv.js`, `css/calc/calc-layout.css` (o il nuovo `calc-zerodiv-ui.css`)

**Descrizione:**  
La funzione `renderOverlayContent()` in `calculator_zerodiv.js` contiene decine di assegnazioni `element.style.xxx = yyy` invece di usare classi CSS. Questo distribuisce la presentazione nel JS e rende impossibile:
- Vedere tutti gli stili di un componente in un unico luogo
- Usare DevTools CSS per debug
- Fare override con media query

Esempi di style injection presente:
- `navBar.style.flexDirection = "column"` / `navBar.style.gap = "8px"` / etc.
- `btn.style.fontFamily`, `btn.style.fontSize`, `btn.style.padding`, …
- `label.style.color`, `label.style.fontWeight`, `label.style.letterSpacing`, …

**Fix:** Creare classi CSS dedicate (es. `.zd-navbar`, `.zd-tab-btn`, `.zd-toggle-label`) e rimuovere le assegnazioni inline, mantenendo solo quelle strettamente dinamiche (es. colori che dipendono dallo stato runtime).

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 3 | Alto (manutenibilità + debug) | 2 h | Consigliato |

---

## Ondata 4 — Bug Mobile (dipende da Ondate 1 + 2)

---

### 4.1 — Bug: scroll verticale bloccato nella lista divisori dello zero su mobile

**File:** `js/ui/mobile.js` (righe 301–316, 336–338), `css/calc/calc-layout.css` (righe 264–277)

**Descrizione:**  
Il CSS applica correttamente `touch-action: pan-y` e `overflow-y: auto` a `#zerodiv-content-grid`. Tuttavia, il problema emerge quando:

1. L'utente inizia lo swipe orizzontale (per cambiare pannello carousel) su un elemento fuori dal grid
2. `isSwipingCarousel` viene impostato a `true`
3. Successivamente, se il dito si sposta su `#zerodiv-content-grid` e continua il movimento, `moveCarouselDrag` viene chiamato nel `touchmove` globale
4. Con `{ passive: false }`, se `isHorizontalSwipe === true`, viene chiamato `e.preventDefault()`, bloccando lo scroll verticale nativo

Il check `isValidDragTarget` in riga 301 esclude correttamente `#zerodiv-content-grid` dall'inizio del drag, ma non lo esclude dal *continuare* un drag già iniziato su un altro elemento.

**Fix:**  
Nella funzione `moveCarouselDrag`, prima di chiamare `e.preventDefault()`, verificare che il target corrente del tocco sia ancora un target di drag valido:

```js
if (isHorizontalSwipe) {
    const currentTarget = (e.touches && e.touches[0]) ? 
        document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : null;
    // Non bloccare lo scroll se siamo sopra uno scrollable interno
    const isOverScrollable = currentTarget && (
        currentTarget.closest('#zerodiv-content-grid') ||
        currentTarget.closest('#zd-search-results') ||
        currentTarget.closest('.zd-panel-overlay-style')
    );
    if (!isOverScrollable && e.cancelable) e.preventDefault();
    updateCarouselPositions(swipeCurrentX - swipeStartX, false);
}
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 3 | Critico (UX mobile) | 1 h | **Urgente** |

---

### 4.2 — Bug: pannelli carousel adiacenti non visibili durante lo swipe su mobile

**File:** `css/calc/calc-layout.css` (righe 189–222), `js/ui/mobile.js` (riga 59)

**Descrizione:**  
Durante lo swipe, i pannelli vengono traslati con `translate3d`. Il problema è che `#carousel-track` ha `overflow: hidden`, il che ritagli i pannelli mentre si spostano fuori dalla viewport interna. L'utente non vede il pannello adiacente comparire gradualmente: invece, il pannello corrente scorre e "scompare", poi improvvisamente appare quello nuovo quando il dito viene rilasciato.

Il comportamento atteso è un effetto "scorrimento" con cui entrambi i pannelli sono visibili contemporaneamente durante il drag.

**Fix:**  
Durante il drag attivo, impostare `overflow: visible` sul `#carousel-track` (tramite una classe CSS aggiunta da JS), e ripristinare `overflow: hidden` al termine. Alternativamente, impostare `width` del track a `300%` (tre pannelli affiancati) e usare un singolo translate sul track invece di transform individuali sui pannelli.

```css
#carousel-track.is-dragging {
    overflow: visible;
}
```

```js
// In startCarouselDrag:
track.classList.add('is-dragging');
// In endCarouselDrag:
track.classList.remove('is-dragging');
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Alto (UX mobile) | 45 min | **Necessario** |

---

### 4.3 — UX: etichette `P_1..P_7` non indicative nei divisori dello zero

**File:** `js/calculator/calculator_zerodiv.js` (righe 476–479)

**Descrizione:**  
In modalità Piani di Fano (modo default nei Sedenioni), i bottoni di selezione mostrano `P₁`, `P₂`, … `P₇`. Questi label non sono intuitivi: quale piano è `P₁`? Quale è `P₃`? L'attributo `title` (tooltip) contiene le informazioni corrette (`{e1, e2, e3, e4, e5, e6, e7}`), ma su mobile il tooltip non è accessibile.

La numerazione `P₁..P₇` è arbitraria e non corrisponde a nessuna convenzione matematica conosciuta.

**Fix — opzione A (rapida):** Mostrare il primo elemento del piano nel bottone e usare un tooltip visivo su mobile (popup al touch):

```js
const firstNode = FANO_PLANES[k][0][0]; // primo nodo del piano
btn.innerHTML = `P<sub>${i+1}</sub><br><span style="font-size:9px;">e${firstNode}…</span>`;
```

**Fix — opzione B (definitiva):** Rinominare i piani con una chiave algebrica significativa. Ogni piano di Fano dell'ottetto è identificabile dalla terna che lo "rompe" rispetto al piano base (es. il piano contenente `{1,2,3}` e la moltiplicazione con `e8`). Definire in `data.js` un array `FANO_PLANE_LABELS` con label leggibili, es. `"B₁₂₃"`, `"B₁₄₅"`, ecc., basate sulla terna di octonionic base che "generano" il piano.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Medio (UX) | 45 min | Consigliato |

---

## Ondata 5 — Architettura JS e Pattern (dipende da Ondate 1 + 3)

---

### 5.1 — Anti-pattern: `exports null` riassegnati dall'interno di funzione

**File:** `js/calculator/calculator_zerodiv.js` (righe 59–61, 205, 382)

**Descrizione:**  
Due funzioni vengono esportate come `null` e poi riassegnate all'interno di `updateZeroDivisorUI()`:

```js
export let resetZeroDivisorUI = null;    // ← exportato come null
export let handleZeroDivisorClick = null; // ← exportato come null

// Poi, dentro updateZeroDivisorUI():
resetZeroDivisorUI = function() { ... };
handleZeroDivisorClick = function() { ... };
```

Chi importa `resetZeroDivisorUI` in un altro modulo prima che `updateZeroDivisorUI` sia stato chiamato ottiene `null`. Ad esempio `table.js` importa `resetZeroDivisorUI` e la chiama direttamente — se la tabella viene interagita prima dell'apertura dei divisori dello zero (cosa possibile), la chiamata sarà su `null` e causerà `TypeError: resetZeroDivisorUI is not a function`.

Questo è un accoppiamento nascosto e fragile.

**Fix:** Usare un pattern di indirezione con getter:

```js
// Invece di export let:
let _resetZeroDivisorUI = null;
let _handleZeroDivisorClick = null;

export const resetZeroDivisorUI = (...args) => _resetZeroDivisorUI?.(...args);
export const handleZeroDivisorClick = (...args) => _handleZeroDivisorClick?.(...args);

// Dentro updateZeroDivisorUI():
_resetZeroDivisorUI = function() { ... };
_handleZeroDivisorClick = function() { ... };
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Alto (robustezza) | 30 min | **Necessario** |

---

### 5.2 — Anti-pattern: `setTimeout(..., 500)` per binding eventi in `calculator_input.js`

**File:** `js/calculator/calculator_input.js` (righe 422–461)

**Descrizione:**  
I listener degli eventi (long press per i tasti var, canc, paren, eval) sono bindati con un `setTimeout` di 500 ms. Questa è una soluzione fragile: su dispositivi lenti, 500 ms potrebbero non bastare; su dispositivi veloci è un ritardo inutile che ritarda l'interattività.

Il motivo del timeout è probabilmente che il DOM del calcolatore (parte popout/iframe) non è pronto immediatamente all'importazione del modulo.

**Fix:** Usare un evento custom `calcReady` (o il pattern già presente con `CalcBridge`) per sapere quando il DOM è pronto, e bindare i listener su quell'evento invece che dopo un timer fisso.

```js
// In calculator_popout.js o bootstrap.js:
document.dispatchEvent(new Event('calcDOMReady'));

// In calculator_input.js:
document.addEventListener('calcDOMReady', () => {
    // ...binding dei listener...
});
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Medio (robustezza) | 45 min | Consigliato |

---

### 5.3 — Accesso DOM a livello di modulo in `calculator_input.js`

**File:** `js/calculator/calculator_input.js` (righe 226–227)

**Descrizione:**  
Le righe:

```js
const exprInput = CalcBridge.getElementById('expression-display');
const highlightLayer = CalcBridge.getElementById('highlight-layer');
```

vengono eseguite **al momento del caricamento del modulo**, prima che il DOM sia necessariamente pronto. Se `CalcBridge` è il `document` principale, questo potrebbe non trovare gli elementi durante il bootstrap.

**Fix:** Spostare queste assegnazioni all'interno delle funzioni che li usano (o come lazy init al primo utilizzo):

```js
let exprInput = null;
let highlightLayer = null;

function getExprInput() {
    return exprInput ?? (exprInput = CalcBridge.getElementById('expression-display'));
}
function getHighlightLayer() {
    return highlightLayer ?? (highlightLayer = CalcBridge.getElementById('highlight-layer'));
}
```

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Medio (robustezza) | 30 min | Consigliato |

---

### 5.4 — Mescolamento responsabilità in `calculator_zerodiv.js` (770 righe)

**File:** `js/calculator/calculator_zerodiv.js`

**Descrizione:**  
Il file gestisce attualmente **quattro responsabilità distinte**:
1. **Calcolo matematico** — `generate32ZeroDivisors()`, logica XOR per trovare coppie
2. **Rendering UI della griglia** — `renderOverlayContent()`, costruzione DOM dinamica
3. **Gestione interazione** — click, gestione stato `activeZD`, aggiornamento grafico 3D
4. **Listener** — `initZeroDivisorListeners()`, bind checkbox/toggle/search

Questa mescolanza di responsabilità rende il file difficile da testare e da modificare in sicurezza.

**Refactoring proposto — split in 3 file:**

| File | Contenuto |
|------|-----------|
| `calculator_zerodiv_math.js` | `generate32ZeroDivisors()`, `getActiveZeroDivisors()` |
| `calculator_zerodiv_render.js` | `renderOverlayContent()`, `renderItems()`, costruzione DOM |
| `calculator_zerodiv.js` (ridotto) | `updateZeroDivisorUI()`, `initZeroDivisorListeners()`, gestione stati |

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 4 | Alto (manutenibilità) | 3 h | Consigliato |

---

## Ondata 6 — Contenuti: Guida e Traduzioni (dipende da Ondata 5)

---

### 6.1 — Aggiornare la guida all'uso (`index.html`)

**File:** `www/index.html` (righe 31–160)

**Descrizione:**  
La guida all'uso (modale `#help-modal`) descrive funzionalità della versione precedente e non menziona o descrive correttamente:
- La modalità **32-ioni** (Trigintaduenioni)
- Il pannello **PG(3,2)** nella sidebar
- Il **Carousel mobile** (swipe sinistra/destra tra formule, calcolatrice, divisori)
- Il **long press** sui tasti variabili per aprire la vista vars
- I **Piani di Fano dei 32-ioni** e le loro classi di colore
- Il tasto **Ker** e la sua funzione
- L'**assegnazione diretta** `a = expr` vs confronto `==`

**Fix:** Aggiungere una o due pagine di guida per la modalità 32-ioni, e aggiornare la sezione Divisori dello Zero e Tabella per riflettere il comportamento attuale.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Alto (UX / onboarding) | 2 h | **Necessario** |

---

### 6.2 — Aggiornare le traduzioni (5 lingue)

**File:** `js/lang/en.js`, `js/lang/de.js`, `js/lang/es.js`, `js/lang/fr.js`, `js/lang/pt.js`

**Descrizione:**  
Le traduzioni in lingue diverse dall'italiano (`it.js`) sono spesso incomplete o non aggiornate rispetto alle ultime funzionalità aggiunte. Chiavi potenzialmente mancanti o non allineate con `it.js`:
- Chiavi per i 32-ioni (`alg_32`, `tab_pg32`)
- Chiavi per la modalità carousel mobile (`sw_zerodiv`, `sw_formulas`, `sw_calc`)
- Chiavi per la ricerca divisori zero (`zd_search_*`)
- Chiavi per i nuovi messaggi di errore/help della calcolatrice

**Fix:**
1. Creare uno script di audit (anche temporaneo) che confronta le chiavi di `it.js` con quelle degli altri file e segnala quelle mancanti.
2. Completare le traduzioni mancanti — se non si ha un traduttore, almeno copiarle dall'italiano come fallback.

Note: il sistema `i18n.js` probabilmente ha già un fallback sull'italiano, ma avere chiavi mancanti esplicite aiuta a capire cosa c'è da fare.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 2 | Medio | 1.5 h | Consigliato |

---

## Ondata 7 — Grandi Refactoring Strutturali (dipende da Ondate 3 + 5)

---

### 7.1 — Refactoring: split di `index.html` (824 righe)

**File:** `www/index.html`

**Descrizione:**  
`index.html` contiene **interamente inline** (senza template system):
- Modale guida all'uso (5 pagine, ~130 righe)
- Modale calcolatrice con tutta la struttura del keypad (~300 righe)
- Modale divisori dello zero con pannelli spiegazione e ricerca (~120 righe)
- Struttura dock e sidebar (~80 righe)
- Impostazioni e menu algebra (~80 righe)

Essendo un progetto statico (no build system), il refactoring diretto in file HTML separati con `fetch`+inject è possibile ma richiede più lavoro. Un'alternativa più leggera è usare **Web Components** o semplici funzioni JS che generano il markup.

**Fix preferito:** Creare funzioni JS `buildHelpModal()`, `buildCalculatorModal()`, `buildZeroDivModal()` in file dedicati, e chiamarle da `bootstrap.js` per iniettare il markup. Questo riduce `index.html` a ~200 righe di struttura scheletro.

Alternativa: usare `<template>` HTML con contenuto lazy-rendered.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 4 | Medio (manutenibilità) | 3 h | Facoltativo |

---

### 7.2 — Refactoring: split di `rotation.js` (637 righe)

**File:** `js/3d/rotation.js`

**Descrizione:**  
`rotation.js` mescola logica 3D (creazione mesh sfera armillare, assi, gruppo rotazione) con logica UI (listener input, validazione, drag pannello). Questo viola la separazione 3D/UI presente nel resto dell'architettura.

**Fix:**
| File | Contenuto |
|------|-----------|
| `rotation.js` (ridotto) | Solo logica 3D: creazione gruppi, mesh, aggiornamento rotazione |
| `js/ui/rotation_ui.js` (nuovo) | Listener input, `validateRotInput`, drag del pannello UI |

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 3 | Medio (architettura) | 2 h | Facoltativo |

---

### 7.3 — Refactoring: split di `ions32.js` (487 righe)

**File:** `js/3d/ions32.js`

**Descrizione:**  
`ions32.js` (già a ~487 righe dopo il futuro spostamento dati in Ondata 3.1) contiene ancora:
- Logica per costruire il grafico 3D dei 32-ioni (`build32IonGraph`, `buildPG32Graph`)
- Logica di toggle modalità (`toggle32Ions`)
- Interazione con la sidebar (mostrare/nascondere grids)

La logica di toggle UI e sidebar dovrebbe stare in `js/ui/ions32_ui.js`.

| Difficoltà | Beneficio | Tempo | Necessità |
|------------|-----------|-------|-----------|
| 🔧 3 | Medio (architettura) | 1.5 h | Facoltativo |

---

## Riepilogo per Priorità e Dipendenze

| # | Ondata | ID | Descrizione | Difficoltà | Tempo | Necessità |
|---|--------|-----|-------------|------------|-------|-----------|
| 1 | 1 | 1.3 | Variabile `t` oscura import i18n | 🔧1 | 5 min | **Urgente** |
| 2 | 4 | 4.1 | Scroll divisori zero bloccato su mobile | 🔧3 | 1 h | **Urgente** |
| 3 | 1 | 1.2 | Grafico incoerente con tabella (prodotto con 1) | 🔧2 | 45 min | **Necessario** |
| 4 | 1 | 1.1 | Segno `-` non segnala errore | 🔧1 | 30 min | **Necessario** |
| 5 | 2 | 2.1 | Testo piani Fano troppo largo su mobile | 🔧1 | 20 min | **Necessario** |
| 6 | 5 | 5.1 | Export `null` pattern fragile | 🔧2 | 30 min | **Necessario** |
| 7 | 4 | 4.2 | Pannelli non visibili durante swipe | 🔧2 | 45 min | **Necessario** |
| 8 | 6 | 6.1 | Aggiornare guida all'uso | 🔧2 | 2 h | **Necessario** |
| 9 | 1 | 1.5 | Import fuori ordine nel file | 🔧1 | 10 min | Consigliato |
| 10 | 1 | 1.6 | Magic numbers senza nome | 🔧1 | 30 min | Consigliato |
| 11 | 2 | 2.2 | Split `calc-layout.css` | 🔧2 | 1.5 h | Consigliato |
| 12 | 3 | 3.1 | Dati raw in `data.js` | 🔧1 | 20 min | Consigliato |
| 13 | 3 | 3.2 | Stili inline → classi CSS | 🔧3 | 2 h | Consigliato |
| 14 | 4 | 4.3 | Etichette P_1..P_7 non indicative | 🔧2 | 45 min | Consigliato |
| 15 | 5 | 5.2 | `setTimeout` → evento calcReady | 🔧2 | 45 min | Consigliato |
| 16 | 5 | 5.3 | Accesso DOM a livello modulo | 🔧2 | 30 min | Consigliato |
| 17 | 5 | 5.4 | Split `calculator_zerodiv.js` | 🔧4 | 3 h | Consigliato |
| 18 | 6 | 6.2 | Aggiornare traduzioni | 🔧2 | 1.5 h | Consigliato |
| 19 | 2 | 2.3 | Split `sidebar.css` e `dock.css` | 🔧2 | 2 h | Consigliato |
| 20 | 1 | 1.4 | Proprietà duplicate rimosse | 🔧1 | 2 min | Consigliato |
| 21 | 7 | 7.1 | Split `index.html` | 🔧4 | 3 h | Facoltativo |
| 22 | 7 | 7.2 | Split `rotation.js` | 🔧3 | 2 h | Facoltativo |
| 23 | 7 | 7.3 | Split `ions32.js` | 🔧3 | 1.5 h | Facoltativo |

---

## Tempo totale stimato

| Categoria | Ore |
|-----------|-----|
| Ondata 1 (Bug JS critici) | ~1.5 h |
| Ondata 2 (CSS) | ~4 h |
| Ondata 3 (Dati) | ~2.5 h |
| Ondata 4 (Bug mobile) | ~2.5 h |
| Ondata 5 (Architettura JS) | ~5 h |
| Ondata 6 (Contenuti) | ~3.5 h |
| Ondata 7 (Refactoring grandi) | ~6.5 h |
| **Totale** | **~25 h** |

---

## Note su Pattern Rilevati nel Codice

### Cosa funziona bene ✅
- L'architettura a livelli (0→5) documentata in `ARCHITECTURE.md` è rispettata nel grafo degli import
- L'uso di event bus (`window.dispatchEvent`) per disaccoppiare la logica 3D dalle UI è una scelta solida
- Il `CalcBridge` per astrarre `document` vs `popout window` è elegante
- L'event delegation sulle griglie (invece di listener per-bottone) è ottimale per performance
- I materiali THREE.js pre-istanziati a livello modulo evitano memory leak GPU
- La cache per `generate32ZeroDivisors()` con `cachedZD32` è corretta

### Cosa va migliorato ⚠️
- Lo stile "spara tutto in JS" (centinaie di `element.style.xxx = yyy`) è il problema principale di manutenibilità
- L'accoppiamento tra `calculator_zerodiv.js` e la logica 3D (importa direttamente `pointObjects`, `tripletVisuals`, `visualizeFanoPlane`) non rispetta completamente la separazione dei livelli
- Mancanza di gestione centralizzata degli errori runtime (gli errori matematici sono catturati, ma gli errori DOM sono silenziati con `if (!el) return`)
- Assenza di qualsiasi test automatizzato (documentato in `piano_di_test.md` ma non implementato)
