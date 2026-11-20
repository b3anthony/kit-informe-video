// Vídeo de un integrante: fondo, cabecera con capítulos, una escena por frase, su personaje a la derecha
// (respira, salta y mueve la boca con su voz), subtítulo palabra a palabra y, si hay, el aparte del presentador.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VISTAS } from './escenas';
import {
  ALTO, bocaAbierta, clamp, cue, ESPECTRO, FPS, fuenteMono, fuenteTexto, LogoG, MARCA, N, Seccion, SFX, Sprite, suave,
  type EscenaI, type PalabraI, type PersonajeP,
} from './piezas';

export interface InformeProps {
  escenas: EscenaI[];
  persona: string; area: string; equipo: string; empresa: string; periodo: string;
  personaje: PersonajeP;
  /** Quien hace los apartes (opcional). */ presentador?: PersonajeP | null;
  /** Color de acento; por defecto, el del personaje. */ acento?: string;
}

const PAUSA = 0.25;
const PAUSA_APARTE = 0.3;
const aparteDesde = (e: EscenaI) => Math.round((e.duracion + PAUSA_APARTE) * FPS);
const audio = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));

export function prepararInforme({ escenas }: { escenas: EscenaI[] }) {
  let desde = 0;
  const tramos = escenas.map((e, n) => {
    const voz = e.duracion + (e.aparte ? PAUSA_APARTE + e.aparte.duracion + 0.45 : 0);
    const fotogramas = Math.ceil((voz + PAUSA + (n === escenas.length - 1 ? 1.3 : 0)) * FPS);
    const t = { e, desde, fotogramas };
    desde += fotogramas;
    return t;
  });
  return { tramos, fin: desde, total: Math.max(1, desde) };
}

export const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  const puntos = Array.from({ length: 80 }, (_, i) => ({
    x: (random(`fx${i}`) * 2100 + f * (0.12 + random(`fv${i}`) * 0.3)) % 2100 - 90,
    y: random(`fy${i}`) * ALTO, r: 1 + random(`fr${i}`) * 1.8, a: 0.12 + random(`fa${i}`) * 0.35, c: MARCA[i % MARCA.length],
  }));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${N.fondo2} 0%, ${N.fondo} 60%)` }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${N.rejilla} 1.6px, transparent 1.6px)`, backgroundSize: '48px 48px', opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: -300 + Math.sin(f / 90) * 60, top: -380, width: 1100, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${MARCA[0]}33 0%, transparent 65%)`, filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', right: -260 + Math.cos(f / 110) * 50, bottom: -420, width: 1100, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${MARCA[3]}26 0%, transparent 65%)`, filter: 'blur(30px)' }} />
      <svg width={1920} height={ALTO} style={{ position: 'absolute' }}>{puntos.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity={p.a} />)}</svg>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 80% at 45% 45%, transparent 55%, ${N.fondo}EE 100%)` }} />
    </AbsoluteFill>
  );
};

const Cabecera: React.FC<{ actual: string; persona: string; equipo: string; empresa: string; periodo: string; avance: number; capitulos: { titulo: string; ids: string[] }[]; acento: string }> = ({ actual, persona, equipo, empresa, periodo, avance, capitulos, acento }) => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, height: 5, width: `${avance * 100}%`, background: ESPECTRO }} />
    <div style={{ position: 'absolute', top: 36, left: 80, right: 80, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, fontFamily: fuenteMono, fontSize: 19, letterSpacing: 3, color: N.tenue }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <LogoG alto={40} />
        <span style={{ color: N.suave, fontWeight: 700 }}>{empresa.toUpperCase()}</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>· {equipo.toUpperCase()} · {persona.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {capitulos.map((c, i) => {
          const on = c.ids.includes(actual);
          return (
            <div key={c.titulo} style={{ padding: '7px 16px', borderRadius: 30, border: `1.5px solid ${on ? acento : N.borde}`, color: on ? N.tinta : N.tenue, background: on ? `${acento}1F` : 'transparent', fontSize: 16, letterSpacing: 2, whiteSpace: 'nowrap' }}>
              {String(i + 1).padStart(2, '0')} {c.titulo.toUpperCase()}
            </div>
          );
        })}
      </div>
      <span style={{ whiteSpace: 'nowrap' }}>{periodo.toUpperCase()}</span>
    </div>
  </>
);

/** El personaje de quien presenta, abajo a la derecha. */
const Avatar: React.FC<{ e: EscenaI; persona: string; p: PersonajeP; salida?: number }> = ({ e, persona, p, salida = 99999 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inicioAparte = e.aparte ? aparteDesde(e) : 99999;
  const conAparte = f >= inicioAparte;
  const cambio = e.cara ? cue(e.palabras, e.cara.desde, 99999) : 99999;
  const cara = !conAparte && e.cara && f >= cambio ? e.cara.cara : 'normal';
  const habla = !conAparte && cara === 'normal' && p.caras.abierta && bocaAbierta(e.palabras, f / FPS);
  const salto = (1 - spring({ frame: f, fps, config: { damping: 9, stiffness: 180 } })) * 26 + (f >= cambio ? (1 - spring({ frame: f - cambio, fps, config: { damping: 8, stiffness: 220 } })) * 20 : 0);
  const tiembla = cara === 'sorpresa' ? Math.sin(f * 2.1) * 2 : 0;
  const X = 1650 - 66 * spring({ frame: f - (inicioAparte - 8), fps, config: { damping: 15, stiffness: 170 } }) * interpolate(f, [salida, salida + 10], [1, 0], { ...clamp, easing: suave });
  const SUELO = 905;
  return (
    <>
      <div style={{ position: 'absolute', left: X - 170, top: SUELO - 30, width: 340, height: 60, borderRadius: '50%', background: `radial-gradient(ellipse, ${p.tono}55 0%, transparent 70%)` }} />
      <Sprite p={p} cara={habla ? 'abierta' : cara} x={X + tiembla} suelo={SUELO - salto + Math.sin(f / 10) * 3} esc={0.44} />
      <div style={{ position: 'absolute', left: X - 170, width: 340, top: SUELO + 26, textAlign: 'center', fontFamily: fuenteMono, fontSize: 18, letterSpacing: 3, color: N.suave }}>
        <span style={{ padding: '6px 14px', borderRadius: 6, border: `1.5px solid ${N.borde}`, background: `${N.panel}DD`, whiteSpace: 'nowrap' }}>{persona.split(' ').slice(0, 2).join(' ').toUpperCase()}</span>
      </div>
    </>
  );
};

/** El presentador entra por la derecha, dice su línea en un bocadillo y se va antes del corte. */
const Aparte: React.FC<{ palabras: PalabraI[]; p: PersonajeP; salida?: number }> = ({ palabras, p, salida = 99999 }) => {
  const f = useCurrentFrame() + 8;
  const { fps } = useVideoConfig();
  const t = f / FPS - 8 / FPS;
  const fuera = interpolate(useCurrentFrame(), [salida, salida + 10], [1, 0], { ...clamp, easing: suave });
  const entra = spring({ frame: f, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } }) * fuera;
  const globo = spring({ frame: f - 7, fps, config: { damping: 13, stiffness: 240, mass: 0.6 } }) * fuera;
  const X = 1786;
  const SUELO = 905;
  return (
    <>
      <div style={{ position: 'absolute', left: X - 130, top: SUELO - 24, width: 260, height: 48, borderRadius: '50%', background: `radial-gradient(ellipse, ${p.tono}66 0%, transparent 70%)`, opacity: entra }} />
      <Sprite p={p} cara={bocaAbierta(palabras, t) ? 'abierta' : 'normal'} x={X + (1 - entra) * 260} suelo={SUELO + Math.sin(f / 9) * 3} esc={0.37} />
      <div style={{ position: 'absolute', left: 1474, top: 390, width: 412, height: 190, display: 'flex', alignItems: 'flex-end', transform: `scale(${globo})`, transformOrigin: '80% 100%', opacity: Math.min(1, globo * 2) }}>
        <div style={{ position: 'relative', width: '100%', padding: '18px 24px', borderRadius: 18, background: N.panel, border: `2.5px solid ${p.tono}`, boxShadow: `0 16px 44px #00000088, 0 0 36px ${p.tono}33`, fontFamily: fuenteTexto, fontWeight: 700, fontSize: 34, lineHeight: 1.22 }}>
          {palabras.map((w, i) => <React.Fragment key={i}><span style={{ color: t >= w.i ? N.tinta : N.tenue }}>{w.p}</span>{' '}</React.Fragment>)}
          <svg width={44} height={78} style={{ position: 'absolute', right: 62, bottom: -76 }}><path d="M0 2 L38 74 L40 2 Z" fill={N.panel} /><path d="M0 2 L38 74 L40 2" fill="none" stroke={p.tono} strokeWidth={2.5} strokeLinejoin="round" /></svg>
        </div>
      </div>
    </>
  );
};

/** Subtítulo: grupos de hasta `max` palabras; la que suena va en oro. */
export const Subtitulo: React.FC<{ palabras: PalabraI[]; ancho?: number; max?: number; top?: number }> = ({ palabras, ancho = 1290, max = 6, top = 960 }) => {
  const t = useCurrentFrame() / FPS;
  const grupos: PalabraI[][] = [[]];
  for (const p of palabras) {
    const g = grupos[grupos.length - 1];
    g.push(p);
    if (g.length >= max || /[.,:;!?…]$/.test(p.p)) grupos.push([]);
  }
  const grupo = grupos.filter((g) => g.length).reverse().find((g) => g[0].i <= t + 0.05);
  if (!grupo || t > grupo[grupo.length - 1].f + 0.6) return null;
  return (
    <div style={{ position: 'absolute', top, left: 96, width: ancho, textAlign: 'center', fontFamily: fuenteTexto, fontWeight: 700, fontSize: 44 }}>
      <span style={{ padding: '10px 26px', borderRadius: 12, background: `${N.fondo}CC` }}>
        {grupo.map((p, i) => {
          const activa = t >= p.i && t < (grupo[i + 1]?.i ?? p.f + 0.1);
          return <span key={i} style={{ color: activa ? N.oro : t >= p.i ? N.tinta : N.tenue, marginRight: i < grupo.length - 1 ? 13 : 0 }}>{p.p}</span>;
        })}
      </span>
    </div>
  );
};

const Transicion: React.FC<{ fotogramas: number; primera: boolean; children: React.ReactNode }> = ({ fotogramas, primera, children }) => {
  const f = useCurrentFrame();
  const entra = primera ? 1 : interpolate(f, [0, 10], [0, 1], { ...clamp, easing: suave });
  const sale = interpolate(f, [fotogramas - 7, fotogramas], [1, 0], clamp);
  return <AbsoluteFill style={{ opacity: Math.min(entra, sale), transform: `translateX(${(1 - entra) * 50}px)` }}>{children}</AbsoluteFill>;
};

export const Informe: React.FC<InformeProps> = ({ escenas, persona, area, equipo, empresa, periodo, personaje, presentador, acento }) => {
  const { tramos, fin } = prepararInforme({ escenas });
  const f = useCurrentFrame();
  const tono = acento ?? personaje.tono;
  const actual = [...tramos].reverse().find((t) => f >= t.desde)?.e.id ?? '';
  // Capítulos de la cabecera: el campo `capitulo` de las escenas, en orden de aparición (máx. 5).
  const capitulos: { titulo: string; ids: string[] }[] = [];
  for (const e of escenas) {
    if (!e.capitulo) continue;
    const c = capitulos.find((x) => x.titulo === e.capitulo);
    if (c) c.ids.push(e.id); else if (capitulos.length < 5) capitulos.push({ titulo: e.capitulo, ids: [e.id] });
  }
  let num = 0;
  return (
    <AbsoluteFill style={{ background: N.fondo, color: N.tinta, fontFamily: fuenteTexto }}>
      <Fondo />
      {f < fin && <Cabecera actual={actual} persona={persona} equipo={equipo} empresa={empresa} periodo={periodo} avance={f / fin} capitulos={capitulos} acento={tono} />}
      {tramos.map(({ e, desde, fotogramas }, i) => {
        const Vista = VISTAS[e.tipo];
        const ultima = i === tramos.length - 1;
        const salida = e.aparte && !ultima ? fotogramas - 11 : undefined;
        const conRotulo = e.tipo !== 'portada';
        if (conRotulo) num++;
        return (
          <Sequence key={e.id} from={desde} durationInFrames={fotogramas}>
            <Transicion fotogramas={fotogramas} primera={i === 0}>
              {conRotulo && <Seccion num={String(num).padStart(2, '0')} texto={e.titulo ?? e.capitulo ?? e.id} nota={e.ilustrativa ? 'Vista ilustrativa' : undefined} acento={tono} />}
              {Vista && <Vista e={e} fotogramas={fotogramas} acento={tono} persona={persona} area={area} periodo={periodo} empresa={empresa} />}
            </Transicion>
            <Avatar e={e} persona={persona} p={personaje} salida={salida} />
            {e.tipo !== 'portada' && <Subtitulo palabras={e.palabras} />}
            <Audio src={audio(e.audio)} />
            {e.aparte && presentador && (
              <Sequence from={aparteDesde(e) - 8} durationInFrames={fotogramas - aparteDesde(e) + 8}>
                <Aparte palabras={e.aparte.palabras} p={presentador} salida={salida === undefined ? undefined : salida - (aparteDesde(e) - 8)} />
                <Audio src={SFX.pop} volume={0.2} />
                <Sequence from={8}><Audio src={audio(e.aparte.audio)} /></Sequence>
              </Sequence>
            )}
            {i > 0 && <Audio src={SFX.whoosh} volume={0.15} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
