#!/usr/bin/env node
// Prepara lo que no trae npm: un Python propio del kit (.venv) con edge-tts (voz gratis) y Pillow (personajes).
// Se ejecuta solo después de «npm install» y también desde hacer-video.mjs si hace falta. No toca el Python del sistema.
// Si no hay Python, no pasa nada grave: con DEEPGRAM_API_KEY la voz va por Deepgram y no lo necesita.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENV_PY = process.platform === 'win32' ? path.join(KIT, '.venv', 'Scripts', 'python.exe') : path.join(KIT, '.venv', 'bin', 'python');
const corre = (cmd, args, ver = false) => spawnSync(cmd, args, { cwd: KIT, encoding: 'utf8', stdio: ver ? 'inherit' : 'pipe' });

/** Ruta de un Python con edge-tts, instalándolo en .venv si hace falta. null si no hay Python en el equipo. */
export function pythonConEdge({ silencioso = false } = {}) {
  const tiene = (py) => existsSync(py) && corre(py, ['-c', 'import edge_tts, PIL']).status === 0;
  if (tiene(VENV_PY)) return VENV_PY;
  if (!existsSync(VENV_PY)) {
    const lanzadores = process.platform === 'win32' ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
    const base = lanzadores.find(([c, a]) => corre(c, [...a, '--version']).status === 0);
    if (!base) { if (!silencioso) console.log('  ! No hay Python en este equipo: la voz gratis (edge-tts) no estará disponible. Con clave de Deepgram no hace falta.'); return null; }
    if (!silencioso) console.log('  Creando el Python del kit (.venv)…');
    if (corre(base[0], [...base[1], '-m', 'venv', path.join(KIT, '.venv')]).status !== 0) { console.log('  ! No pude crear .venv (en Debian/Ubuntu: sudo apt install python3-venv).'); return null; }
  }
  if (!silencioso) console.log('  Instalando edge-tts y Pillow en .venv…');
  const r = corre(VENV_PY, ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', 'edge-tts', 'pillow']);
  if (r.status !== 0) { console.log(`  ! pip falló: ${(r.stderr || r.stdout).trim().split('\n').pop()}`); return null; }
  return VENV_PY;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('\nKit de vídeo: preparando la voz gratis (edge-tts)…');
  const py = pythonConEdge();
  console.log(py ? '  ✓ Listo.\n' : '  (Se puede seguir: con DEEPGRAM_API_KEY en .env la voz va por Deepgram.)\n');
}
