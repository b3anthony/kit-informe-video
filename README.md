# Kit de vídeo de informe semanal

Le das tu informe (.md, .txt, .pdf o .docx) a tu IA y te devuelve un vídeo de 1920×1080 con portada del equipo, tu parte
(voz, escenas animadas, subtítulos y tu personaje hablando) y cierre.

Funciona con **Antigravity, Codex, Claude Code, OpenCode o Cline con DeepSeek**: cualquier IA que lea archivos y ejecute
comandos. Las instrucciones para la IA están en `AGENTS.md`.

## 1. Descargar

```bash
git clone https://github.com/b3anthony/kit-informe-video.git
```

¿Sin git? Arriba en esta página: botón verde **`<> Code`** → **Download ZIP**, y descomprímelo.

## 2. Instalar (una vez)

Solo necesitas **[Node.js](https://nodejs.org)** (botón «LTS»). Lo demás se instala solo.

Abre la carpeta `kit-informe-video` en tu IA y dile:

```
Instala este kit (npm install). Mi clave de Deepgram es: <tu clave>
```

La IA ejecuta `npm install` (trae Remotion, su propio ffmpeg y la voz gratis) y guarda tu clave en el archivo `.env`.
La clave es opcional: consíguela gratis en [deepgram.com](https://deepgram.com). Sin clave también funciona, con una voz
gratis (edge-tts; en Windows necesita [Python](https://www.python.org), marcando «Add to PATH»; en Mac y Linux ya viene).
Tu clave se queda en tu equipo: `.env` no se sube a GitHub.

Si `npm install` muestra avisos de «vulnerabilities» o «install scripts blocked: esbuild», son normales: no hagas nada
(y no ejecutes `npm audit fix --force`).

## 3. Pedir el vídeo

Abre la carpeta `kit-informe-video` en tu IA, pon tu informe dentro y pega esto (cambia lo que va entre `< >`):

```
Haz el vídeo de mi informe semanal siguiendo AGENTS.md.
Mi informe está en <archivo>
Nombre: <nombre y apellido> · Área: <tu área> · Equipo: <equipo> · Empresa: Giantucchi
Semana: del <día> al <día> de <mes> de <año>
Personaje: kevin-<azul | verde | naranja | morado>
Con portada y cierre del equipo, presentados por Claude.
Revisa con --revisar antes de generar y, al terminar, dime la ruta del vídeo.
```

**¿Sois 2 o 3 en el equipo?** Pon los informes de todos y cambia las líneas de nombre y personaje:

```
Integrantes:
- Ana Pérez · Backend · kevin-verde · informe: ana.md
- Luis Soto · Marketing · kevin-naranja · informe: luis.md
```

**¿Otra voz?** Por defecto todo sale con la voz **Celeste**. Añade, por ejemplo: `Voz: duvan flux`, `jaime flux` o `fiorella flux`.

Cuando acabe (tarda unos 5 minutos), el vídeo está en `informes/<semana>/salida/informe-completo.mp4`.

## 4. Corregir algo

Díselo a la IA («cambia la cifra de logros», «acorta el gancho»). Solo se rehace lo que cambió.

---

- Ejemplo completo: `ejemplos/demo/` → `node scripts/hacer-video.mjs ejemplos/demo/equipo.json`
- Crear tu propio personaje: `plantillas/personaje/LEEME.md`
- Voz con Google Vids o grabada por ti: `AGENTS.md`, sección «Voces» (`motor_voz: "manual"`).
- Los vídeos se dibujan con [Remotion](https://www.remotion.dev): gratis para personas y empresas de hasta 3 trabajadores; las más grandes necesitan [su licencia](https://www.remotion.dev/license).
