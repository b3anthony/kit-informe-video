# Kit de vídeo de informe semanal: instrucciones para la IA

Este archivo es para **cualquier asistente de código** (Claude Code, Codex, Antigravity/Gemini, OpenCode o Cline con DeepSeek, etc.).
Si eres la IA: sigue estos pasos al pie de la letra. **Tú solo escribes JSON**: el vídeo lo hace un script.

Resultado: un MP4 de 1920×1080 que une la **portada del equipo**, un **vídeo por integrante** (voz, escenas animadas,
subtítulos palabra a palabra y su personaje moviendo la boca) y el **cierre**. Ejemplo completo en `ejemplos/demo/`.

---

## El flujo (6 pasos)

1. **Crear la carpeta de la semana** en `informes/`, por ejemplo `informes/2026-11-20_devcore/`. Dentro:
   - `fuentes/` → el informe de cada integrante (PDF, .docx, .md o el texto que te pegue el usuario);
   - `equipo.json` → los datos del equipo (formato abajo);
   - una carpeta por integrante con su `guion.json`, por ejemplo `ana/guion.json`.
2. **Leer cada informe** y escribir su `guion.json` siguiendo «Cómo escribir el guion» y «Tipos de escena».
   Si el usuario no dio fechas, nombre del equipo, área o la voz de alguien, **pregúntale** antes de inventarlo.
3. **Revisar sin gastar nada:**
   `node scripts/hacer-video.mjs --revisar informes/<semana>/equipo.json`
   Si hay errores, cada uno dice qué arreglar. Corrige y repite hasta ver «✓ Guiones correctos».
4. **Generar el vídeo:**
   `node scripts/hacer-video.mjs informes/<semana>/equipo.json`
   Tarda ~3–6 min por cada minuto de vídeo. Las voces que no cambian se reutilizan (no se vuelven a generar).
5. **Comprobar:** abre `informes/<semana>/salida/informe-completo.mp4` o extrae fotogramas
   (`ffmpeg -ss 20 -i salida/<integrante>.mp4 -frames:v 1 f.png`) y míralos si puedes ver imágenes.
   Revisa sobre todo que ningún texto se salga de su tarjeta y que las cifras sean las del informe.
6. **Corregir una parte:** cambia el `guion.json` y repite el paso 4 con `--solo <carpeta-del-integrante>`
   (o `--solo portada` / `--solo cierre`). Vuelve a unir el vídeo completo solo.

**Instalación** (una vez por máquina): está en `README.md`. Si un comando falla por falta de `node_modules`, `ffmpeg` o `edge-tts`,
el mensaje de error dice qué instalar. Díselo al usuario.

---

## `equipo.json`

```json
{
  "empresa": "Giantucchi",
  "equipo": "DevCore",
  "periodo": "16–20 nov 2026",
  "periodo_largo": "Semana del 16 al 20 de noviembre de 2026",
  "presentador": { "personaje": "claude" },
  "integrantes": [
    { "guion": "ana/guion.json",  "tema": "Migración de la base de datos" },
    { "guion": "luis/guion.json", "tema": "Campaña de captación" }
  ]
}
```

| Campo | Qué es |
|---|---|
| `empresa`, `equipo` | Salen en la cabecera, la portada y el cierre. |
| `periodo` | Corto, para la cabecera de cada vídeo («16–20 nov 2026»). |
| `periodo_largo` | Opcional: el texto de la portada del equipo. |
| `motor_voz` | Opcional. Si no se pone: `"deepgram"` cuando hay `DEEPGRAM_API_KEY` en `.env`, y si no `"edge"` (gratis). También `"manual"` (audios de Google Vids o grabados). Ver «Voces». |
| `presentador` | Opcional. Personaje (`claude` por defecto) y `voz` de quien presenta la portada, empuja el logo en el cierre y hace los «apartes». **Voz por defecto: Celeste** (`aura-2-celeste-es`). Sin `presentador`, la portada y el cierre salen sin personaje y no hay apartes. |
| `integrantes` | De 1 a 4. `guion`: ruta relativa a `equipo.json`. `tema`: una línea (≤ 35 caracteres) que sale en la tarjeta de la portada. |
| `portada`, `cierre` | Opcionales. `false` los quita. `{ "frase": "…" }` cambia lo que dice el presentador. Por defecto: «Somos el equipo X de Y… A continuación, el equipo: Ana, backend. Y Luis, marketing.» y «Gracias por su atención…». |

## `guion.json` (uno por integrante)

```json
{
  "persona": "Ana Pérez",
  "area": "Backend",
  "personaje": "kevin-verde",
  "velocidad": 1.0,
  "pronunciacion": { "Supabase": "Supa beis" },
  "escenas": [ { "id": "portada", "tipo": "portada", "frase": "…", "datos": { } } ]
}
```

- `persona`: el nombre tal como sale en pantalla (nombre y apellido). `nombre_corto` (opcional): cómo lo nombra el presentador; si no se pone, es el primer nombre.
- `area`: el área o el puesto (corto).
- `personaje`: `kevin-azul`, `kevin-verde`, `kevin-naranja`, `kevin-morado` o una carpeta propia (ver «Personajes»). **Un color distinto por integrante.**
- `voz`: opcional. **Por defecto, Celeste** (la misma voz que la presentadora). Si el usuario pide otra («usa jaime flux», «que hable Fernanda»), ponla aquí tal cual: `"jaime flux"`, `"fernanda flux"`, `"celeste"`… El script la convierte al nombre del modelo. Ver «Voces».
- `velocidad`: opcional, 0.85–1.2 (en Flux va en pasos de 0,05). `expresividad`: opcional, solo Flux (el parámetro `expressivity` de Deepgram; p. ej. 0 = sobria).
- `pronunciacion`: opcional. Cómo se dicen palabras raras de ESTE guion (se suma a `pronunciacion.json`).
- `acento` (opcional): color principal de las escenas («#EC4899»). Por defecto, el del personaje.

### Campos de cada escena

| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | sí | Único, en minúsculas: `portada`, `indicadores`, `logros`… También es el nombre del audio. |
| `tipo` | sí | Uno de los «Tipos de escena». |
| `frase` | sí | **Lo que dice la voz y el subtítulo.** 1–3 oraciones, ≤ 45 palabras. Números escritos con letras («diecinueve», «setenta por ciento»). |
| `datos` | según el tipo | Lo que se dibuja. Textos cortos: la pantalla resume, la voz cuenta. |
| `titulo` | no | El rótulo pequeño de arriba («Indicadores»). Por defecto, `capitulo` o el `id`. |
| `capitulo` | no | Agrupa escenas en los chips de la cabecera. **Máximo 5 capítulos distintos, de 1–2 palabras** («Resultados», «Dificultad», «Lo que sigue»). |
| `decir` | no | Lo que se le pasa a la voz si debe ser distinto de `frase` («Yiantuchi» en vez de «Giantucchi»). Normalmente no hace falta: `pronunciacion.json` ya lo hace. |
| `ilustrativa` | no | `true` si lo que se ve no es un dato real (un ejemplo, una recreación). Pone «Vista ilustrativa». |
| `cara` | no | `{ "cara": "sorpresa", "desde": "palabra" }`: el personaje cambia de cara al decir esa palabra (`sorpresa` o `serio`; solo los Kevin las tienen). |
| `aparte` | no | `{ "texto": "…" }`: una línea corta del presentador al final de la escena, en un bocadillo. Para **un poco** de humor; máximo 1–3 por vídeo. |

**`clave`** (en los items de `datos`): una palabra **que está en la `frase`**. El elemento aparece justo cuando la voz la dice.
Si no la pones o no está en la frase, los elementos aparecen repartidos a lo largo de la escena (funciona igual, pero sincroniza peor).

---

## Tipos de escena

Cada uno con el máximo de elementos que caben. Los textos de pantalla deben ser cortos (lo que pone entre paréntesis).

**`portada`**: el nombre, el área y el periodo. Siempre la primera.
```json
{ "id": "portada", "tipo": "portada",
  "frase": "Este es el informe semanal de Ana Pérez, backend, del dieciséis al veinte de noviembre.",
  "datos": { "subtitulo": "Semana del 16 al 20 de noviembre de 2026", "chips": ["Base migrada", "0 caídas", "3 entregas"] } }
```
`chips`: hasta 3 (≤ 22 caracteres cada uno).

**`titular`**: una idea fuerte (el gancho) y hasta 3 tarjetas.
```json
{ "id": "gancho", "tipo": "titular", "titulo": "Esta semana",
  "frase": "Esta semana migramos la base de datos sin cortar el servicio: cero minutos caídos y todos los clientes atendidos.",
  "datos": { "titulo": "Migración sin cortes", "resaltar": "sin cortes", "subtitulo": "La base de datos ya está en el servidor nuevo",
    "tarjetas": [ { "icono": "base_datos", "titulo": "Base migrada", "detalle": "120 tablas", "clave": "migramos" },
                  { "icono": "reloj", "titulo": "0 minutos caídos", "clave": "cero" } ],
    "sello": "LOGRADO", "clave_sello": "atendidos" } }
```
`titulo` ≤ 45 caracteres; `resaltar`: parte del título en degradado. Tarjetas: `titulo` ≤ 30, `detalle` ≤ 45. `sello` es opcional.

**`marcador`**: 1–4 cifras grandes que cuentan desde cero (indicadores).
```json
{ "id": "indicadores", "tipo": "marcador", "titulo": "Indicadores",
  "frase": "Mis indicadores: cero días de retraso, cero bloqueos, y doce de doce tareas a tiempo.",
  "datos": { "items": [ { "valor": "0", "etiqueta": "días de retraso", "clave": "retraso" },
                        { "valor": "0", "etiqueta": "bloqueos", "clave": "bloqueos" },
                        { "valor": "12/12", "etiqueta": "tareas a tiempo", "clave": "doce" } ],
             "nota": "Sin riesgos activos" } }
```
`valor`: texto corto con número («0», «12/12», «61 %», «S/ 1 200», «242 917»). `etiqueta` ≤ 25. `detalle` opcional (≤ 25). `nota` opcional abajo.

**`tarjetas`**: 1–4 entregas o logros; cada una recibe un sello cuando se nombra.
```json
{ "id": "logros", "tipo": "tarjetas", "titulo": "Logros",
  "frase": "Cerré tres entregas: el panel de pagos, la auditoría de seguridad y la guía para el equipo de ventas.",
  "datos": { "sello": "100 %", "items": [
      { "icono": "dinero", "titulo": "Panel de pagos", "clave": "panel" },
      { "icono": "escudo", "titulo": "Auditoría de seguridad", "detalle": "4 plataformas", "clave": "auditoría" },
      { "icono": "documento", "titulo": "Guía para ventas", "clave": "guía" } ] } }
```
`titulo` ≤ 45, `detalle` ≤ 60. `sello` general u `items[].sello` por tarjeta (opcional).

**`progreso`**: 1–4 anillos con porcentaje (trabajo en curso).
```json
{ "id": "encurso", "tipo": "progreso", "titulo": "En curso",
  "frase": "En curso: la app móvil va al setenta por ciento y la documentación al cuarenta.",
  "datos": { "items": [ { "etiqueta": "App móvil", "pct": 70, "clave": "setenta" },
                        { "etiqueta": "Documentación", "pct": 40, "clave": "cuarenta" } ] } }
```
`pct`: **número** de 0 a 100. `etiqueta` ≤ 32.

**`barras`**: hasta 6 barras horizontales para comparar cantidades.
```json
{ "id": "trafico", "tipo": "barras", "titulo": "Visitas por canal",
  "frase": "Las visitas vinieron sobre todo de Google, después de Instagram y por último del correo.",
  "datos": { "unidad": "visitas", "items": [ { "etiqueta": "Google", "valor": 1200, "clave": "Google" },
                                             { "etiqueta": "Instagram", "valor": 640, "clave": "Instagram" },
                                             { "etiqueta": "Correo", "valor": 210, "clave": "correo" } ] } }
```
`valor`: **número**. `texto` (opcional) reemplaza lo que se escribe al final de la barra.

**`antes_despues`**: la dificultad y cómo se resolvió.
```json
{ "id": "dificultad", "tipo": "antes_despues", "titulo": "Dificultad",
  "frase": "La dificultad: el servidor se saturaba en horas punta. Lo resolví con una caché y ahora responde en la mitad de tiempo.",
  "datos": { "clave_despues": "resolví",
    "antes":   { "titulo": "Servidor saturado", "puntos": ["Lento en horas punta", "Quejas de usuarios"] },
    "despues": { "titulo": "Con caché", "puntos": ["Responde en la mitad de tiempo", "Sin quejas esta semana"] } } }
```
Hasta 4 `puntos` por lado (≤ 45 caracteres). La derecha aparece al decir `clave_despues`.

**`frase`**: una idea para recordar (aprendizaje).
```json
{ "id": "aprendizaje", "tipo": "frase", "titulo": "Aprendizaje",
  "frase": "Lo que aprendí: medir antes de optimizar.",
  "datos": { "etiqueta": "Lo que aprendí", "icono": "bombilla", "texto": "Medir antes de optimizar.", "resaltar": "Medir" } }
```
`texto` ≤ 90 caracteres.

**`lista`**: hasta 6 puntos que se marcan al nombrarlos (lo que sigue, lo que necesito).
```json
{ "id": "sigue", "tipo": "lista", "titulo": "Lo que sigue",
  "frase": "Lo que sigue: terminar la app móvil, probarla con dos clientes y avanzar el curso de Docker.",
  "datos": { "items": [ { "texto": "Terminar la app móvil", "clave": "terminar" },
                        { "texto": "Probarla con dos clientes", "clave": "probarla" },
                        { "texto": "Curso de Docker", "pct": 30, "clave": "Docker" } ] } }
```
`texto` ≤ 50. `pct` (barra) o `nota` (etiqueta a la derecha, ≤ 18) son opcionales.

**`captura`**: una imagen real (pantallazo del sistema, foto del tablero).
```json
{ "id": "tablero", "tipo": "captura", "titulo": "Tablero",
  "frase": "Este es el tablero que ya usa el equipo de ventas.",
  "datos": { "imagen": "img/tablero.png", "titulo": "Panel de ventas", "nota": "Ya en producción" } }
```
`imagen`: ruta **relativa a la carpeta del guion**. `ajuste`: `"cubrir"` para llenar el marco (por defecto se ve entera).

**`cierre`**: el balance de la semana. Siempre la última.
```json
{ "id": "cierre", "tipo": "cierre", "titulo": "Balance",
  "frase": "Avance de la semana: ochenta por ciento, y nada detenido por terceros. La base nueva ya está en producción.",
  "datos": { "pct": 80, "etiqueta": "avance de la semana",
    "puntos": [ { "texto": "0 pendientes por terceros", "clave": "terceros" }, { "texto": "Sin bloqueos", "icono": "escudo" } ],
    "remate": "La base nueva ya está en producción.", "clave_remate": "base" } }
```
`pct` (anillo) o `valor` (cifra suelta, p. ej. «3 entregas»). Hasta 3 `puntos` (≤ 34). `remate` ≤ 55.

**Iconos** (`icono`): check, usuario, equipo, chat, grafico, tendencia, codigo, servidor, nube, escudo, diana, lupa, cohete,
reloj, documento, megafono, engranaje, rayo, estrella, alerta, dinero, calendario, libro, pincel, avion, candado,
base_datos, movil, web, bandera, bombilla.

---

## Cómo escribir el guion (lo que funcionó en los informes de Giantucchi)

**Formato: «elevator pitch»**, en **primera persona** («cerré», «aprendí»), formal y claro, que **venda** lo que se hizo.
Entre 70 y 100 segundos por persona: unas **9 escenas** y **180–240 palabras** de voz (2,5 palabras ≈ 1 s).

Orden recomendado (responde a lo que pide gerencia):

| # | id | tipo | Qué cuenta |
|---|---|---|---|
| 1 | `portada` | portada | «Este es el informe semanal de <nombre>, <área>, del … al …» |
| 2 | `gancho` | titular | El logro más fuerte de la semana, en una frase que enganche. |
| 3 | `indicadores` | marcador | Los indicadores del informe (días de espera, retraso, cumplimiento, bloqueos, decisiones…). |
| 4 | `logros` | tarjetas | Lo terminado (100 %). |
| 5 | `dificultad` | antes_despues | Qué pasó, por qué y cómo se resolvió. |
| 6 | `aprendizaje` | frase | Una frase. |
| 7 | `encurso` | progreso | Lo que va a medias, con su %. |
| 8 | `sigue` | lista | Próximos pasos y, si hace falta, **lo que necesito** de otros. |
| 9 | `cierre` | cierre | Avance total y una frase final con fuerza. |

Puedes quitar, juntar o añadir escenas según el informe (p. ej. `barras` o `captura` si hay datos o pantallazos).

**Reglas (importantes):**
- **Todas las cifras salen del informe.** No inventes números, porcentajes ni nombres. Si un dato no está, no lo pongas o pregúntalo.
- **No nombres a los clientes**: «una consultora de branding», «una inmobiliaria». Los productos propios sí se nombran.
- Nada que suene a problema de seguridad («hay vulnerabilidades», «rotar claves»), ni datos internos: hosts, tablas, contraseñas, endpoints, IP.
- Si algo de la pantalla es un ejemplo y no un dato real, pon `"ilustrativa": true`.
- Una idea por escena. **Anuncia el tema al empezar la frase** («Mis indicadores: …», «La dificultad: …», «Lo que sigue: …»).
- Números en la `frase` **con letras** («diecinueve de diecinueve», «setenta por ciento»); en `datos`, con cifras («19/19», 70).
- La `clave` de cada elemento debe ser una palabra que aparece en la `frase`, en el orden en que se dicen.
- Humor: opcional y poco (un `aparte` como mucho cada 3 escenas). El chiste es sobre el trabajo, **nunca** sobre el cliente, la empresa o un compañero, y nunca sustituye a una cifra.
- No digas «soy nuevo» ni cosas que resten; habla de lo logrado.

---

## Voces

**Por defecto** (con `DEEPGRAM_API_KEY` en `.env`): **todo el audio sale con Celeste** (`aura-2-celeste-es`), tanto los
integrantes como la presentadora. Si el usuario pide otra voz para alguien, escribe en su `voz` cómo la pidió:

| El usuario dice | Pon en `voz` | Modelo que se usa |
|---|---|---|
| (nada) | — | `aura-2-celeste-es` (todos) |
| «usa Duvan Flux» | `"duvan flux"` | `flux-duvan-es` |
| «usa Jaime Flux» | `"jaime flux"` | `flux-jaime-es` |
| «que hable Fiorella» | `"fiorella flux"` | `flux-fiorella-es` |
| «que hable Fernanda» | `"fernanda flux"` | `flux-fernanda-es` |

Voces **Flux** en español (`/v2/speak`, las más naturales): duvan, jaime, eduardo, ernesto, gustavo, martin (hombres);
cecilia, fernanda, fiorella (mujeres); también aina. Cualquier «<nombre> flux» se convierte en `flux-<nombre>-es`.
Voces **Aura-2** latinas: selena, celeste, gloria, estrella, olivia, antonia (mujeres); javier, aquila, luciano, sirio, valerio
(hombres). De España: agustina, carina, diana, silvia, alvaro, nestor. (`valentina` no funciona.)
La clave se pone en `.env` (raíz del kit): `DEEPGRAM_API_KEY=…`. Cada equipo usa la suya.

**`motor_voz: "edge"`** (gratis, sin clave; se usa solo si no hay clave de Deepgram o si lo pones a mano). Voces:
`es-PE-CamilaNeural` (por defecto para integrantes), `es-CO-SalomeNeural` (por defecto para la presentadora),
`es-PE-AlexNeural`, `es-MX-DaliaNeural`, `es-MX-JorgeNeural`, `es-CO-GonzaloNeural`, `es-AR-ElenaNeural`, `es-AR-TomasNeural`,
`es-CL-CatalinaNeural`, `es-CL-LorenzoNeural`, `es-US-PalomaNeural`, `es-US-AlonsoNeural`. Lista: `edge-tts --list-voices`.
Ojo: las voces de edge solo valen con `"motor_voz": "edge"`, y las de Deepgram solo con Deepgram (`--revisar` lo avisa).

**`motor_voz: "manual"`** (Google Vids o grabación propia). El script no genera la voz: busca `voces/<id>.wav` (o `.mp3`)
en la carpeta de cada integrante, y `_equipo/voces/portada.wav` / `cierre.wav`. Para saber qué audio grabar y con qué texto:
`node scripts/hacer-video.mjs --textos informes/<semana>/equipo.json`.
Con Google Vids, la persona puede capturar los audios con `scripts/receptor-vids.py` + `scripts/vids-captura.js`
(instrucciones dentro de `vids-captura.js`). Si hay `DEEPGRAM_API_KEY`, se usa para los tiempos exactos de cada palabra;
si no, los subtítulos se reparten por el largo de cada palabra (funciona, pero sincroniza peor).

**Pronunciación:** antes de hablar, cada `frase` pasa por `pronunciacion.json` («Giantucchi» → «Yiantuchi», «Marketing» →
«Márketing», «PMO» → «pe eme o»…). El subtítulo sigue diciendo la palabra bien escrita. `--revisar` avisa de las palabras
que podrían sonar mal: añádelas a `pronunciacion` del guion. Siglas: letras separadas por espacios, sin comas.

## Personajes

- Incluidos: `kevin-azul`, `kevin-verde`, `kevin-naranja`, `kevin-morado` (caras normal, abierta, serio y sorpresa) y `claude` (presentador).
- **Propio:** sigue `plantillas/personaje/LEEME.md` (se hace con el generador de imágenes de tu IA y `preparar.py`).
  Se guarda en `personajes/<nombre>/` (del kit o de la carpeta de la semana) y se usa con `"personaje": "<nombre>"`.
  Mínimo: `normal.png`. Con `abierta.png`, mueve la boca al hablar.

## Errores comunes

| Mensaje | Qué hacer |
|---|---|
| `Falta edge-tts` | `python -m pip install edge-tts` (ver README). |
| `No encuentro ffmpeg` | Instalar ffmpeg (README). |
| `Cannot find module '@remotion/…'` | Ejecutar `npm install` en la raíz del kit. |
| `tipo «x» no existe` / `necesita datos.items` | Mira «Tipos de escena» y copia la forma del ejemplo. |
| Un texto se sale de su tarjeta | Acórtalo (respeta los máximos de caracteres de cada tipo). |
| Una palabra suena mal | Añádela a `pronunciacion` del guion y vuelve a generar: solo se rehace esa frase. |
| `Deepgram … 401` | La clave de `.env` está mal o sin saldo. Usa `"motor_voz": "edge"`. |
| `Deepgram (voz …) respondió 400` | Esa voz no existe: prueba otra de la lista de «Voces». |

## Lo que NO debes hacer

- No edites `remotion/` ni `scripts/` para un informe normal: con los tipos de escena basta.
- No subas `.env` ni claves a ningún sitio. No pongas claves dentro de los JSON.
- No inventes cifras para «llenar» una escena: cambia de tipo (p. ej. `lista` en vez de `marcador`).

## Avanzado (solo si el usuario lo pide y tu IA programa bien)

Un tipo de escena nuevo: crea el componente en `remotion/escenas.tsx` (recibe `e`, `fotogramas`, `acento`; usa las piezas de
`remotion/piezas.tsx`; deja libre la zona x > 1400 y y > 930), añádelo a `VISTAS`, añade su nombre y campos obligatorios a
`TIPOS` en `scripts/hacer-video.mjs`, comprueba con `npx tsc --noEmit` y documenta su `datos` en este archivo.
Para ver las escenas mientras las editas: `npm run studio`.
