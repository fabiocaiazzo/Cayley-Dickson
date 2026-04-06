// === MOTORE ALGEBRICO E OPERAZIONI VETTORIALI ===

// OTTIMIZZAZIONE MEMORIA: Usa cicli for ed evita .map()/.reduce() per ridurre il Garbage Collection
function createZeroVector() { return new Array(16).fill(0); }

function vecAdd(v1, v2) {
    const r = new Array(16);
    for (let i = 0; i < 16; i++) r[i] = v1[i] + v2[i];
    return r;
}

function vecSub(v1, v2) {
    const r = new Array(16);
    for (let i = 0; i < 16; i++) r[i] = v1[i] - v2[i];
    return r;
}

function vecScale(v, s) {
    const r = new Array(16);
    for (let i = 0; i < 16; i++) r[i] = v[i] * s;
    return r;
}

function vecNormSq(v) {
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += v[i] * v[i];
    return sum;
}

function vecNorm(v) {
    const r = new Array(16).fill(0);
    r[0] = Math.sqrt(vecNormSq(v));
    return r;
}

function vecConj(v) {
    const r = new Array(16);
    r[0] = v[0];
    for (let i = 1; i < 16; i++) r[i] = -v[i];
    return r;
}

function vecInv(v) {
    const n2 = vecNormSq(v);
    if (n2 < 1e-30) throw "Divisione per zero";

    const s = 1 / n2;
    const r = new Array(16);
    r[0] = v[0] * s;
    for (let i = 1; i < 16; i++) r[i] = -v[i] * s; 
    return r;
}

function vecPow(base, exponentVec) {
    for (let i = 1; i < 16; i++) {
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

function vecMul(A, B) {
    const res = new Array(16).fill(0);

    for (let i = 0; i < 16; i++) {
        if (Math.abs(A[i]) < 1e-30) continue;

        for (let j = 0; j < 16; j++) {
            if (Math.abs(B[j]) < 1e-30) continue;

            const { s, i: idx } = tableLookup[i][j];
            res[idx] += A[i] * B[j] * s;
        }
    }
    return res;
}

// Commutator: [a,b] = ab - ba
function vecComm(a, b) {
    return vecSub(vecMul(a, b), vecMul(b, a));
}
// Associator: [a,b,c] = (ab)c - a(bc)
function vecAssoc(a, b, c) {
    return vecSub(vecMul(vecMul(a, b), c), vecMul(a, vecMul(b, c)));
}

// Funzione per creare base al volo (e_n)
function createBaseVec(valVec) {
    for (let i = 1; i < 16; i++) {
        if (Math.abs(valVec[i]) > 1e-9) throw "L'indice di e_(...) deve essere un numero reale, non un numero complesso.";
    }

    const n = valVec[0];
    const limit = 15;

    if (Math.abs(n - Math.round(n)) > 1e-9) throw "L'indice di base deve essere un numero intero.";

    const idx = Math.round(n);

    if (idx < 0 || idx > limit) {
        throw `L'indice e_${idx} non è valido. Inserire un intero tra 0 e ${limit}.`;
    }

    const res = createZeroVector();
    res[idx] = 1;
    return res;
}

// Variabili per il parsing e generazione random
window.randCache = [];
window.randCacheIndex = 0;

// Calcola la base del kernel sinistro di A (vettori v tali che A*v = 0)
function computeKernelBasis(A) {
    const M = Array.from({ length: 16 }, () => new Array(16).fill(0));
    for (let j = 0; j < 16; j++) {
        const ej = new Array(16).fill(0);
        ej[j] = 1;
        const prod = vecMul(A, ej);
        for (let i = 0; i < 16; i++) M[i][j] = prod[i];
    }
    let lead = 0;
    const pivotCols = [];
    for (let r = 0; r < 16; r++) {
        if (lead >= 16) break;
        let i = r;
        while (Math.abs(M[i][lead]) < 1e-9) {
            i++;
            if (i === 16) { i = r; lead++; if (lead >= 16) break; }
        }
        if (lead >= 16) break;
        [M[i], M[r]] = [M[r], M[i]];
        pivotCols.push(lead);
        const lv = M[r][lead];
        for (let j = 0; j < 16; j++) M[r][j] /= lv;
        for (let k = 0; k < 16; k++) {
            if (k !== r) {
                const lv2 = M[k][lead];
                for (let j = 0; j < 16; j++) M[k][j] -= lv2 * M[r][j];
            }
        }
        lead++;
    }
    const basis = [];
    for (let c = 0; c < 16; c++) {
        if (!pivotCols.includes(c)) {
            const v = new Array(16).fill(0);
            v[c] = 1;
            for (let j = 0; j < pivotCols.length; j++) v[pivotCols[j]] = -M[j][c];

            // Normalizzazione a interi per evitare decimali in rand(0)
            let bestScale = 1;
            let foundInt = false;
            for (let d = 1; d <= 10000; d++) {
                let allIntegers = true;
                for (let k = 0; k < 16; k++) {
                    if (Math.abs(v[k]) < 1e-9) continue;
                    const val = v[k] * d;
                    if (Math.abs(val - Math.round(val)) > 1e-4) {
                        allIntegers = false;
                        break;
                    }
                }
                if (allIntegers) { bestScale = d; foundInt = true; break; }
            }
            for (let k = 0; k < 16; k++) {
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

// Genera un sedenione divisore dello zero "completo" tramite 3 kernel consecutivi
function createRandomZeroDivisor() {
    // Passo 1: parti da un divisore dello zero a 4 termini noto
    const zdRaw = ZERO_DIVISORS_RAW[Math.floor(Math.random() * ZERO_DIVISORS_RAW.length)];
    let A = new Array(16).fill(0);
    for (const idx of zdRaw) A[Math.abs(idx)] = idx > 0 ? 1 : -1;

    function randomCombination(basis) {
        const res = new Array(16).fill(0);
        for (const bv of basis) {
            const t = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
            for (let i = 0; i < 16; i++) res[i] += bv[i] * t;
        }
        return res;
    }

    const basisA = computeKernelBasis(A);
    if (basisA.length === 0) return A;
    let B = randomCombination(basisA);
    if (B.every(x => Math.abs(x) < 1e-9)) B = randomCombination(basisA);

    const basisB = computeKernelBasis(B);
    if (basisB.length === 0) return B;
    let C = randomCombination(basisB);
    if (C.every(x => Math.abs(x) < 1e-9)) C = randomCombination(basisB);

    const basisC = computeKernelBasis(C);
    if (basisC.length === 0) return C;
    let D = randomCombination(basisC);
    if (D.every(x => Math.abs(x) < 1e-9)) D = randomCombination(basisC);

    return D;
}

function createRandomVec(valVec) {
    for (let i = 1; i < 16; i++) {
        if (Math.abs(valVec[i]) > 1e-9) throw "L'argomento di rand() deve essere uno scalare.";
    }
    const n = valVec[0];

    if (Math.abs(n) < 1e-9) {
        const key = 'zdiv';
        if (window.randCache[window.randCacheIndex] && window.randCache[window.randCacheIndex].limit === key) {
            return window.randCache[window.randCacheIndex++].vec;
        }
        const res = createRandomZeroDivisor();
        window.randCache[window.randCacheIndex++] = { limit: key, vec: res };
        return res;
    }

    if (Math.abs(n - Math.round(n)) > 1e-9 || n < 1 || n > 16) {
        throw "La dimensione in rand() deve essere un intero tra 0 e 16 (0 = divisore dello zero).";
    }
    const limit = Math.round(n) - 1;

    if (window.randCache[window.randCacheIndex] && window.randCache[window.randCacheIndex].limit === limit) {
        return window.randCache[window.randCacheIndex++].vec;
    }

    const res = createZeroVector();
    for (let i = 0; i <= limit; i++) {
        res[i] = Math.floor(Math.random() * 21) - 10;
    }

    window.randCache[window.randCacheIndex++] = { limit: limit, vec: res };
    return res;
}