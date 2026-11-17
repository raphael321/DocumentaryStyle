import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { useTema } from './tema';
import { carregarImagem, mola, surgir } from './base';
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
export type Rota = { pontos: LonLat[]; aos?: number; dur?: number; cor?: string; curva?: number; icone?: string; tracejado?: boolean; largura?: number; selo?: boolean };
export type Seta = { de: LonLat; para: LonLat; aos?: number; dur?: number; cor?: string; curva?: number; largura?: number; icone?: string };
export type PinoMapa = { lon: number; lat: number; rotulo?: string; sub?: string; aos?: number; cor?: string; bandeira?: string; pulso?: boolean; lado?: 'baixo' | 'direita' | 'cima' | 'esquerda' };
export type MedalhaoMapa = { lon: number; lat: number; foto: string; nome?: string; aos?: number; cor?: string; tamanho?: number; pb?: boolean };
export type RotuloMapa = { lon: number; lat: number; texto: string; sub?: string; aos?: number; tamanho?: number };
export type Area = { pontos: LonLat[]; cor?: string; aos?: number; opacidade?: number; borda?: string };
export type Circulo = { lon: number; lat: number; raioKm: number; aos?: number; cor?: string };
export type TexturaExtra = Caixa & { src: string };

/**
 * Desenha as camadas de satélite num canvas do tamanho da tela. Cada imagem entra só com o pedaço visível
 * (drawImage com recorte). Com <img> de dezenas de milhares de pixels o Chrome perde qualidade em partes
 * diferentes e aparecem emendas entre os blocos.
 */
const Satelite: React.FC<{
  camadas: TexturaExtra[];
  retangulo: (c: Caixa) => { left: number; top: number; width: number; height: number };
  largura: number;
  altura: number;
}> = ({ camadas, retangulo, largura, altura }) => {
  const T = useTema();
  const ref = useRef<HTMLCanvasElement>(null);
  const [imgs, setImgs] = useState<Record<string, HTMLImageElement>>({});
  const faltam = camadas.map((c) => c.src).filter((s) => !imgs[s]);
  const chaveFaltam = faltam.join('|');
  const handle = useMemo(() => (faltam.length ? delayRender(`DocumentaryStyle: satélite ${chaveFaltam}`) : null), [chaveFaltam]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (handle === null) return;
    let vivo = true;
    Promise.all(faltam.map((s) => carregarImagem(s).then((img) => [s, img] as const)))
      .then((lista) => {
        if (vivo) setImgs((antes) => ({ ...antes, ...Object.fromEntries(lista) }));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      vivo = false;
    };
  }, [handle]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, largura, altura);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'saturate(1.18) contrast(1.06)';
    for (const c of camadas) {
      const img = imgs[c.src];
      if (!img) continue;
      const r = retangulo(c);
      // destino em pixels inteiros (vizinhos se sobrepõem até 1 px: sem fresta entre blocos)
      const x0 = Math.max(0, Math.floor(r.left)), y0 = Math.max(0, Math.floor(r.top));
      const x1 = Math.min(largura, Math.ceil(r.left + r.width)), y1 = Math.min(altura, Math.ceil(r.top + r.height));
      if (x1 <= x0 || y1 <= y0) continue;
      const kx = img.naturalWidth / r.width, ky = img.naturalHeight / r.height;
      const sx = Math.max(0, (x0 - r.left) * kx), sy = Math.max(0, (y0 - r.top) * ky);
      const sw = Math.min(img.naturalWidth - sx, (x1 - x0) * kx), sh = Math.min(img.naturalHeight - sy, (y1 - y0) * ky);
      if (sw <= 0 || sh <= 0) continue;
      ctx.drawImage(img, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0);
    }
  });

  return <canvas ref={ref} width={largura} height={altura} style={{ position: 'absolute', left: 0, top: 0 }} />;
};

const PASTA_HD = 'doc/mapa/hd';
/** blocos de 45° (8 colunas x 4 linhas, gerados por blocos-hd.mjs) que cruzam a área visível */
const blocosVisiveis = (vis: Caixa, pasta: string): TexturaExtra[] => {
  const lista: TexturaExtra[] = [];
  for (let lin = 0; lin < 4; lin++) {
    for (let col = 0; col < 8; col++) {
      const b = { oeste: -180 + col * 45, leste: -135 + col * 45, norte: 90 - lin * 45, sul: 45 - lin * 45 };
      if (cruza(b, vis)) lista.push({ ...b, src: `${pasta}/${col}_${lin}.jpg` });
    }
  }
  return lista;
};

export type PropsMapaReal = {
  /** quadros-chave da câmera (t em segundos dentro do bloco; altura = graus de latitude visíveis) */
  camera: QuadroCamera[];
  textura?: string;
  /**
   * satélite HD em blocos (scripts/blocos-hd.mjs): no zoom carrega só os blocos de 45° que aparecem na tela.
   * true = pasta 'doc/mapa/hd'. Não use `textura: 'doc/mapa/terra-hd.jpg'`: a imagem inteira derruba a aba do render.
   */
  hd?: boolean | string;
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
  hd = false,
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
  const T = useTema();
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

  const pulso = (frame % Math.round(fps * 1.6)) / (fps * 1.6);
  const blocos = hd && cam.altura < 30 ? blocosVisiveis(proj.visivel, typeof hd === 'string' ? hd : PASTA_HD) : [];
  const camadas: TexturaExtra[] = [
    { src: textura, oeste: -180, sul: -90, leste: 180, norte: 90 },
    ...blocos,
    ...texturasExtras.filter((t) => cruza(t, proj.visivel)),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#04070d', overflow: 'hidden' }}>
      {/* satélite: desenhado num canvas, recortando só o pedaço visível de cada imagem */}
      <Satelite camadas={camadas} retangulo={proj.retangulo} largura={width} altura={height} />
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
                fill={a.cor ?? T.cor.vermelho}
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
                  fill={pd.cor ?? T.cor.vermelho}
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
          const cor = c.cor ?? T.cor.ouro;
          return (
            <g key={`c${i}`} opacity={Math.min(1, p)}>
              <circle cx={x} cy={y} r={Math.max(0, r)} fill={cor} fillOpacity={0.12} stroke={cor} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-frame * 1.2} />
            </g>
          );
        })}
        {rotas.map((r, i) => {
          const pts = amostrarCurva(r.pontos.map(proj.tela), r.curva ?? 0.12);
          const p = surgir(frame, fps, r.aos ?? 0, r.dur ?? 2);
          return <LinhaAnimada key={`r${i}`} pontos={pts} p={p} cor={r.cor ?? T.cor.branco} largura={r.largura ?? 3} tracejado={r.tracejado ?? true} icone={r.icone} selo={r.selo} />;
        })}
        {setas.map((s, i) => {
          const pts = amostrarCurva([proj.tela(s.de), proj.tela(s.para)], s.curva ?? 0.15);
          const p = surgir(frame, fps, s.aos ?? 0, s.dur ?? 1.2);
          return <LinhaAnimada key={`s${i}`} pontos={pts} p={p} cor={s.cor ?? T.cor.ouro} largura={s.largura ?? 12} tracejado={false} ponta icone={s.icone} />;
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
