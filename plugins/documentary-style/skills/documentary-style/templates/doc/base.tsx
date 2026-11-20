import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Easing,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { GOOGLE_FONTS_URL } from './tema';

// ---------- animação ----------

/** 0 → 1 a partir de `aos` segundos, durando `dur` segundos (easing suave). */
export const surgir = (frame: number, fps: number, aos = 0, dur = 0.5) =>
  interpolate(frame - aos * fps, [0, Math.max(1, dur * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

/** Mola (spring) que começa em `aos` segundos. */
export const mola = (frame: number, fps: number, aos = 0, rigidez = 120, amortecimento = 14) =>
  spring({
    frame: frame - Math.round(aos * fps),
    fps,
    config: { stiffness: rigidez, damping: amortecimento, mass: 0.8 },
  });

/** Some nos últimos `dur` segundos da sequência atual. */
export const sumirNoFim = (frame: number, fps: number, totalFrames: number, dur = 0.35) =>
  interpolate(frame, [totalFrames - dur * fps, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Resolve um caminho de arquivo: URL completa fica como está; o resto vira staticFile(). */
export const arquivo = (src: string) => (/^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\/+/, '')));

// ---------- fontes ----------

let promessaFontes: Promise<void> | null = null;
const carregarFontes = () => {
  if (promessaFontes) return promessaFontes;
  promessaFontes = new Promise<void>((resolve) => {
    const id = 'documentary-style-fontes';
    const pronto = () =>
      Promise.all([
        document.fonts.load("italic 400 40px 'EB Garamond'"),
        document.fonts.load("600 40px 'EB Garamond'"),
        document.fonts.load("700 40px 'Fira Sans'"),
        document.fonts.load("800 40px 'Fira Sans'"),
        document.fonts.load("600 40px 'Cinzel'"),
        document.fonts.load("600 40px 'Oswald'"),
        document.fonts.load("400 40px 'Special Elite'"),
        document.fonts.load("600 40px 'Barlow Condensed'"),
        document.fonts.load("200 40px 'IBM Plex Sans'"),
        document.fonts.load("400 40px 'IBM Plex Sans'"),
        document.fonts.load("400 40px 'IBM Plex Mono'"),
        document.fonts.load("600 40px 'IBM Plex Mono'"),
        document.fonts.load("700 40px Inter"),
        document.fonts.load("italic 400 40px 'Source Serif 4'"),
      ])
        .then(() => resolve())
        .catch(() => resolve());
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      link.onload = pronto;
      link.onerror = () => resolve(); // sem internet: cai nas fontes de reserva
      document.head.appendChild(link);
    } else {
      pronto();
    }
  });
  return promessaFontes;
};

/** Segura a renderização até as fontes do estilo carregarem. Use uma vez na raiz do vídeo. */
export const useFontesDoc = () => {
  const [handle] = useState(() => delayRender('DocumentaryStyle: fontes'));
  useEffect(() => {
    carregarFontes().then(() => continueRender(handle));
  }, [handle]);
};

// ---------- carregamento de imagem / json com cache ----------

const cacheImagens = new Map<string, Promise<HTMLImageElement>>();
export const carregarImagem = (src: string) => {
  const url = arquivo(src);
  if (!cacheImagens.has(url)) {
    cacheImagens.set(
      url,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`DocumentaryStyle: não carregou a imagem ${src}`));
        img.src = url;
      }),
    );
  }
  return cacheImagens.get(url)!;
};

const cacheJson = new Map<string, Promise<unknown>>();
export const carregarJson = <T,>(src: string): Promise<T> => {
  const url = arquivo(src);
  if (!cacheJson.has(url)) {
    cacheJson.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`DocumentaryStyle: não carregou ${src} (${r.status})`);
        return r.json();
      }),
    );
  }
  return cacheJson.get(url) as Promise<T>;
};

/** Carrega algo assíncrono uma vez, segurando a renderização até terminar. */
export function useRecurso<T>(chave: string | null, carregar: () => Promise<T>): T | null {
  const [valor, setValor] = useState<T | null>(null);
  const [handle] = useState(() => (chave ? delayRender(`DocumentaryStyle: ${chave}`) : null));
  useEffect(() => {
    if (!chave || handle === null) return;
    let vivo = true;
    carregar()
      .then((v) => {
        if (vivo) setValor(v);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, handle]);
  return valor;
}

// ---------- fundo e textura ----------

// O fundo das cenas (por tema) fica em Fundos.tsx.
export { FundoDoc, OrnamentoCartao, OrnamentoTela } from './Fundos';

/** Granulação de filme + vinheta. Coloque por cima de vídeo e foto de arquivo. */
export const Granulacao: React.FC<{ intensidade?: number; vinheta?: boolean }> = ({
  intensidade = 0.07,
  vinheta = true,
}) => {
  const frame = useCurrentFrame();
  const id = `grao-${frame % 8}`;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: intensidade, mixBlendMode: 'overlay' }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 8} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
      {vinheta && (
        <AbsoluteFill
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }}
        />
      )}
    </AbsoluteFill>
  );
};
