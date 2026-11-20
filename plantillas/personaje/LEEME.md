# Crear un personaje propio

El personaje sale abajo a la derecha mientras habla cada integrante. Kevin ya viene en 4 colores; si alguien quiere
el suyo, son 4 pasos. Necesitas una IA que **genere imágenes** (Antigravity/Gemini,
ChatGPT o Codex, etc.). DeepSeek no genera imágenes: usa Kevin o genera la imagen en otra herramienta.

1. **Imagen con la boca cerrada.** Dale al generador `kevin-ref.png` (el estilo) y, si quieres parecido, una foto de la
   persona. Copia `encargo.txt`, cambia la descripción entre `< >` y pídelo. Guarda el resultado como `normal-crudo.png`.
   Si no sale con el fondo verde liso o con otro estilo, pide otra versión (suelen hacer falta 2 o 3).
2. **Imagen con la boca abierta** (opcional, para que hable). Dale `normal-crudo.png` al generador con `encargo-boca.txt`.
   Guárdala como `abierta-cruda.png`.
3. **Prepararlo para el kit:**
   ```bash
   python plantillas/personaje/preparar.py personajes/ana normal-crudo.png abierta-cruda.png --tono "#EC4899"
   ```
   Quita el verde, lo deja del tamaño de Kevin y, de la boca abierta, copia solo la boca (así no salta al hablar).
   Si avisa de que cambió mucho más que la boca, repite el paso 2. `--tono` es su color (brillo del suelo y escenas).
4. En el `guion.json` de esa persona: `"personaje": "ana"`.

La carpeta puede ir en `personajes/` del kit (para todas las semanas) o en `informes/<semana>/personajes/`.
Respeta la imagen de las personas: usa su foto solo si está de acuerdo.
