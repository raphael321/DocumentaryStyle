import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR } from './tema';
import { carregarImagem, mola, surgir, useRecurso } from './base';
import { LonLat, QuadroGlobo, TEXTURA_TERRA, globoNoTempo, usePaises } from './geo';
import { Pino } from './Marcadores';

type Mip = { w: number; h: number; px: Uint8ClampedArray };

const mipsPorImagem = new WeakMap<HTMLImageElement, Map<number, Mip>>();
const pegarMip = (img: HTMLImageElement, w: number): Mip => {
  let mapa = mipsPorImagem.get(img);
  if (!mapa) {
    mapa = new Map();
    mipsPorImagem.set(img, mapa);
  }
  const larg = Math.min(w, img.naturalWidth);
  let mip = mapa.get(larg);
  if (!mip) {
    const alt = Math.round(larg / 2);
    const c = document.createElement('canvas');
    c.width = larg;
    c.height = alt;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, larg, alt);
    mip = { w: larg, h: alt, px: ctx.getImageData(0, 0, larg, alt).data };
    mapa.set(larg, mip);
  }
  return mip;
};

const RAD = Math.PI / 180;

/** Projeção ortográfica direta: devolve [x, y, cosc] com x,y em -1..1 (y para cima). */
const projetarOrto = (lon: number, lat: number, lon0: number, lat0: number): [number, number, number] => {
  const f = lat * RAD, l = (lon - lon0) * RAD, f0 = lat0 * RAD;
  const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
  const x = Math.cos(f) * Math.sin(l);
  const y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
  return [x, y, cosc];
};

export type PropsGlobo = {
  /** quadros-chave: centro do globo (lon, lat) e raio em pixels (cresce para "mergulhar") */
  camera: QuadroGlobo[];
  textura?: string;
  paises?: { iso: string; cor?: string; aos?: number; opacidade?: number }[];
  pinos?: { lon: number; lat: number; rotulo?: string; sub?: string; aos?: number; cor?: string; bandeira?: string }[];
  /** linhas ligando lugares no globo (arco tracejado) */
  arcos?: { de: LonLat; para: LonLat; aos?: number; dur?: number; cor?: string }[];
};

/** GLOBO 3D com a textura de satélite real, girando e aproximando. Bom para abrir e trocar de continente. */
export const GloboReal: React.FC<PropsGlobo> = ({ camera, textura = TEXTURA_TERRA, paises = [], pinos = [], arcos = [] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const img = useRecurso(`globo ${textura}`, () => carregarImagem(textura));
  const formas = usePaises(paises.length > 0);
  const cam = globoNoTempo(camera, frame / fps);
  const cx = width / 2, cy = height / 2;
  const saida = useMemo(() => new ImageData(width, height), [width, height]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    const R = cam.raio;
    const alvo = Math.PI * 2 * R * 1.1;
    const nivel = [1024, 2048, 4096, 8192].find((w) => w >= alvo) ?? 8192;
    const mip = pegarMip(img, nivel);
    const { w: tw, h: th, px: tex } = mip;
    const dados = saida.data;
    dados.fill(0);
    const f0 = cam.lat * RAD;
    const sf0 = Math.sin(f0), cf0 = Math.cos(f0);
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(height - 1, Math.ceil(cy + R));
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(width - 1, Math.ceil(cx + R));
    for (let py = y0; py <= y1; py++) {
      const y = (cy - py) / R;
      for (let pxl = x0; pxl <= x1; pxl++) {
        const x = (pxl - cx) / R;
        const rho2 = x * x + y * y;
        if (rho2 > 1) continue;
        const z = Math.sqrt(1 - rho2);
        const lat = Math.asin(Math.max(-1, Math.min(1, z * sf0 + y * cf0)));
        let lon = cam.lon * RAD + Math.atan2(x, z * cf0 - y * sf0);
        lon = ((((lon / RAD + 180) % 360) + 360) % 360) / 360;
        const u = lon * (tw - 1);
        const v = ((90 - lat / RAD) / 180) * (th - 1);
        const ui = u | 0, vi = v | 0;
        const du = u - ui, dv = v - vi;
        const u2 = ui + 1 >= tw ? 0 : ui + 1;
        const v2 = vi + 1 >= th ? vi : vi + 1;
        const i00 = (vi * tw + ui) * 4, i10 = (vi * tw + u2) * 4, i01 = (v2 * tw + ui) * 4, i11 = (v2 * tw + u2) * 4;
        // sombreamento: bordas mais escuras e levemente azuladas (atmosfera)
        const luz = 0.38 + 0.62 * Math.pow(z, 0.55);
        const azul = Math.pow(1 - z, 3) * 0.55;
        const o = (py * width + pxl) * 4;
        for (let c = 0; c < 3; c++) {
          const val =
            tex[i00 + c] * (1 - du) * (1 - dv) + tex[i10 + c] * du * (1 - dv) + tex[i01 + c] * (1 - du) * dv + tex[i11 + c] * du * dv;
          const tint = c === 0 ? 90 : c === 1 ? 150 : 255;
          dados[o + c] = val * luz * (1 - azul) + tint * azul;
        }
        const borda = (1 - Math.sqrt(rho2)) * R; // antisserrilhado na borda
        dados[o + 3] = borda >= 1 ? 255 : Math.max(0, borda) * 255;
      }
    }
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(saida, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);

    // brilho da atmosfera
    const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.1);
    g.addColorStop(0, 'rgba(120,175,255,0.42)');
    g.addColorStop(0.35, 'rgba(110,170,255,0.16)');
    g.addColorStop(1, 'rgba(110,170,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
    ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
    ctx.fill();

    // países destacados
    if (formas) {
      for (const pd of paises) {
        const forma = formas.get(pd.iso);
        if (!forma) continue;
        const p = surgir(frame, fps, pd.aos ?? 0, 0.6);
        if (p <= 0) continue;
        ctx.beginPath();
        for (const anel of forma.aneis) {
          anel.forEach(([lon, lat], i) => {
            let [x, y, cosc] = projetarOrto(lon, lat, cam.lon, cam.lat);
            if (cosc < 0) {
              const len = Math.hypot(x, y) || 1;
              x /= len;
              y /= len;
            }
            const sx = cx + x * R, sy = cy - y * R;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
        }
        ctx.globalAlpha = (pd.opacidade ?? 0.72) * p;
        ctx.fillStyle = pd.cor ?? COR.vermelho;
        ctx.fill('evenodd');
        ctx.globalAlpha = p;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // arcos entre lugares (grande círculo, tracejado)
    for (const a of arcos) {
      const p = surgir(frame, fps, a.aos ?? 0, a.dur ?? 1.5);
      if (p <= 0) continue;
      const n = 64;
      const [l1, f1] = a.de, [l2, f2] = a.para;
      const v1 = [Math.cos(f1 * RAD) * Math.cos(l1 * RAD), Math.cos(f1 * RAD) * Math.sin(l1 * RAD), Math.sin(f1 * RAD)];
      const v2 = [Math.cos(f2 * RAD) * Math.cos(l2 * RAD), Math.cos(f2 * RAD) * Math.sin(l2 * RAD), Math.sin(f2 * RAD)];
      const omega = Math.acos(Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2])) || 1e-6;
      ctx.beginPath();
      for (let i = 0; i <= n * p; i++) {
        const t = i / n;
        const s1 = Math.sin((1 - t) * omega) / Math.sin(omega), s2 = Math.sin(t * omega) / Math.sin(omega);
        const vx = s1 * v1[0] + s2 * v2[0], vy = s1 * v1[1] + s2 * v2[1], vz = s1 * v1[2] + s2 * v2[2];
        const lat = Math.asin(vz) / RAD, lon = Math.atan2(vy, vx) / RAD;
        const elev = 1 + Math.sin(t * Math.PI) * 0.08; // arco levemente acima da superfície
        const [x, y, cosc] = projetarOrto(lon, lat, cam.lon, cam.lat);
        if (cosc < 0) continue;
        const sx = cx + x * R * elev, sy = cy - y * R * elev;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.setLineDash([10, 9]);
      ctx.strokeStyle = a.cor ?? '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  const pulso = (frame % Math.round(fps * 1.6)) / (fps * 1.6);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} />
      {pinos.map((pn, i) => {
        const [x, y, cosc] = projetarOrto(pn.lon, pn.lat, cam.lon, cam.lat);
        if (cosc < 0.12) return null;
        const vis = Math.min(1, (cosc - 0.12) * 4);
        return (
          <Pino
            key={i}
            x={cx + x * cam.raio}
            y={cy - y * cam.raio}
            p={Math.min(1.2, mola(frame, fps, pn.aos ?? 0, 180, 12)) * vis}
            rotulo={pn.rotulo}
            sub={pn.sub}
            cor={pn.cor}
            bandeira={pn.bandeira}
            pulso={pulso}
          />
        );
      })}
    </AbsoluteFill>
  );
};
