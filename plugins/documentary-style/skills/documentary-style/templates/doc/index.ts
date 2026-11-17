// DocumentaryStyle: componentes Remotion para documentário de arquivo.
export { COR, FONTE, TEMAS, MISTURAS, ProvedorTema, resolverTema, useTema } from './tema';
export type { Tema, TemaId, TemaPersonalizado, EscolhaTema, Ritmo, TrilhaId } from './tema';
export { FundoDoc, OrnamentoCartao, OrnamentoTela } from './Fundos';
export { Granulacao, useFontesDoc, surgir, mola, arquivo } from './base';
export { Arquivo, FotoMoldura } from './Arquivo';
export { CartaoDocumento, Legenda, Credito } from './Textos';
export { MapaReal } from './MapaReal';
export { GloboReal } from './GloboReal';
export { ComparacaoBarras, NumeroGrande, LinhaDoTempo } from './Graficos';
export { QuadroConexoes } from './QuadroConexoes';
export { DocVideo, duracaoDoPlano } from './DocVideo';
export type { Plano, CenaPlano, Bloco, Som } from './DocVideo';
export { eventosDeSom, conferirPlano } from './Som';
export type { LonLat, QuadroCamera, QuadroGlobo } from './geo';
