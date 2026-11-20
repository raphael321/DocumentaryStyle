// Mapa3D: mapa de satélite HD com zoom infinito (sem borrão) + relevo 3D real + inclinação lateral (pitch/bearing).
// Stack 100% gratuito e sem chave de API:
//   - MapLibre GL JS (MIT)
//   - Satélite HD Esri World Imagery (nítido do espaço z2 até nível de rua z17 ~0,3m/px)
//   - Relevo 3D AWS Terrarium DEM (encoding: 'terrarium')
// Determinístico no Remotion: interactive: false, fadeDuration: 0, jumpTo() por quadro, delayRender/continueRender.
// Dica de render: use --concurrency=1 ao renderizar cenas WebGL/MapLibre no Remotion.
import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { COR, FONTE, SOMBRA_TEXTO } from './tema';
import { mola, surgir } from './base';
import type { LonLat } from './geo';

export type QuadroCamera3D = {
  /** tempo em segundos dentro da cena */
  t: number;
  lon: number;
  lat: number;
  /** nível de zoom MapLibre: 2 = mundo, 6 = país, 11 = vale/cidade, 15 = bairro, 17 = rua */
  zoom: number;
  /** inclinação 3D em graus (0 = de cima, 55–65 = vista lateral cinematográfica) */
  pitch?: number;
  /** rotação/bússola em graus (-180 a 180) */
  bearing?: number;
};

export type Pino3D = {
  lon: number;
  lat: number;
  rotulo: string;
  sub?: string;
  aos?: number;
  cor?: string;
};

export type Rota3D = {
  pontos: LonLat[];
  aos?: number;
  dur?: number;
  cor?: string;
  largura?: number;
  tracejado?: boolean;
};

const ESRI_SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const AWS_TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

function interpolarCamera(frames: QuadroCamera3D[], tSec: number) {
  if (!frames.length) return { lon: 10.1, lat: 44.69, zoom: 10, pitch: 45, bearing: 0 };
  if (frames.length === 1 || tSec <= frames[0].t) {
    const f = frames[0];
    return { lon: f.lon, lat: f.lat, zoom: f.zoom, pitch: f.pitch ?? 0, bearing: f.bearing ?? 0 };
  }
  const ult = frames[frames.length - 1];
  if (tSec >= ult.t) {
    return { lon: ult.lon, lat: ult.lat, zoom: ult.zoom, pitch: ult.pitch ?? 0, bearing: ult.bearing ?? 0 };
  }
  let i = 0;
  while (i + 1 < frames.length && frames[i + 1].t < tSec) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const k = interpolate(tSec, [a.t, b.t], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const mix = (u: number, v: number) => u + (v - u) * k;
  return {
    lon: mix(a.lon, b.lon),
    lat: mix(a.lat, b.lat),
    zoom: mix(a.zoom, b.zoom),
    pitch: mix(a.pitch ?? 0, b.pitch ?? 0),
    bearing: mix(a.bearing ?? 0, b.bearing ?? 0),
  };
}

/** Recorta uma polilinha GeoJSON proporcionalmente a `progresso` (0..1) para desenhar rotas animadas no terreno 3D. */
function recortarRota(pontos: LonLat[], progresso: number): LonLat[] {
  if (pontos.length < 2 || progresso <= 0) return [];
  if (progresso >= 1) return pontos;
  const dists: number[] = [0];
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    const dx = pontos[i][0] - pontos[i - 1][0];
    const dy = pontos[i][1] - pontos[i - 1][1];
    total += Math.hypot(dx, dy);
    dists.push(total);
  }
  if (total === 0) return [pontos[0]];
  const alvo = total * progresso;
  const out: LonLat[] = [pontos[0]];
  for (let i = 1; i < pontos.length; i++) {
    if (dists[i] <= alvo) {
      out.push(pontos[i]);
    } else {
      const seg = dists[i] - dists[i - 1];
      const f = seg > 0 ? (alvo - dists[i - 1]) / seg : 0;
      out.push([
        pontos[i - 1][0] + (pontos[i][0] - pontos[i - 1][0]) * f,
        pontos[i - 1][1] + (pontos[i][1] - pontos[i - 1][1]) * f,
      ]);
      break;
    }
  }
  return out;
}

export const Mapa3D: React.FC<{
  camera: QuadroCamera3D[];
  /** exagero vertical do relevo 3D (padrão 1.4; use 0 para plano sem DEM) */
  exageroRelevo?: number;
  /** escurecimento leve sobre o satélite (0..0.6, padrão 0.14) */
  escurecer?: number;
  rotas?: Rota3D[];
  pinos?: Pino3D[];
  /** exibe HUD sutil com zoom/inclinação no canto superior esquerdo */
  mostrarHud?: boolean;
}> = ({ camera, exageroRelevo = 1.4, escurecer = 0.14, rotas = [], pinos = [], mostrarHud = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const cam = interpolarCamera(camera, t);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [pronto, setPronto] = useState(false);
  const [initHandle] = useState(() => delayRender('Mapa3D: inicializar MapLibre'));
  const [projetados, setProjetados] = useState<Array<{ x: number; y: number; pino: Pino3D }>>([]);

  // Inicializa o mapa uma única vez com Esri Satellite + AWS Terrarium DEM
  useEffect(() => {
    if (!containerRef.current) return;
    const sources: Record<string, any> = {
      esri: {
        type: 'raster',
        tiles: [ESRI_SATELITE],
        tileSize: 256,
        maxzoom: 17,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
      rotas: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    };
    if (exageroRelevo > 0) {
      sources.terreno = {
        type: 'raster-dem',
        tiles: [AWS_TERRARIUM],
        tileSize: 256,
        maxzoom: 14,
        encoding: 'terrarium',
      };
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      preserveDrawingBuffer: true,
      center: [cam.lon, cam.lat],
      zoom: cam.zoom,
      pitch: cam.pitch,
      bearing: cam.bearing,
      maxPitch: 75,
      style: {
        version: 8,
        sources,
        terrain: exageroRelevo > 0 ? { source: 'terreno', exaggeration: exageroRelevo } : undefined,
        sky: {
          'sky-color': '#0b1824',
          'horizon-color': '#1e3a4c',
          'fog-color': '#132634',
          'sky-horizon-blend': 0.55,
          'horizon-fog-blend': 0.7,
          'fog-ground-blend': 0.4,
        } as any,
        layers: [
          {
            id: 'satelite',
            type: 'raster',
            source: 'esri',
            paint: { 'raster-fade-duration': 0 },
          },
          {
            id: 'rotas-glow',
            type: 'line',
            source: 'rotas',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': ['get', 'cor'],
              'line-width': ['+', ['get', 'largura'], 6],
              'line-opacity': 0.28,
              'line-blur': 4,
            },
          },
          {
            id: 'rotas-linha',
            type: 'line',
            source: 'rotas',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': ['get', 'cor'],
              'line-width': ['get', 'largura'],
              'line-opacity': 0.96,
            },
          },
        ],
      },
    });

    map.once('idle', () => {
      setPronto(true);
      continueRender(initHandle);
    });
    map.on('error', (ev) => {
      // Erros esporádicos de tile não devem travar o render inteiro
      if (ev && (ev as any).error && !pronto) {
        setPronto(true);
        continueRender(initHandle);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // A cada quadro do Remotion: move a câmera 3D, atualiza as rotas GeoJSON e aguarda os tiles HD ficarem prontos
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pronto) return;

    const frameHandle = delayRender(`Mapa3D: quadro ${frame}`);
    let concluido = false;
    const liberar = () => {
      if (concluido) return;
      concluido = true;
      setProjetados(
        pinos.map((pino) => {
          const pt = map.project([pino.lon, pino.lat]);
          return { x: pt.x, y: pt.y, pino };
        }),
      );
      continueRender(frameHandle);
    };

    try {
      map.jumpTo({
        center: [cam.lon, cam.lat],
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
      });

      const src = map.getSource('rotas') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        const features = rotas
          .map((r) => {
            const prog = surgir(frame, fps, r.aos ?? 0, r.dur ?? 2.2);
            const coords = recortarRota(r.pontos, prog);
            if (coords.length < 2) return null;
            return {
              type: 'Feature',
              properties: { cor: r.cor ?? COR.ouro, largura: r.largura ?? 5 },
              geometry: { type: 'LineString', coordinates: coords },
            };
          })
          .filter(Boolean);
        src.setData({ type: 'FeatureCollection', features } as any);
      }

      if (map.areTilesLoaded()) {
        map.once('render', liberar);
        map.triggerRepaint();
      } else {
        map.once('idle', liberar);
      }
    } catch (e) {
      cancelRender(e);
    }

    const fallback = setTimeout(liberar, 4000);
    return () => {
      clearTimeout(fallback);
      if (!concluido) {
        concluido = true;
        continueRender(frameHandle);
      }
    };
  }, [frame, pronto]);

  return (
    <AbsoluteFill style={{ background: COR.fundo, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width, height, position: 'absolute', inset: 0 }} />
      {escurecer > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, rgba(4,10,18,${escurecer * 0.4}) 35%, rgba(4,10,18,${Math.min(0.75, escurecer + 0.35)}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Pinos projetados no espaço de tela 3D acompanhando pitch e bearing */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {projetados.map(({ x, y, pino }, idx) => {
          const sp = mola(frame, fps, pino.aos ?? 0, 160, 16);
          if (sp <= 0.01) return null;
          const cor = pino.cor ?? COR.ouro;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${sp})`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: cor,
                  border: '3px solid #fff',
                  boxShadow: `0 0 0 6px ${cor}44, 0 4px 14px rgba(0,0,0,0.75)`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  background: 'rgba(8,18,26,0.84)',
                  border: `1px solid ${cor}99`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontFamily: FONTE.sans, fontWeight: 800, fontSize: 20, color: COR.branco, textShadow: SOMBRA_TEXTO, lineHeight: 1.15 }}>
                  {pino.rotulo}
                </div>
                {pino.sub && (
                  <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: 16, color: 'rgba(246,242,233,0.85)' }}>
                    {pino.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      {mostrarHud && (
        <div
          style={{
            position: 'absolute',
            left: 36,
            top: 32,
            background: 'rgba(8,18,26,0.82)',
            border: `1px solid ${COR.ouro}77`,
            borderRadius: 8,
            padding: '6px 14px',
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontWeight: 700,
            fontSize: 16,
            color: COR.ouro,
            letterSpacing: 1,
          }}
        >
          {`Z${cam.zoom.toFixed(1)} · PITCH ${Math.round(cam.pitch)}° · BEARING ${Math.round(cam.bearing)}° · 3D TERRAIN`}
        </div>
      )}
    </AbsoluteFill>
  );
};
