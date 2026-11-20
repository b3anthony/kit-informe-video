// Tres composiciones 1920×1080 a 30 fps. La duración sale de las props (la calcula cada una).
import React from 'react';
import { Composition } from 'remotion';
import { CierreEquipo, duracionCierre, duracionPortada, PortadaEquipo, type EquipoProps } from './Equipo';
import { Informe, prepararInforme, type InformeProps } from './Informe';
import { FPS } from './piezas';

const vacio: EquipoProps = { empresa: 'Giantucchi', equipo: 'DevCore', periodo: '', integrantes: [], audio: '', duracion: 3, palabras: [] };
const pj = { nombre: 'kevin', tono: '#4C8DF6', cx: 386, pies: 1089, caras: { normal: 'personajes/kevin-azul/normal.png' } };

export const Root: React.FC = () => (
  <>
    <Composition id="Informe" component={Informe as React.FC<any>} width={1920} height={1080} fps={FPS}
      durationInFrames={1} defaultProps={{ escenas: [], persona: '', area: '', equipo: '', empresa: '', periodo: '', personaje: pj } as InformeProps}
      calculateMetadata={({ props }) => ({ durationInFrames: prepararInforme(props as unknown as InformeProps).total })} />
    <Composition id="PortadaEquipo" component={PortadaEquipo as React.FC<any>} width={1920} height={1080} fps={FPS}
      durationInFrames={1} defaultProps={vacio} calculateMetadata={({ props }) => ({ durationInFrames: duracionPortada(props as unknown as EquipoProps) })} />
    <Composition id="CierreEquipo" component={CierreEquipo as React.FC<any>} width={1920} height={1080} fps={FPS}
      durationInFrames={1} defaultProps={vacio} calculateMetadata={({ props }) => ({ durationInFrames: duracionCierre(props as unknown as EquipoProps) })} />
  </>
);
