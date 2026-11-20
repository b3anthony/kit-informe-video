// Audio sin depender de lo que haya instalado: usa el ffmpeg del sistema si existe y, si no, el que trae Remotion
// (node_modules/@remotion/compositor-<sistema>). Los silencios se recortan aquí, en JavaScript, sobre el WAV.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TASA = 48000;
let binarios;

/** { ffmpeg, ffprobe, env } listos para spawn. */
export function herramientas() {
  if (binarios) return binarios;
  const sistema = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (sistema.status === 0) return (binarios = { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', env: process.env, origen: 'sistema' });
  const base = path.join(KIT, 'node_modules', '@remotion');
  const dir = existsSync(base) && readdirSync(base).filter((d) => d.startsWith('compositor-')).map((d) => path.join(base, d))
    .find((d) => existsSync(path.join(d, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')));
  if (!dir) throw new Error('No encuentro ffmpeg. Ejecuta «npm install» en la carpeta del kit (trae su propio ffmpeg).');
  const exe = (n) => path.join(dir, process.platform === 'win32' ? `${n}.exe` : n);
  const env = { ...process.env };
  if (process.platform === 'linux') env.LD_LIBRARY_PATH = [dir, env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  if (process.platform === 'darwin') env.DYLD_LIBRARY_PATH = [dir, env.DYLD_LIBRARY_PATH].filter(Boolean).join(':');
  if (process.platform === 'win32') env.PATH = [dir, env.PATH].filter(Boolean).join(';');
  return (binarios = { ffmpeg: exe('ffmpeg'), ffprobe: exe('ffprobe'), env, origen: 'remotion' });
}

export function ffmpeg(...args) {
  const h = herramientas();
  const r = spawnSync(h.ffmpeg, ['-v', 'error', '-y', ...args], { encoding: 'utf8', env: h.env });
  if (r.error || r.status !== 0) throw new Error(`ffmpeg falló: ${r.error?.message ?? r.stderr}`);
}

export function duracionArchivo(f) {
  const h = herramientas();
  return Number(execFileSync(h.ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8', env: h.env }).trim());
}

function leerWav(f) {
  const b = readFileSync(f);
  let i = 12;
  while (i + 8 <= b.length) {
    const id = b.toString('ascii', i, i + 4);
    const n = b.readUInt32LE(i + 4);
    if (id === 'data') {
      const fin = Math.min(b.length, i + 8 + n);
      return new Int16Array(b.buffer.slice(b.byteOffset + i + 8, b.byteOffset + fin - ((fin - i - 8) % 2)));
    }
    i += 8 + n + (n % 2);
  }
  throw new Error(`WAV sin datos: ${f}`);
}

function escribirWav(f, m) {
  const datos = Buffer.from(m.buffer, m.byteOffset, m.byteLength);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + datos.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(TASA, 24);
  h.writeUInt32LE(TASA * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(datos.length, 40);
  writeFileSync(f, Buffer.concat([h, datos]));
}

/** Ventanas de 10 ms: true si suenan por encima de -45 dB. */
function sonoras(m) {
  const v = TASA / 100;
  const umbral = 32768 * Math.pow(10, -45 / 20);
  const out = [];
  for (let i = 0; i < m.length; i += v) {
    let s = 0, n = 0;
    for (let k = i; k < Math.min(m.length, i + v); k++) { s += m[k] * m[k]; n++; }
    out.push(Math.sqrt(s / Math.max(1, n)) > umbral);
  }
  return out;
}

/**
 * Convierte cualquier audio a WAV mono 48 kHz y recorta silencios.
 * modo «final»: solo el silencio del final (no mueve los tiempos de las palabras).
 * modo «todo»: el del principio y el del final, y acorta a 0,18 s las pausas internas de más de 0,3 s.
 * Devuelve la duración en segundos.
 */
export function prepararAudio(entrada, salida, { modo = 'todo', tempo = 1 } = {}) {
  const tmp = `${salida}.tmp.wav`;
  ffmpeg('-i', entrada, '-ac', '1', '-ar', String(TASA), ...(tempo !== 1 ? ['-af', `atempo=${tempo}`] : []), '-c:a', 'pcm_s16le', tmp);
  const m = leerWav(tmp);
  const v = TASA / 100;
  const s = sonoras(m);
  const primera = s.indexOf(true);
  const ultima = s.lastIndexOf(true);
  let trozos;
  if (primera < 0) trozos = [[0, m.length]];
  else if (modo === 'final') trozos = [[0, Math.min(m.length, (ultima + 3) * v)]];
  else {
    trozos = [];
    let ini = Math.max(0, primera - 1) * v, k = primera;
    while (k <= ultima) {
      if (s[k]) { k++; continue; }
      let j = k;
      while (j <= ultima && !s[j]) j++;
      if (j - k > 30) { trozos.push([ini, (k + 9) * v]); ini = (j - 9) * v; }
      k = j;
    }
    trozos.push([ini, Math.min(m.length, (ultima + 3) * v)]);
  }
  const total = trozos.reduce((n, [a, b]) => n + (b - a), 0);
  const out = new Int16Array(total);
  let p = 0;
  for (const [a, b] of trozos) { out.set(m.subarray(a, b), p); p += b - a; }
  escribirWav(salida, out);
  rmSync(tmp, { force: true });
  return out.length / TASA;
}
