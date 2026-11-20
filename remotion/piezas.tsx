// Piezas comunes: paleta, fuentes, tiempos de voz, logo G, paneles, sellos, contadores e iconos.
// Todo lo que cambia de un informe a otro llega por props (ver ../scripts/hacer-video.mjs); aquí no hay datos de nadie.
import React from 'react';
import { Audio, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as cargarMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as cargarTexto } from '@remotion/google-fonts/PlusJakartaSans';
import { LOGO_DEFS, LOGO_PIECES, LOGO_VIEWBOX } from './logo';

export const FPS = 30;
export const ANCHO = 1920;
export const ALTO = 1080;
export const fuenteMono = cargarMono('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily;
export const fuenteTexto = cargarTexto('normal', { weights: ['500', '700', '800'], subsets: ['latin'] }).fontFamily;

export const N = {
  fondo: '#050F19', fondo2: '#0A1B2A', panel: '#0B1C2B', borde: '#1C3446', rejilla: '#12283A',
  tinta: '#EEF3F7', suave: '#A9BBC9', tenue: '#617A8C', oro: '#E7B34E', verde: '#4ADE9A', rojo: '#FF6B6B',
};
/** Colores del logo de Giantucchi. */
export const MARCA = ['#2355c3', '#6f3aa8', '#c8366f', '#ef6e2a', '#fca20c'];
export const ESPECTRO = `linear-gradient(90deg, ${MARCA.join(', ')})`;
/** Colores para series (anillos, barras, tarjetas), legibles sobre el panel oscuro. */
export const SERIE = ['#4C8DF6', '#EC4899', '#F2B84B', '#4ADE9A', '#A78BFA', '#FF7A59'];
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const suave = (x: number) => 1 - Math.pow(1 - x, 3);
export const textoDegradado: React.CSSProperties = { background: ESPECTRO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export const SFX = {
  pop: new URL('./recursos/sfx/pop.wav', import.meta.url).href,
  boom: new URL('./recursos/sfx/boom.wav', import.meta.url).href,
  whoosh: new URL('./recursos/sfx/whoosh.wav', import.meta.url).href,
  riser: new URL('./recursos/sfx/riser.wav', import.meta.url).href,
};

// ── Tipos que llegan en props ──
export interface PalabraI { p: string; i: number; f: number }
export interface AparteI { audio: string; duracion: number; palabras: PalabraI[] }
/** Personaje ya resuelto por hacer-video.mjs: rutas dentro de public/ y punto de apoyo (cx, pies) en el lienzo 768×1376. */
export interface PersonajeP { nombre: string; tono: string; cx: number; pies: number; caras: Record<string, string> }
export interface EscenaI {
  id: string; tipo: string; titulo?: string; capitulo?: string; ilustrativa?: boolean;
  datos: Record<string, any>;
  /** Cara del personaje a partir de una palabra: { cara: 'sorpresa', desde: 'palabra' }. */ cara?: { cara: string; desde: string };
  audio: string; duracion: number; palabras: PalabraI[]; aparte?: AparteI;
}

export const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');
/** Fotograma (dentro de la escena) en que la voz dice la primera palabra que empieza por `clave` (admite varias palabras). */
export const cue = (palabras: PalabraI[], clave: string | undefined, respaldo = 0) => {
  if (!clave) return respaldo;
  const partes = clave.split(/\s+/).map(normalizar).filter(Boolean);
  if (!partes.length) return respaldo;
  for (let k = 0; k < palabras.length; k++) {
    if (partes.every((p, j) => palabras[k + j] && normalizar(palabras[k + j].p).startsWith(p))) return Math.round(palabras[k].i * FPS);
  }
  return respaldo;
};
/** Momento de aparición de cada elemento: su `clave` si la voz la dice; si no, repartidos a lo largo de la frase. */
export const momentos = (palabras: PalabraI[], items: { clave?: string }[], fotogramas: number, desde = 14) => {
  const hueco = Math.max(8, (fotogramas * 0.62 - desde) / Math.max(1, items.length));
  return items.map((it, i) => cue(palabras, it.clave, Math.round(desde + hueco * i)));
};

export const imagen = (ruta: string) => (/^(https?:|data:)/.test(ruta) ? ruta : staticFile(ruta));

export const useMuelle = (desde: number, rigidez = 150, amort = 16) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - desde, fps, config: { damping: amort, stiffness: rigidez, mass: 0.7 } });
};

export const Entra: React.FC<{ desde: number; children: React.ReactNode; style?: React.CSSProperties; dx?: number; dy?: number }> = ({ desde, children, style, dx = 0, dy = 30 }) => {
  const t = useMuelle(desde);
  const f = useCurrentFrame();
  return <div style={{ ...style, visibility: f < desde ? 'hidden' : 'visible', opacity: Math.min(1, t * 1.5), transform: `translate(${(1 - t) * dx}px, ${(1 - t) * dy}px)` }}>{children}</div>;
};

/** Tamaño de letra que cabe: baja según el largo del texto. */
export const ajustar = (texto: string, base: number, largoIdeal: number, minimo = base * 0.55) =>
  Math.max(minimo, Math.min(base, base * Math.sqrt(largoIdeal / Math.max(1, texto.length))));

export const miles = (n: number, decimales = 0) => {
  const [e, d] = n.toFixed(decimales).split('.');
  return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? `,${d}` : '');
};

/** «19/19», «61 %», «S/ 1 200», «0»: anima solo el número y deja el resto tal cual. */
export const Valor: React.FC<{ texto: string; desde: number; dura?: number }> = ({ texto, desde, dura = 28 }) => {
  const f = useCurrentFrame();
  const m = /^(\D*?)(\d[\d\s.]*(?:,\d+)?)(.*)$/.exec(texto);
  if (!m) return <>{texto}</>;
  const crudo = m[2].replace(/[\s.]/g, '').replace(',', '.');
  const n = Number(crudo);
  if (!Number.isFinite(n)) return <>{texto}</>;
  const dec = (crudo.split('.')[1] ?? '').length;
  const v = interpolate(f, [desde, desde + dura], [0, n], { ...clamp, easing: suave });
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{m[1]}{miles(v, dec)}{m[3]}</span>;
};

// ── Logo G vectorial: `t` 0 → 1 lo arma con las piezas llegando en espiral ──
const [VX, VY, VW, VH] = LOGO_VIEWBOX;
const LU = VX + VW / 2;
const LV = VY + VH / 2;
export const LogoG: React.FC<{ alto: number; t?: number; brillo?: number }> = ({ alto, t = 1, brillo = 0 }) => {
  const k = alto / VH;
  return (
    <svg width={VW * k} height={alto} viewBox={`${VX} ${VY} ${VW} ${VH}`} style={{ overflow: 'visible', filter: brillo ? `drop-shadow(0 0 ${18 * brillo}px rgba(239,110,42,.55))` : 'none' }}>
      <defs dangerouslySetInnerHTML={{ __html: LOGO_DEFS }} />
      {LOGO_PIECES.map((p, i) => {
        const orden = (Math.atan2(p.cy - LV, p.cx - LU) + Math.PI) / (Math.PI * 2);
        const e = suave(Math.max(0, Math.min(1, (t - orden * 0.45) / 0.55)));
        if (e <= 0) return null;
        const ang = Math.atan2(p.cy - LV, p.cx - LU) + 2.2 + (1 - e) * 3;
        const r = 160 * (1 - e);
        const giro = (random(`lg${i}`) - 0.5) * 360 * (1 - e);
        return (
          <g key={p.d} transform={`translate(${p.cx + Math.cos(ang) * r} ${p.cy + Math.sin(ang) * r}) rotate(${giro}) scale(${0.4 + 0.6 * e}) translate(${-p.cx} ${-p.cy})`} opacity={Math.min(1, e * 3)}>
            <path d={p.d} fill={`url(#${p.grad})`} />
          </g>
        );
      })}
    </svg>
  );
};

// ── Piezas de escena ──
export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; tono?: string; brillo?: number }> = ({ children, style, tono = N.borde, brillo = 0 }) => (
  <div style={{ boxSizing: 'border-box', background: `${N.panel}F0`, border: `1.5px solid ${tono}`, borderRadius: 16, boxShadow: `0 24px 60px #00000066${brillo ? `, 0 0 ${50 * brillo}px ${tono}55` : ''}`, ...style }}>{children}</div>
);

/** Rótulo de la escena: «02 INDICADORES ─────── VISTA ILUSTRATIVA». */
export const Seccion: React.FC<{ num: string; texto: string; nota?: string; acento: string }> = ({ num, texto, nota, acento }) => (
  <div style={{ position: 'absolute', top: 150, left: 96, width: 1290, display: 'flex', alignItems: 'baseline', gap: 18, fontFamily: fuenteMono }}>
    <span style={{ fontSize: 22, fontWeight: 700, color: acento, letterSpacing: 4 }}>{num}</span>
    <span style={{ fontSize: 22, fontWeight: 700, color: N.tinta, letterSpacing: 5, whiteSpace: 'nowrap' }}>{texto.toUpperCase()}</span>
    <span style={{ flex: 1, height: 1.5, background: N.borde, alignSelf: 'center' }} />
    {nota && <span style={{ fontSize: 16, color: N.oro, letterSpacing: 2, padding: '4px 10px', border: `1.5px solid ${N.oro}66`, borderRadius: 6, whiteSpace: 'nowrap' }}>{nota.toUpperCase()}</span>}
  </div>
);

export const Sello: React.FC<{ desde: number; texto: string; tono: string; style?: React.CSSProperties; giro?: number; tam?: number }> = ({ desde, texto, tono, style, giro = -6, tam = 46 }) => {
  const f = useCurrentFrame();
  const t = useMuelle(desde, 260, 11);
  if (f < desde) return null;
  return (
    <div style={{ position: 'absolute', ...style, transform: `rotate(${giro}deg) scale(${2.2 - 1.2 * t})`, opacity: Math.min(1, t * 2), padding: `${tam * 0.3}px ${tam * 0.65}px`, border: `${Math.max(3, tam / 9)}px solid ${tono}`, borderRadius: 12, color: tono, fontFamily: fuenteTexto, fontWeight: 800, fontSize: tam, letterSpacing: 3, background: `${N.fondo}D9`, boxShadow: `0 0 40px ${tono}44`, whiteSpace: 'nowrap' }}>
      {texto}
      <Sequence from={desde} durationInFrames={30}><Audio src={SFX.boom} volume={0.3} /></Sequence>
    </div>
  );
};

export const Check: React.FC<{ on: boolean; t?: number; tono?: string; tam?: number }> = ({ on, t = 1, tono = N.verde, tam = 38 }) => (
  <div style={{ width: tam, height: tam, borderRadius: tam / 4, flex: 'none', border: `2.5px solid ${on ? tono : N.borde}`, background: on ? `${tono}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {on && <svg width={tam * 0.65} height={tam * 0.65} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={tono} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - t)} /></svg>}
  </div>
);

export const Pop: React.FC<{ en: number; v?: number }> = ({ en, v = 0.22 }) => <Sequence from={Math.max(0, en)} durationInFrames={20}><Audio src={SFX.pop} volume={v} /></Sequence>;

/** Anillo de progreso que se llena hasta `pct` desde `desde`. */
export const Anillo: React.FC<{ pct: number; desde: number; tam: number; grosor?: number; color: string; children?: React.ReactNode }> = ({ pct, desde, tam, grosor = 18, color, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [desde, desde + 36], [0, Math.max(0, Math.min(100, pct)) / 100], { ...clamp, easing: suave });
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: tam, height: tam }}>
      <svg width={tam} height={tam} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={N.rejilla} strokeWidth={grosor} />
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - t)} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
};

// ── Iconos de línea (24×24). Si el nombre no existe se usa «estrella». ──
export const ICONOS: Record<string, React.ReactNode> = {
  check: <path d="M4 12.5l5 5L20 6.5" />,
  usuario: <><circle cx={12} cy={8} r={4} /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  equipo: <><circle cx={9} cy={8} r={3.5} /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><circle cx={17} cy={7} r={2.8} /><path d="M17 13c3 0 5 2 5 5" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  grafico: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  tendencia: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  codigo: <><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></>,
  servidor: <><rect x={3} y={4} width={18} height={7} rx={2} /><rect x={3} y={13} width={18} height={7} rx={2} /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  nube: <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z" />,
  escudo: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  diana: <><circle cx={12} cy={12} r={9} /><circle cx={12} cy={12} r={5} /><circle cx={12} cy={12} r={1.5} /></>,
  lupa: <><circle cx={10.5} cy={10.5} r={6.5} /><path d="M15.5 15.5L21 21" /></>,
  cohete: <><path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3c-1-5 1-9 5-11z" /><circle cx={12} cy={10} r={2} /><path d="M9 17l-3 4M15 17l3 4" /></>,
  reloj: <><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></>,
  documento: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  megafono: <><path d="M3 10v4h4l9 5V5L7 10z" /><path d="M19 9a4 4 0 0 1 0 6" /></>,
  engranaje: <><circle cx={12} cy={12} r={3.2} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  rayo: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  estrella: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  alerta: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  dinero: <><rect x={2} y={6} width={20} height={12} rx={2} /><circle cx={12} cy={12} r={3} /></>,
  calendario: <><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  libro: <><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>,
  pincel: <><path d="M14.5 4.5l5 5L10 19H5v-5z" /><path d="M12 7l5 5" /></>,
  avion: <><path d="M21 3L3 10.5l7 2.5 2.5 7z" /><path d="M10 13l11-10" /></>,
  candado: <><rect x={5} y={11} width={14} height={10} rx={2} /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  base_datos: <><ellipse cx={12} cy={5} rx={8} ry={3} /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  movil: <><rect x={7} y={2} width={10} height={20} rx={2} /><path d="M11 18h2" /></>,
  web: <><circle cx={12} cy={12} r={9} /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  bandera: <><path d="M5 21V4M5 4h12l-2 4 2 4H5" /></>,
  bombilla: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
};
export const Icono: React.FC<{ nombre?: string; color: string; tam?: number }> = ({ nombre, color, tam = 56 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {ICONOS[nombre ?? ''] ?? ICONOS.estrella}
  </svg>
);

/** Sprite de personaje (lienzo 768×1376) apoyado en (x, suelo). `cara` cae a «normal» si no existe. */
export const Sprite: React.FC<{ p: PersonajeP; cara?: string; x: number; suelo: number; esc: number; style?: React.CSSProperties }> = ({ p, cara = 'normal', x, suelo, esc, style }) => {
  const src = p.caras[cara] ?? p.caras.normal;
  return <Img src={imagen(src)} style={{ position: 'absolute', width: 768 * esc, height: 1376 * esc, left: x - p.cx * esc, top: suelo - p.pies * esc, ...style }} />;
};
/** ¿Boca abierta en este instante? Alterna con cada palabra que suena (5 de cada 7 fotogramas abierta). */
export const bocaAbierta = (palabras: PalabraI[], t: number) => {
  const p = palabras.find((w) => t >= w.i && t < w.f);
  return p ? ((t - p.i) * FPS) % 7 < 5 : false;
};
