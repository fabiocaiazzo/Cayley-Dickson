# Roadmap Completa di Refactoring — Ondate 0–13
## App Cayley-Dickson — Documento Unificato

> **Copertura:** Tutte le 39 problematiche individuate nei 43 file del progetto, organizzate
> in 14 ondate progressive ordinate per dipendenza e rischio.
>
> **Metodologia:** Ogni problema è valutato su quattro assi:
> - 🔧 **Complessità** (1=triviale → 5=chirurgia maggiore)
> - 🐛 **Rischio bug** (Basso / Medio / Alto)
> - 💎 **Beneficio** (Basso / Medio / Alto)
> - ✅ **Vale la pena?**
>
> Le frecce `→` nelle tabelle indicano dipendenze esplicite tra item.

---

## Diagramma Generale delle Dipendenze

```
Ondata 0:  H1 J2 K1 M2 N1 J1 N3        ← Zero dipendenze
                   │
Ondata 1:  D1──>G2  B2  I1  E1          D1→G2 (CSS già aperto); B2→B1 (prerequisito)
                   │
Ondata 2:  M1  G1  K2  E2               Indipendenti da 1 e 3
                   │
Ondata 3:  C1──>F1  C2  I2  N2          C1→F1; I2→B1; N2 dipende da D1
                   │
Ondata 4:  B2+I2──>B1──>L2──>F2         Sequenza rigida
                   │
Ondata 5:  A1  L1                        Dipendono da tutto il resto
                   │
Ondata 6:  Magic Numbers → Smembrare main.js → Riorganizzare cartelle → Anti-patterns
                   │
Ondata 7:  7.1  7.2                      Nessuna dipendenza reciproca
                   │
Ondata 8:  8.1                           Solo CSS, nessuna dipendenza
                   │
Ondata 9:  9.1                           Verificare grafo import PRIMA
                   │
Ondata 10: 10.1──>10.2                   10.1 prerequisito di 10.2
                   │
Ondata 11: 11.1  11.2                    Nessuna dipendenza reciproca
                   │
Ondata 12: 12.1──>12.2                   12.1 prerequisito di 12.2
                   │
Ondata 13: 13.1──>13.2                   13.1 prerequisito (CSS da aprire)
```

---

## Riepilogo Completo delle Problematiche

| ID | Problema | File | Compl. | Rischio | Beneficio | Ondata |
|----|----------|------|:------:|:-------:|:---------:|:------:|
| A1 | **Monkey-patching DOM** `getElementById` | `calculator_popout.js` | 4 | Alto | Alto | 5 |
| B1 | Globali implicite (`data.js`, `algebra.js`) | tutti | 4 | Alto | Alto | 4 |
| B2 | `createZeroVector` definita due volte | `algebra.js`, `parser.js` | 2 | Basso | Medio | 1 |
| C1 | `multiplyQuaternions` ridefinita manualmente | `sequence.js` | 2 | Medio | Medio | 3 |
| C2 | Logica percorso 3D duplicata | `scene.js`, `ions32.js` | 2 | Medio | Medio | 3 |
| D1 | CSS iniettato via JS × 4 | `mobile.js`, `sidebar.js` ecc. | 2 | Basso | Medio | 1 |
| E1 | `window.highestZIndex` contatore globale | `sidebar.js` | 2 | Basso | Basso | 1 |
| E2 | `updateSidebarCarousel` esposta su `window` | `sidebar.js` | 2 | Medio | Medio | 2 |
| F1 | `initRotationSequence()` — God function | `sequence.js` | 3 | Medio | Alto | 3 |
| F2 | `toggleRotationMode()` — 120 righe DOM | `rotation.js` | 4 | Alto | Alto | 4 |
| G1 | `buildTable()` loop O(n²) ad ogni click | `table.js` | 2 | Basso | Medio | 2 |
| G2 | Stili inline su elementi generati da JS | `sequence.js`, `ions32.js` | 2 | Basso | Medio | 1 |
| H1 | `window.innerWidth <= 768` × 18 | tutti | 1 | Basso | Medio | 0 |
| I1 | Tema/velocità/musica non persistiti | `ui.js` | 1 | Basso | Medio | 1 |
| I2 | Doppio meccanismo stato algebra | `main.js`, `ions32.js` | 2 | Medio | Medio | 3 |
| J1 | `innerHTML` in `translateDOM()` | `i18n.js` | 1 | Basso | Basso | 7 |
| J2 | `<html lang>` non aggiornato al cambio lingua | `i18n.js` | 1 | Basso | Medio | 0 |
| K1 | `forceRender` event — dead code | `rotation.js` | 1 | Basso | Basso | 0 |
| K2 | Listener drag globali sempre attivi | `sidebar.js`, `rotation.js` | 2 | Basso | Medio | 2 |
| L1 | Stili inline su tutta `index.html` | `index.html` | 4 | Basso | Alto | 5 |
| L2 | Handler `onclick` inline nell'HTML | `index.html` | 3 | Basso | Medio | 4 |
| M1 | Memory leak GPU — materiali non rilasciati | `calculator_zerodiv.js` | 3 | Alto | Alto | 2 |
| M2 | `isDraggingSphere` — dead code | `rotation.js` | 1 | Basso | Basso | 0 |
| N1 | Commento duplicato | `dock.css` | 1 | Basso | Basso | 0 |
| N2 | CSS carousel frammentato tra 3 sorgenti | CSS + `mobile.js` | 3 | Medio | Alto | 8 |
| N3 | Audio ON di default, nessun fallback | `ui.js` | 1 | Basso | Medio | 0 |
| — | `window.formatVecGlobal` su `window` | `parser.js` | 2 | Alto | Alto | 11 |
| — | `window.preprocessExpr` su `window` | `parser.js` | 2 | Alto | Alto | 11 |
| — | `window.randCacheIndex` stato condiviso | `algebra.js`, `calculator_*` | 2 | Medio | Alto | 11 |
| — | Ciclo import: `state.js`↔`table.js`↔`main.js` | Tutti e tre | 3 | Medio | Alto | 12 |
| — | Ciclo import: `main.js`↔`ions32.js` | Entrambi | 3 | Medio | Alto | 12 |
| — | `initRotationSequence()` a 182 righe | `sequence.js` | 2 | Basso | Medio | 13 |
| — | Inline style residui in `addFixedQ0()` | `sequence.js` | 1 | Basso | Basso | 13 |
| — | `ARCHITECTURE.md` incompleto | root | 1 | Basso | Medio | 12 |

---
---

## ONDATA 0 — One-liners: Zero Rischio, Effetto Immediato
> ⏱ Stima: **30 minuti totali**
> 🛡 Rischio regressione: **Nullo**
> 🔑 Perché prima: Puliscono rumore dal codebase prima di fare qualsiasi altra cosa. Nessuna dipendenza esterna.

### H1 — `window.innerWidth <= 768` ripetuto in almeno 18 punti
**File:** `main.js`, `mobile.js`, `calculator_ui.js`, `calculator_zerodiv.js`, `sidebar.js`, `scene.js`, `graph.js`, `rotation.js`, `rotations/sequence.js`

Il valore `768` è una costante magica ripetuta in almeno 18 punti. Un cambio del breakpoint richiederebbe una ricerca globale.

```js
// scene.js — l.19
if (window.innerWidth <= 768) { initialCameraPos.set(22, 18, 38); }
// sidebar.js — l.134, 257, 293, 307
if (window.innerWidth <= 768) { ... }
```

**Fix:** Aggiungere `const MOBILE_BP = 768;` (e la funzione helper `isMobile()`) in un file condiviso e sostituire ogni literal.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Medio | Assolutamente sì — costo zero |

---

### J2 — Attributo `lang` dell'HTML non aggiornato al cambio lingua
**File:** `i18n.js`

```html
<!-- index.html — hardcoded su "it" -->
<html lang="it">
```
Quando l'utente cambia lingua, `setLanguage('en')` aggiorna `localStorage` e ri-traduce il DOM ma **non aggiorna** `document.documentElement.lang`. Conseguenze per screen reader, SEO e correttore ortografico.

**Fix:** `document.documentElement.lang = lang;` in `setLanguage()`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Medio | Sì — 1 riga |

---

### K1 — `forceRender` event sparato nel vuoto (dead code)
**File:** `rotation.js` (righe 173, 233, 419, 549)

```js
window.dispatchEvent(new Event('forceRender')); // Non ha listener
```
Non esiste nessun `addEventListener('forceRender', ...)` nel codebase. Il rendering è già richiesto da `controls.update()`. L'evento è codice morto.

**Fix:** Sostituire le 4 occorrenze con una chiamata diretta a `forceUpdate()`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Basso | Sì — one-liner |

---

### M2 — `isDraggingSphere` — variabile dichiarata ma mai impostata
**File:** `rotation.js` (righe 389-425)

```js
let isDraggingSphere = false;      // Dichiarata
// ... nel pointerdown: isDraggingMaster = true (ma isDraggingSphere no)
window.addEventListener('pointerup', () => {
    isDraggingSphere = false;      // Resettata, ma era già false
});
```
**Fix:** Rimuovere la variabile e la sua riga di reset.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Basso | Sì — one-liner |

---

### N1 — Commento duplicato in `dock.css`
**File:** `dock.css` (righe 156-157)

```css
/* FIX UX: Impedisce la selezione del testo (effetto blu) su pulsanti e titoli */
/* FIX UX: Impedisce la selezione del testo (effetto blu) su pulsanti, pannelli e titoli */
```
**Fix:** Cancellare una delle due righe identiche.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Basso | Sì — one-liner |

---

### J1 — `innerHTML` in `translateDOM()` (rinviato all'Ondata 7)
**File:** `i18n.js`

Spostato all'Ondata 7 perché richiede un'analisi delle chiavi che contengono HTML reale. Vedi **7.1**.

---

### N3 — Audio ON di default, nessun fallback
**File:** `ui.js` (riga 252)

```js
let isMusicPlaying = true; // ON di default — molti browser bloccano l'autoplay
const bgMusic = new Audio('./assets/audio/background.mp3');
// Nessun handler per file mancante
```
**Fix:** Default `isMusicPlaying = false`; aggiungere `bgMusic.onerror = () => { isMusicPlaying = false; }`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Medio | Sì — 2 righe |

---

### Checklist Ondata 0
- [ ] **H1** — `MOBILE_BP` + `isMobile()` in file condiviso, sostituire 18 literal
- [ ] **J2** — `document.documentElement.lang = lang` in `setLanguage()`
- [ ] **K1** — Rimuovere `forceRender` event, sostituire con `forceUpdate()` diretto (4 punti)
- [ ] **M2** — Rimuovere `isDraggingSphere` e il suo reset
- [ ] **N1** — Cancellare commento duplicato in `dock.css`
- [ ] **N3** — Default musica OFF + `bgMusic.onerror`

---
---

## ONDATA 1 — Quick Wins: Basso Rischio, Nessuna Dipendenza Architetturale
> ⏱ Stima: **mezza giornata**
> 🛡 Rischio regressione: **Molto basso** (nessuna logica cambia)
> 🔑 Perché ora: Vanno fatte **tutte prima dell'Ondata 2** perché D1 è prerequisito per N2 (Ondata 8).

### I1 — Tema/velocità/musica non persistiti in `localStorage`
**File:** `ui.js` (righe 104, 254)

```js
let currentTheme = 0; // Sempre 0 all'avvio
let isMusicPlaying = true; // Sempre ON — perso ad ogni ricarica
```
La lingua è l'unica preferenza persistita. Tutte le altre si resettano.

**Fix:** `localStorage.setItem('theme', currentTheme)` al cambio; lettura all'avvio per tema, velocità, opacità, musica.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 1 | Basso | Medio | Sì |

---

### D1 — CSS iniettato via JavaScript in 4 punti *(prerequisito di N2)*
**File:** `mobile.js`, `sidebar.js`, `rotations/sequence.js`, `calculator_popout.js`

```js
// sidebar.js — CSS iniettato al caricamento
const sidebarCarouselCss = document.createElement('style');
sidebarCarouselCss.textContent = `
    .tab-content.carousel-mode { display: flex !important; ... }
`;
document.head.appendChild(sidebarCarouselCss);
```
4 blocchi `<style>` dinamici. Creano dipendenza d'ordine, `!important` non sovrascrivibili, foglio CSS incompleto senza eseguire JS.

**Fix:** Spostare ogni `style.textContent = ...` nel file `.css` appropriato e usare classi.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Medio | Sì — prerequisito di N2 |

---

### G2 — Stili inline su elementi generati dinamicamente *(dipende da D1)*
**File:** `rotations/sequence.js` (righe 119-145), `ions32.js` (righe 64-88)

```js
// sequence.js — 7+ stili inline per ogni riga creata da addEmptyRow()
row.style.opacity = '0.4';
row.style.transition = 'opacity 0.3s ease';
row.style.display = 'flex';
row.style.alignItems = 'center';
// ... altri 4
```
Impossibili da tematizzare o sovrascrivere senza `!important`.

**Fix:** `el.className = 'rot-seq-row'` + regole in file CSS statici (file già aperti da D1).

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Medio | Sì — dopo D1 |

---

### E1 — `window.highestZIndex` contatore globale
**File:** `sidebar.js` (righe 46, 50, 57)

```js
const currentZ = parseInt(sidebar.style.zIndex || 0);
sidebar.style.zIndex = ++window.highestZIndex;
```
Contatore fragile: se un componente viene aperto bypassando questa logica, il sistema si inceppa.

**Fix:** `const zManager = { next() { return ++this._z; }, _z: 100 };` in file condiviso (`constants.js`).

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Basso | Sì — one-liner |

---

### B2 — `createZeroVector()` definita due volte *(prerequisito di B1)*
**File:** `algebra.js` (riga 4), `parser.js` (riga 7)

```js
// algebra.js — versione globale
function createZeroVector() { return new Array(16).fill(0); }
// parser.js — versione ES module identica
export const createZeroVector = () => new Array(16).fill(0);
window.createZeroVector = createZeroVector;
```
Un solo punto di verità. Se la struttura cambia (es. `Float64Array`), basta aggiornare uno.

**Fix:** Eliminare quella in `algebra.js`; i consumatori la useranno da `parser.js` dopo B1.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Medio | Sì — prerequisito di B1 |

---

### Checklist Ondata 1
- [ ] **I1** — Persistenza tema/velocità/opacità/musica in `localStorage`
- [ ] **D1** — Spostare 4 blocchi CSS da JS → file `.css` statici *(prerequisito N2)*
- [ ] **G2** — Stili inline dinamici → classi CSS *(dopo D1)*
- [ ] **E1** — `zManager` centralizzato in `constants.js`
- [ ] **B2** — Rimuovere `createZeroVector` da `algebra.js` *(prerequisito B1)*

---
---

## ONDATA 2 — Performance e Memory: Medio Rischio, Impatto Diretto
> ⏱ Stima: **1 giornata**
> 🛡 Rischio regressione: **Basso–Medio** (toccare oggetti Three.js e listener DOM)
> 🔑 Perché ora: Fix su risorse (GPU, memoria, eventi) da fare *prima* del refactoring architetturale.

### M1 — Memory leak GPU: materiali Three.js creati ad ogni click
**File:** `calculator_zerodiv.js` (righe 161-163)

```js
// Eseguito ad ogni click su un divisore dello zero
const matBlue = new THREE.MeshPhysicalMaterial({ color: 0x0088ff, ... });
const matGreen = new THREE.MeshPhysicalMaterial({ color: 0x00ff00, ... });
const matRed  = new THREE.MeshPhysicalMaterial({ color: 0xff0000, ... });
// Mai rilasciati con .dispose()
```
3 materiali × ogni interazione × 84 divisori. Degradazione progressiva del renderer WebGL.

**Fix:** Pre-istanziare `matBlue`, `matGreen`, `matRed` una volta sola a livello di modulo; riutilizzarli.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 3 | **Alto** | **Alto** | Sì — priorità alta |

---

### G1 — `buildTable()`: loop O(n²) ad ogni click
**File:** `table.js` (righe 161-271)

Un doppio loop scorre tutte le 256+ celle per aggiornare classi CSS a ogni interazione:
```js
for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < tr.cells.length; c++) {
        tr.cells[c].classList.remove('table-intersect', 'table-highlight', ...);
    }
}
```
272 iterazioni ad ogni click. Su mobile può causare jank visibile.

**Fix:** Cachare i riferimenti DOM + aggiornare solo il delta (riga/colonna precedente vs nuova) con `prevActiveRow`/`prevActiveCol`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Medio | Sì |

---

### K2 — Listener drag globali sempre attivi
**File:** `sidebar.js` (righe 144-158), `rotation.js` (righe 351-356)

9 listener `mousemove`/`touchmove` globali su `document`, sempre attivi anche quando nessun drag è in corso. La guardia `if (!isResizing)` li argina, ma il costo di dispatch rimane.

**Fix:** Aggiungere i listener `mousemove`/`touchmove` su `pointerdown`, rimuoverli su `pointerup`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Basso | Medio | Sì |

---

### E2 — `updateSidebarCarousel` esposta su `window` da dentro una funzione
**File:** `sidebar.js` (riga 256)

La funzione è esposta come `window.updateSidebarCarousel` all'interno di `initSidebar()`. Race condition se `initSidebar()` non è ancora stata chiamata quando qualcuno la invoca.

**Fix:** Esportare come `export function updateSidebarCarousel(...)` e importarla esplicitamente dove serve.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Medio | Medio | Sì |

---

### Checklist Ondata 2
- [ ] **M1** — Pre-istanziare i 3 materiali GPU in `calculator_zerodiv.js`
- [ ] **G1** — `buildTable()` con diff invece di reset totale; `prevActiveRow/Col`
- [ ] **K2** — Listener drag: aggiungi su `pointerdown`, rimuovi su `pointerup`
- [ ] **E2** — `updateSidebarCarousel` esportata come ES module function

---
---

## ONDATA 3 — Refactoring Logico: Medio-Alto Rischio, Molto Impatto
> ⏱ Stima: **3–4 giorni**
> 🛡 Rischio regressione: **Medio** — richiedono test visivi dopo ogni modifica
> 🔑 Perché ora: Fix su duplicazione e frammentazione logica. Vanno fatte *dopo* le Ondate 0–2 e *prima* della modularizzazione ES (Ondata 4) per non portare codice duplicato nel sistema modulare.

### C2 — Logica percorso 3D duplicata in `scene.js` e `ions32.js`
**File:** `scene.js` (righe 149-214), `ions32.js` (righe 416-445)

≈50 righe identiche per calcolare la curva circolare di una terna e creare il `TubeGeometry`. Copia-incolla con minime variazioni.

```js
// In entrambi i file — codice identico:
const v12 = new THREE.Vector3().subVectors(p2, p1);
const normal = new THREE.Vector3().crossVectors(v12, v13);
// ... 40 righe
```
Bug in una versione → non corretti nell'altra.

**Fix:** Estrarre `createTubeGeometry(p1, p2, p3, options)` in `geometry.js` condiviso.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Medio | Medio | Sì |

---

### C1 — `multiplyQuaternions` ridefinita manualmente *(fare prima di F1)*
**File:** `rotations/sequence.js` (righe 372-427)

```js
function multiplyQuaternions(q1, q2) {
    return {
        w: q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z,
        x: q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y,
        // ...
    };
}
```
Duplica esattamente `vecMul` di `algebra.js`. Se `vecMul` viene corretta per un bug, `multiplyQuaternions` rimane errata.

**Fix:** Usare `vecMul` con adattatori `quatToVec`/`vecToQuat` per convertire tra `{w,x,y,z}` e array.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Medio | Medio | Sì — prerequisito di F1 |

---

### F1 — `initRotationSequence()`: God function da 527 righe *(dipende da C1)*
**File:** `rotations/sequence.js`

Tutta la logica (UI, matematica, validazione, DOM creation, event handling, keyboard navigation) in una singola funzione. Funzioni interne annidate in closure profonde:
```
initRotationSequence()
  ├─ addEmptyRow()
  │   ├─ isRowEmpty(), isRowNumeric(), isRowPerfect()
  │   ├─ maintainBuffer(), updateActionButton()
  ├─ addFixedQ0()
  ├─ getValidQuaternions()
  ├─ calculateQTot()
  └─ multiplyQuaternions()  ← da unificare prima (C1)
```
**Fix:** Estrarre `createRowElement()`, `validateRow()`, `getValidQuaternions()` come funzioni autonome top-level.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 3 | Medio | Alto | Sì — incrementale, dopo C1 |

---

### I2 — Doppio meccanismo stato algebra *(prerequisito di B1)*
**File:** `ions32.js` (riga 8), `main.js` (riga 71)

```js
window.is32IonMode = false;    // ions32.js — stato su window
export let currentAlgState = 15; // main.js — stato come export
```
Due meccanismi completamente diversi per lo stesso tipo di informazione.

**Fix:** Creare `AppState = { currentAlg: 15, is32IonMode: false, ... }` come unico contenitore in `state.js`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 2 | Medio | Medio | Sì — prerequisito di B1 |

---

### N2 — CSS carousel frammentato tra 3 sorgenti *(dipende da D1)*
**File:** `base.css` (2 regole), `dock.css` (2 regole), CSS iniettato da `mobile.js`

Tre sorgenti per lo stesso componente. I conflitti di cascata spiegano la presenza di `!important` diffusi.

**Fix:** Unificare tutte le regole `.carousel-mode`, `.swipe-state-*`, `.hidden-tab`, `.no-transition` in un unico file (`sidebar.css` o `mobile.css`) in una sezione `/* === CAROUSEL & SWIPE === */`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 3 | Medio | Alto | Sì — dopo D1 |

---

### Checklist Ondata 3
- [ ] **C2** — `createTubeGeometry()` condivisa in `geometry.js`
- [ ] **C1** — `multiplyQuaternions` → `vecMul` + adattatori *(prerequisito F1)*
- [ ] **F1** — `initRotationSequence()` decomposta in sotto-funzioni *(dopo C1)*
- [ ] **I2** — `AppState` centralizzato in `state.js` *(prerequisito B1)*
- [ ] **N2** — CSS carousel in un unico file *(dopo D1)*

---
---

## ONDATA 4 — Modularizzazione: Alto Rischio, Fondamentale Per Il Futuro
> ⏱ Stima: **3–5 giorni** (con test di regressione)
> 🛡 Rischio regressione: **Alto** — ogni file che usa globali implicite deve essere modificato
> 🔑 Perché ora: Va fatta *dopo* che stato (I2) e matematica (C1, B2) sono già stati unificati.

### B1 — `data.js` e `algebra.js` non sono ES Modules *(dipende da B2 + I2)*
**File:** `data.js`, `algebra.js`, e tutti i consumatori

Caricati come `<script>` classici in `index.html`. Le loro definizioni (`vecMul`, `tableLookup`, `POSITIVE_TRIPLETS`, ecc.) finiscono nello scope globale. I moduli ES le usano senza `import`.

```js
// graph.js — usa POSITIVE_TRIPLETS senza averla importata
const tripletIdx = POSITIVE_TRIPLETS.findIndex(pt => ...); // Globale implicita
```

**Fix:** Aggiungere `export` a tutte le costanti/funzioni; aggiungere `import` in ogni file che le usa.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 4 | **Alto** | **Alto** | Sì — come progetto con test |

---

### L2 — Handler `onclick` inline nell'HTML *(dipende da B1)*
**File:** `index.html` (righe 175-191, 280, 382, 430, 459, 536-537, 741)

```html
<button onclick="saveKernelToVar('a')">a</button>
<button onclick="if(window.changeCalcHelperPage) window.changeCalcHelperPage(-1)">Indietro</button>
<button onclick="toggle32Ions()">...</button>
```
Dipende da B1 perché le funzioni devono essere importabili prima di poter essere collegate con `addEventListener`.

**Fix:** Sostituire ogni `onclick="..."` con `addEventListener` nei file JS.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 3 | Basso | Medio | Sì — dopo B1 |

---

### F2 — `toggleRotationMode()`: 120 righe di manipolazione DOM *(dipende da B1)*
**File:** `rotation.js` (righe 430-550)

Tocca almeno 15 elementi DOM via `getElementById`. Le due ramificazioni if/else hanno operazioni speculari quasi identiche senza astrazione.

```js
export function toggleRotationMode() {
    isRotationMode = !isRotationMode;
    const dbBtn = document.getElementById('sidebar-toggle-btn');
    const rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    // ... altri 13 getElementById
}
```

**Fix:** Estrarre `enterRotationMode()` e `exitRotationMode()` con lista esplicita degli elementi toccati.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 4 | **Alto** | **Alto** | Solo con test approfonditi |

---

### Checklist Ondata 4
- [ ] **B1** — `data.js` + `algebra.js` → ES Modules *(dopo B2 + I2)*
- [ ] **L2** — `onclick` inline → `addEventListener` *(dopo B1)*
- [ ] **F2** — `toggleRotationMode()` → `enterRotationMode()` / `exitRotationMode()` *(dopo B1)*

---
---

## ONDATA 5 — Re-Architettura: Massimo Rischio, Pianificazione Separata
> ⏱ Stima: **1–2 settimane — progetto a parte**
> 🛡 Rischio regressione: **Molto alto** — tocca infrastruttura cross-window e HTML strutturale
> 🔑 Perché dopo tutto il resto: Cambia come i componenti comunicano a livello fondamentale.

### A1 — Monkey-patching delle API Native del DOM
**File:** `calculator_popout.js` (righe 6-31)

```js
// I tre metodi nativi vengono riscritti PERMANENTEMENTE
document.getElementById = function(id) {
    let el = origGetId(id);
    if (!el && window.externalCalcWindow && !window.externalCalcWindow.closed) {
        el = window.externalCalcWindow.document.getElementById(id);
    }
    return el;
};
// Stessa cosa per querySelector e querySelectorAll
```
Dal momento in cui `calculator_popout.js` è importato, **ogni singola chiamata** a `document.getElementById` nell'intera app — incluse quelle di Three.js, i18n.js, sidebar.js — passa attraverso questa funzione custom.

Effetti: performance degradata, potenziale confusione di contesti DOM, incompatibilità con librerie di terze parti.

**Fix:** Sostituire con un bridge esplicito: `CalcBridge.getElementById(id, usePopout)`.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 4 | **Alto** | **Alto** | Sì — priorità assoluta |

---

### L1 — Stili inline su quasi ogni elemento di `index.html`
**File:** `index.html` (918 righe)

```html
<div id="steps-overlay"
    style="display:none; position:absolute; top:0; left:0; right:0; bottom:0;
           background:rgba(20, 20, 25, 0.98); z-index:2600; flex-direction:column;
           backdrop-filter:blur(10px); border-radius:8px;">
```
Ogni overlay, ogni pannello, ogni sezione ha stili inline. Impossibile sovrascrivere senza `!important`, impossibile creare temi, impossibile controllare il layout senza eseguire JS.

**Fix:** Creare classi CSS per ogni componente (`.overlay-steps`, `.overlay-kernel`, ecc.) e rimuovere gli inline.

| 🔧 Complessità | 🐛 Rischio | 💎 Beneficio | ✅ |
|:-:|:-:|:-:|:-:|
| 4 | Basso | **Alto** | Sì — lungo termine |

---

### Checklist Ondata 5
- [ ] **A1** — Rimuovere monkey-patching DOM, implementare `CalcBridge`
- [ ] **L1** — Eliminare stili inline da `index.html` (progetto a parte)

---
---

## ONDATA 6 — Riorganizzazione Strutturale (Esecuzione Manuale Graduale)
> ⏱ Stima: **3–5 giorni**
> 🛡 Rischio regressione: **Medio-Alto** — spostamento fisico dei file, tutti i path `import` devono essere aggiornati
> 🔑 Perché ora: Prerequisito per tutte le ondate successive. La struttura a domini rende ogni refactoring futuro più semplice e localizzato.

### Fase 1 — Sterminio dei Magic Numbers

Aggiungere in `js/constants.js` gli enumeratori semantici e fare Cerca-e-Sostituisci massiccio:

```js
export const ALGEBRAS   = { QUATERNIONS: 3, OCTONIONS: 7, SEDENIONS: 15 };
export const THRESHOLDS = { DRAG_MIN_DIST: 10, HOLD_INSPECTION_DELAY: 450 };
export const TIMINGS    = { CLOSURE_FLASH: 300, CLOSURE_PLAY: 800 };
```

Sostituire: `limitIndex === 15` → `limitIndex === ALGEBRAS.SEDENIONS`, `setTimeout(..., 450)` → `setTimeout(..., THRESHOLDS.HOLD_INSPECTION_DELAY)`, ecc.

---

### Fase 2 — Smembrare `main.js` (in loco, senza spostare cartelle)

Creare i nuovi script vuoti ed estrarre da `main.js`:

| Nuovo file | Cosa estrae da `main.js` |
|-----------|--------------------------|
| `closure.js` | Algoritmo iterazione chiusura algebrica |
| `state.js` | `AppState`, `filterSubspace` |
| `interaction3d.js` | Logica pointer Raycaster, Hold Point, Hitbox |
| `shortcuts.js` | Listener tastiera `keydown` |
| `calculator/calculator_formulas.js` | HTML identità notevoli e Formule demo |
| `calculator/calculator_window.js` | Gestione apertura e trascinamento finestra calcolatrice |

**Anti-patterns da eliminare durante l'estrazione:**

1. **`window.*` globali** (`window.closureTimer`, `window.runFormulaDemo`, ecc.) → diventano variabili locali esportate
2. **Timer accoppiati** — `abortAnimations()` va esportata dal modulo proprietario (`closure.js`), non chiamata da `resetView()`
3. **Stato DOM** (`dataset.lastClickedNode`) → spostare in `interaction3d.js` come `let holdState = { isHolding: false, targetType: null, targetId: null };`

---

### Fase 3 — Riorganizzazione Definitiva del File System

> ⚠️ **Attenzione:** al termine di questa fase l'app si romperà finché non saranno corretti tutti i path `import`. Lavorare meticolosamente file per file.

**Struttura di destinazione:**

```
js/
├── main.js              ← Bootstrapper centrale
├── /three/              ← Dipendenza esterna (immutata)
├── /lang/               ← Traduzioni (immutate)
│
├── /core/               ← Stato, Config, Globals
│   ├── constants.js
│   ├── i18n.js
│   ├── renderer.js
│   └── state.js         [NUOVO]
│
├── /math/               ← Logica algoritmica
│   ├── algebra.js
│   ├── parser.js
│   ├── data.js
│   └── closure.js       [NUOVO]
│
├── /3d/                 ← Scena, Geometria, WebGL
│   ├── scene.js
│   ├── geometry.js
│   ├── graph.js
│   ├── ions32.js
│   ├── rotation.js
│   ├── sequence.js      (da /rotations/sequence.js — cartella rotations eliminata)
│   └── interaction3d.js [NUOVO]
│
├── /ui/                 ← Comportamenti UI
│   ├── ui.js
│   ├── sidebar.js
│   ├── mobile.js
│   ├── table.js
│   └── shortcuts.js     [NUOVO]
│
└── /calculator/         ← Mini-app (già organizzata)
    ├── calculator_core.js
    ├── calculator_history.js
    ├── calculator_input.js
    ├── calculator_kernel.js
    ├── calculator_popout.js
    ├── calculator_steps.js
    ├── calculator_ui.js
    ├── calculator_zerodiv.js
    ├── calculator_formulas.js [NUOVO]
    └── calculator_window.js   [NUOVO]
```

---

### Checklist Ondata 6
- [ ] **Fase 1** — Magic numbers → costanti in `constants.js`; Cerca-e-Sostituisci in tutti i file
- [ ] **Fase 2** — Creare i 6 nuovi file; estrarre logiche da `main.js`; eliminare `window.*` globali; aggiungere `import` in `main.js`
- [ ] **Fase 3** — Spostare i file nelle cartelle di destinazione; aggiornare tutti i path `import`; verificare che l'app funzioni
- [ ] **Fase 4 (checklist anti-pattern)** — `window.*` rimossi; timer disaccoppiati; stato DOM → `interaction3d.js`

---
---

## ONDATA 7 — Completamento Ondata 0 e Pulizia Globali
> ⏱ Stima: **1–2 ore**
> 🛡 Rischio regressione: **Molto basso**
> 🔑 Perché ora: Sono gli item rimasti aperti delle ondate 0–1. Vanno chiusi prima di procedere.

### 7.1 — `J1`: `translateDOM()` usa `innerHTML` invece di `textContent`
**File:** `js/core/i18n.js`

Rinviato dall'Ondata 0 perché **molte chiavi di traduzione contengono effettivamente HTML** (`<b>`, `<strong>`, `<sub>`, `<br>`, `<code>`, `<a>`, ecc.). Un cambio secco a `textContent` romperebbe il rendering.

**Fix corretto — rilevamento automatico:**
```js
document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = dictionaries[currentLang][key];
    if (!value) return;
    // innerHTML solo se la traduzione contiene tag HTML o entità (es. &larr;)
    if (/(<[a-z][\s\S]*>|&[a-z0-9#]+;)/i.test(value)) {
        el.innerHTML = value;
    } else {
        el.textContent = value;
    }
});
```
Non serve DOMPurify: i file di traduzione sono sorgenti locali controllate.

---

### 7.2 — `calculator_steps.js`: funzioni esposte su `window` → event delegation
**File:** `js/calculator/calculator_steps.js`

Il pattern L2 (onclick → addEventListener) risolto per `index.html` non si applica direttamente qui perché `calculator_steps.js` genera HTML dinamicamente a runtime con `innerHTML`. Le funzioni erano chiamate da `onclick="..."` inseriti dinamicamente.

**Fix — event delegation sul container:**
```js
// 1. Le funzioni diventano locali (non su window)
function switchMulTab(uid, k, btn) { ... }
function explainMul(A, B) { ... }
// ecc.

// 2. Negli innerHTML generati, sostituire:
//    onclick="switchMulTab(...)"
// con attributi data:
//    data-action="switchMulTab" data-uid="${uid}" data-k="${k}"

// 3. Un singolo listener delegato:
stepsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, uid, k } = btn.dataset;
    if (action === 'switchMulTab') switchMulTab(uid, parseInt(k, 10), btn);
    // ecc.
});
```

---

### Checklist Ondata 7
- [ ] **7.1** — `translateDOM()`: `innerHTML` condizionale con regex HTML+entità in `i18n.js`
- [ ] **7.2** — `calculator_steps.js`: 7 funzioni `window.*` → locali + event delegation `data-action`

---
---

## ONDATA 8 — CSS: Consolidamento Carousel
> ⏱ Stima: **2–4 ore**
> 🛡 Rischio regressione: **Basso** (solo CSS, nessuna logica)
> 🔑 Perché ora: D1 è stato completato (CSS iniettato da JS è sparito). Le regole carousel statiche rimangono ancora sparse tra 3 file.

### 8.1 — N2: Regole carousel ancora frammentate
**File:** `css/base.css`, `css/dock.css`, `css/sidebar.css`

Nonostante D1 abbia rimosso il CSS iniettato da JS, le regole statiche `.carousel-mode`, `.swipe-state-*`, `.hidden-tab`, `.no-transition` rimangono distribuite in più file. `sidebar.css` ha già la concentrazione maggiore ed è il file semanticamente corretto.

**Fix:**
1. Cercare tutte le occorrenze dei selettori carousel in `base.css` e `dock.css`
2. Spostarle in `sidebar.css` in una sezione `/* === CAROUSEL & SWIPE === */`
3. Verificare che nessuna regola sia duplicata (causa degli `!important` attuali)
4. Dopo consolidamento, eliminare gli `!important` non più necessari

**Beneficio:** eliminare la necessità di `!important` nel CSS carousel, rendendolo sovrascrivibile per tematizzazione futura.

---

### Checklist Ondata 8
- [ ] **8.1** — Consolidare regole carousel da `base.css` + `dock.css` → `sidebar.css`
- [ ] Eliminare gli `!important` resi superflui dalla consolidazione

---
---

## ONDATA 9 — Refactoring `filterSubspace()`: Separazione delle Responsabilità
> ⏱ Stima: **mezza giornata**
> 🛡 Rischio regressione: **Medio** — tocca la logica di cambio algebra; testare visivamente dopo
> 🔑 Perché ora: `state.js` è diventato il nuovo `main.js` monolitico. `filterSubspace()` ha 80+ righe e tocca 4 domini distinti, violando il principio di responsabilità singola.

### 9.1 — `filterSubspace()` in `state.js`: God Function secondaria
**File:** `js/core/state.js`

La funzione tocca simultaneamente: badge closure (DOM), titolo algebra + trigger mobile (DOM), dot selector `.alg-dot` (DOM), visibilità nodi 3D `pointObjects` (Three.js), visibilità terne `tripletVisuals` (Three.js), tab sidebar (DOM), `buildTable()` (logica tabella), pulsante dock zero-divisori (DOM).

**Fix — estrarre 3 sotto-funzioni:**

```js
// In js/ui/table.js
export function updateTableForAlgebra(limitIndex) {
    tableState.activeRow = null;
    tableState.activeCol = null;
    buildTable(limitIndex);
}

// In js/3d/scene.js
export function updateSceneVisibility(limitIndex) {
    for (let idStr in pointObjects) {
        const id = parseInt(idStr);
        pointObjects[id].mesh.visible = id <= limitIndex;
        pointObjects[id].label.visible = id <= limitIndex;
    }
    tripletVisuals.forEach((t, i) => {
        const isVisible = t.ids.every(val => val <= limitIndex);
        t.mesh.visible = isVisible;
        if (t.hitMesh) t.hitMesh.visible = isVisible;
        const btn = document.querySelectorAll('.triplet-btn')[i];
        if (btn) btn.style.display = isVisible ? 'block' : 'none';
    });
}

// In state.js — filterSubspace() diventa orchestratore
function updateAlgebraUI(limitIndex) { /* solo DOM: titolo, dots, tab, dock button */ }

export function filterSubspace(limitIndex) {
    updateAlgebraUI(limitIndex);
    // Usare CustomEvent per evitare import circolare con scene.js:
    window.dispatchEvent(new CustomEvent('algebraChanged', { detail: { limitIndex } }));
    updateTableForAlgebra(limitIndex);
}
```

> **Attenzione:** verificare il grafo delle dipendenze prima di aggiungere nuovi import tra `state.js` e `scene.js` per non creare cicli.

---

### Checklist Ondata 9
- [ ] **9.1** — Estrarre `updateTableForAlgebra()` in `table.js`
- [ ] **9.1** — Estrarre `updateSceneVisibility()` in `scene.js` (con listener `CustomEvent`)
- [ ] **9.1** — `filterSubspace()` ridotta a orchestratore di 10–15 righe
- [ ] Verificare assenza di cicli di import introdotti dalle nuove dipendenze

---
---

## ONDATA 10 — Architettura: Grafo delle Dipendenze e `initRotationSequence()`
> ⏱ Stima: **2–3 giorni**
> 🛡 Rischio regressione: **Medio-Alto** — tocca la struttura degli import tra moduli
> 🔑 Perché ultima (del blocco 7–10): richiede che tutto il resto sia già stabile.

### 10.1 — `state.js` ha import circolari latenti
**File:** `js/core/state.js`

`state.js` importa da `scene.js`, `rotation.js`, `table.js`. Se uno di questi importa (direttamente o transitivamente) da `state.js`, si crea un ciclo. Gli ES Modules gestiscono i cicli con binding live ma il comportamento è difficile da debuggare.

**Fix — event bus per le comunicazioni bidirezionali:**
```js
// Invece di: import { updateSceneVisibility } from '../3d/scene.js'
// In state.js:
window.dispatchEvent(new CustomEvent('algebraChanged', { detail: { limitIndex } }));

// In scene.js:
window.addEventListener('algebraChanged', (e) => updateSceneVisibility(e.detail.limitIndex));
```

Documentare il grafo finale in `ARCHITECTURE.md`.

---

### 10.2 — `initRotationSequence()` ancora a ~400 righe
**File:** `js/3d/sequence.js`

Le funzioni logiche (`getValidQuaternions`, `calculateQTot`, `updateResultDisplay`) sono state estratte come top-level ✅. Ma `initRotationSequence()` è ancora grande perché cattura i riferimenti DOM via closure invece di leggerli da variabili di modulo.

**Fix — cachare i DOM node a livello di modulo:**
```js
// A livello modulo (fuori da initRotationSequence):
let container, addBtn, resultDisplay;

export function initRotationSequence() {
    container     = document.getElementById('rot-seq-container');
    addBtn        = document.getElementById('rot-add-btn');
    resultDisplay = document.getElementById('rot-result');
    // Le sotto-funzioni ora leggono dalle variabili di modulo, non dalla closure
}

function addEmptyRow() {
    container.appendChild(...); // legge dalla variabile di modulo
}
```

> **Test richiesti dopo ogni modifica:** add/remove riga, calcolo QTot, navigazione frecce, modalità mobile.

---

### Checklist Ondata 10
- [ ] **10.1** — Mappare il grafo completo degli import ES6
- [ ] **10.1** — Sostituire import circolari con `CustomEvent` dove necessario
- [ ] **10.1** — Creare/aggiornare `ARCHITECTURE.md` con il grafo documentato
- [ ] **10.2** — DOM node di `sequence.js` a livello modulo, non catturati da closure
- [ ] **10.2** — `initRotationSequence()` ridotta a ~50 righe di collegamento
- [ ] Test manuale completo della feature rotation sequence

---
---

## ONDATA 11 — Eliminazione Globals Residui in `parser.js` e `algebra.js`
> ⏱ Stima: **1–2 ore**
> 🛡 Rischio regressione: **Basso** — cambio meccanico di import/export
> 🔑 Perché prima (del blocco 11–13): `formatVecGlobal` e `preprocessExpr` sono usate da 3 file del dominio `calculator/`. Una race condition (modulo consumatore caricato prima del produttore) causa `TypeError` silenzioso. Sono prerequisito di Ondata 12 perché i file coinvolti nei cicli di import devono essere stabili prima di riorganizzarli.

### 11.1 — `parser.js`: 4 assegnazioni su `window` → `export`
**File:** `js/math/parser.js` (righe 6, 9, 17, 410)

```js
window.EPSILON = EPSILON;                    // riga 6  — già esportato, ridondante
window.createZeroVector = createZeroVector;  // riga 9  — già esportato, ridondante
window.preprocessExpr = function (str) { ... } // riga 17 — NON esportato
window.formatVecGlobal = function (v) { ... }  // riga 410 — NON esportato
```

**Consumatori da aggiornare:**

| File | `window.preprocessExpr` | `window.formatVecGlobal` |
|------|:-----------------------:|:-----------------------:|
| `calculator/calculator_core.js` | 5 | 3 |
| `calculator/calculator_steps.js` | 1 | 17 |
| `calculator/calculator_kernel.js` | 0 | 2 |

**Fix — in `parser.js`:**
```js
// Rimuovere le 4 righe window.*
// Aggiungere export alle due funzioni mancanti:
export function preprocessExpr(str) { ... }
export function formatVec(v) { ... }  // rinominata da formatVecGlobal
```

**Fix — nei 3 consumatori:**
```js
import { ..., preprocessExpr, formatVec } from '../math/parser.js';
// Sostituire ogni window.preprocessExpr(x) → preprocessExpr(x)
// Sostituire ogni window.formatVecGlobal(x) → formatVec(x)
```
Rimuovere anche il guard `typeof window.formatVecGlobal !== 'undefined'` in `calculator_kernel.js`.

---

### 11.2 — `algebra.js`: `window.randCache` e `window.randCacheIndex` → stato di modulo
**File:** `js/math/algebra.js` (righe 138-297); `js/calculator/calculator_steps.js` (riga 286); `js/calculator/calculator_core.js` (righe 82, 159, 332)

Il meccanismo di cache per i vettori casuali usa `window.randCache` (array) e `window.randCacheIndex` (puntatore) come stato condiviso tra `algebra.js` (produttore) e i file `calculator/` (che resettano l'indice). Stato condiviso implicito tra moduli non correlati.

```js
// algebra.js — usa window.randCacheIndex nonostante let randCacheIndex = 0 dichiarato a riga 138
window.randCache[window.randCacheIndex++] = { limit: key, vec: res };

// calculator_steps.js — resetta l'indice prima di ogni calcolo
window.randCacheIndex = 0;
```

**Fix — in `algebra.js`:**
```js
let _randCache = [];
let _randCacheIndex = 0;

export function resetRandCache() { _randCacheIndex = 0; }

// Sostituire internamente window.randCache[window.randCacheIndex] → _randCache[_randCacheIndex]
```

**Fix — nei consumatori:**
```js
import { ..., resetRandCache } from '../math/algebra.js';
// window.randCacheIndex = 0  →  resetRandCache()
```

---

### Checklist Ondata 11
- [ ] **11.1** — Rimuovere `window.EPSILON` e `window.createZeroVector` da `parser.js` (ridondanti)
- [ ] **11.1** — Esportare `preprocessExpr` → aggiornare 6 occorrenze in `calculator_core.js` + `calculator_steps.js`
- [ ] **11.1** — Esportare `formatVec` (ex `formatVecGlobal`) → aggiornare 22 occorrenze in 3 file
- [ ] **11.1** — Rimuovere guard `typeof window.formatVecGlobal !== 'undefined'` in `calculator_kernel.js`
- [ ] **11.2** — `randCache` + `randCacheIndex` come stato privato in `algebra.js`
- [ ] **11.2** — Esportare `resetRandCache()` da `algebra.js`
- [ ] **11.2** — Sostituire `window.randCacheIndex = 0` con `resetRandCache()` (4 occorrenze in 2 file)

---
---

## ONDATA 12 — Cicli di Import e Documentazione Architetturale
> ⏱ Stima: **mezza giornata** (12.1) + **1 ora** (12.2)
> 🛡 Rischio regressione: **Medio** — tocca la struttura degli import tra i moduli core
> 🔑 Perché dopo l'Ondata 11: i moduli coinvolti (`table.js`, `main.js`, `state.js`, `ions32.js`) devono avere i propri export stabili prima di riorganizzare le dipendenze.

### 12.1 — Spezzare i due cicli di import ES6 confermati
**File coinvolti:** `js/core/state.js`, `js/ui/table.js`, `js/main.js`, `js/3d/ions32.js`

**Ciclo 1 (confermato a 3 vie):**
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

Il problema radice è che `table.js` importa da `main.js`. `currentAlgState` e `resetView` appartengono a `state.js`, non a `main.js`. La comunicazione inversa (`resetView` chiamata da `table.js`) va sostituita con un CustomEvent:

```js
// In table.js — rimuovere:
import { currentAlgState, tripletButtons, resetView } from '../main.js';

// Sostituire la chiamata a resetView() con:
window.dispatchEvent(new CustomEvent('requestResetView'));

// In main.js — aggiungere il listener:
window.addEventListener('requestResetView', () => resetView());

// tripletButtons → spostare nel modulo proprietario (es. state.js o nuovo ui/triplets.js)
```

**Fix — Ciclo 2:**
```js
// In ions32.js — rimuovere:
import { resetView, AppState } from '../main.js';

// Sostituire con:
import { AppState } from '../core/state.js';
window.dispatchEvent(new CustomEvent('requestResetView')); // invece di resetView()
```

> **Prima di iniziare:** verificare con `grep -rn "from.*main.js"` tutti i moduli che importano da `main.js` (oltre a `table.js` e `ions32.js`) per non lasciare import rotti.

---

### 12.2 — `ARCHITECTURE.md`: documentare il grafo completo e reale
**File:** `ARCHITECTURE.md` (root progetto)

Il file esistente è corretto ma incompleto: non documenta i cicli (ora risolti da 12.1) né la tabella completa degli eventi usati come bus. Va aggiornato dopo 12.1 per riflettere il grafo definitivo.

**Struttura da aggiungere:**

```
Livello 0 — Nessun import locale
  js/math/algebra.js, js/math/data.js, js/core/constants.js

Livello 1 — Importa solo da Livello 0
  js/math/parser.js, js/core/i18n.js, js/core/renderer.js

Livello 2 — Importa da Livello 0-1
  js/3d/geometry.js, js/math/closure.js

Livello 3 — Importa da Livello 0-2
  js/3d/scene.js, js/3d/rotation.js

Livello 4 — Importa da Livello 0-3
  js/3d/graph.js, js/3d/ions32.js [+event bus]
  js/ui/table.js [+event bus], js/core/state.js

Livello 5 — Bootstrapper
  js/main.js
```

| Evento | Emesso da | Ascoltato da |
|--------|-----------|--------------|
| `algebraChanged` | `state.js` | `scene.js` |
| `requestResetView` | `table.js`, `ions32.js` | `main.js` |
| `triggerToggle32Ions` | `state.js` | `main.js` |
| `triggerResetView` | `state.js` | `main.js` |
| `languageChanged` | `i18n.js` | `ui.js`, altri |

---

### Checklist Ondata 12
- [ ] **12.1** — Rimuovere `import { resetView } from '../main.js'` da `table.js` → `CustomEvent('requestResetView')`
- [ ] **12.1** — Spostare `tripletButtons` fuori da `main.js` nel modulo proprietario
- [ ] **12.1** — Rimuovere `import { resetView, AppState } from '../main.js'` da `ions32.js` → `AppState` da `state.js`, `resetView` via evento
- [ ] **12.1** — Audit completo: `grep -rn "from.*main.js"` e correggere ogni import non-bootstrap rimasto
- [ ] **12.2** — Aggiornare `ARCHITECTURE.md` con grafo per livelli + tabella event bus

---
---

## ONDATA 13 — Completamento 10.2 e Pulizia G2 Residua
> ⏱ Stima: **mezza giornata**
> 🛡 Rischio regressione: **Basso** — refactoring puramente strutturale, nessuna logica cambia
> 🔑 Perché dopo Ondata 12: il grafo degli import deve essere stabile prima di estrarre nuove sotto-funzioni da `sequence.js`, altrimenti le eventuali dipendenze aggiunte potrebbero riaprire i cicli appena chiusi.

### 13.1 — `initRotationSequence()`: 182 righe → ~50 righe
**File:** `js/3d/sequence.js`

**Stato:** Il fix 10.2 è parzialmente fatto (DOM node a livello di modulo ✅), ma 3 blocchi logici distinti non sono stati estratti. La funzione va da riga 268 a fine file (450).

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

// Risultato finale — initRotationSequence() ~40 righe:
export function initRotationSequence() {
    rotSidebarBtn = document.getElementById('rot-sidebar-btn');
    sidebar       = document.getElementById('sidebar');
    listContainer = document.getElementById('rot-sequence-list');
    clearBtn      = document.getElementById('rot-seq-clear');
    calcQtotBtn   = document.getElementById('calc-qtot-btn');
    calcProtBtn   = document.getElementById('calc-prot-btn');

    initSidebarButton();
    initKeyboardNavigation();
    addFixedQ0();
    addEmptyRow();

    if (clearBtn) clearBtn.addEventListener('click', () => { ... }); // 8 righe
    if (listContainer) listContainer.addEventListener('input', () => { ... }); // 3 righe

    initCalculateButtons();
}
```

> **Test richiesti dopo ogni estrazione:** add/remove riga, calcolo qTot, navigazione frecce, modalità mobile.

---

### 13.2 — Inline style residui in `addFixedQ0()` → classi CSS
**File:** `js/3d/sequence.js`, `css/calc/calc-layout.css`

Il template HTML di `addFixedQ0()` contiene due style inline:
```html
<div style="flex:1; width:100%; min-width:0;"></div>
<span class="rot-plus" style="visibility:hidden;">+</span>
```
Violazione residua di G2.

**Fix — in `sequence.js`:**
```html
<div class="q0-spacer"></div>
<span class="rot-plus rot-plus-hidden">+</span>
```

**Fix — in `calc-layout.css`:**
```css
.q0-spacer      { flex: 1; width: 100%; min-width: 0; }
.rot-plus-hidden { visibility: hidden; }
```

> **Nota:** `calculator_steps.js` contiene 63 occorrenze di `style="..."` in template HTML generati dinamicamente. Richiedono ~2–4 ore di lavoro aggiuntivo e possono essere trattati come **Ondata 14** separata.

---

### Checklist Ondata 13
- [ ] **13.1** — Estrarre `initSidebarButton()` da `initRotationSequence()`
- [ ] **13.1** — Estrarre `initKeyboardNavigation()` da `initRotationSequence()`
- [ ] **13.1** — Estrarre `initCalculateButtons()` da `initRotationSequence()`
- [ ] **13.1** — Verificare che `initRotationSequence()` sia ≤ 50 righe
- [ ] **13.1** — Test manuale: add/remove riga, qTot, navigazione frecce, mobile
- [ ] **13.2** — Sostituire 2 inline style in `addFixedQ0()` con classi CSS
- [ ] **13.2** — Aggiungere `.q0-spacer` e `.rot-plus-hidden` in `calc-layout.css`

---
---

## Checklist Esecutiva Globale

### ✅ Ondata 0 — Zero Rischio (30 min)
- [ ] H1 — `MOBILE_BP` + `isMobile()` in `constants.js`, 18 literal sostituiti
- [ ] J2 — `document.documentElement.lang = lang` in `setLanguage()`
- [ ] K1 — `forceRender` event rimosso → `forceUpdate()` diretto (4 punti)
- [ ] M2 — `isDraggingSphere` rimossa
- [ ] N1 — Commento duplicato `dock.css` rimosso
- [ ] N3 — Default musica OFF + `bgMusic.onerror`

### ✅ Ondata 1 — Quick Wins (mezza giornata)
- [ ] I1 — Persistenza tema/velocità/opacità/musica in `localStorage`
- [ ] D1 — CSS iniettato da JS → file `.css` statici *(prerequisito N2)*
- [ ] G2 — Stili inline dinamici → classi CSS *(dopo D1)*
- [ ] E1 — `zManager` centralizzato in `constants.js`
- [ ] B2 — `createZeroVector` rimossa da `algebra.js` *(prerequisito B1)*

### ✅ Ondata 2 — Performance (1 giornata)
- [ ] M1 — 3 materiali GPU pre-istanziati in `calculator_zerodiv.js`
- [ ] G1 — `buildTable()` con diff invece di reset totale
- [ ] K2 — Listener drag: aggiungi su `pointerdown`, rimuovi su `pointerup`
- [ ] E2 — `updateSidebarCarousel` esportata come ES module function

### ✅ Ondata 3 — Refactoring Logico (3–4 giorni)
- [ ] C2 — `createTubeGeometry()` condivisa in `geometry.js`
- [ ] C1 — `multiplyQuaternions` → `vecMul` + adattatori *(prima di F1)*
- [ ] F1 — `initRotationSequence()` decomposta *(dopo C1)*
- [ ] I2 — `AppState` centralizzato in `state.js` *(prima di B1)*
- [ ] N2 — CSS carousel in un unico file *(dopo D1)*

### ✅ Ondata 4 — Modularizzazione (3–5 giorni)
- [ ] B1 — `data.js` + `algebra.js` → ES Modules *(dopo B2 + I2)*
- [ ] L2 — `onclick` inline → `addEventListener` *(dopo B1)*
- [ ] F2 — `toggleRotationMode()` → `enter/exit` *(dopo B1, con test)*

### ✅ Ondata 5 — Re-Architettura (1–2 settimane)
- [ ] A1 — Monkey-patching DOM → `CalcBridge` esplicito
- [ ] L1 — Stili inline da `index.html` → classi CSS (progetto a parte)

### ✅ Ondata 6 — Riorganizzazione Strutturale (3–5 giorni)
- [ ] Fase 1 — Magic numbers → costanti semantiche in `constants.js`
- [ ] Fase 2 — Smembrare `main.js`: 6 nuovi file + import puliti
- [ ] Fase 3 — Spostare file nelle cartelle di destinazione; aggiornare path
- [ ] Fase 4 (anti-pattern) — `window.*` rimossi; timer disaccoppiati; stato DOM → `interaction3d.js`

### ✅ Ondata 7 — Completamento e pulizia globali (1–2 ore)
- [ ] 7.1 — `translateDOM()`: `innerHTML` condizionale in `i18n.js`
- [ ] 7.2 — `calculator_steps.js`: 7 funzioni `window.*` → event delegation `data-action`

### ✅ Ondata 8 — CSS Carousel (2–4 ore)
- [ ] 8.1 — Regole carousel consolidate in `sidebar.css`
- [ ] Eliminare `!important` superflui

### ✅ Ondata 9 — `filterSubspace()` decomposta (mezza giornata)
- [ ] 9.1 — `updateTableForAlgebra()` in `table.js`
- [ ] 9.1 — `updateSceneVisibility()` in `scene.js` (via `CustomEvent`)
- [ ] 9.1 — `filterSubspace()` ridotta a orchestratore ~10 righe
- [ ] Verifica assenza cicli import

### ✅ Ondata 10 — Architettura (2–3 giorni)
- [ ] 10.1 — Grafo completo degli import mappato
- [ ] 10.1 — Import circolari → `CustomEvent` dove necessario
- [ ] 10.1 — `ARCHITECTURE.md` creato con grafo documentato
- [ ] 10.2 — DOM node di `sequence.js` a livello modulo
- [ ] 10.2 — `initRotationSequence()` ridotta a ~50 righe
- [ ] Test manuale completo rotation sequence

### ✅ Ondata 11 — Globals residui in `parser.js` e `algebra.js` (1–2 ore)
- [ ] 11.1 — Rimuovere `window.EPSILON` e `window.createZeroVector` (ridondanti)
- [ ] 11.1 — Esportare `preprocessExpr` → 6 occorrenze nei consumatori
- [ ] 11.1 — Esportare `formatVec` → 22 occorrenze in 3 file
- [ ] 11.1 — Rimuovere guard `typeof window.formatVecGlobal !== 'undefined'`
- [ ] 11.2 — `randCache` + `randCacheIndex` → stato privato di `algebra.js`
- [ ] 11.2 — Esportare `resetRandCache()`
- [ ] 11.2 — `window.randCacheIndex = 0` → `resetRandCache()` (4 occorrenze)

### ✅ Ondata 12 — Cicli di import (mezza giornata + 1 ora)
- [ ] 12.1 — Spezzare Ciclo 1: `table.js` → `main.js` via `CustomEvent('requestResetView')`
- [ ] 12.1 — Spostare `tripletButtons` nel modulo proprietario
- [ ] 12.1 — Spezzare Ciclo 2: `ions32.js` → `main.js` via `state.js` + evento
- [ ] 12.1 — Audit: nessun import da `main.js` in moduli non-bootstrap
- [ ] 12.2 — `ARCHITECTURE.md` con grafo per livelli + tabella event bus

### ✅ Ondata 13 — Completamento `sequence.js` e G2 residuo (mezza giornata)
- [ ] 13.1 — Estrarre `initSidebarButton()`
- [ ] 13.1 — Estrarre `initKeyboardNavigation()`
- [ ] 13.1 — Estrarre `initCalculateButtons()`
- [ ] 13.1 — `initRotationSequence()` ≤ 50 righe; test manuale completo
- [ ] 13.2 — 2 inline style in `addFixedQ0()` → `.q0-spacer` e `.rot-plus-hidden` in CSS

---

*Documento unificato — generato il 2026-04-18 — copre le analisi dal 2026-04-15 al 2026-04-18.*
*Ondate 0–5: analisi originale (code_analysis.md + code_analysis_ondate.md)*
*Ondata 6: piano strategico (implementation_plan.md)*
*Ondate 7–10: roadmap post-refactoring (ondate_7-10.md)*
*Ondate 11–13: analisi sul codice effettivo post-Ondate 0–10 (ondate_11-13.md)*
