# Roadmap Correzioni — Ondate 11–13
## App Cayley-Dickson — Stato post-refactoring Ondate 0–10

> **Nota metodologica:** Ogni voce è verificata direttamente sul codice.
> Le ondate sono ordinate per dipendenza: ogni ondata può essere eseguita solo
> dopo che quelle precedenti sono completate.

---

## Riepilogo dello Stato Reale (post-analisi)

### ✅ Completate correttamente
| ID | Descrizione |
|----|-------------|
| 7.1 | `translateDOM()` con `innerHTML` condizionale + rilevamento entità HTML |
| 7.2 | `calculator_steps.js`: `window.switchMulTab` ecc. → event delegation con `data-action` |
| 8.1 | CSS carousel consolidato in `sidebar.css`, rimosso da `base.css` e `dock.css` |
| 9.1 | `filterSubspace()` ridotta a orchestratore (4 righe) via `updateAlgebraUI()` + `CustomEvent` |
| 10.1 parziale | DOM node di `sequence.js` dichiarati a livello di modulo (riga 88) |
| 10.1 parziale | `ARCHITECTURE.md` creato con struttura base |

### ⚠️ Incomplete o parziali
| ID | Problema |
|----|----------|
| 10.2 | `initRotationSequence()` ancora a **182 righe** (obiettivo: ~50) |
| 10.1 | `ARCHITECTURE.md` non documenta il ciclo di import confermato (vedi sotto) |

### 🐛 Bug introdotti
| # | Descrizione | File | Rischio |
|---|-------------|------|---------|
| B1 | `window.formatVecGlobal` assegnata su `window` invece di essere esportata | `parser.js` | Race condition a runtime |
| B2 | `window.preprocessExpr` assegnata su `window` invece di essere esportata | `parser.js` | Race condition a runtime |
| B3 | `window.EPSILON` e `window.createZeroVector` ridondanti su `window` | `parser.js` | Inquinamento scope globale |
| B4 | `window.randCacheIndex` — variabile di stato scritta su `window` tra moduli separati | `algebra.js`, `calculator_steps.js`, `calculator_core.js` | Stato condiviso implicito, bug difficili da tracciare |
| B5 | Ciclo di import confermato: `state.js` → `table.js` → `main.js` → `state.js` | Tutti e tre | Binding ES6 live, comportamento difficile da debuggare |
| B6 | Ciclo di import confermato: `main.js` → `ions32.js` → `main.js` | Entrambi | Come sopra |
| B7 | Inline style in template HTML di `addFixedQ0()` (violazione G2) | `sequence.js` | CSS non sovrascrivibile |

---

## Diagramma delle Dipendenze tra Ondate

```
Ondata 11: 11.1 ──────────────────────────────── ← Fix B1/B2/B3: export da parser.js
               │                                    Nessuna dipendenza esterna
               ▼
Ondata 11: 11.2 ──────────────────────────────── ← Fix B4: randCache in algebra.js
               │                                    Nessuna dipendenza da 11.1
               ▼
Ondata 12: 12.1 ──────────────────────────────── ← Fix B5/B6: spezza i cicli di import
               │                                    DOPO 11.1 e 11.2 (i moduli coinvolti
               │                                    devono essere già stabili)
               ▼
Ondata 12: 12.2 ──────────────────────────────── ← ARCHITECTURE.md completo
               │                                    DOPO 12.1 (documenta il grafo finale)
               ▼
Ondata 13: 13.1 ──────────────────────────────── ← initRotationSequence() a ~50 righe
               │                                    DOPO 12.1 (cicli risolti → no rischio
               │                                    di rompere il grafo durante l'estrazione)
               ▼
Ondata 13: 13.2 ──────────────────────────────── ← Inline style → classi CSS
                                                    DOPO 13.1 (i CSS nuovi vanno aperti
                                                    una sola volta per entrambe le fix)
```

---

## Ondata 11 — Eliminazione Globals Residui in `parser.js` e `algebra.js`
> ⏱ Stima: **1–2 ore**
> 🛡 Rischio regressione: **Basso** — cambio meccanico di import/export
> 🔑 Perché prima: `formatVecGlobal` e `preprocessExpr` sono usate da 3 file del dominio
> `calculator/`. Una race condition (modulo consumatore caricato prima del produttore)
> causa `TypeError` silenzioso. Sono prerequisito di Ondata 12 perché i file coinvolti
> nei cicli di import devono essere stabili prima di riorganizzarli.

---

### 11.1 — `parser.js`: 4 assegnazioni su `window` → `export`

**File:** `js/math/parser.js` — righe 6, 9, 17, 410

**Problema:** Quattro simboli sono esposti come globali invece di essere esportati come ES module:

```js
window.EPSILON = EPSILON;                  // riga 6  — già esportato, ridondante
window.createZeroVector = createZeroVector; // riga 9  — già esportato, ridondante
window.preprocessExpr = function (str) {   // riga 17 — NON esportato
window.formatVecGlobal = function (v) {    // riga 410 — NON esportato
```

`window.EPSILON` e `window.createZeroVector` sono ridondanti perché `parser.js` già li
esporta con `export`. `window.preprocessExpr` e `window.formatVecGlobal` sono le critiche:
sono consumate da `calculator_steps.js` e `calculator_core.js` tramite `window.*`.

**Consumatori da aggiornare:**

| Consumatore | Occorrenze `window.preprocessExpr` | Occorrenze `window.formatVecGlobal` |
|-------------|------------------------------------:|------------------------------------:|
| `calculator/calculator_core.js` | 5 | 3 |
| `calculator/calculator_steps.js` | 1 | 17 |
| `calculator/calculator_kernel.js` | 0 | 2 |

**Fix — in `parser.js`:**
```js
// Rimuovere le 4 righe window.* (6, 9, 17, 410)
// Aggiungere export alle due funzioni mancanti:
export function preprocessExpr(str) { ... }
export function formatVec(v) { ... }  // rinominata da formatVecGlobal per coerenza con ES style
```

**Fix — nei consumatori (tutti e tre i file `calculator/`):**
```js
// Aggiungere all'import esistente da parser.js:
import { ..., preprocessExpr, formatVec } from '../math/parser.js';

// Sostituire ogni occorrenza:
// window.preprocessExpr(x)  →  preprocessExpr(x)
// window.formatVecGlobal(x) →  formatVec(x)
```

> **Nota:** `calculator_kernel.js` usa già un guard `typeof window.formatVecGlobal !== 'undefined'`
> che può essere rimosso dopo questa fix.

---

### 11.2 — `algebra.js` / `calculator_*.js`: `window.randCache` e `window.randCacheIndex` → stato di modulo

**File:** `js/math/algebra.js` — righe 138–297; `js/calculator/calculator_steps.js` — riga 286;
`js/calculator/calculator_core.js` — righe 82, 159, 332

**Problema:** Il meccanismo di cache per i vettori casuali usa `window.randCache` (array) e
`window.randCacheIndex` (puntatore) come stato condiviso tra `algebra.js` (produttore)
e i file `calculator/` (che resettano l'indice prima di ogni calcolo). Questo è stato
condiviso implicito tra moduli non correlati.

**Nota curiosa:** `algebra.js` dichiara già `let randCacheIndex = 0;` a riga 138 ma poi
ignora quella variabile e usa `window.randCacheIndex`. Il commento alla riga 139 dice
esplicitamente che questo è un compromesso temporaneo.

**Fix — in `algebra.js`:**
```js
// Eliminare le righe 138-139 (let randCacheIndex già dichiarato ma inutilizzato)
// Dichiarare lo stato interno del modulo:
let _randCache = [];
let _randCacheIndex = 0;

// Esportare una funzione di reset per i consumatori:
export function resetRandCache() {
    _randCacheIndex = 0;
}

// Sostituire internamente:
// window.randCache[window.randCacheIndex]  →  _randCache[_randCacheIndex]
// window.randCacheIndex++                 →  _randCacheIndex++
// window.randCache[window.randCacheIndex++] = { ... }  →  _randCache[_randCacheIndex++] = { ... }
```

**Fix — nei consumatori:**
```js
// In calculator_steps.js e calculator_core.js — aggiungere all'import da algebra.js:
import { ..., resetRandCache } from '../math/algebra.js';

// Sostituire ogni:
// window.randCacheIndex = 0;  →  resetRandCache();
```

---

## Ondata 12 — Cicli di Import e Documentazione Architetturale
> ⏱ Stima: **mezza giornata** (12.1) + **1 ora** (12.2)
> 🛡 Rischio regressione: **Medio** — tocca la struttura degli import tra i moduli core
> 🔑 Perché dopo l'Ondata 11: i moduli coinvolti (`table.js`, `main.js`, `state.js`,
> `ions32.js`) devono avere i propri export stabili prima di riorganizzare le dipendenze.

---

### 12.1 — Spezzare i due cicli di import ES6 confermati

**File coinvolti:** `js/core/state.js`, `js/ui/table.js`, `js/main.js`, `js/3d/ions32.js`

**Ciclo 1 (confermato):**
```
state.js  → import updateTableForAlgebra  → table.js
table.js  → import currentAlgState,           
              tripletButtons, resetView    → main.js
main.js   → import AppState, filterSubspace → state.js
```

**Ciclo 2 (confermato):**
```
main.js   → import toggle32Ions, ecc.     → ions32.js
ions32.js → import resetView, AppState    → main.js
```

**Fix — Ciclo 1:**

Il problema radice è che `table.js` importa da `main.js`. `currentAlgState` e `resetView`
appartengono a `state.js`, non a `main.js`. Spostarli è il fix corretto:

```js
// In state.js — aggiungere export di resetView o esporre via evento:
// Opzione A (se resetView è logica pura di stato):
export function resetView() { ... } // sposta da main.js

// Opzione B (se resetView dipende da Three.js — più probabile):
// In table.js, sostituire l'import diretto con un CustomEvent:
// window.dispatchEvent(new CustomEvent('requestResetView'));
// In main.js, ascoltare l'evento:
// window.addEventListener('requestResetView', () => resetView());

// In ogni caso, rimuovere da table.js:
// import { ..., resetView } from '../main.js';
```

`tripletButtons` dovrebbe essere spostato nel modulo che gestisce i pulsanti triplet
(probabilmente `state.js` o un nuovo `js/ui/triplets.js`).

**Fix — Ciclo 2:**

```js
// In ions32.js — rimuovere:
import { resetView, AppState } from '../main.js';

// Sostituire l'uso di AppState con un CustomEvent o con import da state.js:
import { AppState } from '../core/state.js';

// Sostituire l'uso di resetView con un evento:
window.dispatchEvent(new CustomEvent('requestResetView'));
```

> **Attenzione:** Prima di fare questa modifica, verificare esattamente cosa usa `ions32.js`
> da `main.js` (oltre a `resetView` e `AppState`) per non lasciare import rotti.

---

### 12.2 — `ARCHITECTURE.md`: documentare il grafo completo e reale

**File:** `ARCHITECTURE.md` (root progetto)

**Problema:** Il file attuale non documenta i cicli di import (ora risolti da 12.1) né il
pattern `CustomEvent` usato come event bus. Deve essere aggiornato dopo 12.1 per riflettere
il grafo definitivo e stabile.

**Contenuto da aggiungere:**

````md
## Grafo Completo degli Import (post-Ondata 12)

### Livelli architetturali (dipendenze solo verso il basso)

```
Livello 0 — Nessun import locale
  js/math/algebra.js
  js/math/data.js
  js/core/constants.js

Livello 1 — Importa solo da Livello 0
  js/math/parser.js       ← algebra.js, data.js
  js/core/i18n.js         ← (solo lang/)

Livello 2 — Importa da Livello 0-1
  js/3d/geometry.js       ← (three solo)
  js/math/closure.js      ← algebra.js, data.js
  js/core/renderer.js     ← (nessun import locale)

Livello 3 — Importa da Livello 0-2
  js/3d/scene.js          ← geometry.js, data.js, i18n.js, constants.js
  js/3d/rotation.js       ← scene.js, renderer.js, constants.js

Livello 4 — Importa da Livello 0-3
  js/3d/graph.js          ← scene.js, data.js
  js/3d/ions32.js         ← scene.js, data.js, constants.js [+ event bus]
  js/ui/table.js          ← scene.js, graph.js, data.js, i18n.js [+ event bus]
  js/core/state.js        ← i18n.js, constants.js, scene.js, rotation.js, table.js

Livello 5 — Bootstrapper
  js/main.js              ← tutto quanto
```

### Pattern Event Bus (comunicazione senza import diretto)

| Evento | Emesso da | Ascoltato da |
|--------|-----------|--------------|
| `algebraChanged` | `state.js` | `scene.js` |
| `requestResetView` | `table.js`, `ions32.js` | `main.js` |
| `triggerToggle32Ions` | `state.js` | `main.js` |
| `triggerResetView` | `state.js` | `main.js` |
| `languageChanged` | `i18n.js` | `ui.js`, altri |
```
````

---

## Ondata 13 — Completamento 10.2 e Pulizia G2 Residua
> ⏱ Stima: **mezza giornata**
> 🛡 Rischio regressione: **Basso** (refactoring puramente strutturale, nessuna logica cambia)
> 🔑 Perché dopo Ondata 12: il grafo degli import deve essere stabile prima di estrarre
> nuove sotto-funzioni da `sequence.js`, altrimenti le eventuali dipendenze aggiunte
> potrebbero riaprire i cicli appena chiusi.

---

### 13.1 — `initRotationSequence()`: 182 righe → ~50 righe

**File:** `js/3d/sequence.js`

**Stato attuale:** Il fix 10.2 è parzialmente fatto (DOM node a livello di modulo ✅),
ma `initRotationSequence()` è ancora a 182 righe perché tre blocchi logici distinti
non sono stati estratti.

**Blocchi da estrarre:**

```js
// Blocco 1 — ~35 righe — gestione apertura sidebar + MutationObserver
function initSidebarButton() {
    if (!rotSidebarBtn) return;
    rotSidebarBtn.addEventListener('click', () => { ... });

    const syncBtnState = () => { ... };
    const observer = new MutationObserver(syncBtnState);
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    const tabRot = document.getElementById('tab-btn-rotations');
    if (tabRot) observer.observe(tabRot, { attributes: true, attributeFilter: ['class'] });
}

// Blocco 2 — ~45 righe — navigazione da tastiera con frecce
function initKeyboardNavigation() {
    if (!listContainer) return;
    listContainer.addEventListener('keydown', (e) => { ... });
}

// Blocco 3 — ~35 righe — calcolo qTot e pRot
function initCalculateButtons() {
    if (calcQtotBtn) calcQtotBtn.addEventListener('click', () => { ... });
    if (calcProtBtn) calcProtBtn.addEventListener('click', () => { ... });
}

// initRotationSequence() diventa:
export function initRotationSequence() {
    // 1. Assegna DOM node (già fatto)
    rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    sidebar       = document.getElementById('sidebar');
    listContainer = document.getElementById('rot-sequence-list');
    clearBtn      = document.getElementById('rot-seq-clear');
    calcQtotBtn   = document.getElementById('calc-qtot-btn');
    calcProtBtn   = document.getElementById('calc-prot-btn');

    // 2. Inizializza sotto-sistemi
    initSidebarButton();
    initKeyboardNavigation();
    addFixedQ0();
    addEmptyRow();

    // 3. Listener di servizio
    if (clearBtn) clearBtn.addEventListener('click', () => { ... }); // ~8 righe
    if (listContainer) listContainer.addEventListener('input', () => { ... }); // 3 righe

    // 4. Calcoli
    initCalculateButtons();
}
```

> **Test richiesti dopo ogni estrazione:** la rotation sequence è la feature più
> complessa dell'app. Testare manualmente add/remove riga, calcolo qTot, navigazione
> frecce, modalità mobile.

---

### 13.2 — Inline style residui → classi CSS (completamento G2)

**File:** `js/3d/sequence.js` e (bassa priorità) `js/calculator/calculator_steps.js`

**Problema in `sequence.js`:** Il template HTML di `addFixedQ0()` contiene due style inline:
```html
<div style="flex:1; width:100%; min-width:0;"></div>
<span class="rot-plus" style="visibility:hidden;">+</span>
```

**Fix — in `sequence.js`:**
```html
<!-- Sostituire con classi -->
<div class="q0-spacer"></div>
<span class="rot-plus rot-plus-hidden">+</span>
```

**Fix — in `css/calc/calc-layout.css` (sezione rotation sequence):**
```css
.q0-spacer {
    flex: 1;
    width: 100%;
    min-width: 0;
}
.rot-plus-hidden {
    visibility: hidden;
}
```

**Nota su `calculator_steps.js`:** Contiene 63 occorrenze di `style="..."` dentro template
HTML generati dinamicamente. Sono quasi tutte colorazioni e spaziature dei passaggi
step-by-step. Il loro volume rende questo un refactoring a sé (stimabile in 2–4 ore)
che può essere fatto come Ondata 14 separata, dopo che 13.1 e 13.2 sono stabili.

---

## Checklist Esecutiva

### ✅ Ondata 11 — Globals residui
- [ ] **11.1** — Rimuovere `window.EPSILON`, `window.createZeroVector` da `parser.js` (ridondanti)
- [ ] **11.1** — Esportare `preprocessExpr` da `parser.js` + aggiornare 6 occorrenze in `calculator_core.js` e `calculator_steps.js`
- [ ] **11.1** — Esportare `formatVec` (ex `formatVecGlobal`) da `parser.js` + aggiornare 22 occorrenze in 3 file
- [ ] **11.1** — Rimuovere guard `typeof window.formatVecGlobal !== 'undefined'` in `calculator_kernel.js`
- [ ] **11.2** — Spostare `randCache` e `randCacheIndex` come stato privato di `algebra.js`
- [ ] **11.2** — Esportare `resetRandCache()` da `algebra.js`
- [ ] **11.2** — Sostituire `window.randCacheIndex = 0` con `resetRandCache()` in `calculator_steps.js` e `calculator_core.js` (4 occorrenze)

### ✅ Ondata 12 — Cicli di import
- [ ] **12.1** — Rimuovere `import { resetView } from '../main.js'` da `table.js` → sostituire con CustomEvent `requestResetView`
- [ ] **12.1** — Spostare `tripletButtons` fuori da `main.js` nel modulo proprietario
- [ ] **12.1** — Rimuovere `import { resetView, AppState } from '../main.js'` da `ions32.js` → `AppState` da `state.js`, `resetView` via CustomEvent
- [ ] **12.1** — Verificare assenza di altri import da `main.js` in moduli non-bootstrap (audit con `grep -rn "from.*main.js"`)
- [ ] **12.2** — Aggiornare `ARCHITECTURE.md` con grafo completo per livelli + tabella event bus

### ✅ Ondata 13 — Completamento 10.2 e pulizia G2
- [ ] **13.1** — Estrarre `initSidebarButton()` da `initRotationSequence()`
- [ ] **13.1** — Estrarre `initKeyboardNavigation()` da `initRotationSequence()`
- [ ] **13.1** — Estrarre `initCalculateButtons()` da `initRotationSequence()`
- [ ] **13.1** — Verificare che `initRotationSequence()` sia ≤ 50 righe
- [ ] **13.1** — Test manuale: add/remove riga, qTot, navigazione frecce, mobile
- [ ] **13.2** — Sostituire 2 inline style in `addFixedQ0()` con classi CSS
- [ ] **13.2** — Aggiungere `.q0-spacer` e `.rot-plus-hidden` in `calc-layout.css`

---

*Documento generato il 2026-04-18 — Analisi basata sul codice post-refactoring Ondate 0–10.*
