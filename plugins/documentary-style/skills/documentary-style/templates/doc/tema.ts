// DocumentaryStyle: paleta, fontes e medidas do estilo "documentário de arquivo".
// Cada TEMA troca o fundo, as cores, as fontes e as molduras das cenas GRÁFICAS (cartões, números, quadro).
// Vídeo e foto de arquivo continuam reais: o tema só muda o filtro, a legenda e o crédito por cima deles.
// guerra = estilo Sonar · investigacao = estilo Investigação visual (acidentes, aviação, crimes, mistérios)
// realeza, ditadura, mar, antiguidade, guerraClassica, aviacao, crime = outros visuais prontos.
// O tema vem do Plano (`tema: 'guerra'`) e pode ser trocado por cena.
// Para descobrir o tema de um roteiro: node <skill>/scripts/detectar-tema.mjs ROTEIRO.md BRIEFING.md
import React, { createContext, useContext } from 'react';

export type CoresTema = {
  fundo: string;
  fundoClaro: string;
  papel: string;
  papelClaro: string;
  papelBorda: string;
  tinta: string;
  tintaSuave: string;
  /** cor de destaque (barra da legenda, fios, setas de avanço). No tema padrão é o ouro. */
  ouro: string;
  vermelho: string;
  azul: string;
  verde: string;
  branco: string;
  marcaTexto: string;
  sombra: string;
};

export type FontesTema = {
  serif: string;
  sans: string;
  /** títulos de gráfico, ano grande, cabeçalho de documento, nomes nos cartões */
  titulo: string;
  /** texto da citação no cartão de documento */
  documento: string;
};

/** Desenho do fundo das cenas sem material real (cartões, números, gráficos, quadro). */
export type EstiloFundo = 'estrelas' | 'sonar' | 'investigacao' | 'fumaca' | 'damasco' | 'propaganda' | 'radar' | 'oceano' | 'pedra' | 'noir';
/** Enfeite dos cantos da tela e dos cartões de papel. */
export type EstiloOrnamento = 'nenhum' | 'sonar' | 'investigacao' | 'militar' | 'filigrana' | 'faixas' | 'hud' | 'nautico' | 'meandro' | 'dossie';

export type TemaId = 'padrao' | 'guerra' | 'guerraClassica' | 'investigacao' | 'realeza' | 'ditadura' | 'mar' | 'antiguidade' | 'aviacao' | 'crime';

export type Tema = {
  id: TemaId;
  nome: string;
  cor: CoresTema;
  fonte: FontesTema;
  /** a citação do documento sai em itálico? (máquina de escrever não fica bem em itálico) */
  documentoItalico: boolean;
  /** o "papel" dos cartões é um painel escuro (sonar)? Muda o carimbo e as sombras. */
  papelEscuro: boolean;
  fundo: EstiloFundo;
  ornamento: EstiloOrnamento;
  /** filtro CSS aplicado ao vídeo/foto de arquivo quando a cena não pede `pb` */
  filtroArquivo: string;
  /** granulação padrão por cima do arquivo */
  graos: number;
};

/** Personalização: parte de um tema pronto e troca o que quiser. */
export type TemaPersonalizado = {
  base: TemaId;
  nome?: string;
  cor?: Partial<CoresTema>;
  fonte?: Partial<FontesTema>;
  documentoItalico?: boolean;
  papelEscuro?: boolean;
  fundo?: EstiloFundo;
  ornamento?: EstiloOrnamento;
  filtroArquivo?: string;
  graos?: number;
};

export type EscolhaTema = TemaId | TemaPersonalizado;

const SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Fira Sans', 'Segoe UI', Arial, sans-serif";
const CINZEL = "'Cinzel', 'EB Garamond', Georgia, serif";
const OSWALD = "'Oswald', 'Fira Sans Condensed', 'Arial Narrow', sans-serif";
const MAQUINA = "'Special Elite', 'Courier New', Courier, monospace";
const BARLOW = "'Barlow Condensed', 'Fira Sans', 'Arial Narrow', sans-serif";
const PLEX_SANS = "'IBM Plex Sans', 'Fira Sans', Arial, sans-serif";
const PLEX_MONO = "'IBM Plex Mono', 'Courier New', monospace";
const INTER = "Inter, 'Fira Sans', Arial, sans-serif";
const SOURCE_SERIF = "'Source Serif 4', 'EB Garamond', Georgia, serif";

const CORES_PADRAO: CoresTema = {
  fundo: '#0c1420',
  fundoClaro: '#18243a',
  papel: '#f3ecdc',
  papelClaro: '#f7f1e3',
  papelBorda: '#cbb98d',
  tinta: '#1d1a16',
  tintaSuave: '#6a6052',
  ouro: '#d9a93a',
  vermelho: '#c8372d',
  azul: '#2f6fd6',
  verde: '#2e9e5b',
  branco: '#f6f2e9',
  marcaTexto: 'rgba(244, 196, 48, 0.55)',
  sombra: 'rgba(0, 0, 0, 0.55)',
};

const FONTES_PADRAO: FontesTema = { serif: SERIF, sans: SANS, titulo: SERIF, documento: SERIF };

export const TEMAS: Record<TemaId, Tema> = {
  padrao: {
    id: 'padrao',
    nome: 'Padrão (azul-noite com estrelas)',
    cor: CORES_PADRAO,
    fonte: FONTES_PADRAO,
    documentoItalico: true,
    papelEscuro: false,
    fundo: 'estrelas',
    ornamento: 'nenhum',
    filtroArquivo: 'saturate(0.92) contrast(1.04)',
    graos: 0.07,
  },
  // Estilo 2 "Sonar / varredura": tudo nasce do escuro, linhas de eco azul-gelo, alvo em âmbar.
  guerra: {
    id: 'guerra',
    nome: 'Guerra · Sonar (preto, eco azul-gelo, alvos em âmbar)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#000000',
      fundoClaro: '#03070c',
      papel: '#05090e',
      papelClaro: '#0a1119',
      papelBorda: 'rgba(179, 219, 255, 0.45)',
      tinta: '#EEF2F6',
      tintaSuave: '#96A2B0',
      ouro: '#F2C48D',
      vermelho: '#E8603C',
      azul: '#B3DBFF',
      verde: '#7FD1A8',
      branco: '#EEF2F6',
      marcaTexto: 'rgba(242, 196, 141, 0.32)',
    },
    fonte: { serif: PLEX_SANS, sans: PLEX_SANS, titulo: PLEX_SANS, documento: PLEX_MONO },
    documentoItalico: false,
    papelEscuro: true,
    fundo: 'sonar',
    ornamento: 'sonar',
    filtroArquivo: 'saturate(0.55) contrast(1.12) brightness(0.92)',
    graos: 0.08,
  },
  // Estilo 5 "Investigação visual": painéis de perícia, etiqueta vermelha, transcrição em papel, dado com cursor.
  investigacao: {
    id: 'investigacao',
    nome: 'Investigação visual (painéis de perícia, vermelho de alerta)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#0B0C0E',
      fundoClaro: '#141619',
      papel: '#E4E0D4',
      papelClaro: '#ECE9DF',
      papelBorda: '#9c978b',
      tinta: '#1D1D1B',
      tintaSuave: '#55524b',
      ouro: '#FF4A2E',
      vermelho: '#FF4A2E',
      azul: '#5B8DEF',
      verde: '#3FB37F',
      branco: '#ECEAE4',
      marcaTexto: 'rgba(255, 74, 46, 0.42)',
    },
    fonte: { serif: SOURCE_SERIF, sans: INTER, titulo: INTER, documento: PLEX_MONO },
    documentoItalico: false,
    papelEscuro: false,
    fundo: 'investigacao',
    ornamento: 'investigacao',
    filtroArquivo: 'saturate(0.85) contrast(1.06)',
    graos: 0.04,
  },
  // Guerra "clássica": carvão e oliva, fumaça, quadrícula de carta militar e documento datilografado.
  guerraClassica: {
    id: 'guerraClassica',
    nome: 'Guerra clássica (carvão e oliva, fumaça, mapa militar)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#121410',
      fundoClaro: '#2a2e22',
      papel: '#e9dcb8',
      papelClaro: '#f1e6c6',
      papelBorda: '#a8935f',
      tinta: '#211d14',
      tintaSuave: '#5f5440',
      ouro: '#d8a23a',
      vermelho: '#b8321f',
      azul: '#3d6fb0',
      verde: '#5f8a3a',
      marcaTexto: 'rgba(230, 180, 60, 0.5)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: OSWALD, documento: MAQUINA },
    documentoItalico: false,
    papelEscuro: false,
    fundo: 'fumaca',
    ornamento: 'militar',
    filtroArquivo: 'saturate(0.7) contrast(1.1) sepia(0.12)',
    graos: 0.1,
  },
  realeza: {
    id: 'realeza',
    nome: 'Realeza (vinho e ouro, damasco, filigrana)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#1c0710',
      fundoClaro: '#4a1226',
      papel: '#f6eedb',
      papelClaro: '#fbf6ea',
      papelBorda: '#c9a24e',
      tinta: '#2a1410',
      tintaSuave: '#7a5a3c',
      ouro: '#e3b84f',
      vermelho: '#9e1b32',
      azul: '#2c4f9e',
      verde: '#2f7d5b',
      branco: '#fbf3e2',
      marcaTexto: 'rgba(227, 184, 79, 0.45)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: CINZEL, documento: SERIF },
    documentoItalico: true,
    papelEscuro: false,
    fundo: 'damasco',
    ornamento: 'filigrana',
    filtroArquivo: 'saturate(0.95) contrast(1.03) sepia(0.08)',
    graos: 0.05,
  },
  ditadura: {
    id: 'ditadura',
    nome: 'Ditadura (concreto, preto e vermelho, propaganda)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#0d0c0c',
      fundoClaro: '#2a2524',
      papel: '#e4e0d6',
      papelClaro: '#eeebe3',
      papelBorda: '#9a948a',
      tinta: '#151313',
      tintaSuave: '#57524c',
      ouro: '#d23a2a',
      vermelho: '#c41e1e',
      azul: '#3a5f8a',
      verde: '#4d7a4d',
      branco: '#f2efe9',
      marcaTexto: 'rgba(210, 58, 42, 0.32)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: OSWALD, documento: MAQUINA },
    documentoItalico: false,
    papelEscuro: false,
    fundo: 'propaganda',
    ornamento: 'faixas',
    filtroArquivo: 'grayscale(0.55) contrast(1.15)',
    graos: 0.11,
  },
  aviacao: {
    id: 'aviacao',
    nome: 'Aviação (azul-aço, radar, HUD)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#081422',
      fundoClaro: '#14304a',
      papel: '#eef1f2',
      papelClaro: '#f6f8f8',
      papelBorda: '#9fb0ba',
      tinta: '#121a22',
      tintaSuave: '#55626e',
      ouro: '#ff9f1c',
      vermelho: '#e5383b',
      azul: '#3aa0ff',
      verde: '#3ccf7a',
      branco: '#eef6ff',
      marcaTexto: 'rgba(255, 159, 28, 0.42)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: BARLOW, documento: SERIF },
    documentoItalico: true,
    papelEscuro: false,
    fundo: 'radar',
    ornamento: 'hud',
    filtroArquivo: 'saturate(0.9) contrast(1.06)',
    graos: 0.05,
  },
  mar: {
    id: 'mar',
    nome: 'Mar (azul profundo, ondas, carta náutica)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#04141c',
      fundoClaro: '#0c3a4c',
      papel: '#efe6cf',
      papelClaro: '#f6efdc',
      papelBorda: '#b99c63',
      tinta: '#18201f',
      tintaSuave: '#5b5a4c',
      ouro: '#d4a24a',
      vermelho: '#cc3b2e',
      azul: '#3c8fd6',
      verde: '#2fa38a',
      branco: '#eef6f4',
      marcaTexto: 'rgba(212, 162, 74, 0.45)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: CINZEL, documento: SERIF },
    documentoItalico: true,
    papelEscuro: false,
    fundo: 'oceano',
    ornamento: 'nautico',
    filtroArquivo: 'saturate(0.85) contrast(1.05) hue-rotate(-4deg)',
    graos: 0.07,
  },
  antiguidade: {
    id: 'antiguidade',
    nome: 'Antiguidade (pedra, terracota, meandro grego)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#1a120c',
      fundoClaro: '#4a3220',
      papel: '#ecdcb6',
      papelClaro: '#f3e7c8',
      papelBorda: '#b08850',
      tinta: '#2a1a0e',
      tintaSuave: '#6e5536',
      ouro: '#d9a441',
      vermelho: '#b5452b',
      azul: '#2f6a8f',
      verde: '#5f7f3a',
      branco: '#f7eedb',
      marcaTexto: 'rgba(217, 164, 65, 0.45)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: CINZEL, documento: SERIF },
    documentoItalico: true,
    papelEscuro: false,
    fundo: 'pedra',
    ornamento: 'meandro',
    filtroArquivo: 'sepia(0.3) saturate(0.85) contrast(1.05)',
    graos: 0.08,
  },
  crime: {
    id: 'crime',
    nome: 'Crime e mistério (noir, persiana, dossiê)',
    cor: {
      ...CORES_PADRAO,
      fundo: '#08090b',
      fundoClaro: '#1d2126',
      papel: '#e8e2d0',
      papelClaro: '#f0ebdc',
      papelBorda: '#a39a80',
      tinta: '#16140f',
      tintaSuave: '#5a5446',
      ouro: '#e8c547',
      vermelho: '#c3272b',
      azul: '#4a78a8',
      verde: '#4f8c62',
      branco: '#f0eee8',
      marcaTexto: 'rgba(232, 197, 71, 0.5)',
    },
    fonte: { serif: SERIF, sans: SANS, titulo: OSWALD, documento: MAQUINA },
    documentoItalico: false,
    papelEscuro: false,
    fundo: 'noir',
    ornamento: 'dossie',
    filtroArquivo: 'grayscale(0.35) contrast(1.12) brightness(0.95)',
    graos: 0.1,
  },
};

/** Transforma o que veio do Plano (id ou personalização) num tema completo. */
export const resolverTema = (escolha?: EscolhaTema | Tema): Tema => {
  if (!escolha) return TEMAS.padrao;
  if (typeof escolha === 'string') return TEMAS[escolha] ?? TEMAS.padrao;
  if ('id' in escolha) return escolha;
  const b = TEMAS[escolha.base] ?? TEMAS.padrao;
  return {
    ...b,
    ...(escolha.nome ? { nome: escolha.nome } : {}),
    cor: { ...b.cor, ...escolha.cor },
    fonte: { ...b.fonte, ...escolha.fonte },
    documentoItalico: escolha.documentoItalico ?? b.documentoItalico,
    papelEscuro: escolha.papelEscuro ?? b.papelEscuro,
    fundo: escolha.fundo ?? b.fundo,
    ornamento: escolha.ornamento ?? b.ornamento,
    filtroArquivo: escolha.filtroArquivo ?? b.filtroArquivo,
    graos: escolha.graos ?? b.graos,
  };
};

const TemaContexto = createContext<Tema>(TEMAS.padrao);

/** Tema ativo (vem do Plano ou da cena). Fora do DocVideo devolve o padrão. */
export const useTema = () => useContext(TemaContexto);

/** Aplica um tema a tudo que estiver dentro. O DocVideo já faz isso sozinho. */
export const ProvedorTema: React.FC<{ tema?: EscolhaTema | Tema; children: React.ReactNode }> = ({ tema, children }) =>
  React.createElement(TemaContexto.Provider, { value: resolverTema(tema) }, children);

// Compatibilidade: COR e FONTE continuam sendo as cores e fontes do tema padrão.
// Use para cores com SIGNIFICADO fixo no plano (um lado do conflito = uma cor), não para o visual do tema.
export const COR = CORES_PADRAO;
export const FONTE = { serif: SERIF, sans: SANS } as const;

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500' +
  '&family=Fira+Sans:wght@400;500;700;800&family=Cinzel:wght@500;600;700&family=Oswald:wght@400;500;600;700' +
  '&family=Special+Elite&family=Barlow+Condensed:wght@500;600;700' +
  '&family=IBM+Plex+Sans:wght@200;300;400;600;700&family=IBM+Plex+Mono:wght@300;400;600' +
  '&family=Inter:wght@400;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=block';

// Sombra de texto usada em tudo que fica por cima de vídeo ou mapa.
export const SOMBRA_TEXTO = '0 2px 6px rgba(0,0,0,0.85), 0 0 18px rgba(0,0,0,0.45)';
