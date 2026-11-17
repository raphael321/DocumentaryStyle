// DocumentaryStyle: geografia real (Natural Earth, domínio público) em coordenadas de grau.
// Espaço "graus": x = lon + 180 (0..360), y = 90 - lat (0..180).
import { Easing, interpolate } from 'remotion';
import { carregarJson, useRecurso } from './base';

export type LonLat = [number, number];
export type Caixa = { oeste: number; sul: number; leste: number; norte: number };

type Geometria = { type: string; coordinates: any };
type Feicao = { properties: Record<string, any>; geometry: Geometria | null };
type Colecao = { features: Feicao[] };

export type Forma = { id: string; nome: string; d: string; aneis: LonLat[][]; caixa: Caixa };

export const ARQUIVO_PAISES = 'doc/mapa/paises-50m.geojson';
export const ARQUIVO_RIOS = 'doc/mapa/rios-10m.geojson';
export const TEXTURA_TERRA = 'doc/mapa/terra.jpg';

const aneisDe = (g: Geometria | null): LonLat[][] => {
  if (!g) return [];
  switch (g.type) {
    case 'Polygon':
      return g.coordinates as LonLat[][];
    case 'MultiPolygon':
      return (g.coordinates as LonLat[][][]).flat();
    case 'LineString':
      return [g.coordinates as LonLat[]];
    case 'MultiLineString':
      return g.coordinates as LonLat[][];
    default:
      return [];
  }
};

const caixaDe = (aneis: LonLat[][]): Caixa => {
  let oeste = 180, sul = 90, leste = -180, norte = -90;
  for (const anel of aneis)
    for (const [lon, lat] of anel) {
      if (lon < oeste) oeste = lon;
      if (lon > leste) leste = lon;
      if (lat < sul) sul = lat;
      if (lat > norte) norte = lat;
    }
  return { oeste, sul, leste, norte };
};

const n = (v: number) => Math.round(v * 1000) / 1000;
export const caminhoEmGraus = (aneis: LonLat[][], fechar: boolean) =>
  aneis
    .map((anel) => anel.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${n(lon + 180)} ${n(90 - lat)}`).join('') + (fechar ? 'Z' : ''))
    .join('');

const processar = (col: Colecao, fechar: boolean, chaveId: (p: Record<string, any>, i: number) => string): Map<string, Forma> => {
  const mapa = new Map<string, Forma>();
  col.features.forEach((f, i) => {
    const aneis = aneisDe(f.geometry);
    if (!aneis.length) return;
    const id = chaveId(f.properties, i);
    mapa.set(id, {
      id,
      nome: String(f.properties.NAME_PT ?? f.properties.NAME ?? f.properties.name ?? id),
      d: caminhoEmGraus(aneis, fechar),
      aneis,
      caixa: caixaDe(aneis),
    });
  });
  return mapa;
};

let paisesProntos: Promise<Map<string, Forma>> | null = null;
/** Países por código ISO de 3 letras (BRA, ITA, DEU, PRK...). Usa ADM0_A3 do Natural Earth. */
export const usePaises = (ativo: boolean) =>
  useRecurso(ativo ? 'paises' : null, () => {
    paisesProntos ??= carregarJson<Colecao>(ARQUIVO_PAISES).then((c) =>
      processar(c, true, (p) => String(p.ADM0_A3 ?? p.ISO_A3 ?? p.NAME)),
    );
    return paisesProntos;
  });

let riosProntos: Promise<Forma[]> | null = null;
export const useRios = (ativo: boolean) =>
  useRecurso(ativo ? 'rios' : null, () => {
    riosProntos ??= carregarJson<Colecao>(ARQUIVO_RIOS).then((c) => [...processar(c, false, (_p, i) => `rio-${i}`).values()]);
    return riosProntos;
  });

export const cruza = (a: Caixa, b: Caixa) => !(a.leste < b.oeste || a.oeste > b.leste || a.norte < b.sul || a.sul > b.norte);

// ---------- câmera do mapa plano ----------

/** Quadro-chave da câmera: centro (lon, lat) e altura visível em graus de latitude (zoom). */
export type QuadroCamera = { t: number; lon: number; lat: number; altura: number };
/** Quadro-chave do globo: centro e raio do globo em pixels. */
export type QuadroGlobo = { t: number; lon: number; lat: number; raio: number };

const segmento = <T extends { t: number }>(quadros: T[], seg: number): [T, T, number] => {
  if (quadros.length === 1 || seg <= quadros[0].t) return [quadros[0], quadros[0], 0];
  for (let i = 0; i < quadros.length - 1; i++) {
    const a = quadros[i], b = quadros[i + 1];
    if (seg <= b.t) {
      const p = interpolate(seg, [a.t, b.t], [0, 1], { easing: Easing.inOut(Easing.cubic) });
      return [a, b, p];
    }
  }
  const ult = quadros[quadros.length - 1];
  return [ult, ult, 0];
};

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpLog = (a: number, b: number, p: number) => Math.exp(lerp(Math.log(a), Math.log(b), p));

export const cameraNoTempo = (quadros: QuadroCamera[], seg: number) => {
  const [a, b, p] = segmento(quadros, seg);
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), altura: lerpLog(a.altura, b.altura, p) };
};

export const globoNoTempo = (quadros: QuadroGlobo[], seg: number) => {
  const [a, b, p] = segmento(quadros, seg);
  let dl = b.lon - a.lon;
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  return { lon: a.lon + dl * p, lat: lerp(a.lat, b.lat, p), raio: lerpLog(a.raio, b.raio, p) };
};

/** Projeção local do mapa plano: equiretangular corrigida pelo cosseno da latitude do centro. */
export const projetor = (cam: { lon: number; lat: number; altura: number }, largura: number, alturaTela: number) => {
  const ppd = alturaTela / cam.altura;
  const sx = ppd * Math.cos((cam.lat * Math.PI) / 180);
  const tx = largura / 2 - (cam.lon + 180) * sx;
  const ty = alturaTela / 2 - (90 - cam.lat) * ppd;
  const meiaLon = largura / 2 / sx;
  const meiaLat = alturaTela / 2 / ppd;
  return {
    ppd,
    sx,
    matriz: `matrix(${sx} 0 0 ${ppd} ${tx} ${ty})`,
    tela: ([lon, lat]: LonLat): [number, number] => [largura / 2 + (lon - cam.lon) * sx, alturaTela / 2 - (lat - cam.lat) * ppd],
    visivel: { oeste: cam.lon - meiaLon, leste: cam.lon + meiaLon, sul: cam.lat - meiaLat, norte: cam.lat + meiaLat } as Caixa,
    /** caixa de uma imagem georreferenciada, em pixels de tela */
    retangulo: (c: Caixa) => ({
      left: largura / 2 + (c.oeste - cam.lon) * sx,
      top: alturaTela / 2 - (c.norte - cam.lat) * ppd,
      width: (c.leste - c.oeste) * sx,
      height: (c.norte - c.sul) * ppd,
    }),
  };
};

// ---------- curvas em tela ----------

export type Ponto = [number, number];

/** Curva suave (quadrática) entre pontos de tela. `curva` = quanto a linha arqueia (0 = reta). */
export const amostrarCurva = (pontos: Ponto[], curva = 0.18, porSegmento = 40): Ponto[] => {
  const saida: Ponto[] = [];
  for (let s = 0; s < pontos.length - 1; s++) {
    const [ax, ay] = pontos[s];
    const [bx, by] = pontos[s + 1];
    const dx = bx - ax, dy = by - ay;
    const cx = (ax + bx) / 2 - dy * curva;
    const cy = (ay + by) / 2 + dx * curva;
    for (let i = s === 0 ? 0 : 1; i <= porSegmento; i++) {
      const t = i / porSegmento;
      const u = 1 - t;
      saida.push([u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by]);
    }
  }
  return saida;
};

/** Corta a linha na fração `p` do comprimento. Devolve os pontos e a direção (radianos) na ponta. */
export const cortarLinha = (pts: Ponto[], p: number): { pontos: Ponto[]; angulo: number } => {
  if (pts.length < 2) return { pontos: pts, angulo: 0 };
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const alvo = acum[acum.length - 1] * Math.min(1, Math.max(0, p));
  const saida: Ponto[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (acum[i] <= alvo) {
      saida.push(pts[i]);
      continue;
    }
    const f = (alvo - acum[i - 1]) / Math.max(1e-6, acum[i] - acum[i - 1]);
    saida.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]);
    break;
  }
  const a = saida[Math.max(0, saida.length - 2)], b = saida[saida.length - 1];
  const angulo = saida.length >= 2 ? Math.atan2(b[1] - a[1], b[0] - a[0]) : 0;
  return { pontos: saida, angulo };
};

export const caminhoTela = (pts: Ponto[]) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
