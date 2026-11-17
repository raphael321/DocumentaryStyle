// DocumentaryStyle: componentes Remotion para documentário de arquivo.
export { COR, FONTE, TEMAS, ProvedorTema, resolverTema, useTema } from './tema';
export type { Tema, TemaId, TemaPersonalizado, EscolhaTema } from './tema';
export { FundoDoc, OrnamentoCartao, OrnamentoTela } from './Fundos';
export { Granulacao, useFontesDoc, surgir, mola, arquivo } from './base';
export { Arquivo, FotoMoldura } from './Arquivo';
export { CartaoDocumento, Legenda, Credito } from './Textos';
export { MapaReal } from './MapaReal';
export { GloboReal } from './GloboReal';
export { ComparacaoBarras, NumeroGrande, LinhaDoTempo } from './Graficos';
export { QuadroConexoes } from './QuadroConexoes';
export { DocVideo, duracaoDoPlano } from './DocVideo';
export type { Plano, CenaPlano, Bloco } from './DocVideo';
export type { LonLat, QuadroCamera, QuadroGlobo } from './geo';
