import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FundoDoc, arquivo, useFontesDoc } from './base';
import { Arquivo, FotoMoldura } from './Arquivo';
import { CartaoDocumento, Credito, Legenda } from './Textos';
import { MapaReal } from './MapaReal';
import { GloboReal } from './GloboReal';
import { ComparacaoBarras, LinhaDoTempo, NumeroGrande } from './Graficos';
import { QuadroConexoes } from './QuadroConexoes';
import { Cena3D } from './Cena3D';

type P<C extends React.FC<any>> = React.ComponentProps<C>;
type Tempo = { inicio?: number; duracao?: number };

/** Um bloco visual dentro da cena. Vários blocos podem ficar empilhados (ex.: arquivo + legenda + selo de ano). */
export type Bloco = Tempo &
  (
    | { tipo: 'arquivo'; props: P<typeof Arquivo> }
    | { tipo: 'foto'; props: P<typeof FotoMoldura> }
    | { tipo: 'documento'; props: P<typeof CartaoDocumento> }
    | { tipo: 'mapa'; props: P<typeof MapaReal> }
    | { tipo: 'globo'; props: P<typeof GloboReal> }
    | { tipo: 'barras'; props: P<typeof ComparacaoBarras> }
    | { tipo: 'numero'; props: P<typeof NumeroGrande> }
    | { tipo: 'linhaTempo'; props: P<typeof LinhaDoTempo> }
    | { tipo: 'conexoes'; props: P<typeof QuadroConexoes> }
    | { tipo: 'cena3d'; props: P<typeof Cena3D> }
    | { tipo: 'legenda'; props: P<typeof Legenda> }
    | { tipo: 'credito'; props: P<typeof Credito> }
  );

export type CenaPlano = {
  id: string;
  /** duração em segundos (normalmente = duração do áudio da narração da cena) */
  duracao: number;
  /** narração da cena, ex.: 'fornovo/cena3.mp3' (dentro de public/) */
  audio?: string;
  /** 'doc' = azul-noite com estrelas (padrão), 'preto' ou 'nenhum' */
  fundo?: 'doc' | 'preto' | 'nenhum';
  blocos: Bloco[];
};

export type Plano = {
  cenas: CenaPlano[];
  /** fusão entre cenas, em segundos (padrão 0.4) */
  fusao?: number;
  trilha?: { src: string; volume?: number };
};

const RENDER: { [K in Bloco['tipo']]: React.FC<any> } = {
  arquivo: Arquivo,
  foto: FotoMoldura,
  documento: CartaoDocumento,
  mapa: MapaReal,
  globo: GloboReal,
  barras: ComparacaoBarras,
  numero: NumeroGrande,
  linhaTempo: LinhaDoTempo,
  conexoes: QuadroConexoes,
  cena3d: Cena3D,
  legenda: Legenda,
  credito: Credito,
};

export const duracaoDoPlano = (plano: Plano) => plano.cenas.reduce((s, c) => s + c.duracao, 0);

const EntradaCena: React.FC<{ fusao: number; children: React.ReactNode }> = ({ fusao, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = fusao > 0 ? interpolate(frame, [0, fusao * fps], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

/**
 * Monta o vídeo inteiro a partir de um PLANO (lista de cenas com blocos).
 * Cada cena segura a imagem por `fusao` segundos a mais para a próxima entrar por cima com fusão.
 */
export const DocVideo: React.FC<{ plano: Plano }> = ({ plano }) => {
  useFontesDoc();
  const { fps } = useVideoConfig();
  const fusao = plano.fusao ?? 0.4;
  let inicio = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {plano.cenas.map((cena, i) => {
        const de = Math.round(inicio * fps);
        const durVisual = Math.round((cena.duracao + (i < plano.cenas.length - 1 ? fusao : 0)) * fps);
        const durAudio = Math.round(cena.duracao * fps);
        inicio += cena.duracao;
        return (
          <React.Fragment key={cena.id}>
            <Sequence from={de} durationInFrames={durVisual} name={`cena ${cena.id}`}>
              <EntradaCena fusao={i === 0 ? 0 : fusao}>
                {(cena.fundo ?? 'doc') === 'doc' && <FundoDoc semente={cena.id} />}
                {cena.fundo === 'preto' && <AbsoluteFill style={{ backgroundColor: '#000' }} />}
                {cena.blocos.map((b, j) => {
                  const C = RENDER[b.tipo];
                  const bDe = Math.round((b.inicio ?? 0) * fps);
                  const bDur = b.duracao ? Math.round(b.duracao * fps) : durVisual - bDe;
                  return (
                    <Sequence key={j} from={bDe} durationInFrames={Math.max(1, bDur)} name={`${b.tipo}`}>
                      <C {...(b.props as object)} />
                    </Sequence>
                  );
                })}
              </EntradaCena>
            </Sequence>
            {cena.audio && (
              <Sequence from={de} durationInFrames={durAudio} name={`voz ${cena.id}`}>
                <Audio src={arquivo(cena.audio)} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
      {plano.trilha && <Audio src={arquivo(plano.trilha.src)} volume={plano.trilha.volume ?? 0.12} loop />}
    </AbsoluteFill>
  );
};
