// Biblioteca de escenas genéricas del informe. Cada escena se elige con `tipo` en guion.json y se llena con `datos`.
// Zona de contenido: x 96–1386, y 200–930 (a la derecha está el personaje; abajo, el subtítulo).
// El formato de `datos` de cada tipo está en AGENTS.md («Tipos de escena») y lo comprueba scripts/hacer-video.mjs --revisar.
import React from 'react';
import { Img, interpolate, random, useCurrentFrame } from 'remotion';
import {
  ajustar, Anillo, Check, clamp, cue, Entra, ESPECTRO, fuenteMono, fuenteTexto, Icono, imagen, LogoG, momentos, N, Panel, Pop, Sello, SERIE, suave,
  textoDegradado, useMuelle, Valor, type EscenaI, type PalabraI,
} from './piezas';

export interface PropsVista { e: EscenaI; fotogramas: number; acento: string; persona: string; area: string; periodo: string; empresa: string }
const IZQ = 96;
const ANCHO_Z = 1290;
const ARRIBA = 215;

const Etiqueta: React.FC<{ children: React.ReactNode; tono?: string; style?: React.CSSProperties }> = ({ children, tono = N.tenue, style }) => (
  <div style={{ fontFamily: fuenteMono, fontSize: 18, letterSpacing: 3, color: tono, fontWeight: 700, ...style }}>{children}</div>
);
const lista = <T,>(x: T[] | undefined, max: number) => (Array.isArray(x) ? x.slice(0, max) : []);
const colorDe = (i: number, acento: string) => (i === 0 ? acento : SERIE[(i + SERIE.indexOf(acento) + 1 + SERIE.length) % SERIE.length]);

/** Texto con una parte resaltada en degradado (la primera aparición de `resaltar`). */
const Resaltado: React.FC<{ texto: string; resaltar?: string }> = ({ texto, resaltar }) => {
  const i = resaltar ? texto.toLowerCase().indexOf(resaltar.toLowerCase()) : -1;
  if (i < 0) return <>{texto}</>;
  return <>{texto.slice(0, i)}<span style={textoDegradado}>{texto.slice(i, i + resaltar!.length)}</span>{texto.slice(i + resaltar!.length)}</>;
};

// ── portada: nombre, área, periodo y hasta 3 chips ──
const Portada: React.FC<PropsVista> = ({ e, persona, area, periodo, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const linea = interpolate(f, [16, 40], [0, 1], { ...clamp, easing: suave });
  const chips = lista<string>(d.chips, 3);
  return (
    <>
      <div style={{ position: 'absolute', left: 110, top: 330 }}><LogoG alto={360} t={interpolate(f, [0, 34], [0, 1], clamp)} brillo={interpolate(f, [30, 40, 80], [0, 1, 0.5], clamp)} /></div>
      <div style={{ position: 'absolute', left: 520, top: 300, width: 900 }}>
        <Entra desde={6} dx={-40} dy={0}><Etiqueta tono={acento} style={{ fontSize: 24, letterSpacing: 8 }}>{`INFORME SEMANAL · ${area}`.toUpperCase()}</Etiqueta></Entra>
        <Entra desde={10} dx={-40} dy={0}><div style={{ fontFamily: fuenteTexto, fontWeight: 800, color: N.tinta, letterSpacing: -1, fontSize: ajustar(persona, 112, 18, 70), lineHeight: 1.05, marginTop: 16 }}>{persona}</div></Entra>
        <div style={{ height: 8, width: 680 * linea, borderRadius: 4, background: `linear-gradient(90deg, ${acento}, ${N.oro})`, marginTop: 22, boxShadow: `0 0 26px ${acento}88` }} />
        <Entra desde={22} dx={-40} dy={0}><div style={{ fontFamily: fuenteTexto, fontSize: 32, color: N.suave, marginTop: 24 }}>{d.subtitulo ?? periodo}</div></Entra>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 40 }}>
          {chips.map((t, i) => (
            <Entra key={i} desde={30 + i * 6} dy={20}>
              <div style={{ padding: '10px 22px', borderRadius: 40, border: `2px solid ${colorDe(i, acento)}`, color: N.tinta, fontFamily: fuenteTexto, fontSize: 24, fontWeight: 700, background: `${colorDe(i, acento)}1F` }}>{t}</div>
            </Entra>
          ))}
        </div>
      </div>
    </>
  );
};

// ── titular: una idea fuerte + hasta 3 tarjetas ──
const Titular: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const d = e.datos;
  const tarjetas = lista<any>(d.tarjetas, 3);
  const t = momentos(e.palabras, tarjetas, fotogramas, 24);
  const titulo: string = d.titulo ?? '';
  const ancho = (ANCHO_Z - (tarjetas.length - 1) * 28) / Math.max(1, tarjetas.length);
  return (
    <>
      <Entra desde={4} dy={26} style={{ position: 'absolute', left: IZQ, top: ARRIBA + 20, width: ANCHO_Z }}>
        <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(titulo, tarjetas.length ? 76 : 96, tarjetas.length ? 44 : 34, 50), lineHeight: 1.1, color: N.tinta, letterSpacing: -1 }}>
          <Resaltado texto={titulo} resaltar={d.resaltar} />
        </div>
        {d.subtitulo && <div style={{ fontFamily: fuenteTexto, fontSize: 32, color: N.suave, marginTop: 18 }}>{d.subtitulo}</div>}
      </Entra>
      <div style={{ position: 'absolute', left: IZQ, top: 560, width: ANCHO_Z, display: 'flex', gap: 28 }}>
        {tarjetas.map((c, i) => {
          const tono = colorDe(i, acento);
          return (
            <Entra key={i} desde={t[i]} dy={40} style={{ width: ancho }}>
              <Panel tono={tono} brillo={0.5} style={{ height: 300, padding: '30px 32px', background: `linear-gradient(160deg, ${tono}26, ${N.panel}F2 62%)` }}>
                <Icono nombre={c.icono} color={tono} tam={58} />
                <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(c.titulo ?? '', 38, 22, 26), color: N.tinta, marginTop: 18, lineHeight: 1.15 }}>{c.titulo}</div>
                {c.detalle && <div style={{ fontFamily: fuenteTexto, fontSize: ajustar(c.detalle, 25, 50, 19), color: N.suave, marginTop: 10, lineHeight: 1.3 }}>{c.detalle}</div>}
              </Panel>
              <Pop en={t[i]} />
            </Entra>
          );
        })}
      </div>
      {d.sello && <Sello desde={cue(e.palabras, d.clave_sello, Math.round(fotogramas * 0.7))} texto={d.sello} tono={N.verde} style={{ right: 560, top: 470 }} />}
    </>
  );
};

// ── marcador: 1 a 4 cifras grandes que caen y cuentan ──
const Marcador: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const items = lista<any>(d.items, 4);
  const t = momentos(e.palabras, items, fotogramas, 16);
  const ancho = (ANCHO_Z - (items.length - 1) * 26) / Math.max(1, items.length);
  return (
    <>
      {d.titulo && <Entra desde={2} style={{ position: 'absolute', left: IZQ, top: ARRIBA + 10, fontFamily: fuenteTexto, fontWeight: 800, fontSize: 54, color: N.tinta }}>{d.titulo}</Entra>}
      <div style={{ position: 'absolute', left: IZQ, top: d.titulo ? 340 : 290, width: ANCHO_Z, display: 'flex', gap: 26 }}>
        {items.map((it, i) => {
          const tono = colorDe(i, acento);
          const cae = useMuelle(t[i], 230, 12);
          const valor = String(it.valor ?? '');
          return (
            <div key={i} style={{ width: ancho, opacity: f < t[i] ? 0.18 : 1, transform: `translateY(${(1 - cae) * -70}px)` }}>
              <Panel tono={f >= t[i] ? tono : N.borde} brillo={f >= t[i] ? 0.7 : 0} style={{ height: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: Math.min(items.length > 3 ? 120 : 150, (ancho - 56) / (Math.max(2, valor.length) * 0.62)), color: tono, lineHeight: 1, letterSpacing: -2, textShadow: `0 0 40px ${tono}66` }}>
                  {f >= t[i] ? <Valor texto={valor} desde={t[i]} dura={22} /> : valor.replace(/\d/g, '0')}
                </div>
                <div style={{ fontFamily: fuenteTexto, fontWeight: 700, fontSize: ajustar(it.etiqueta ?? '', 30, 22, 21), color: N.tinta, marginTop: 26, lineHeight: 1.2 }}>{it.etiqueta}</div>
                {it.detalle && <div style={{ fontFamily: fuenteMono, fontSize: 17, color: N.tenue, marginTop: 10, letterSpacing: 1 }}>{it.detalle}</div>}
              </Panel>
              <Pop en={t[i]} v={0.25} />
            </div>
          );
        })}
      </div>
      {d.nota && <Entra desde={momentos(e.palabras, [{ clave: d.clave_nota }], fotogramas, Math.round(fotogramas * 0.75))[0]} style={{ position: 'absolute', left: IZQ, top: 800, width: ANCHO_Z, textAlign: 'center', fontFamily: fuenteTexto, fontSize: 32, fontWeight: 700, color: N.suave }}>{d.nota}</Entra>}
    </>
  );
};

// ── tarjetas: 1 a 4 entregas; cada una recibe su sello ──
const Tarjetas: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const items = lista<any>(d.items, 4);
  const t = momentos(e.palabras, items, fotogramas, 14);
  const rejilla = items.length === 4;
  const ancho = rejilla ? (ANCHO_Z - 26) / 2 : (ANCHO_Z - (items.length - 1) * 26) / Math.max(1, items.length);
  const alto = rejilla ? 300 : 420;
  return (
    <div style={{ position: 'absolute', left: IZQ, top: ARRIBA + 25, width: ANCHO_Z, display: 'flex', flexWrap: 'wrap', gap: 26 }}>
      {items.map((it, i) => {
        const tono = colorDe(i, acento);
        const on = f >= t[i];
        const sello = it.sello ?? d.sello;
        return (
          <Entra key={i} desde={Math.max(0, t[i] - 10)} dy={36} style={{ width: ancho, position: 'relative' }}>
            <Panel tono={on ? tono : N.borde} brillo={on ? 0.5 : 0} style={{ height: alto, padding: rejilla ? '26px 30px' : '36px 34px', background: on ? `linear-gradient(160deg, ${tono}22, ${N.panel}F2 60%)` : `${N.panel}E6` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Icono nombre={it.icono ?? 'check'} color={tono} tam={rejilla ? 46 : 60} />
                <Etiqueta tono={tono}>{String(i + 1).padStart(2, '0')}</Etiqueta>
              </div>
              <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(it.titulo ?? '', rejilla ? 34 : 40, rejilla ? 34 : 26, 24), color: N.tinta, marginTop: rejilla ? 14 : 26, lineHeight: 1.15 }}>{it.titulo}</div>
              {it.detalle && <div style={{ fontFamily: fuenteTexto, fontSize: ajustar(it.detalle, rejilla ? 23 : 26, 60, 18), color: N.suave, marginTop: 12, lineHeight: 1.3 }}>{it.detalle}</div>}
            </Panel>
            {sello && <Sello desde={t[i] + 8} texto={sello} tono={N.verde} tam={rejilla ? 30 : 38} style={{ right: 18, bottom: 22 }} />}
          </Entra>
        );
      })}
    </div>
  );
};

// ── progreso: 1 a 4 anillos con porcentaje ──
const Progreso: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const d = e.datos;
  const items = lista<any>(d.items, 4);
  const t = momentos(e.palabras, items, fotogramas, 14);
  const tam = items.length > 3 ? 240 : 290;
  return (
    <>
      {d.titulo && <Entra desde={2} style={{ position: 'absolute', left: IZQ, top: ARRIBA + 10, fontFamily: fuenteTexto, fontWeight: 800, fontSize: 54, color: N.tinta }}>{d.titulo}</Entra>}
      <div style={{ position: 'absolute', left: IZQ, top: d.titulo ? 350 : 300, width: ANCHO_Z, display: 'flex', justifyContent: 'space-around' }}>
        {items.map((it, i) => {
          const tono = colorDe(i, acento);
          return (
            <Entra key={i} desde={t[i]} dy={30} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: ANCHO_Z / items.length - 20 }}>
              <Anillo pct={Number(it.pct) || 0} desde={t[i]} tam={tam} grosor={22} color={tono}>
                <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: tam * 0.26, color: N.tinta }}><Valor texto={`${it.pct} %`} desde={t[i]} dura={36} /></div>
              </Anillo>
              <div style={{ fontFamily: fuenteTexto, fontWeight: 700, fontSize: ajustar(it.etiqueta ?? '', 30, 24, 21), color: N.tinta, marginTop: 30, textAlign: 'center', lineHeight: 1.2 }}>{it.etiqueta}</div>
              {it.detalle && <div style={{ fontFamily: fuenteMono, fontSize: 17, color: N.tenue, marginTop: 8, textAlign: 'center' }}>{it.detalle}</div>}
              <Pop en={t[i]} />
            </Entra>
          );
        })}
      </div>
    </>
  );
};

// ── barras: hasta 6 barras horizontales con su valor ──
const Barras: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const items = lista<any>(d.items, 6);
  const t = momentos(e.palabras, items, fotogramas, 14);
  const max = Number(d.max) || Math.max(1, ...items.map((x) => Number(x.valor) || 0));
  const fila = Math.min(110, 560 / Math.max(1, items.length));
  return (
    <>
      {d.titulo && <Entra desde={2} style={{ position: 'absolute', left: IZQ, top: ARRIBA + 10, fontFamily: fuenteTexto, fontWeight: 800, fontSize: 54, color: N.tinta }}>{d.titulo}</Entra>}
      <Panel style={{ position: 'absolute', left: IZQ, top: d.titulo ? 330 : 270, width: ANCHO_Z, padding: '40px 46px' }}>
        {items.map((it, i) => {
          const tono = colorDe(i, acento);
          const v = Number(it.valor) || 0;
          const k = interpolate(f, [t[i], t[i] + 26], [0, v / max], { ...clamp, easing: suave });
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', height: fila, gap: 24 }}>
              <div style={{ width: 330, fontFamily: fuenteTexto, fontWeight: 700, fontSize: ajustar(it.etiqueta ?? '', 28, 20, 19), color: f >= t[i] ? N.tinta : N.tenue, textAlign: 'right', lineHeight: 1.15 }}>{it.etiqueta}</div>
              <div style={{ flex: 1, height: fila * 0.46, borderRadius: 10, background: N.rejilla, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k * 100}%`, borderRadius: 10, background: `linear-gradient(90deg, ${tono}AA, ${tono})`, boxShadow: `0 0 18px ${tono}66` }} />
              </div>
              <div style={{ width: 170, fontFamily: fuenteTexto, fontWeight: 800, fontSize: 34, color: tono, opacity: f >= t[i] ? 1 : 0 }}>
                <Valor texto={it.texto ?? `${it.valor}${d.unidad ? ` ${d.unidad}` : ''}`} desde={t[i]} dura={26} />
              </div>
              <Pop en={t[i]} v={0.15} />
            </div>
          );
        })}
      </Panel>
    </>
  );
};

// ── antes_despues: el problema a la izquierda, cómo se resolvió a la derecha ──
const AntesDespues: React.FC<PropsVista> = ({ e, fotogramas }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const antes = d.antes ?? {};
  const despues = d.despues ?? {};
  const giro = cue(e.palabras, d.clave_despues, Math.round(fotogramas * 0.5));
  const flecha = interpolate(f, [giro - 8, giro + 8], [0, 1], { ...clamp, easing: suave });
  const Lado: React.FC<{ x: number; tono: string; icono: string; titulo: string; puntos: string[]; desde: number; desorden?: boolean }> = ({ x, tono, icono, titulo, puntos, desde, desorden }) => (
    <Entra desde={desde} dy={34} style={{ position: 'absolute', left: x, top: ARRIBA + 20, width: 560 }}>
      <Panel tono={tono} brillo={0.4} style={{ minHeight: 430, padding: '34px 36px', background: `linear-gradient(160deg, ${tono}1F, ${N.panel}F2 55%)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Icono nombre={icono} color={tono} tam={50} />
          <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(titulo, 40, 20, 28), color: tono }}>{titulo}</div>
        </div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {puntos.slice(0, 4).map((p, i) => {
            const nace = desde + 10 + i * 8;
            const ruido = desorden ? (random(`d${i}`) - 0.5) * 7 * interpolate(f, [giro, giro + 18], [1, 0.25], clamp) : 0;
            return (
              <div key={i} style={{ opacity: f < nace ? 0 : 1, transform: `rotate(${ruido}deg) translateX(${ruido * 3}px)`, padding: '14px 18px', borderRadius: 12, background: `${N.fondo}AA`, border: `1.5px solid ${N.borde}`, fontFamily: fuenteTexto, fontSize: ajustar(p, 27, 46, 20), color: N.tinta, lineHeight: 1.25 }}>{p}</div>
            );
          })}
        </div>
      </Panel>
    </Entra>
  );
  return (
    <>
      <Lado x={IZQ} tono={N.rojo} icono={antes.icono ?? 'alerta'} titulo={antes.titulo ?? 'Antes'} puntos={lista<string>(antes.puntos, 4)} desde={6} desorden />
      <svg width={130} height={80} style={{ position: 'absolute', left: IZQ + 580, top: 470, opacity: flecha }}>
        <path d={`M8 40 H${8 + 96 * flecha}`} stroke={N.oro} strokeWidth={8} strokeLinecap="round" />
        <path d="M86 18 L112 40 L86 62" fill="none" stroke={N.oro} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={flecha} />
      </svg>
      <Lado x={IZQ + 730} tono={N.verde} icono={despues.icono ?? 'check'} titulo={despues.titulo ?? 'Después'} puntos={lista<string>(despues.puntos, 4)} desde={giro} />
      <Pop en={giro} />
    </>
  );
};

// ── frase: una idea para recordar (aprendizaje, lema, cita) ──
const Frase: React.FC<PropsVista> = ({ e, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const texto: string = d.texto ?? '';
  const linea = interpolate(f, [20, 46], [0, 1], { ...clamp, easing: suave });
  const golpe = useMuelle(4, 200, 11);
  return (
    <>
      <div style={{ position: 'absolute', left: IZQ + 20, top: 330, transform: `scale(${golpe})` }}>
        <div style={{ width: 230, height: 230, borderRadius: '50%', border: `3px solid ${acento}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${acento}18`, boxShadow: `0 0 70px ${acento}44` }}>
          <Icono nombre={d.icono ?? 'bombilla'} color={acento} tam={130} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: IZQ + 330, top: 270, width: ANCHO_Z - 330 }}>
        {d.etiqueta && <Entra desde={6} dx={-30} dy={0}><Etiqueta tono={acento} style={{ fontSize: 22, letterSpacing: 6 }}>{d.etiqueta.toUpperCase()}</Etiqueta></Entra>}
        <Entra desde={12} dx={-30} dy={0}>
          <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(texto, 74, 50, 46), color: N.tinta, lineHeight: 1.15, marginTop: 20, letterSpacing: -1 }}><Resaltado texto={texto} resaltar={d.resaltar} /></div>
        </Entra>
        <div style={{ height: 7, width: 560 * linea, borderRadius: 4, background: ESPECTRO, marginTop: 30 }} />
      </div>
      <Pop en={4} />
    </>
  );
};

// ── lista: hasta 6 puntos que se marcan al nombrarlos (con nota o porcentaje opcional) ──
const Lista: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const items = lista<any>(d.items, 6);
  const t = momentos(e.palabras, items, fotogramas, 14);
  const fila = Math.min(118, (d.titulo ? 560 : 640) / Math.max(1, items.length));
  return (
    <>
      {d.titulo && <Entra desde={2} style={{ position: 'absolute', left: IZQ, top: ARRIBA + 10, fontFamily: fuenteTexto, fontWeight: 800, fontSize: 54, color: N.tinta }}>{d.titulo}</Entra>}
      <div style={{ position: 'absolute', left: IZQ, top: d.titulo ? 330 : 260, width: ANCHO_Z }}>
        {items.map((it, i) => {
          const on = f >= t[i];
          const tk = interpolate(f, [t[i], t[i] + 10], [0, 1], clamp);
          const tono = colorDe(i, acento);
          return (
            <Entra key={i} desde={Math.max(0, t[i] - 12)} dx={-30} dy={0} style={{ height: fila, display: 'flex', alignItems: 'center', gap: 26, borderBottom: `1.5px solid ${N.borde}` }}>
              <Check on={on} t={tk} tono={tono} tam={Math.min(46, fila * 0.5)} />
              <div style={{ flex: 1, fontFamily: fuenteTexto, fontWeight: 700, fontSize: ajustar(it.texto ?? '', Math.min(40, fila * 0.42), 44, 22), color: on ? N.tinta : N.suave, lineHeight: 1.2 }}>{it.texto}</div>
              {it.pct !== undefined && (
                <div style={{ width: 260, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, height: 14, borderRadius: 7, background: N.rejilla }}>
                    <div style={{ height: '100%', borderRadius: 7, width: `${interpolate(f, [t[i], t[i] + 24], [0, Number(it.pct) || 0], { ...clamp, easing: suave })}%`, background: tono }} />
                  </div>
                  <span style={{ fontFamily: fuenteMono, fontSize: 22, fontWeight: 700, color: tono, width: 70, textAlign: 'right' }}>{it.pct} %</span>
                </div>
              )}
              {it.nota && <div style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${tono}88`, fontFamily: fuenteMono, fontSize: 18, color: tono, whiteSpace: 'nowrap' }}>{it.nota}</div>}
              <Pop en={t[i]} v={0.15} />
            </Entra>
          );
        })}
      </div>
    </>
  );
};

// ── captura: una imagen real (pantallazo, foto del tablero) en un marco de navegador ──
const Captura: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const f = useCurrentFrame();
  const d = e.datos;
  const zoom = interpolate(f, [0, fotogramas], [1, 1.06]);
  const entra = useMuelle(2, 140, 16);
  return (
    <>
      <div style={{ position: 'absolute', left: IZQ, top: ARRIBA + 5, width: ANCHO_Z, height: d.nota ? 620 : 690, transform: `translateY(${(1 - entra) * 40}px)`, opacity: entra, borderRadius: 16, overflow: 'hidden', border: `2px solid ${N.borde}`, boxShadow: `0 30px 80px #000000AA, 0 0 50px ${acento}22`, background: N.panel }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: N.fondo2, borderBottom: `1.5px solid ${N.borde}` }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
          <div style={{ marginLeft: 20, fontFamily: fuenteMono, fontSize: 17, color: N.suave }}>{d.titulo ?? ''}</div>
        </div>
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#0006' }}>
          {d.imagen && <Img src={imagen(d.imagen)} style={{ width: '100%', height: '100%', objectFit: d.ajuste === 'cubrir' ? 'cover' : 'contain', transform: `scale(${zoom})` }} />}
        </div>
      </div>
      {d.nota && <Entra desde={momentos(e.palabras, [{ clave: d.clave_nota }], fotogramas, 24)[0]} style={{ position: 'absolute', left: IZQ, top: 870, width: ANCHO_Z, textAlign: 'center', fontFamily: fuenteTexto, fontSize: 30, fontWeight: 700, color: N.tinta }}>{d.nota}</Entra>}
    </>
  );
};

// ── cierre: el balance de la semana (anillo o cifra) + puntos + remate ──
const Cierre: React.FC<PropsVista> = ({ e, fotogramas, acento }) => {
  const d = e.datos;
  const puntos = lista<any>(d.puntos, 3).map((p) => (typeof p === 'string' ? { texto: p } : p));
  const t = momentos(e.palabras, puntos, fotogramas, 26);
  const remate = cue(e.palabras, d.clave_remate, Math.round(fotogramas * 0.62));
  const pct = d.pct !== undefined ? Number(d.pct) : undefined;
  const valor = String(d.valor ?? (pct !== undefined ? `${pct} %` : ''));
  return (
    <>
      <Entra desde={2} dy={30} style={{ position: 'absolute', left: IZQ + 30, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 400 }}>
        {pct !== undefined ? (
          <Anillo pct={pct} desde={4} tam={380} grosor={30} color={acento}>
            <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(valor, 100, 5, 60), color: N.tinta }}><Valor texto={valor} desde={4} dura={36} /></div>
          </Anillo>
        ) : (
          <div style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(valor, 170, 4, 80), color: acento, textShadow: `0 0 50px ${acento}66`, height: 380, display: 'flex', alignItems: 'center' }}><Valor texto={valor} desde={4} dura={36} /></div>
        )}
        <div style={{ fontFamily: fuenteTexto, fontWeight: 700, fontSize: 30, color: N.suave, marginTop: 22, textAlign: 'center' }}>{d.etiqueta}</div>
      </Entra>
      <div style={{ position: 'absolute', left: IZQ + 500, top: 280, width: ANCHO_Z - 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {puntos.map((p, i) => (
          <Entra key={i} desde={t[i]} dx={30} dy={0}>
            <Panel tono={colorDe(i + 1, acento)} style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <Icono nombre={p.icono ?? 'check'} color={colorDe(i + 1, acento)} tam={42} />
              <div style={{ fontFamily: fuenteTexto, fontWeight: 700, fontSize: ajustar(p.texto ?? '', 32, 34, 22), color: N.tinta }}>{p.texto}</div>
            </Panel>
            <Pop en={t[i]} v={0.15} />
          </Entra>
        ))}
      </div>
      {d.remate && (
        <Entra desde={remate} dy={30} style={{ position: 'absolute', left: IZQ, top: 790, width: ANCHO_Z, textAlign: 'center' }}>
          <span style={{ fontFamily: fuenteTexto, fontWeight: 800, fontSize: ajustar(d.remate, 52, 44, 34), ...textoDegradado }}>{d.remate}</span>
        </Entra>
      )}
    </>
  );
};

export const VISTAS: Record<string, React.FC<PropsVista>> = {
  portada: Portada, titular: Titular, marcador: Marcador, tarjetas: Tarjetas, progreso: Progreso, barras: Barras,
  antes_despues: AntesDespues, frase: Frase, lista: Lista, captura: Captura, cierre: Cierre,
};
export type { PalabraI };
