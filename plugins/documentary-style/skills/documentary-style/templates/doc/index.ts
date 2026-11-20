// DocumentaryStyle: componentes Remotion para documentário de arquivo.
export { COR, FONTE } from './tema';
export { FundoDoc, Granulacao, useFontesDoc, surgir, mola, arquivo } from './base';
export { Arquivo, FotoMoldura } from './Arquivo';
export { CartaoDocumento, Legenda, Credito } from './Textos';
export { MapaReal } from './MapaReal';
export { Mapa3D } from './Mapa3D';
export type { QuadroCamera3D, Pino3D, Rota3D } from './Mapa3D';
export { GloboReal } from './GloboReal';
export { ComparacaoBarras, NumeroGrande, LinhaDoTempo } from './Graficos';
export { QuadroConexoes } from './QuadroConexoes';
export { Cena3D, camera3DNoTempo } from './Cena3D';
export type { Cena3DProps, QuadroCamera3D } from './Cena3D';
export type { Terreno3D, CamadaSatelite } from './Terreno3D';
export { DocVideo, duracaoDoPlano } from './DocVideo';
export type { Plano, CenaPlano, Bloco } from './DocVideo';
export type { LonLat, QuadroCamera, QuadroGlobo } from './geo';
