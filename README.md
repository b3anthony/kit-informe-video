# Kit de vídeo de informe semanal

Le das tu informe (.md, .txt, .pdf o .docx) a tu IA y te devuelve un vídeo de 1920×1080 con portada del equipo, tu parte
(voz, escenas animadas, subtítulos y tu personaje hablando) y cierre.

Funciona con **Antigravity, Codex, Claude Code, OpenCode o Cline con DeepSeek**: cualquier IA que lea archivos y ejecute
comandos. Las instrucciones para la IA están en `AGENTS.md`.

## 1. Instalar (una vez)

Necesitas [Node.js 20+](https://nodejs.org), [Python 3](https://www.python.org) y [ffmpeg](https://ffmpeg.org/download.html).

```bash
git clone https://github.com/b3anthony/kit-informe-video.git
cd kit-informe-video
npm install
python -m venv .venv
.venv/bin/pip install edge-tts pillow          # Windows: .venv\Scripts\pip install edge-tts pillow
```

Avisos normales de `npm install` que puedes ignorar: «vulnerabilities» (son de herramientas internas de Remotion; **no**
ejecutes `npm audit fix --force`, rompe las versiones) y «install scripts blocked: esbuild» (funciona igual).

**Voz (recomendado):** crea una cuenta gratis en [deepgram.com](https://deepgram.com) y crea en esta carpeta un
archivo `.env` con:

```
DEEPGRAM_API_KEY=tu_clave
```

Sin clave también funciona, con voces gratis (edge-tts). La clave es tuya: el archivo `.env` no se sube a GitHub.

## 2. Pedir el vídeo

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

## 3. Corregir algo

Díselo a la IA («cambia la cifra de logros», «acorta el gancho»). Solo se rehace lo que cambió.

---

- Ejemplo completo: `ejemplos/demo/` → `node scripts/hacer-video.mjs ejemplos/demo/equipo.json`
- Crear tu propio personaje: `plantillas/personaje/LEEME.md`
- Voz con Google Vids o grabada por ti: `AGENTS.md`, sección «Voces» (`motor_voz: "manual"`).
- Los vídeos se dibujan con [Remotion](https://www.remotion.dev): gratis para personas y empresas de hasta 3 trabajadores; las más grandes necesitan [su licencia](https://www.remotion.dev/license).
