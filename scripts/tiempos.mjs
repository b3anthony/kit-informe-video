// Tiempos de cada palabra del subtítulo. Las palabras escritas (la «frase») se casan con las oídas (STT o edge-tts)
// por bloques comunes, como SequenceMatcher; las que no casan se reparten en el hueco entre anclas.
const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');

function emparejar(a, b) {
  const pos = new Map();
  b.forEach((w, i) => pos.set(w, [...(pos.get(w) ?? []), i]));
  const pend = [[0, a.length, 0, b.length]];
  const bloques = [];
  while (pend.length) {
    const [a0, a1, b0, b1] = pend.pop();
    let ma = a0, mb = b0, largo = 0, ant = new Map();
    for (let i = a0; i < a1; i++) {
      const act = new Map();
      for (const j of pos.get(a[i]) ?? []) {
        if (j < b0) continue;
        if (j >= b1) break;
        const n = (ant.get(j - 1) ?? 0) + 1;
        act.set(j, n);
        if (n > largo) { ma = i - n + 1; mb = j - n + 1; largo = n; }
      }
      ant = act;
    }
    if (!largo) continue;
    bloques.push([ma, mb, largo]);
    if (a0 < ma && b0 < mb) pend.push([a0, ma, b0, mb]);
    if (ma + largo < a1 && mb + largo < b1) pend.push([ma + largo, a1, mb + largo, b1]);
  }
  return bloques.sort((x, y) => x[0] - y[0]);
}

/** escritas: palabras de la frase · oidas: [{p, i, f}] · devuelve [{p, i, f}] con los textos escritos. */
export function alinear(escritas, oidas, dur) {
  const t = Array(escritas.length).fill(null);
  for (const [a, b, n] of emparejar(escritas.map(normalizar), oidas.map((o) => normalizar(o.p)))) {
    for (let k = 0; k < n; k++) t[a + k] = [oidas[b + k].i, oidas[b + k].f];
  }
  for (let i = 0; i < t.length;) {
    if (t[i]) { i++; continue; }
    let j = i;
    while (j < t.length && !t[j]) j++;
    const desde = i ? t[i - 1][1] : (oidas[0]?.i ?? 0);
    const hasta = j < t.length ? t[j][0] : dur;
    const paso = Math.max(0, hasta - desde) / (j - i);
    for (let k = i; k < j; k++) t[k] = [desde + paso * (k - i), desde + paso * (k - i + 1)];
    i = j;
  }
  let antes = 0;
  return escritas.map((p, k) => {
    const i = Math.max(antes, Math.min(dur, t[k][0]));
    const f = Math.max(i, Math.min(dur, t[k][1]));
    antes = i;
    return { p, i: +i.toFixed(3), f: +f.toFixed(3) };
  });
}

/** Sin tiempos reales: reparte la duración según el largo de cada palabra. */
export function proporcionales(escritas, dur) {
  const total = escritas.reduce((n, p) => n + p.length, 0) || 1;
  let c = 0;
  return escritas.map((p) => { const i = (c / total) * dur; c += p.length; return { p, i: +i.toFixed(3), f: +((c / total) * dur).toFixed(3) }; });
}
