# Cayley-Dickson App — Grafo delle Dipendenze

Questo documento mappa l'architettura a moduli ES6 dell'applicativo post-refactoring. L'obiettivo è prevenire import circolari e mantenere la chiara separazione dei domini introdotta nell'Ondata 6.

## Grafo Completo degli Import (post-Ondata 12)

### Livelli architetturali (dipendenze solo verso il basso)

```text
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