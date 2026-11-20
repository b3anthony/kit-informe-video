---
name: informe-video
description: Genera el vídeo del informe semanal de un equipo (portada, un vídeo por integrante con voz, escenas animadas y personaje, y cierre) a partir de los informes de cada persona. Usar cuando pidan «hacer el vídeo del informe», «vídeo de la semana», o adjunten informes semanales para presentar.
---

# Vídeo de informe semanal

1. Lee `AGENTS.md` (raíz del kit) entero: ahí están el formato de `equipo.json` y `guion.json`, los tipos de escena,
   las reglas de contenido y las voces. Mira `ejemplos/demo/` como modelo.
2. Crea `informes/<semana>/` con `fuentes/` (los informes), `equipo.json` y `<integrante>/guion.json` por persona.
   Si faltan datos que no están en los informes (fechas, equipo, área, voz), pregúntalos con una sola pregunta.
3. `node scripts/hacer-video.mjs --revisar informes/<semana>/equipo.json` hasta que no haya errores.
4. `node scripts/hacer-video.mjs informes/<semana>/equipo.json` (en segundo plano: tarda varios minutos).
5. Extrae un fotograma por escena con ffmpeg, míralos y corrige textos que se salgan o cifras que no cuadren
   (`--solo <integrante>` para rehacer solo ese vídeo).
6. Entrega la ruta de `salida/informe-completo.mp4`, su duración y en qué segundo empieza cada parte.
