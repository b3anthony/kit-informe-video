// Portada y cierre del equipo (van una sola vez: al principio y al final del vídeo completo).
// Portada: el presentador presenta a cada integrante; al nombrarlo se enciende su foco y sube su personaje.
// Cierre: el presentador entra empujando la G, la frena con un golpe y sale «Gracias»; al final asoman los integrantes.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo, Subtitulo } from './Informe';
import {
  bocaAbierta, clamp, cue, ESPECTRO, FPS, fuenteMono, fuenteTexto, LogoG, N, Pop, SFX, Sprite, suave, textoDegradado, useMuelle,
  type PalabraI, type PersonajeP,
} from './piezas';

export interface IntegranteP { nombre: string; area: string; tema?: string; clave: string; personaje: PersonajeP }
export interface EquipoProps {
  empresa: string; equipo: string; periodo: string; titulo?: string;
  integrantes: IntegranteP[]; presentador?: PersonajeP | null;
  audio: string; duracion: number; palabras: PalabraI[];
}
const audio = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
export const RETRASO_CIERRE = 52; // la voz del cierre empieza después del golpe de la G
export const duracionPortada = (p: Pick<EquipoProps, 'duracion'>) => Math.ceil((p.duracion + 1.2) * FPS);
export const duracionCierre = (p: Pick<EquipoProps, 'duracion'>) => RETRASO_CIERRE + Math.ceil((p.duracion + 1.4) * FPS);

// ───────────── Portada ─────────────
const CARTA_Y = 680;
const Tarjeta: React.FC<{ m: IntegranteP; i: number; n: number; on: number; actual: boolean }> = ({ m, i, n, on, actual }) => {
  const f = useCurrentFrame();
  const espacio = 1270 / n;
  const x = 560 + espacio * (i + 0.5);
  const ancho = Math.min(320, espacio - 30);
  const entra = 34 + i * 7;
  const t = useMuelle(entra, 150, 16);
  const brilla = interpolate(f, [on, on + 10], [0, 1], { ...clamp, easing: suave });
  const asoma = useMuelle(on, 170, 13);
  const tono = m.personaje.tono;
  const foco = brilla * (actual ? 1 : 0.42);
  const ESC = 0.4;
  return (
    <>
      <div style={{ position: 'absolute', left: x - ancho / 2, top: 268, width: ancho, height: CARTA_Y - 268, opacity: foco, clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)', background: `linear-gradient(180deg, ${tono}66, ${tono}1A)` }} />
      <div style={{ position: 'absolute', left: x - 13, top: 258, width: 26, height: 16, borderRadius: '4px 4px 13px 13px', background: f >= on ? tono : N.borde, boxShadow: f >= on ? `0 0 24px ${tono}` : 'none' }} />
      <div style={{ position: 'absolute', left: x - ancho / 2, top: 276, width: ancho, height: CARTA_Y - 276 + 10, overflow: 'hidden' }}>
        {f >= on && <Sprite p={m.personaje} cara={actual && m.personaje.caras.abierta ? 'abierta' : 'normal'} x={ancho / 2} suelo={CARTA_Y - 276 + 34 + (1 - asoma) * 420 + Math.sin(f / 9 + i) * 2} esc={ESC} />}
      </div>
      <div style={{ position: 'absolute', left: x - ancho / 2 + 8, top: CARTA_Y, width: ancho - 16, height: 250, opacity: f < entra ? 0 : Math.min(1, t * 1.6) * (brilla > 0 ? 1 : 0.5), transform: `translateY(${(1 - t) * 40}px)` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: `linear-gradient(160deg, ${tono}${brilla > 0.5 ? '24' : '00'}, ${N.panel} 55%)`, backgroundColor: N.panel, border: `2px solid ${brilla > 0.5 ? tono : N.borde}`, boxShadow: `0 24px 60px #00000066, 0 0 ${50 * foco}px ${tono}44`, overflow: 'hidden', fontFamily: fuenteTexto, padding: '16px 18px 0 26px', boxSizing: 'border-box' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, background: brilla > 0.5 ? tono : N.borde }} />
          <div style={{ height: 76, display: 'flex', alignItems: 'center', fontSize: m.nombre.length > 22 ? 26 : 31, fontWeight: 800, color: N.tinta, lineHeight: 1.12 }}>{m.nombre}</div>
          <div style={{ height: 44, marginTop: 8, fontFamily: fuenteMono, fontSize: 15, color: N.oro, letterSpacing: 1, lineHeight: 1.3 }}>{m.area.toUpperCase()}</div>
          {m.tema && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 21, fontWeight: 700, color: N.tinta, lineHeight: 1.18, opacity: brilla, transform: `translateX(${(1 - brilla) * -16}px)` }}>
              <span style={{ color: tono }}>✓</span>{m.tema}
            </div>
          )}
        </div>
      </div>
      <Pop en={on} v={0.2} />
    </>
  );
};

const PresentadorPortada: React.FC<{ p: PersonajeP; palabras: PalabraI[]; saltos: number[] }> = ({ p, palabras, saltos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const ultimo = [...saltos].reverse().find((k) => f >= k) ?? -99;
  const salto = (1 - spring({ frame: f - ultimo, fps, config: { damping: 9, stiffness: 240 } })) * 26;
  const X = 280;
  const SUELO = 930;
  return (
    <>
      <div style={{ position: 'absolute', left: X - 190, top: SUELO - 30, width: 380, height: 60, borderRadius: '50%', background: `radial-gradient(ellipse, ${p.tono}77 0%, transparent 70%)` }} />
      <Sprite p={p} cara={bocaAbierta(palabras, f / FPS) ? 'abierta' : 'normal'} x={X + (1 - entra) * -460} suelo={SUELO - salto + Math.sin(f / 10) * 3} esc={0.62} />
      <div style={{ position: 'absolute', left: X - 160, width: 320, top: SUELO + 8, textAlign: 'center', fontFamily: fuenteMono, fontSize: 18, letterSpacing: 3, color: N.suave, opacity: entra }}>
        <span style={{ padding: '6px 14px', borderRadius: 6, border: `1.5px solid ${p.tono}88`, background: `${N.panel}DD` }}>{p.nombre.toUpperCase()}</span>
      </div>
    </>
  );
};

export const PortadaEquipo: React.FC<EquipoProps> = ({ empresa, equipo, periodo, titulo = 'Reporte semanal de actividades', integrantes, presentador, audio: voz, palabras }) => {
  const f = useCurrentFrame();
  const momentos = integrantes.map((m, i) => cue(palabras, m.clave, 60 + i * 45));
  const final = (momentos[momentos.length - 1] ?? 60) + 40;
  const chip = cue(palabras, equipo, 30);
  const fin = interpolate(f, [final, final + 16], [0, 1], { ...clamp, easing: suave });
  const actual = [...momentos].reverse().findIndex((k) => f >= k);
  const indice = actual < 0 ? -1 : momentos.length - 1 - actual;
  const cinta = useMuelle(chip, 240, 12);
  return (
    <AbsoluteFill style={{ background: N.fondo, color: N.tinta, fontFamily: fuenteTexto }}>
      <Fondo />
      <div style={{ position: 'absolute', left: 0, top: 0, height: 8, width: `${interpolate(f, [0, 22], [0, 100], clamp)}%`, background: ESPECTRO }} />
      <div style={{ position: 'absolute', left: 96, top: 54, width: 1400 }}>
        <div style={{ fontFamily: fuenteMono, fontSize: 24, fontWeight: 700, color: N.oro, letterSpacing: 6, opacity: interpolate(f, [2, 14], [0, 1], clamp) }}>{empresa.toUpperCase()}</div>
        <div style={{ fontSize: titulo.length > 32 ? 62 : 76, fontWeight: 800, color: N.tinta, lineHeight: 1.08, marginTop: 10, letterSpacing: -1.5, whiteSpace: 'nowrap', opacity: interpolate(f, [4, 16], [0, 1], clamp), transform: `translateY(${interpolate(f, [4, 18], [24, 0], { ...clamp, easing: suave })}px)` }}>{titulo}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
          <div style={{ padding: '8px 20px', borderRadius: 10, background: N.oro, color: N.fondo, fontFamily: fuenteMono, fontSize: 21, fontWeight: 800, letterSpacing: 3, transform: `scale(${f >= chip ? 1.25 - 0.25 * cinta : 1})`, opacity: f >= chip ? 1 : 0.35 }}>EQUIPO {equipo.toUpperCase()}</div>
          <div style={{ fontFamily: fuenteMono, fontSize: 21, color: N.suave, letterSpacing: 2, opacity: interpolate(f, [20, 32], [0, 1], clamp) }}>{periodo.toUpperCase()}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1620, top: 42, transform: `scale(${1 + 0.1 * Math.sin(fin * Math.PI)})` }}>
        <LogoG alto={190} t={interpolate(f, [4, 40], [0, 1], clamp)} brillo={Math.max(interpolate(f, [36, 46, 100], [0, 1, 0.4], clamp), fin)} />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 262, width: 1272, height: 3, background: N.borde, opacity: interpolate(f, [26, 40], [0, 1], clamp) }} />
      {integrantes.map((m, i) => <Tarjeta key={i} m={m} i={i} n={integrantes.length} on={momentos[i]} actual={indice === i || f >= final} />)}
      {presentador && <PresentadorPortada p={presentador} palabras={palabras} saltos={momentos} />}
      <Subtitulo palabras={palabras} ancho={1728} max={7} top={972} />
      <Audio src={audio(voz)} />
      <Audio src={SFX.riser} volume={0.22} />
      <Sequence from={final} durationInFrames={40}><Audio src={SFX.boom} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

// ───────────── Cierre ─────────────
const SUELO = 480;
const ALTO_G = 290;
const META = 1095;
const GOLPE = 44;
const SEP = 298;
const avance = (f: number) => {
  const tramos: [number, number, number, number][] = [[0, 16, -220, 300], [16, 30, 300, 720], [30, GOLPE, 720, META]];
  const t = tramos.find(([, b]) => f < b) ?? tramos[2];
  return interpolate(f, [t[0], t[1]], [t[2], t[3]], { ...clamp, easing: (k) => k * k * (3 - 2 * k) });
};
const Sube: React.FC<{ desde: number; children: React.ReactNode }> = ({ desde, children }) => {
  const t = useMuelle(desde, 160, 15);
  return <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: 10 }}><span style={{ display: 'inline-block', transform: `translateY(${(1 - t) * 110}%)`, opacity: Math.min(1, t * 2) }}>{children}</span></span>;
};
const Empujador: React.FC<{ p: PersonajeP; palabras: PalabraI[] }> = ({ p, palabras }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const atras = spring({ frame: f - GOLPE - 2, fps, config: { damping: 13, stiffness: 120 } });
  const inclina = interpolate(f, [GOLPE - 2, GOLPE + 12], [13, 0], { ...clamp, easing: suave });
  const paso = f < GOLPE ? Math.abs(Math.sin(f / 2.6)) * 16 : 0;
  const ESC = 0.5;
  const X = avance(f) - SEP - atras * 30;
  return (
    <>
      <div style={{ position: 'absolute', left: X - 130, top: SUELO - 22, width: 260, height: 44, borderRadius: '50%', background: `radial-gradient(ellipse, ${p.tono}66 0%, transparent 70%)` }} />
      <Sprite p={p} cara={bocaAbierta(palabras, f / FPS) ? 'abierta' : 'normal'} x={X} suelo={SUELO - paso + (f >= GOLPE ? Math.sin(f / 10) * 2 : 0)} esc={ESC}
        style={{ transform: `rotate(${inclina}deg)`, transformOrigin: `${p.cx * ESC}px ${p.pies * ESC}px` }} />
    </>
  );
};
const Polvo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: 22 }, (_, i) => {
        const nace = (i * GOLPE) / 22;
        const edad = f - nace;
        if (edad < 0 || edad > 22) return null;
        const a = edad / 22;
        return <circle key={i} cx={avance(nace) - 150 - random(`px${i}`) * 26 - a * (30 + random(`pv${i}`) * 70)} cy={SUELO - 6 - a * (18 + random(`py${i}`) * 34)} r={4 + a * 14} fill={N.suave} opacity={(1 - a) * 0.3} />;
      })}
      {f >= GOLPE && Array.from({ length: 14 }, (_, i) => {
        const a = (f - GOLPE) / 20;
        if (a > 1) return null;
        const ang = Math.PI + (i / 13) * Math.PI;
        const r = 40 + a * (90 + random(`gr${i}`) * 90);
        return <circle key={`g${i}`} cx={META + Math.cos(ang) * r * 1.5} cy={SUELO - 4 + Math.sin(ang) * r * 0.22} r={4 + a * 8} fill={N.suave} opacity={(1 - a) * 0.34} />;
      })}
    </svg>
  );
};
const Asoma: React.FC<{ p: PersonajeP; i: number; n: number; desde: number }> = ({ p, i, n, desde }) => {
  const f = useCurrentFrame();
  const t = useMuelle(desde + i * 5, 200, 12);
  const X = 960 - (n - 1) * 100 + i * 200;
  if (f < desde + i * 5) return null;
  return <Sprite p={p} cara={p.caras.abierta ? 'abierta' : 'normal'} x={X} suelo={1050 + (1 - t) * 260 + Math.sin(f / 8 + i * 2) * 3} esc={0.19} />;
};

export const CierreEquipo: React.FC<EquipoProps> = ({ empresa, equipo, integrantes, presentador, audio: voz, palabras: crudas }) => {
  const f = useCurrentFrame();
  const palabras = crudas.map((w) => ({ ...w, i: w.i + RETRASO_CIERRE / FPS, f: w.f + RETRASO_CIERRE / FPS }));
  const gracias = cue(palabras, 'Gracias', 56);
  const atencion = cue(palabras, 'atención', 68);
  const chipEquipo = cue(palabras, 'equipo', 100);
  const x = avance(f);
  const dt = f - GOLPE;
  const temblor = dt >= 0 ? Math.sin(dt * 1.5) * interpolate(dt, [0, 16], [5, 0], clamp) : 0;
  const pantalla = dt >= 0 ? Math.sin(dt * 2.4) * interpolate(dt, [0, 10], [7, 0], clamp) : 0;
  const empuja = f < GOLPE ? interpolate(Math.sin(f / 2.6), [-1, 1], [-1.2, 1.2]) : 0;
  const brillo = dt >= 0 ? interpolate(dt, [0, 8, 60], [1, 1, 0.5], clamp) : 0.15;
  const linea = interpolate(f, [atencion, atencion + 20], [0, 1], { ...clamp, easing: suave });
  const chip = useMuelle(chipEquipo, 220, 12);
  const ANCHO_G = ALTO_G * 1.02;
  return (
    <AbsoluteFill style={{ background: N.fondo, color: N.tinta, fontFamily: fuenteTexto }}>
      <Fondo />
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${pantalla}px)` }}>
        <div style={{ position: 'absolute', left: 240, top: SUELO, width: 1440, height: 4, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${N.borde} 15%, ${N.borde} 85%, transparent)` }} />
        <div style={{ position: 'absolute', left: x - ANCHO_G * 0.6, top: SUELO - 20, width: ANCHO_G * 1.2, height: 40, borderRadius: '50%', background: 'radial-gradient(ellipse, #00000099 0%, transparent 70%)' }} />
        <Polvo />
        <div style={{ position: 'absolute', left: x - ANCHO_G / 2 + temblor, top: SUELO - ALTO_G, transform: `rotate(${f < GOLPE ? empuja : temblor * 0.5}deg)`, transformOrigin: '50% 100%' }}>
          <LogoG alto={ALTO_G} brillo={brillo} />
        </div>
        {presentador && <Empujador p={presentador} palabras={palabras} />}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 510, textAlign: 'center', fontSize: 150, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
          <Sube desde={gracias}><span style={textoDegradado}>Gracias</span></Sube>
          <Pop en={gracias} v={0.2} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 668, textAlign: 'center', fontSize: 42, color: N.suave }}>
          <Sube desde={atencion - 6}>por su atención</Sube>
        </div>
        <div style={{ position: 'absolute', left: 960 - 260 * linea, top: 734, width: 520 * linea, height: 5, borderRadius: 3, background: ESPECTRO }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', opacity: f < chipEquipo ? 0 : 1 }}>
          <div style={{ padding: '10px 28px', borderRadius: 10, background: N.oro, color: N.fondo, fontFamily: fuenteMono, fontSize: 24, fontWeight: 800, letterSpacing: 4, transform: `scale(${1.5 - 0.5 * chip})`, boxShadow: '0 14px 40px #00000077' }}>
            EQUIPO {equipo.toUpperCase()} · {empresa.toUpperCase()}
          </div>
        </div>
        {integrantes.map((m, i) => <Asoma key={i} p={m.personaje} i={i} n={integrantes.length} desde={chipEquipo + 10} />)}
      </div>
      <Sequence from={RETRASO_CIERRE}><Audio src={audio(voz)} /></Sequence>
      <Sequence from={0} durationInFrames={GOLPE}><Audio src={SFX.whoosh} volume={0.16} /></Sequence>
      <Sequence from={GOLPE - 1} durationInFrames={40}><Audio src={SFX.boom} volume={0.42} /></Sequence>
    </AbsoluteFill>
  );
};
