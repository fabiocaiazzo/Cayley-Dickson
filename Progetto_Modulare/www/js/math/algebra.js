import { tableLookup, ZERO_DIVISORS_RAW } from './data.js';
import { createZeroVector } from './parser.js'; // Come da tua modifica Ondata 1 (B2)
import { TRIPLETS_32 } from '../3d/ions32.js';
import { AppState } from '../core/state.js';

const tableLookup32 = Array.from({ length: 32 }, () => new Array(32).fill({ s: 1, i: 0 }));
for(let i=0; i<32; i++) {
    tableLookup32[i][0] = { s: 1, i: i };
    tableLookup32[0][i] = { s: 1, i: i };
    if(i > 0) tableLookup32[i][i] = { s: -1, i: 0 };
}
TRIPLETS_32.forEach(([a, b, c]) => {
    tableLookup32[a][b] = { s: 1, i: c };
    tableLookup32[b][c] = { s: 1, i: a };
    tableLookup32[c][a] = { s: 1, i: b };

    tableLookup32[b][a] = { s: -1, i: c };
    tableLookup32[c][b] = { s: -1, i: a };
    tableLookup32[a][c] = { s: -1, i: b };
});

// === MOTORE ALGEBRICO E OPERAZIONI VETTORIALI ===

export function vecAdd(v1, v2) {
    const r = new Array(32);
    for (let i = 0; i < 32; i++) r[i] = v1[i] + v2[i];
    return r;
}

export function vecSub(v1, v2) {
    const r = new Array(32);
    for (let i = 0; i < 32; i++) r[i] = v1[i] - v2[i];
    return r;
}

export function vecScale(v, s) {
    const r = new Array(32);
    for (let i = 0; i < 32; i++) r[i] = v[i] * s;
    return r;
}

export function vecNormSq(v) {
    let sum = 0;
    for (let i = 0; i < 32; i++) sum += v[i] * v[i];
    return sum;
}

export function vecNorm(v) {
    const r = new Array(32).fill(0);
    r[0] = Math.sqrt(vecNormSq(v));
    return r;
}

export function vecConj(v) {
    const r = new Array(32);
    r[0] = v[0];
    for (let i = 1; i < 32; i++) r[i] = -v[i];
    return r;
}

export function vecInv(v) {
    const n2 = vecNormSq(v);
    if (n2 < 1e-30) throw "Divisione per zero";

    const s = 1 / n2;
    const r = new Array(32);
    r[0] = v[0] * s;
    for (let i = 1; i < 32; i++) r[i] = -v[i] * s;
    return r;
}

export function vecPow(base, exponentVec) {
    for (let i = 1; i < 32; i++) {
        if (Math.abs(exponentVec[i]) > 1e-9) throw "L'esponente deve essere un numero reale.";
    }
    let n = Math.round(exponentVec[0]);
    if (Math.abs(exponentVec[0] - n) > 1e-9) throw "L'esponente deve essere un intero.";

    if (n === 0) {
        const res = createZeroVector();
        res[0] = 1;
        return res;
    }
    if (n === 1) return base;

    let isNegative = false;
    if (n < 0) {
        isNegative = true;
        n = -n;
    }

    let res = base;
    for (let i = 1; i < n; i++) {
        res = vecMul(res, base);
    }

    if (isNegative) return vecInv(res);
    return res;
}

export function vecMul(A, B) {
    const res = new Array(32).fill(0);
    const dim = (AppState && AppState.is32IonMode) ? 32 : 16;
    const lookup = (AppState && AppState.is32IonMode) ? tableLookup32 : tableLookup;

    for (let i = 0; i < dim; i++) {
        if (Math.abs(A[i]) < 1e-30) continue;

        for (let j = 0; j < dim; j++) {
            if (Math.abs(B[j]) < 1e-30) continue;

            const { s, i: idx } = lookup[i][j];
            res[idx] += A[i] * B[j] * s;
        }
    }
    return res;
}

export function vecDot(A, B) {
    let sum = 0;
    for (let i = 0; i < 32; i++) sum += A[i] * B[i];
    const res = createZeroVector();
    res[0] = sum;
    return res;
}

// Commutator: [a,b] = ab - ba
export function vecComm(a, b) {
    return vecSub(vecMul(a, b), vecMul(b, a));
}
// Associator: [a,b,c] = (ab)c - a(bc)
export function vecAssoc(a, b, c) {
    return vecSub(vecMul(vecMul(a, b), c), vecMul(a, vecMul(b, c)));
}

// Funzione per creare base al volo (e_n)
export function createBaseVec(valVec) {
    for (let i = 1; i < 32; i++) {
        if (Math.abs(valVec[i]) > 1e-9) throw "L'indice di e_(...) deve essere un numero reale, non un numero complesso.";
    }

    const n = valVec[0];
    const limit = (AppState && AppState.is32IonMode) ? 31 : 15;

    if (Math.abs(n - Math.round(n)) > 1e-9) throw "L'indice di base deve essere un numero intero.";

    const idx = Math.round(n);

    if (idx < 0 || idx > limit) {
        throw `e_() accetta 0, 1, ..., ${limit}`;
    }

    const res = createZeroVector();
    res[idx] = 1;
    return res;
}

let _randCache = [];
let _randCacheIndex = 0;

export function resetRandCache() {
    _randCacheIndex = 0;
}

export function getRandCache() {
    return _randCache;
}

export function setRandCache(newCache) {
    _randCache = newCache;
}

export function clearRandCache() {
    _randCache = [];
    _randCacheIndex = 0;
}

// Calcola la base del kernel sinistro di A (vettori v tali che A*v = 0)
export function computeKernelBasis(A) {
    const dim = (AppState && AppState.is32IonMode) ? 32 : 16;
    const M = Array.from({ length: dim }, () => new Array(dim).fill(0));
    for (let j = 0; j < dim; j++) {
        const ej = new Array(32).fill(0);
        ej[j] = 1;
        const prod = vecMul(A, ej);
        for (let i = 0; i < dim; i++) M[i][j] = prod[i];
    }
    let lead = 0;
    const pivotCols = [];
    for (let r = 0; r < dim; r++) {
        if (lead >= dim) break;

        // Partial Pivoting: cerca l'elemento maggiore per ridurre gli errori
        let maxVal = 0;
        let maxIdx = r;
        for (let row = r; row < dim; row++) {
            if (Math.abs(M[row][lead]) > maxVal) {
                maxVal = Math.abs(M[row][lead]);
                maxIdx = row;
            }
        }

        if (maxVal < 1e-7) { // Tolleranza più ampia per evitare falsi pivot
            lead++;
            r--; // Rimani sulla stessa riga ma passa alla prossima colonna
            continue;
        }

        let i = maxIdx;
        [M[i], M[r]] = [M[r], M[i]];
        pivotCols.push(lead);
        const lv = M[r][lead];

        for (let j = 0; j < dim; j++) M[r][j] /= lv;

        for (let k = 0; k < dim; k++) {
            if (k !== r) {
                const lv2 = M[k][lead];
                if (Math.abs(lv2) > 1e-10) { // Salta i calcoli per gli zeri per non accumulare errori
                    for (let j = 0; j < dim; j++) M[k][j] -= lv2 * M[r][j];
                }
            }
        }
        lead++;
    }
    const basis = [];
    for (let c = 0; c < dim; c++) {
        if (!pivotCols.includes(c)) {
            const v = new Array(32).fill(0);
            v[c] = 1;
            for (let j = 0; j < pivotCols.length; j++) v[pivotCols[j]] = -M[j][c];

            // Normalizzazione a interi per evitare decimali in rand(0)
            let bestScale = 1;
            let foundInt = false;
            for (let d = 1; d <= 10000; d++) {
                let allIntegers = true;
                for (let k = 0; k < dim; k++) {
                    if (Math.abs(v[k]) < 1e-9) continue;
                    const val = v[k] * d;
                    if (Math.abs(val - Math.round(val)) > 1e-4) {
                        allIntegers = false;
                        break;
                    }
                }
                if (allIntegers) { bestScale = d; foundInt = true; break; }
            }
            for (let k = 0; k < dim; k++) {
                if (foundInt) {
                    v[k] = Math.round(v[k] * bestScale);
                }
                if (Math.abs(v[k]) < 1e-9) v[k] = 0;
            }

            basis.push(v);
        }
    }
    return basis;
}

// Genera un sedenione divisore dello zero "completo"
export function createRandomZeroDivisor() {
    const zdRaw = ZERO_DIVISORS_RAW[Math.floor(Math.random() * ZERO_DIVISORS_RAW.length)];
    let A = new Array(32).fill(0);
    A[zdRaw[0]] = 1;
    A[zdRaw[1]] = 1;

    function randomCombination(basis) {
        const res = new Array(32).fill(0);
        const dim = (AppState && AppState.is32IonMode) ? 32 : 16;
        for (const bv of basis) {
            const t = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
            for (let i = 0; i < dim; i++) res[i] += bv[i] * t;
        }
        return res;
    }

    const basisA = computeKernelBasis(A);
    if (basisA.length === 0) return A;

    let B = randomCombination(basisA);
    let attempts = 0;
    while (B.every(x => Math.abs(x) < 1e-9) && attempts < 5) {
        B = randomCombination(basisA);
        attempts++;
    }

    // A è un divisore sinistro, quindi B (combinazione del suo nucleo) è un divisore destro.
    // Coniugando B otteniamo B*, che è matematicamente un divisore sinistro.
    // Essendo B formato da 8 vettori base, B* è già un divisore denso!
    // Evitiamo ulteriori kernel a catena per annullare totalmente gli errori di precisione (floating point).
    return vecConj(B);
}

export function createRandomVec(valVec) {
    for (let i = 1; i < 32; i++) {
        if (Math.abs(valVec[i]) > 1e-9) throw "L'argomento di rand() deve essere uno scalare.";
    }
    const n = valVec[0];
    const maxDim = (AppState && AppState.is32IonMode) ? 32 : 16;

    if (Math.abs(n) < 1e-9) {
        const key = 'zdiv';
        if (_randCache[_randCacheIndex] && _randCache[_randCacheIndex].limit === key) {
            return _randCache[_randCacheIndex++].vec;
        }
        const res = createRandomZeroDivisor();
        _randCache[_randCacheIndex++] = { limit: key, vec: res };
        return res;
    }

    if (Math.abs(n - Math.round(n)) > 1e-9 || n < 1 || n > maxDim) {
        throw `rand accetta 0, 1, ..., ${maxDim}`;
    }
    const limit = Math.round(n) - 1;

    if (_randCache[_randCacheIndex] && _randCache[_randCacheIndex].limit === limit) {
        return _randCache[_randCacheIndex++].vec;
    }

    const res = createZeroVector();
    for (let i = 0; i <= limit; i++) {
        res[i] = Math.floor(Math.random() * 21) - 10;
    }

    // Bug 17: Assicurati che il coefficiente dell'indice massimo non sia 0
    if (limit > 0) {
        while (res[limit] === 0) {
            res[limit] = Math.floor(Math.random() * 21) - 10;
        }
    }

    _randCache[_randCacheIndex++] = { limit: limit, vec: res };
    return res;
}