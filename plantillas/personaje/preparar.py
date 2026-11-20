# Convierte las imágenes del generador (fondo verde croma) en un personaje del kit, con las medidas de Kevin.
#
#   python plantillas/personaje/preparar.py personajes/ana normal-crudo.png [abierta-cruda.png] [--tono "#EC4899"]
#
# Deja en personajes/ana/: normal.png, abierta.png (si la diste) y personaje.json.
# - Quita el verde y suaviza el borde.
# - Recorta y escala las dos imágenes con LA MISMA caja (la de la boca cerrada): así no «saltan» al hablar.
# - De la boca abierta solo copia la zona que cambió (la boca); el resto es la imagen cerrada. Si cambió demasiado,
#   avisa: pide al generador otra versión que cambie solo la boca.
# Requiere Pillow:  python -m pip install pillow
import json, os, sys
try:
    from PIL import Image, ImageChops, ImageFilter
except ImportError:
    sys.exit('Falta Pillow:  python -m pip install pillow')

ANCHO, ALTO, CX, PIES, ALTO_PJ = 768, 1376, 386, 1089, 860  # Kevin: lienzo 768×1376, pies en y=1089, ~860 px de alto


def sin_verde(ruta):
    im = Image.open(ruta).convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            verde = g - max(r, b)
            if verde > 60:
                px[x, y] = (r, g, b, 0)
            elif verde > 15:  # borde: quita el halo verde
                px[x, y] = (r, min(g, max(r, b)), b, int(255 * (60 - verde) / 45))
    return im


def colocar(im, caja):
    p = im.crop(caja)
    k = ALTO_PJ / p.height
    p = p.resize((round(p.width * k), ALTO_PJ), Image.LANCZOS)
    lienzo = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    lienzo.paste(p, (CX - p.width // 2, PIES - ALTO_PJ), p)
    return lienzo


def main():
    args = [a for a in sys.argv[1:]]
    tono = '#4C8DF6'
    if '--tono' in args:
        i = args.index('--tono'); tono = args[i + 1]; del args[i:i + 2]
    if len(args) < 2:
        sys.exit(__doc__ or 'Uso: python preparar.py personajes/<nombre> normal.png [abierta.png] [--tono "#RRGGBB"]')
    destino, normal = args[0], args[1]
    abierta = args[2] if len(args) > 2 else None
    os.makedirs(destino, exist_ok=True)

    cerrada = sin_verde(normal)
    caja = cerrada.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    if not caja:
        sys.exit('No encontré el personaje: ¿el fondo es verde #00FF00 liso?')
    colocar(cerrada, caja).save(os.path.join(destino, 'normal.png'))
    caras = ['normal']

    if abierta:
        ab = sin_verde(abierta)
        if ab.size != cerrada.size:
            ab = ab.resize(cerrada.size, Image.LANCZOS)
        # Zona que cambió entre las dos (debería ser solo la boca).
        # Se compara con las imágenes originales (antes de quitar el verde) y se borra el ruido suelto.
        crudo_c = Image.open(normal).convert('RGB')
        crudo_a = Image.open(abierta).convert('RGB').resize(crudo_c.size, Image.LANCZOS)
        dif = ImageChops.difference(crudo_c, crudo_a).convert('L').point(lambda v: 255 if v > 40 else 0)
        dif = dif.filter(ImageFilter.MedianFilter(5))
        zona = dif.getbbox()
        if not zona:
            print('! La boca abierta es igual a la cerrada: no la uso.')
        else:
            area = (zona[2] - zona[0]) * (zona[3] - zona[1]) / (cerrada.width * cerrada.height)
            if area > 0.06:
                print(f'! Cambió el {area:.0%} de la imagen, no solo la boca. Uso la imagen entera, pero puede «saltar» al hablar.'
                      ' Mejor: pide al generador que cambie SOLO la boca (encargo-boca.txt).')
                mezcla = ab
            else:
                margen = 6
                zona = (max(0, zona[0] - margen), max(0, zona[1] - margen), min(cerrada.width, zona[2] + margen), min(cerrada.height, zona[3] + margen))
                mezcla = cerrada.copy()
                mezcla.paste(ab.crop(zona), zona[:2])
                print(f'Boca: copiada solo la zona {zona} ({area:.2%} de la imagen).')
            colocar(mezcla, caja).save(os.path.join(destino, 'abierta.png'))
            caras.append('abierta')

    nombre = os.path.basename(os.path.normpath(destino))
    with open(os.path.join(destino, 'personaje.json'), 'w', encoding='utf-8') as f:
        json.dump({'nombre': nombre, 'tono': tono, 'cx': CX, 'pies': PIES, 'caras': caras}, f, ensure_ascii=False, indent=1)
    print(f'Listo: {destino}/ ({", ".join(caras)}). Úsalo en guion.json con  "personaje": "{nombre}"')


if __name__ == '__main__':
    main()
