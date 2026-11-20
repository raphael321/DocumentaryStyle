// DocumentaryStyle: terreno 3D REAL para a cena3d — satélite real (NASA Blue Marble / recortes Sentinel-2)
// deitado sobre o relevo real (AWS Terrain Tiles, baixado com scripts/baixar-relevo.mjs).
import * as THREE from 'three';
import { carregarImagem, carregarJson } from './base';
import type { LonLat } from './geo';

export type CamadaSatelite = { src: string; oeste: number; sul: number; leste: number; norte: number; /** suaviza a borda do recorte (fração, padrão 0.04) */ suavizar?: number };

export type Terreno3D = {
  /** caixa (graus) coberta pelo terreno 3D */
  oeste: number; sul: number; leste: number; norte: number;
  /**
   * Imagens de satélite em lon/lat (equiretangulares), desenhadas em ordem: a primeira é a base
   * (ex.: bloco NASA 'doc/mapa/hd/4_0.jpg' = lon 0..45, lat 45..90), as seguintes são recortes mais nítidos por cima.
   */
  satelite: CamadaSatelite[];
  /** pasta gerada por baixar-relevo.mjs (ex.: 'doc/relevo/holanda'); sem ela o terreno fica plano */
  relevo?: string;
  /** multiplica a altitude para o relevo aparecer (padrão 12; montanha alta pede 3 a 5) */
  exagero?: number;
  /** subdivisões da malha (padrão 320) */
  segmentos?: number;
  /** lado maior da textura em px (padrão 4096; 8192 se tiver recorte Sentinel grande) */
  resolucao?: number;
  /** escurece o satélite para os elementos 3D saltarem (padrão 0.12) */
  escurecer?: number;
  /** fração das bordas que se dissolve no fundo (padrão 0.08) */
  bordaSuave?: number;
  /** crédito do mapa na tela (padrão: NASA + Sentinel-2 EOX + AWS Terrain Tiles) */
  credito?: string;
};

type InfoRelevo = { z: number; x0: number; x1: number; y0: number; y1: number };
export type Altitudes = { info: InfoRelevo; w: number; h: number; m: Float32Array } | null;

const KM_LAT = 110.57;
const COR_FUNDO = '#0c1420';
const kmLon = (lat0: number) => 111.32 * Math.cos((lat0 * Math.PI) / 180);
const paraCena = (c: LonLat, [lon, lat]: LonLat): [number, number] => [(lon - c[0]) * kmLon(c[1]), -(lat - c[1]) * KM_LAT];

export const carregarTerreno = async (t: Terreno3D) => {
  const imgs = await Promise.all(t.satelite.map((s) => carregarImagem(s.src)));
  let alt: Altitudes = null;
  if (t.relevo) {
    const info = await carregarJson<InfoRelevo>(`${t.relevo}/info.json`);
    const nx = info.x1 - info.x0 + 1, ny = info.y1 - info.y0 + 1;
    const cv = document.createElement('canvas');
    cv.width = nx * 256;
    cv.height = ny * 256;
    const ctx = cv.getContext('2d', { willReadFrequently: true })!;
    const blocos: Promise<void>[] = [];
    for (let x = info.x0; x <= info.x1; x++)
      for (let y = info.y0; y <= info.y1; y++)
        blocos.push(carregarImagem(`${t.relevo}/${info.z}_${x}_${y}.png`).then((im) => ctx.drawImage(im, (x - info.x0) * 256, (y - info.y0) * 256)));
    await Promise.all(blocos);
    const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const m = new Float32Array(cv.width * cv.height);
    for (let i = 0; i < m.length; i++) m[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    alt = { info, w: cv.width, h: cv.height, m };
  }
  return { imgs, alt };
};

/** Altitude em metros (bilinear) num ponto; 0 fora da área baixada. */
export const altitudeEm = (alt: Altitudes, lon: number, lat: number) => {
  if (!alt) return 0;
  const n = 2 ** alt.info.z;
  const r = (lat * Math.PI) / 180;
  const gx = ((lon + 180) / 360) * n * 256 - alt.info.x0 * 256;
  const gy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n * 256 - alt.info.y0 * 256;
  if (gx < 0 || gy < 0 || gx >= alt.w - 1 || gy >= alt.h - 1) return 0;
  const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
  const v = (x: number, y: number) => alt.m[y * alt.w + x];
  return (v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx) * (1 - fy) + (v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx) * fy;
};

/** Altura do chão na cena (km, já com exagero; mar e pólderes abaixo de 0 ficam no nível 0). */
export const chaoKm = (t: Terreno3D | undefined, alt: Altitudes, lon: number, lat: number) =>
  t && lon >= t.oeste && lon <= t.leste && lat >= t.sul && lat <= t.norte ? (Math.max(0, altitudeEm(alt, lon, lat)) * (t.exagero ?? 12)) / 1000 : 0;

/** Junta as camadas de satélite numa textura só, em lon/lat, com as bordas dos recortes suavizadas. */
export const texturaTerreno = (t: Terreno3D, imgs: HTMLImageElement[]) => {
  const wDeg = t.leste - t.oeste, hDeg = t.norte - t.sul;
  const res = t.resolucao ?? 4096;
  const W = wDeg >= hDeg ? res : Math.round((res * wDeg) / hDeg);
  const H = wDeg >= hDeg ? Math.round((res * hDeg) / wDeg) : res;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = COR_FUNDO;
  ctx.fillRect(0, 0, W, H);
  t.satelite.forEach((s, i) => {
    const img = imgs[i];
    // parte da imagem que cai dentro do terreno
    const o = Math.max(s.oeste, t.oeste), l = Math.min(s.leste, t.leste), n = Math.min(s.norte, t.norte), su = Math.max(s.sul, t.sul);
    if (o >= l || su >= n) return;
    const sx = ((o - s.oeste) / (s.leste - s.oeste)) * img.naturalWidth, sw = ((l - o) / (s.leste - s.oeste)) * img.naturalWidth;
    const sy = ((s.norte - n) / (s.norte - s.sul)) * img.naturalHeight, sh = ((n - su) / (s.norte - s.sul)) * img.naturalHeight;
    const dx = ((o - t.oeste) / wDeg) * W, dw = ((l - o) / wDeg) * W, dy = ((t.norte - n) / hDeg) * H, dh = ((n - su) / hDeg) * H;
    if (i === 0) {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      return;
    }
    // recorte por cima: borda suavizada para não aparecer a emenda com a base
    const tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.round(dw));
    tmp.height = Math.max(1, Math.round(dh));
    const c2 = tmp.getContext('2d')!;
    c2.drawImage(img, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
    const f = s.suavizar ?? 0.04;
    c2.globalCompositeOperation = 'destination-in';
    for (const horizontal of [true, false]) {
      const tam = horizontal ? tmp.width : tmp.height;
      const g = horizontal ? c2.createLinearGradient(0, 0, tam, 0) : c2.createLinearGradient(0, 0, 0, tam);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(f, 'rgba(0,0,0,1)');
      g.addColorStop(1 - f, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c2.fillStyle = g;
      c2.fillRect(0, 0, tmp.width, tmp.height);
    }
    ctx.drawImage(tmp, dx, dy);
  });
  // bordas do terreno somem no azul-noite do fundo (sem "laje" quadrada aparecendo)
  const borda = t.bordaSuave ?? 0.08;
  if (borda > 0) {
    for (const [x0, y0, x1, y1, w, h, rx, ry] of [
      [0, 0, borda * W, 0, borda * W, H, 0, 0], [W, 0, W - borda * W, 0, borda * W, H, W - borda * W, 0],
      [0, 0, 0, borda * H, W, borda * H, 0, 0], [0, H, 0, H - borda * H, W, borda * H, 0, H - borda * H],
    ]) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, COR_FUNDO);
      g.addColorStop(1, 'rgba(12,20,32,0)');
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, w, h);
    }
  }
  if ((t.escurecer ?? 0.12) > 0) {
    ctx.fillStyle = `rgba(0,0,0,${t.escurecer ?? 0.12})`;
    ctx.fillRect(0, 0, W, H);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/** Malha do terreno em km a partir de `centro`, com a altitude real. */
export const geometriaTerreno = (t: Terreno3D, alt: Altitudes, centro: LonLat) => {
  const n = t.segmentos ?? 320;
  const nx = n, ny = Math.max(8, Math.round((n * (t.norte - t.sul)) / (t.leste - t.oeste)));
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3);
  const uv = new Float32Array((nx + 1) * (ny + 1) * 2);
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const lon = t.oeste + ((t.leste - t.oeste) * i) / nx, lat = t.norte - ((t.norte - t.sul) * j) / ny;
      const [x, z] = paraCena(centro, [lon, lat]);
      const k = j * (nx + 1) + i;
      pos.set([x, chaoKm(t, alt, lon, lat), z], k * 3);
      uv.set([i / nx, 1 - j / ny], k * 2);
    }
  const idx: number[] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
