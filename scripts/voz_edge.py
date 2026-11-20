# Voz gratis con edge-tts (voces neuronales de Microsoft, sin clave). La llama hacer-video.mjs.
# Uso: python voz_edge.py "<texto>" <voz> <salida.mp3> <palabras.json> [velocidad, p. ej. +5%]
# Escribe el audio y los tiempos de cada palabra ([{p, i, f}] en segundos).
import asyncio, json, sys

try:
    import edge_tts
except ImportError:
    sys.exit('Falta edge-tts. Instálalo con:  python -m pip install edge-tts   (o mira README.md, «Instalar»)')


async def main(texto, voz, mp3, salida_json, velocidad):
    com = edge_tts.Communicate(texto, voz, rate=velocidad, boundary='WordBoundary')
    palabras = []
    with open(mp3, 'wb') as f:
        async for trozo in com.stream():
            if trozo['type'] == 'audio':
                f.write(trozo['data'])
            elif trozo['type'] == 'WordBoundary':
                i = trozo['offset'] / 1e7
                palabras.append({'p': trozo['text'], 'i': round(i, 3), 'f': round(i + trozo['duration'] / 1e7, 3)})
    with open(salida_json, 'w', encoding='utf-8') as f:
        json.dump(palabras, f, ensure_ascii=False)


if __name__ == '__main__':
    texto, voz, mp3, js = sys.argv[1:5]
    asyncio.run(main(texto, voz, mp3, js, sys.argv[5] if len(sys.argv) > 5 else '+0%'))
