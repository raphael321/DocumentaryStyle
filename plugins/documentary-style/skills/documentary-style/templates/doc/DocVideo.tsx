import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FundoDoc, arquivo, useFontesDoc } from './base';
import { Arquivo, FotoMoldura } from './Arquivo';
import { CartaoDocumento, Credito, Legenda } from './Textos';
import { MapaReal } from './MapaReal';
import { GloboReal } from './GloboReal';
import { ComparacaoBarras, LinhaDoTempo, NumeroGrande } from './Graficos';
import { QuadroConexoes } from './QuadroConexoes';
import { EscolhaTema, ProvedorTema, Ritmo } from './tema';
import { SomDoPlano } from './Som';

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
    | { tipo: 'legenda'; props: P<typeof Legenda> }
    | { tipo: 'credito'; props: P<typeof Credito> }
  );

export type CenaPlano = {
  id: string;
  /** duração em segundos (normalmente = duração do áudio da narração da cena) */
  duracao: number;
  /** narração da cena, ex.: 'fornovo/cena3.mp3' (dentro de public/) */
  audio?: string;
  /** segundos de respiro antes da narração começar (padrão 0) */
  audioInicio?: number;
  /** duração real da narração, para a trilha abaixar só enquanto há fala (padrão: até o fim da cena) */
  audioDuracao?: number;
  /** 'doc' = fundo do tema (padrão), 'preto' ou 'nenhum' */
  fundo?: 'doc' | 'preto' | 'nenhum';
  /** troca o tema só nesta cena (ex.: uma cena sobre o rei num vídeo de guerra) */
  tema?: EscolhaTema;
  /** false tira a moldura do tema (cantos, faixas) desta cena */
  moldura?: boolean;
  blocos: Bloco[];
};

/** Som automático: trilha do tema (sempre abaixo da locução) e efeitos de acordo com o ritmo. */
export type Som = {
  /** 'auto' = trilha do tema em doc/sons/trilhas · { src } = música do canal · false = sem trilha */
  trilha?: 'auto' | { src: string; volume?: number } | false;
  /** 'serio' (padrão): efeitos suaves e movimento lento · 'dinamico': efeitos mais vivos, fusões curtas */
  ritmo?: Ritmo;
  /** false desliga os efeitos */
  efeitos?: boolean;
  /** multiplicadores de volume (1 = padrão). A trilha nunca passa da voz: o ducking continua valendo. */
  volumeTrilha?: number;
  volumeEfeitos?: number;
  /** pasta dos sons dentro de public/ (padrão 'doc/sons') e extensão das trilhas (padrão 'mp3') */
  pasta?: string;
  extensao?: 'mp3' | 'wav';
};

export type Plano = {
  /**
   * Visual do vídeo: 'padrao' | 'guerra' | 'realeza' | 'ditadura' | 'aviacao' | 'mar' | 'antiguidade' | 'crime',
   * ou { base: 'realeza', cor: { ouro: '#...' } } para personalizar.
   * Descubra o tema do roteiro com scripts/detectar-tema.mjs.
   */
  tema?: EscolhaTema;
  cenas: CenaPlano[];
  /** trilha e efeitos automáticos (gere os arquivos com scripts/gerar-sons.py) */
  som?: Som;
  /** fusão entre cenas, em segundos (padrão 0.5 no ritmo sério e 0.3 no dinâmico) */
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
  const ritmo: Ritmo = plano.som?.ritmo ?? 'serio';
  const fusao = plano.fusao ?? (plano.som ? (ritmo === 'dinamico' ? 0.3 : 0.5) : 0.4);
  let inicio = 0;
  let graficas = 0; // posição da cena gráfica: numa mistura de temas, alterna o fundo
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {plano.cenas.map((cena, i) => {
        const de = Math.round(inicio * fps);
        const durVisual = Math.round((cena.duracao + (i < plano.cenas.length - 1 ? fusao : 0)) * fps);
        const durAudio = Math.round(cena.duracao * fps);
        inicio += cena.duracao;
        const variacao = (cena.fundo ?? 'doc') === 'doc' ? graficas++ : 0;
        return (
          <React.Fragment key={cena.id}>
            <Sequence from={de} durationInFrames={durVisual} name={`cena ${cena.id}`}>
              <ProvedorTema tema={cena.tema ?? plano.tema} variacao={variacao} ritmo={ritmo}>
              <EntradaCena fusao={i === 0 ? 0 : fusao}>
                {(cena.fundo ?? 'doc') === 'doc' && <FundoDoc semente={cena.id} moldura={cena.moldura ?? true} />}
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
              </ProvedorTema>
            </Sequence>
            {cena.audio && (
              <Sequence
                from={de + Math.round((cena.audioInicio ?? 0) * fps)}
                durationInFrames={Math.max(1, durAudio - Math.round((cena.audioInicio ?? 0) * fps))}
                name={`voz ${cena.id}`}
              >
                <Audio src={arquivo(cena.audio)} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
      {plano.trilha && !plano.som && <Audio src={arquivo(plano.trilha.src)} volume={plano.trilha.volume ?? 0.12} loop />}
      <SomDoPlano plano={plano.som && !plano.som.trilha && plano.trilha ? { ...plano, som: { ...plano.som, trilha: plano.trilha } } : plano} total={duracaoDoPlano(plano)} />
    </AbsoluteFill>
  );
};
