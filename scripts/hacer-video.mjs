#!/usr/bin/env node
// Un solo comando: equipo.json → voces → tiempos de cada palabra → portada + un vídeo por integrante + cierre → informe-completo.mp4
//
//   node scripts/hacer-video.mjs informes/<semana>/equipo.json            hace todo (reutiliza las voces que no cambiaron)
//   node scripts/hacer-video.mjs --revisar informes/<semana>/equipo.json  solo comprueba los guiones (no gasta nada)
//   node scripts/hacer-video.mjs informes/<semana>/equipo.json --solo ana  solo ese vídeo (o «portada», «cierre») y vuelve a unir
//   --sin-unir   no junta los vídeos al final
//   --textos     lista, por carpeta, lo que hay que escribir en Google Vids (motor «manual») y el nombre de cada audio
//
// Necesita: Node 20+, ffmpeg en el PATH y, según el motor de voz, edge-tts (Python) o DEEPGRAM_API_KEY en .env.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { alinear, proporcionales } from './tiempos.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const REVISAR = args.includes('--revisar');
const TEXTOS = args.includes('--textos');
const SIN_UNIR = args.includes('--sin-unir');
const SOLO = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null;
const archivoEquipo = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--solo');
if (!archivoEquipo) salir('Uso: node scripts/hacer-video.mjs [--revisar] informes/<semana>/equipo.json [--solo <integrante|portada|cierre>]');

// ── utilidades ──
function salir(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1); }
const leerJSON = (f, que) => {
  if (!existsSync(f)) salir(`No existe ${que}: ${f}`);
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch (e) { salir(`${que} no es JSON válido (${f}): ${e.message}\n  Arregla: revisa comas, comillas dobles y llaves.`); }
};
const ffmpeg = (...a) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...a], { encoding: 'utf8' });
  if (r.error) salir('No encuentro ffmpeg. Instálalo y ponlo en el PATH (Windows: winget install ffmpeg · macOS: brew install ffmpeg · Linux: apt install ffmpeg).');
  if (r.status !== 0) salir(`ffmpeg falló: ${r.stderr}`);
};
const duracion = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim());
const huella = (...x) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const cargarEnv = () => {
  for (const f of [path.join(KIT, '.env'), path.join(process.cwd(), '.env')]) {
    if (!existsSync(f)) continue;
    for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/.exec(l);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
};
cargarEnv();
const python = () => {
  for (const p of [path.join(KIT, '.venv', 'bin', 'python'), path.join(KIT, '.venv', 'Scripts', 'python.exe'), 'python3', 'python']) {
    if (p.includes(path.sep) && !existsSync(p)) continue;
    const r = spawnSync(p, ['-c', 'import edge_tts'], { encoding: 'utf8' });
    if (r.status === 0) return p;
  }
  return null;
};

// ── equipo y guiones ──
const RAIZ = path.dirname(path.resolve(archivoEquipo));
const equipo = leerJSON(path.resolve(archivoEquipo), 'equipo.json');
// Sin motor_voz: Deepgram si hay clave; si no, edge-tts (gratis).
const MOTOR = equipo.motor_voz ?? (process.env.DEEPGRAM_API_KEY ? 'deepgram' : 'edge');
// Voz por defecto con Deepgram: Celeste (Aura-2) para todo. Otra voz: "voz": "duvan flux", "fiorella flux"…
const VOZ_DEFECTO = { edge: 'es-PE-CamilaNeural', deepgram: 'aura-2-celeste-es', manual: '' }[MOTOR];
const VOZ_PRESENTADORA = { edge: 'es-CO-SalomeNeural', deepgram: 'aura-2-celeste-es', manual: '' }[MOTOR];
// Voces Aura-2 en español (las demás se toman como Flux): así «celeste» → aura-2-celeste-es y «jaime flux» → flux-jaime-es.
const AURA2 = new Set(['agustina', 'alvaro', 'antonia', 'aquila', 'carina', 'celeste', 'diana', 'estrella', 'gloria', 'javier', 'luciano', 'nestor', 'olivia', 'selena', 'silvia', 'sirio', 'valerio']);
/** Acepta el nombre del modelo («flux-jaime-es») o como lo diría una persona («jaime flux», «Celeste», «aura celeste»). */
function resolverVoz(v, donde) {
  if (!v || MOTOR !== 'deepgram') return v;
  const t = String(v).trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (/^(aura-2|flux)-[a-z]+-es$/.test(t)) return t;
  if (/^es-[a-z]{2}-\w+neural$/i.test(v)) { err(donde, `«${v}» es una voz de edge-tts, pero motor_voz es "deepgram"`, 'usa una voz de Deepgram (p. ej. "duvan flux", "celeste") o pon "motor_voz": "edge"'); return v; }
  const palabras = t.split(/[\s_-]+/).filter((p) => p && !['aura', '2', 'es', 'voz', 'de', 'deepgram'].includes(p));
  const flux = palabras.includes('flux');
  const nombre = palabras.find((p) => p !== 'flux');
  if (!nombre) { err(donde, `no entiendo la voz «${v}»`, 'escribe p. ej. "duvan flux", "jaime flux" o "celeste"'); return v; }
  return !flux && AURA2.has(nombre) ? `aura-2-${nombre}-es` : `flux-${nombre}-es`;
}
const pronComun = JSON.parse(readFileSync(path.join(KIT, 'pronunciacion.json'), 'utf8'));
const TIPOS = {
  portada: [], titular: ['titulo'], marcador: ['items'], tarjetas: ['items'], progreso: ['items'], barras: ['items'],
  antes_despues: ['antes', 'despues'], frase: ['texto'], lista: ['items'], captura: ['imagen'], cierre: [],
};
const MAX_ITEMS = { marcador: 4, tarjetas: 4, progreso: 4, barras: 6, lista: 6 };

const errores = [];
const avisos = [];
const err = (donde, msg, arreglo) => errores.push(`${donde}: ${msg}${arreglo ? `\n    Arregla: ${arreglo}` : ''}`);
const aviso = (donde, msg) => avisos.push(`${donde}: ${msg}`);

if (!['edge', 'deepgram', 'manual'].includes(MOTOR)) err('equipo.json', `motor_voz «${MOTOR}» no existe`, 'usa "edge" (gratis), "deepgram" (con clave) o "manual" (audios de Google Vids o grabados)');
if (MOTOR === 'deepgram' && !process.env.DEEPGRAM_API_KEY) err('equipo.json', 'motor_voz es "deepgram" pero falta DEEPGRAM_API_KEY', 'crea el archivo .env en la raíz del kit con DEEPGRAM_API_KEY=tu_clave, o usa "edge"');
for (const k of ['empresa', 'equipo', 'periodo']) if (!equipo[k]) err('equipo.json', `falta "${k}"`, 'mira ejemplos/demo/equipo.json');
if (!Array.isArray(equipo.integrantes) || !equipo.integrantes.length) err('equipo.json', 'falta la lista "integrantes"', 'cada integrante: { "guion": "<carpeta>/guion.json", "tema": "…" }');

function personaje(nombre, donde) {
  const cands = [path.resolve(RAIZ, nombre), path.join(RAIZ, 'personajes', nombre), path.join(KIT, 'personajes', nombre)];
  const dir = cands.find((d) => existsSync(path.join(d, 'normal.png')));
  if (!dir) { err(donde, `no encuentro el personaje «${nombre}» (falta normal.png)`, `usa kevin-azul, kevin-verde, kevin-naranja, kevin-morado o claude, o crea el tuyo (plantillas/personaje/LEEME.md)`); return null; }
  const meta = existsSync(path.join(dir, 'personaje.json')) ? JSON.parse(readFileSync(path.join(dir, 'personaje.json'), 'utf8')) : {};
  const id = huella(dir).slice(0, 8);
  const caras = {};
  for (const c of ['normal', 'abierta', 'serio', 'sorpresa']) if (existsSync(path.join(dir, `${c}.png`))) caras[c] = { origen: path.join(dir, `${c}.png`), publico: `pj-${id}-${c}.png` };
  return { nombre: meta.nombre ?? path.basename(dir), tono: meta.tono ?? '#4C8DF6', cx: meta.cx ?? 386, pies: meta.pies ?? 1089, caras };
}

const palabrasDe = (t) => t.trim().split(/\s+/).filter(Boolean);
const normal = (t) => t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');
function pronunciar(texto, propias = {}) {
  const dic = { ...pronComun.palabras, ...propias };
  return Object.entries(dic).sort(([a], [b]) => b.length - a.length).reduce((t, [escrita, dicha]) =>
    t.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escrita.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu'), dicha), texto);
}
const sospechosa = (p) => /^\p{Lu}{2,}\d*$/u.test(p) || /\p{Ll}\p{Lu}/u.test(p) || /\p{L}\d|\d\p{L}/u.test(p) || /[kwKW]|th|sh|ck|oo|ee|ph/u.test(p);

function revisarGuion(g, donde, carpeta) {
  if (!g.persona) err(donde, 'falta "persona" (nombre que sale en pantalla)');
  if (!g.area) err(donde, 'falta "area" (p. ej. "Backend", "Marketing")');
  if (!Array.isArray(g.escenas) || !g.escenas.length) { err(donde, 'falta la lista "escenas"'); return; }
  const ids = new Set();
  let total = 0;
  const conocidas = new Set([...Object.keys({ ...pronComun.palabras, ...(g.pronunciacion ?? {}) }).flatMap((k) => k.toLowerCase().split(/\s+/)), ...(pronComun.sin_truco ?? []).map((p) => p.toLowerCase())]);
  const raras = new Set();
  g.escenas.forEach((e, n) => {
    const d = `${donde} › escena ${n + 1}${e.id ? ` «${e.id}»` : ''}`;
    if (!e.id || !/^[a-z0-9_-]+$/.test(e.id)) err(d, `"id" inválido`, 'solo minúsculas, números, - y _ (p. ej. "indicadores")');
    else if (ids.has(e.id)) err(d, `"id" repetido`, 'cada escena necesita un id distinto'); else ids.add(e.id);
    if (!(e.tipo in TIPOS)) { err(d, `tipo «${e.tipo}» no existe`, `usa uno de: ${Object.keys(TIPOS).join(', ')}`); return; }
    if (!e.frase || typeof e.frase !== 'string') { err(d, 'falta "frase" (lo que dice la voz; también es el subtítulo)'); return; }
    const datos = e.datos ?? {};
    for (const k of TIPOS[e.tipo]) if (datos[k] === undefined) err(d, `el tipo «${e.tipo}» necesita datos.${k}`, 'mira «Tipos de escena» en AGENTS.md');
    if (MAX_ITEMS[e.tipo] && Array.isArray(datos.items)) {
      if (!datos.items.length) err(d, 'datos.items está vacío');
      if (datos.items.length > MAX_ITEMS[e.tipo]) aviso(d, `solo caben ${MAX_ITEMS[e.tipo]} items; los demás no saldrán`);
    }
    if (e.tipo === 'progreso') for (const it of datos.items ?? []) if (typeof it.pct !== 'number') err(d, `cada item de progreso necesita "pct" numérico (0–100)`, `p. ej. { "etiqueta": "Textos", "pct": 70 }`);
    if (e.tipo === 'barras') for (const it of datos.items ?? []) if (typeof it.valor !== 'number') err(d, 'cada barra necesita "valor" numérico');
    if (e.tipo === 'captura' && datos.imagen && !/^https?:/.test(datos.imagen) && !existsSync(path.resolve(carpeta, datos.imagen))) err(d, `no existe la imagen ${datos.imagen}`, 'la ruta es relativa a la carpeta del guion');
    const n_pal = palabrasDe(e.frase).length;
    total += n_pal + (e.aparte?.texto ? palabrasDe(e.aparte.texto).length : 0);
    if (n_pal > 45) aviso(d, `frase larga (${n_pal} palabras, ~${Math.round(n_pal / 2.5)} s). Mejor partirla en dos escenas`);
    const frase = normal(e.frase);
    for (const it of [...(datos.items ?? []), ...(datos.tarjetas ?? []), ...(datos.puntos ?? [])]) {
      if (it && typeof it === 'object' && it.clave && !frase.includes(normal(it.clave))) aviso(d, `la clave «${it.clave}» no está en la frase: ese elemento aparecerá a su ritmo, no al nombrarlo`);
    }
    if (e.aparte && !equipo.presentador) aviso(d, 'tiene "aparte" pero equipo.json no tiene "presentador": no saldrá');
    if (!e.decir) for (const w of e.frase.split(/[^\p{L}\p{N}-]+/u)) if (w.length > 1 && sospechosa(w) && !conocidas.has(w.toLowerCase())) raras.add(w);
  });
  const seg = total / 2.5;
  if (seg > 150) aviso(donde, `unos ${Math.round(seg)} s de voz: es largo para un informe (lo normal, 45–100 s)`);
  if (raras.size) aviso(donde, `palabras que la voz podría leer mal: ${[...raras].join(', ')}. Si suenan mal, añádelas a "pronunciacion" del guion (p. ej. "MarTech": "Mar Tek")`);
  return seg;
}

const integrantes = [];
for (const [i, m] of (equipo.integrantes ?? []).entries()) {
  const ruta = path.resolve(RAIZ, m.guion ?? '');
  const donde = m.guion ?? `integrante ${i + 1}`;
  if (!m.guion || !existsSync(ruta)) { err(`equipo.json › integrante ${i + 1}`, `no existe el guion ${m.guion}`, 'pon la ruta relativa a equipo.json, p. ej. "ana/guion.json"'); continue; }
  const g = leerJSON(ruta, 'guion.json');
  const carpeta = path.dirname(ruta);
  const seg = revisarGuion(g, donde, carpeta);
  const pj = personaje(g.personaje ?? 'kevin-azul', donde);
  integrantes.push({ slug: path.basename(carpeta), carpeta, g, tema: m.tema, pj, seg, vozM: resolverVoz(g.voz ?? VOZ_DEFECTO, donde) });
}
const presentador = equipo.presentador ? personaje(equipo.presentador.personaje ?? 'claude', 'equipo.json › presentador') : null;

console.log(`\nEquipo ${equipo.equipo} · ${equipo.periodo} · voz: ${MOTOR}`);
for (const m of integrantes) console.log(`  · ${m.g.persona ?? '?'} (${m.slug}): ${m.g.escenas?.length ?? 0} escenas, ~${Math.round(m.seg ?? 0)} s de voz, voz ${m.vozM || '(grabada)'}, personaje ${m.pj?.nombre ?? '?'}`);
if (equipo.presentador) console.log(`  · presentador: ${equipo.presentador.personaje ?? 'claude'}, voz ${resolverVoz(equipo.presentador.voz ?? VOZ_PRESENTADORA, 'equipo.json › presentador') || '(grabada)'}`);
if (avisos.length) console.log(`\nAvisos (no impiden el vídeo):\n${avisos.map((a) => `  ! ${a}`).join('\n')}`);
if (errores.length) salir(`Hay ${errores.length} error(es):\n${errores.map((e) => `  • ${e}`).join('\n')}`);
const nombreCorto = (m) => m.g.nombre_corto ?? m.g.persona.split(' ')[0];
const frasePortada = () => equipo.portada?.frase ?? `Somos el equipo ${equipo.equipo} de ${equipo.empresa}, y esta semana presentamos nuestros avances. A continuación, ${integrantes.length > 1 ? 'el equipo' : 'nuestro informe'}: ${integrantes.map((m, i) => `${i === integrantes.length - 1 && i > 0 ? 'Y ' : ''}${nombreCorto(m)}, ${m.g.area.toLowerCase()}.`).join(' ')}`;
const fraseCierre = () => equipo.cierre?.frase ?? `Gracias por su atención. Somos el equipo ${equipo.equipo} de ${equipo.empresa}, y nos vemos en el próximo informe.`;
if (TEXTOS) {
  const bloque = (carpeta, filas) => { console.log(`\n▸ Guarda los audios en ${path.relative(process.cwd(), path.join(carpeta, 'voces'))}/`); for (const [id, t] of filas) console.log(`  ${(id + '.wav').padEnd(26)} ${t}`); };
  for (const m of integrantes) bloque(m.carpeta, m.g.escenas.flatMap((e) => [[e.id, e.decir ?? pronunciar(e.frase, m.g.pronunciacion)], ...(e.aparte?.texto ? [[`${e.id}__aparte`, `(presentador) ${e.aparte.decir ?? pronunciar(e.aparte.texto, m.g.pronunciacion)}`]] : [])]));
  const fe = [];
  if (equipo.portada !== false) fe.push(['portada', `(presentador) ${equipo.portada?.decir ?? pronunciar(frasePortada())}`]);
  if (equipo.cierre !== false) fe.push(['cierre', `(presentador) ${equipo.cierre?.decir ?? pronunciar(fraseCierre())}`]);
  if (fe.length) bloque(path.join(RAIZ, '_equipo'), fe);
  console.log('');
  process.exit(0);
}
if (REVISAR) { console.log('\n✓ Guiones correctos. Siguiente paso: node scripts/hacer-video.mjs ' + archivoEquipo + '\n'); process.exit(0); }

// ── voces ──
const PY = MOTOR === 'edge' ? python() : null;
if (MOTOR === 'edge' && !PY) salir('Falta edge-tts (Python). Instálalo:  python -m pip install edge-tts   (o en el kit: python -m venv .venv y .venv/bin/pip install edge-tts)');
const RECORTE = 'silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.3:stop_silence=0.18:stop_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';
const SOLO_FINAL = 'areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';

async function deepgramSTT(wav) {
  const r = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=es', { method: 'POST', headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'audio/wav' }, body: readFileSync(wav) });
  if (!r.ok) salir(`Deepgram (transcribir) respondió ${r.status}: ${await r.text()}`);
  const a = (await r.json()).results.channels[0].alternatives[0];
  return a.words.map((w) => ({ p: w.word, i: w.start, f: w.end }));
}

/** Deja voces/listas/<id>.wav y devuelve { audio, duracion, palabras } con los textos de `frase` y sus tiempos. */
async function voz(carpeta, id, frase, decir, vozNombre, velocidad, expresividad) {
  const dirV = path.join(carpeta, 'voces');
  const listas = path.join(dirV, 'listas');
  mkdirSync(listas, { recursive: true });
  const cacheF = path.join(dirV, 'cache.json');
  const cache = existsSync(cacheF) ? JSON.parse(readFileSync(cacheF, 'utf8')) : {};
  const salida = path.join(listas, `${id}.wav`);
  const clave = huella(MOTOR, vozNombre, decir, frase, velocidad, expresividad);
  if (MOTOR !== 'manual' && cache[id]?.clave === clave && existsSync(salida)) return { audio: salida, ...cache[id].res };

  let oidas;
  if (MOTOR === 'edge') {
    const mp3 = path.join(dirV, `${id}.mp3`);
    const js = path.join(dirV, `${id}.palabras.json`);
    const pct = Math.round((velocidad - 1) * 100);
    const r = spawnSync(PY, [path.join(KIT, 'scripts', 'voz_edge.py'), decir, vozNombre, mp3, js, `${pct >= 0 ? '+' : ''}${pct}%`], { encoding: 'utf8' });
    if (r.status !== 0) salir(`edge-tts falló en «${id}» (voz ${vozNombre}): ${r.stderr || r.stdout}\n  ¿Hay internet? ¿Existe la voz? Lista: edge-tts --list-voices | grep es-`);
    ffmpeg('-i', mp3, '-af', `${SOLO_FINAL},aresample=48000`, '-ac', '1', salida);
    oidas = JSON.parse(readFileSync(js, 'utf8'));
  } else if (MOTOR === 'deepgram') {
    const crudo = path.join(dirV, `${id}.dg.wav`);
    // Flux va por /v2/speak (admite speed); Aura-2 por /v1/speak (la velocidad se aplica luego con atempo).
    const esFlux = vozNombre.startsWith('flux-');
    const extra = esFlux ? `${velocidad !== 1 ? `&speed=${(Math.round(velocidad * 20) / 20).toFixed(2)}` : ''}${expresividad !== undefined ? `&expressivity=${expresividad}` : ''}` : '';
    const r = await fetch(`https://api.deepgram.com/${esFlux ? 'v2' : 'v1'}/speak?model=${vozNombre}&encoding=linear16&container=wav&sample_rate=48000${extra}`, {
      method: 'POST', headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: decir }),
    });
    if (!r.ok) salir(`Deepgram (voz ${vozNombre}) respondió ${r.status} en «${id}»: ${await r.text()}\n  ¿Existe esa voz? Prueba con otra (AGENTS.md, «Voces»).`);
    writeFileSync(crudo, Buffer.from(await r.arrayBuffer()));
    ffmpeg('-i', crudo, '-af', `${RECORTE}${velocidad !== 1 && !esFlux ? `,atempo=${velocidad}` : ''},aresample=48000`, '-ac', '1', salida);
    oidas = await deepgramSTT(salida);
  } else {
    const fuente = ['wav', 'mp3', 'm4a', 'ogg'].map((x) => path.join(dirV, `${id}.${x}`)).find(existsSync);
    if (!fuente) salir(`motor "manual": falta el audio voces/${id}.wav (o .mp3) en ${carpeta}\n  Genera esa frase en Google Vids o grábala y guárdala con ese nombre (mira AGENTS.md, «Voz con Google Vids»).`);
    ffmpeg('-i', fuente, '-af', `${RECORTE},aresample=48000`, '-ac', '1', salida);
    oidas = process.env.DEEPGRAM_API_KEY ? await deepgramSTT(salida) : null;
  }
  const dur = duracion(salida);
  const escritas = palabrasDe(frase);
  const palabras = oidas ? alinear(escritas, oidas, dur) : proporcionales(escritas, dur);
  const res = { duracion: dur, palabras };
  cache[id] = { clave, res };
  writeFileSync(cacheF, JSON.stringify(cache, null, 1));
  console.log(`    ${id.padEnd(16)} ${dur.toFixed(1).padStart(5)} s  ${frase.slice(0, 70)}${frase.length > 70 ? '…' : ''}`);
  return { audio: salida, ...res };
}

// ── preparar props de cada vídeo ──
const trabajo = mkdtempSync(path.join(os.tmpdir(), 'informe-video-'));
const publico = path.join(trabajo, 'public');
mkdirSync(publico);
let nArchivo = 0;
const publicar = (origen) => { const n = `f${nArchivo++}${path.extname(origen)}`; copyFileSync(origen, path.join(publico, n)); return n; };
const pjProps = (pj) => {
  if (!pj) return null;
  const caras = {};
  for (const [c, x] of Object.entries(pj.caras)) { if (!existsSync(path.join(publico, x.publico))) copyFileSync(x.origen, path.join(publico, x.publico)); caras[c] = x.publico; }
  return { nombre: pj.nombre, tono: pj.tono, cx: pj.cx, pies: pj.pies, caras };
};
const vozPresentador = resolverVoz(equipo.presentador?.voz ?? VOZ_PRESENTADORA, 'equipo.json › presentador');
const dirSalida = path.join(RAIZ, 'salida');
mkdirSync(dirSalida, { recursive: true });
const trabajos = [];
const quiere = (n) => !SOLO || SOLO === n;

console.log('\nVoces:');
for (const m of integrantes) {
  if (!quiere(m.slug)) continue;
  console.log(`  ${m.g.persona}`);
  const vel = Number(m.g.velocidad) || 1;
  const vozM = m.vozM;
  const expr = m.g.expresividad;
  const escenas = [];
  for (const e of m.g.escenas) {
    const v = await voz(m.carpeta, e.id, e.frase, e.decir ?? pronunciar(e.frase, m.g.pronunciacion), vozM, vel, expr);
    const datos = structuredClone(e.datos ?? {});
    if (e.tipo === 'captura' && datos.imagen && !/^https?:/.test(datos.imagen)) datos.imagen = publicar(path.resolve(m.carpeta, datos.imagen));
    const esc = { id: e.id, tipo: e.tipo, titulo: e.titulo, capitulo: e.capitulo, ilustrativa: !!e.ilustrativa, cara: e.cara, datos, audio: publicar(v.audio), duracion: v.duracion, palabras: v.palabras };
    if (e.aparte?.texto && presentador) {
      const a = await voz(m.carpeta, `${e.id}__aparte`, e.aparte.texto, e.aparte.decir ?? pronunciar(e.aparte.texto, m.g.pronunciacion), vozPresentador, 1);
      esc.aparte = { audio: publicar(a.audio), duracion: a.duracion, palabras: a.palabras };
    }
    escenas.push(esc);
  }
  trabajos.push({ nombre: m.slug, id: 'Informe', props: { escenas, persona: m.g.persona, area: m.g.area, equipo: equipo.equipo, empresa: equipo.empresa, periodo: m.g.periodo ?? equipo.periodo, personaje: pjProps(m.pj), presentador: pjProps(presentador), acento: m.g.acento } });
}

const listaIntegrantes = integrantes.map((m) => ({ nombre: m.g.persona, area: m.g.area, tema: m.tema, clave: nombreCorto(m), personaje: pjProps(m.pj) }));
const carpetaEquipo = path.join(RAIZ, '_equipo');
if (equipo.portada !== false && quiere('portada')) {
  const frase = frasePortada();
  console.log('  Portada');
  const v = await voz(carpetaEquipo, 'portada', frase, equipo.portada?.decir ?? pronunciar(frase), vozPresentador, 1);
  trabajos.unshift({ nombre: '00-portada', id: 'PortadaEquipo', props: { empresa: equipo.empresa, equipo: equipo.equipo, periodo: equipo.periodo_largo ?? equipo.periodo, titulo: equipo.portada?.titulo, integrantes: listaIntegrantes, presentador: pjProps(presentador), audio: publicar(v.audio), duracion: v.duracion, palabras: v.palabras } });
}
if (equipo.cierre !== false && quiere('cierre')) {
  const frase = fraseCierre();
  console.log('  Cierre');
  const v = await voz(carpetaEquipo, 'cierre', frase, equipo.cierre?.decir ?? pronunciar(frase), vozPresentador, 1);
  trabajos.push({ nombre: '99-cierre', id: 'CierreEquipo', props: { empresa: equipo.empresa, equipo: equipo.equipo, periodo: equipo.periodo, integrantes: listaIntegrantes, presentador: pjProps(presentador), audio: publicar(v.audio), duracion: v.duracion, palabras: v.palabras } });
}

// ── render ──
const { bundle } = await import('@remotion/bundler');
const { renderMedia, selectComposition } = await import('@remotion/renderer');
console.log('\nPreparando el render…');
try {
  const serveUrl = await bundle({ entryPoint: path.join(KIT, 'remotion', 'index.ts'), rootDir: KIT, publicDir: publico, outDir: path.join(trabajo, 'bundle'), enableCaching: false });
  for (const t of trabajos) {
    const composition = await selectComposition({ serveUrl, id: t.id, inputProps: t.props });
    const destino = path.join(dirSalida, `${t.nombre}.mp4`);
    console.log(`  ${t.nombre}: ${(composition.durationInFrames / composition.fps).toFixed(1)} s`);
    let ultimo = -1;
    await renderMedia({
      serveUrl, composition, inputProps: t.props, codec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p', outputLocation: destino,
      concurrency: Math.max(1, Math.min(6, os.cpus().length - 1)), timeoutInMilliseconds: 120_000,
      onProgress: ({ progress }) => { const p = Math.floor(progress * 4); if (p !== ultimo) { ultimo = p; process.stdout.write(`    ${p * 25} %\n`); } },
    });
    writeFileSync(path.join(dirSalida, `${t.nombre}.props.json`), JSON.stringify(t.props, null, 1));
  }
} finally {
  rmSync(trabajo, { recursive: true, force: true });
}

// ── unir ──
if (!SIN_UNIR) {
  const orden = [equipo.portada !== false && '00-portada', ...integrantes.map((m) => m.slug), equipo.cierre !== false && '99-cierre'].filter(Boolean);
  const faltan = orden.filter((n) => !existsSync(path.join(dirSalida, `${n}.mp4`)));
  if (faltan.length) console.log(`\nNo uno el vídeo completo: faltan ${faltan.join(', ')}.mp4 (genera sin --solo).`);
  else {
    const lista = path.join(dirSalida, 'lista.txt');
    writeFileSync(lista, orden.map((n) => `file '${path.join(dirSalida, `${n}.mp4`).replace(/'/g, "'\\''")}'`).join('\n'));
    const final = path.join(dirSalida, 'informe-completo.mp4');
    ffmpeg('-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', final);
    rmSync(lista);
    let t = 0;
    console.log(`\n✓ ${final}  (${duracion(final).toFixed(1)} s)`);
    for (const n of orden) { console.log(`    ${new Date(t * 1000).toISOString().slice(14, 19)}  ${n}`); t += duracion(path.join(dirSalida, `${n}.mp4`)); }
  }
}
console.log('');
