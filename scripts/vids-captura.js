// Captura las voces de Google Vids y las manda al receptor (scripts/receptor-vids.py), con el nombre que pide el kit.
// Cómo se usa (motor_voz "manual"; lo puede hacer una persona sin IA):
//  1. En una terminal: python scripts/receptor-vids.py informes/<semana>/<integrante>/voces
//  2. Abre tu vídeo en Google Vids, pulsa F12 → Consola, pega TODO este archivo y pulsa Enter (una sola vez). Si Chrome
//     no deja pegar, escribe antes «allow pasting».
//  3. Por cada frase de `node scripts/hacer-video.mjs --textos …`: escribe el texto en el panel «Voz en off» de Vids,
//     elige la voz y, en la consola:   await __generar('indicadores')     (el id de esa frase)
//     Devuelve ['wav <bytes>', 'ok 200'] si el audio llegó. Si dice 'sin audio nuevo': pulsa a mano «Actualizar voz en off»
//     → «Reemplazar», dale a Vista previa y llama a  __capturar('indicadores').
// Ojo: busca los botones por su texto EN ESPAÑOL («Reemplazar», «Actualizar voz en off», «Vista previa»). Con Vids en
// inglés, pon Google en español o cambia esos textos abajo («Replace», «Update voiceover», «Preview»).
// Ojo 2: en Vids la voz es POR ESCENA. Si cambias de escena, vuelve a elegir la voz o saldrá otra.
window.__vistos = window.__vistos || new Set([...document.querySelectorAll('audio,video')].map(e => e.currentSrc || e.src));
window.__nuevo = () => [...document.querySelectorAll('audio,video')].map(e => e.currentSrc || e.src)
  .find(s => /contribution-rt|docs\.usercontent\.google\.com\/download\/videos/.test(s) && !window.__vistos.has(s));
window.__capturar = (nombre) => {
  window.__log = [];
  (async () => {
    for (let i = 0; i < 60; i++) {
      const src = window.__nuevo();
      if (src) {
        window.__vistos.add(src);
        const b = await (await fetch(src, { credentials: 'include' })).blob();
        const ext = /mp3|mpeg/.test(b.type) ? 'mp3' : 'wav';
        window.__log.push(ext + ' ' + b.size);
        const r = await fetch('http://127.0.0.1:8765/' + nombre + '.' + ext, { method: 'POST', body: b });
        window.__log.push('ok ' + r.status);
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    window.__log.push('timeout');
  })();
  return 'esperando';
};
window.__generar = async (nombre) => {
  // Espera el diálogo «Reemplazar» y repite «Vista previa» hasta que aparezca el audio nuevo (a veces tarda >10 s).
  const z = ms => new Promise(r => setTimeout(r, ms));
  const btn = t => [...document.querySelectorAll('[role=button],button')].find(e => t.test(e.textContent.trim()));
  window.__log = [];
  if (!btn(/^Reemplazar$/)) btn(/Actualizar voz en off|Insertar voz en off/).click();
  for (let i = 0; i < 20 && !btn(/^Reemplazar$/); i++) await z(300);
  btn(/^Reemplazar$/)?.click();
  await z(10000);
  for (let k = 0; k < 6 && !window.__nuevo(); k++) { document.querySelector('button[aria-label="Vista previa"]')?.click(); await z(5000); }
  if (!window.__nuevo()) return ['sin audio nuevo'];
  window.__capturar(nombre);
  await z(3000);
  return window.__log;
};
'listo';
