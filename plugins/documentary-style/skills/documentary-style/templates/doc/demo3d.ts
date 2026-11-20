// Demo da cena 3D sobre o MAPA REAL: abertura da Watersnoodramp (1953), Holanda. Tempos casados com uma narração de 13,5 s.
// Antes de usar: baixar-mapas.mjs --hd (bloco hd/4_0.jpg + paises-10m), baixar-relevo.mjs --nome holanda (caixa abaixo)
// e um recorte Sentinel-2 da Zelândia com recortar-regiao.mjs (regiao-zeeland2.jpg). A foto usa o placeholder da demo.
// A área azul é ilustrativa, não o contorno exato da inundação.
import type { Plano } from './DocVideo';
const ZEELAND: [number, number][] = [[3.45,51.76],[3.95,51.86],[4.45,51.76],[4.58,51.62],[4.32,51.45],[4.0,51.42],[3.72,51.5],[3.5,51.56]];
export const PLANO_DEMO_3D: Plano = {
  fusao: 0.4,
  cenas: [{
    id: 'storm', duracao: 13.5, fundo: 'nenhum',
    blocos: [{ tipo: 'cena3d', props: {
      centro: [4.6, 52.1],
      camera: [
        { t: 0, lon: 5.2, lat: 51.9, distancia: 900, inclinacao: 38, giro: -18 },
        { t: 4.6, lon: 4.7, lat: 51.8, distancia: 620, inclinacao: 50, giro: -6 },
        { t: 8.6, lon: 3.95, lat: 51.78, distancia: 320, inclinacao: 60, giro: 12 },
        { t: 13.5, lon: 3.85, lat: 51.76, distancia: 250, inclinacao: 64, giro: 34 },
      ],
      terreno: {
        oeste: 1.0, sul: 49.9, leste: 7.8, norte: 54.2,
        satelite: [
          { src: 'doc/mapa/hd/4_0.jpg', oeste: 0, sul: 45, leste: 45, norte: 90 },
          { src: 'doc/mapa/regiao-zeeland2.jpg', oeste: 2.9, sul: 50.9, leste: 5.3, norte: 52.4, suavizar: 0.15 },
        ],
        relevo: 'doc/relevo/holanda', exagero: 12, resolucao: 6144,
      },
      paises: [{ iso: 'NLD', borda: '#d9a93a', aos: 0.4, dur: 2.2, preenchimento: 0.0 }],
      titulo: { texto: '31 januari 1953', sub: 'Zaterdagavond', aos: 0.3, ate: 4.6 },
      rotas: [{ pontos: [[1.0, 55.6], [2.3, 53.4], [3.7, 51.72]], aos: 10.6, dur: 1.6, cor: '#c8372d', arco: 25, largura: 2.2 }],
      pinos: [
        { lon: 3.9, lat: 51.5, rotulo: 'Zeeland', aos: 5.3, cor: '#c8372d' },
        { lon: 4.45, lat: 52.0, rotulo: 'Zuid-Holland', aos: 6.4, cor: '#c8372d' },
        { lon: 4.6, lat: 51.55, rotulo: 'West-Brabant', aos: 7.6, cor: '#c8372d' },
      ],
      areas: [{ pontos: ZEELAND, aos: 11.4, dur: 2.0, cor: '#2f6fd6', altura: 1.2, base: 0.1, opacidade: 0.5 }],
      fotos: [{ src: 'doc/demo/cena.svg', lon: 3.05, lat: 51.62, largura: 54, elevacao: 14, aos: 9.0, legenda: 'Zierikzee · 1953', credito: 'Foto: Nationaal Archief / Anefo (CC0)' }],
    } }],
  }],
};
