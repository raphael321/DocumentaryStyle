import React, { useMemo } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR } from './tema';
import { arquivo, mola, surgir } from './base';
import {
  Caixa,
  LonLat,
  QuadroCamera,
  TEXTURA_TERRA,
  amostrarCurva,
  cameraNoTempo,
  caminhoEmGraus,
  cruza,
  projetor,
  usePaises,
  useRios,
} from './geo';
import { LinhaAnimada, Medalhao, Pino, Rotulo } from './Marcadores';

export type PaisDestaque = { iso: string; cor?: string; aos?: number; opacidade?: number; borda?: string };
export type Rota = { pontos: LonLat[]; aos?: number; dur?: number; cor?: string; curva?: number; icone?: string; tracejado?: boolean; largura?: number };
export type Seta = { de: LonLat; para: LonLat; aos?: number; dur?: number; cor?: string; curva?: number; largura?: number; icone?: string };
export type PinoMapa = { lon: number; lat: number; rotulo?: string; sub?: string; aos?: number; cor?: string; bandeira?: string; pulso?: boolean; lado?: 'baixo' | 'direita' | 'cima' | 'esquerda' };
export type MedalhaoMapa = { lon: number; lat: number; foto: string; nome?: string; aos?: number; cor?: string; tamanho?: number; pb?: boolean };
export type RotuloMapa = { lon: number; lat: number; texto: string; sub?: string; aos?: number; tamanho?: number };
export type Area = { pontos: LonLat[]; cor?: string; aos?: number; opacidade?: number; borda?: string };
export type Circulo = { lon: number; lat: number; raioKm: number; aos?: number; cor?: string };
export type TexturaExtra = Caixa & { src: string };

export type PropsMapaReal = {
  /** quadros-chave da câmera (t em segundos dentro do bloco; altura = graus de latitude visíveis) */
  camera: QuadroCamera[];
  textura?: string;
  /** imagens de satélite mais detalhadas para regiões (recortes georreferenciados) */
  texturasExtras?: TexturaExtra[];
  /** escurece o satélite para os desenhos saltarem (0 a 0.6) */
  escurecer?: number;
  paises?: PaisDestaque[];
  rios?: boolean | { cor?: string; aos?: number };
  areas?: Area[];
  circulos?: Circulo[];
  rotas?: Rota[];
  setas?: Seta[];
  pinos?: PinoMapa[];
  medalhoes?: MedalhaoMapa[];
  rotulos?: RotuloMapa[];
};

/**
 * MAPA REAL: satélite da NASA + países/rios do Natural Earth, com câmera animada (zoom e pan)
 * e camadas de explicação (países pintados, rotas, setas, pinos, medalhões de pessoas, cercos).
 */
export const MapaReal: React.FC<PropsMapaReal> = ({
  camera,
  textura = TEXTURA_TERRA,
  texturasExtras = [],
  escurecer = 0.1,
  paises = [],
  rios = false,
  areas = [],
  circulos = [],
  rotas = [],
  setas = [],
  pinos = [],
  medalhoes = [],
  rotulos = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const seg = frame / fps;
  const cam = cameraNoTempo(camera, seg);
  const proj = projetor(cam, width, height);
  const formasPaises = usePaises(paises.length > 0);
  const listaRios = useRios(Boolean(rios));
  const opRios = rios ? surgir(frame, fps, typeof rios === 'object' ? rios.aos ?? 0 : 0, 0.8) : 0;
  const corRios = typeof rios === 'object' && rios.cor ? rios.cor : '#8cc4f2';

  const riosVisiveis = useMemo(
    () => (listaRios ? listaRios.filter((r) => cruza(r.caixa, proj.visivel)) : []),
    // recalcula quando a câmera anda o suficiente
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listaRios, Math.round(proj.visivel.oeste), Math.round(proj.visivel.norte), Math.round(cam.altura)],
  );

  const ret = proj.retangulo({ oeste: -180, sul: -90, leste: 180, norte: 90 });
  const pulso = (frame % Math.round(fps * 1.6)) / (fps * 1.6);

  return (
    <AbsoluteFill style={{ backgroundColor: '#04070d', overflow: 'hidden' }}>
      {/* satélite */}
      <Img src={arquivo(textura)} style={{ position: 'absolute', ...ret, maxWidth: 'none', filter: 'saturate(1.18) contrast(1.06)' }} />
      {texturasExtras.map((t, i) => (
        <Img key={i} src={arquivo(t.src)} style={{ position: 'absolute', ...proj.retangulo(t), maxWidth: 'none', filter: 'saturate(1.1) contrast(1.04)' }} />
      ))}
      <AbsoluteFill style={{ background: `rgba(4,10,22,${escurecer})` }} />

      {/* camadas geográficas no espaço de graus */}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        <g transform={proj.matriz}>
          {riosVisiveis.map((r) => (
            <path key={r.id} d={r.d} fill="none" stroke={corRios} strokeWidth={1.6} vectorEffect="non-scaling-stroke" opacity={0.85 * opRios} />
          ))}
          {areas.map((a, i) => {
            const p = surgir(frame, fps, a.aos ?? 0, 0.6);
            return (
              <path
                key={`a${i}`}
                d={caminhoEmGraus([a.pontos], true)}
                fill={a.cor ?? COR.vermelho}
                fillOpacity={(a.opacidade ?? 0.45) * p}
                stroke={a.borda ?? '#fff'}
                strokeWidth={2}
                strokeOpacity={p}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {formasPaises &&
            paises.map((pd) => {
              const f = formasPaises.get(pd.iso);
              if (!f) return null;
              const p = surgir(frame, fps, pd.aos ?? 0, 0.6);
              return (
                <path
                  key={pd.iso}
                  d={f.d}
                  fill={pd.cor ?? COR.vermelho}
                  fillOpacity={(pd.opacidade ?? 0.72) * p}
                  stroke={pd.borda ?? '#ffffff'}
                  strokeWidth={2.2}
                  strokeOpacity={p}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.6))' }}
                />
              );
            })}
        </g>
      </svg>

      {/* camadas de explicação em pixels de tela */}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {circulos.map((c, i) => {
          const p = mola(frame, fps, c.aos ?? 0, 90, 14);
          const [x, y] = proj.tela([c.lon, c.lat]);
          const r = (c.raioKm / 111.32) * proj.ppd * p;
          const cor = c.cor ?? COR.ouro;
          return (
            <g key={`c${i}`} opacity={Math.min(1, p)}>
              <circle cx={x} cy={y} r={Math.max(0, r)} fill={cor} fillOpacity={0.12} stroke={cor} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-frame * 1.2} />
            </g>
          );
        })}
        {rotas.map((r, i) => {
          const pts = amostrarCurva(r.pontos.map(proj.tela), r.curva ?? 0.12);
          const p = surgir(frame, fps, r.aos ?? 0, r.dur ?? 2);
          return <LinhaAnimada key={`r${i}`} pontos={pts} p={p} cor={r.cor ?? COR.branco} largura={r.largura ?? 3} tracejado={r.tracejado ?? true} icone={r.icone} />;
        })}
        {setas.map((s, i) => {
          const pts = amostrarCurva([proj.tela(s.de), proj.tela(s.para)], s.curva ?? 0.15);
          const p = surgir(frame, fps, s.aos ?? 0, s.dur ?? 1.2);
          return <LinhaAnimada key={`s${i}`} pontos={pts} p={p} cor={s.cor ?? COR.ouro} largura={s.largura ?? 12} tracejado={false} ponta icone={s.icone} />;
        })}
      </svg>

      <AbsoluteFill>
        {rotulos.map((r, i) => {
          const [x, y] = proj.tela([r.lon, r.lat]);
          return <Rotulo key={`l${i}`} x={x} y={y} p={surgir(frame, fps, r.aos ?? 0, 0.5)} texto={r.texto} sub={r.sub} tamanho={r.tamanho} />;
        })}
        {pinos.map((pn, i) => {
          const [x, y] = proj.tela([pn.lon, pn.lat]);
          return (
            <Pino
              key={`p${i}`}
              x={x}
              y={y}
              p={Math.min(1.2, mola(frame, fps, pn.aos ?? 0, 180, 12))}
              rotulo={pn.rotulo}
              sub={pn.sub}
              cor={pn.cor}
              bandeira={pn.bandeira}
              pulso={pn.pulso === false ? 0 : pulso}
              lado={pn.lado}
            />
          );
        })}
        {medalhoes.map((m, i) => {
          const [x, y] = proj.tela([m.lon, m.lat]);
          return <Medalhao key={`m${i}`} x={x} y={y} p={Math.min(1.15, mola(frame, fps, m.aos ?? 0, 170, 12))} foto={m.foto} nome={m.nome} cor={m.cor} tamanho={m.tamanho} pb={m.pb} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
