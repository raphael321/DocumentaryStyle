// DocumentaryStyle: satélite em ALTA resolução por blocos (tiles XYZ, 256 px) só onde a câmera está.
// Fonte padrão: Sentinel-2 cloudless 2016 (EOX, s2maps.eu), ~10 m por pixel, licença CC BY 4.0.
// Os blocos são baixados antes pelo scripts/baixar-tiles.mjs para public/doc/mapa/tiles/{z}/{x}/{y}.jpg,
// que também grava tiles/indice.json (lista dos blocos + crédito). Sem o índice o mapa usa só a textura base.
import type { Caixa } from './geo';
import type { QuadroCamera } from './geo';

export const PASTA_TILES = 'doc/mapa/tiles';
export const URL_TILES_PADRAO = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
export const CREDITO_TILES_PADRAO = 'Satélite: Sentinel-2 cloudless 2016 · s2maps.eu · EOX IT Services (CC BY 4.0)';
/** abaixo deste zoom a textura base (NASA 5400 px) já basta */
export const ZOOM_MIN_TILES = 5;
/** densidade mínima: pixels do bloco por pixel da tela (0.8 = aceita ampliar até 25%) */
export const FATOR_DENSIDADE = 0.8;

export type IndiceTiles = { url?: string; credito?: string; zoomMax?: number; tiles: string[] };

const RAD = Math.PI / 180;
export const lonParaX = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
export const latParaY = (lat: number, z: number) => {
  const l = Math.max(-85.05, Math.min(85.05, lat)) * RAD;
  return ((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * 2 ** z;
};
export const xParaLon = (x: number, z: number) => (x / 2 ** z) * 360 - 180;
export const yParaLat = (y: number, z: number) => Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / 2 ** z)) / RAD;

/** Caixa (graus) de um bloco z/x/y. O bloco é desenhado como retângulo em graus (erro < 1 px a partir do zoom 5). */
export const caixaDoTile = (z: number, x: number, y: number): Caixa => ({
  oeste: xParaLon(x, z),
  leste: xParaLon(x + 1, z),
  norte: yParaLat(y, z),
  sul: yParaLat(y + 1, z),
});

/** Zoom de bloco necessário para `sx` pixels de tela por grau de longitude. */
export const zoomParaDensidade = (sx: number, zoomMax = 14) =>
  Math.min(zoomMax, Math.max(0, Math.ceil(Math.log2((sx * FATOR_DENSIDADE * 360) / 256))));

/** Blocos (z/x/y) que cobrem a caixa visível no zoom z. */
export const tilesNaCaixa = (vis: Caixa, z: number): [number, number, number][] => {
  const n = 2 ** z;
  const x0 = Math.floor(lonParaX(vis.oeste, z)), x1 = Math.floor(lonParaX(vis.leste, z));
  const y0 = Math.max(0, Math.floor(latParaY(vis.norte, z))), y1 = Math.min(n - 1, Math.floor(latParaY(vis.sul, z)));
  const out: [number, number, number][] = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([z, ((x % n) + n) % n, y]);
  return out;
};

/**
 * Escolhe os blocos para a tela atual. Com índice: usa o bloco do zoom certo e, se ele não foi baixado,
 * o "pai" mais próximo que existir (fica um pouco menos nítido, mas nunca some). Sem índice e com `url`: pede direto.
 */
export const tilesParaTela = (
  vis: Caixa,
  sx: number,
  fonte: { pasta?: string; url?: string; zoomMax?: number },
  disponiveis: Set<string> | null,
): (Caixa & { src: string; opcional: boolean; z: number })[] => {
  const zAlvo = zoomParaDensidade(sx, fonte.zoomMax ?? 14);
  if (zAlvo < ZOOM_MIN_TILES) return [];
  const usados = new Map<string, Caixa & { src: string; opcional: boolean; z: number }>();
  for (const [z, x, y] of tilesNaCaixa(vis, zAlvo)) {
    if (disponiveis) {
      let zz = z, xx = x, yy = y;
      while (zz >= ZOOM_MIN_TILES && !disponiveis.has(`${zz}/${xx}/${yy}`)) {
        zz--;
        xx = Math.floor(xx / 2);
        yy = Math.floor(yy / 2);
      }
      if (zz < ZOOM_MIN_TILES) continue;
      const k = `${zz}/${xx}/${yy}`;
      if (!usados.has(k)) usados.set(k, { ...caixaDoTile(zz, xx, yy), src: `${fonte.pasta ?? PASTA_TILES}/${k}.jpg`, opcional: false, z: zz });
    } else if (fonte.url) {
      const src = fonte.url.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
      usados.set(`${z}/${x}/${y}`, { ...caixaDoTile(z, x, y), src, opcional: true, z });
    }
  }
  // zoom menor primeiro: o mais nítido fica por cima
  return [...usados.values()].sort((a, b) => a.z - b.z);
};

/**
 * Câmeras de mapa de um plano, para o baixar-tiles.mjs:
 *   npx tsx -e "import {camerasDoPlano} from './src/doc'; import {PLANO} from './src/x/plano'; console.log(JSON.stringify(camerasDoPlano(PLANO)))" > cameras.json
 */
export const camerasDoPlano = (plano: { cenas: { blocos: { tipo: string; props: unknown }[] }[] }): QuadroCamera[][] =>
  plano.cenas.flatMap((c) => c.blocos.filter((b) => b.tipo === 'mapa').map((b) => (b.props as { camera: QuadroCamera[] }).camera));
