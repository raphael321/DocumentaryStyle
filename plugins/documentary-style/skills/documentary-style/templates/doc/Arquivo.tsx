import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useTema } from './tema';
import { Granulacao, OrnamentoCartao, arquivo, mola } from './base';
import { Credito, Legenda } from './Textos';

type Enquadramento = { escala: number; x: number; y: number };

/**
 * Vídeo ou foto de arquivo ocupando a TELA INTEIRA.
 * - modo 'cobrir': corta as bordas para preencher 16:9 (padrão)
 * - modo 'desfocado': material 4:3 ou vertical inteiro no centro, com o próprio material desfocado preenchendo atrás
 * - modo 'painel': o material vai num painel 16:9 sobre o fundo do tema, com etiqueta (estilo investigação).
 *   Use para variar o ritmo sem tirar o material real da tela. Ponha `fundo: 'doc'` na cena.
 * - kenBurns: movimento lento de câmera (foto e vídeo). Padrão: aproximação suave.
 */
export const Arquivo: React.FC<{
  src: string;
  tipo?: 'video' | 'foto';
  inicioSeg?: number;
  volume?: number;
  pb?: boolean;
  modo?: 'cobrir' | 'desfocado' | 'painel';
  /** texto da etiqueta no modo painel (ex.: 'ARQUIVO · FEB, 1945') */
  etiqueta?: string;
  kenBurns?: { de: Enquadramento; para: Enquadramento } | false;
  legenda?: { local: string; data?: string };
  credito?: string;
  graos?: number;
}> = ({
  src,
  tipo,
  inicioSeg = 0,
  volume = 0,
  pb = false,
  modo = 'cobrir',
  kenBurns,
  legenda,
  credito,
  etiqueta,
  graos: graosProp,
}) => {
  const T = useTema();
  const graos = graosProp ?? T.graos;
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ehVideo = tipo ? tipo === 'video' : /\.(mp4|webm|mov|mkv)$/i.test(src);
  const kb =
    kenBurns === false
      ? null
      : kenBurns ?? { de: { escala: 1.0, x: 0, y: 0 }, para: T.ritmo === 'dinamico' ? { escala: 1.16, x: -1.5, y: -1.5 } : { escala: 1.06, x: 0, y: -0.8 } };
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  const escala = kb ? kb.de.escala + (kb.para.escala - kb.de.escala) * p : 1;
  const x = kb ? kb.de.x + (kb.para.x - kb.de.x) * p : 0;
  const y = kb ? kb.de.y + (kb.para.y - kb.de.y) * p : 0;
  const filtro = pb ? 'grayscale(1) contrast(1.08)' : T.filtroArquivo;

  const midia = (fit: 'cover' | 'contain', extra: React.CSSProperties = {}) =>
    ehVideo ? (
      <OffthreadVideo
        src={arquivo(src)}
        trimBefore={Math.round(inicioSeg * fps)}
        volume={volume}
        muted={volume === 0}
        style={{ width: '100%', height: '100%', objectFit: fit, filter: filtro, ...extra }}
      />
    ) : (
      <Img src={arquivo(src)} style={{ width: '100%', height: '100%', objectFit: fit, filter: filtro, ...extra }} />
    );

  if (modo === 'painel') {
    const W = 1440, H = 810;
    const flash = interpolate(frame, [0, 4], [0.7, 0], { extrapolateRight: 'clamp' });
    const entra = mola(frame, fps, 0, 140, 18);
    return (
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: (1920 - W) / 2,
            top: (1080 - H) / 2 + 10,
            width: W,
            height: H,
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
            background: '#000',
            overflow: 'hidden',
            opacity: Math.min(1, entra * 1.5),
            transform: `scale(${0.97 + entra * 0.03})`,
          }}
        >
          <AbsoluteFill style={{ transform: `scale(${escala}) translate(${x}%, ${y}%)` }}>{midia('cover')}</AbsoluteFill>
          <Granulacao intensidade={graos} />
          <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
        </div>
        {etiqueta && (
          <div
            style={{
              position: 'absolute',
              left: (1920 - W) / 2,
              top: (1080 - H) / 2 - 30,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 17,
              letterSpacing: 1.5,
              color: 'rgba(236,234,228,0.7)',
              opacity: entra,
            }}
          >
            <div style={{ width: 6, height: 13, background: T.cor.vermelho }} />
            {etiqueta}
          </div>
        )}
        {legenda && <Legenda local={legenda.local} data={legenda.data} />}
        {credito && <Credito texto={credito} />}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {modo === 'desfocado' && (
        <AbsoluteFill style={{ transform: 'scale(1.15)' }}>{midia('cover', { filter: `${filtro} blur(28px) brightness(0.55)` })}</AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${escala}) translate(${x}%, ${y}%)` }}>
        {midia(modo === 'desfocado' ? 'contain' : 'cover')}
      </AbsoluteFill>
      <Granulacao intensidade={graos} />
      {legenda && <Legenda local={legenda.local} data={legenda.data} />}
      {credito && <Credito texto={credito} />}
    </AbsoluteFill>
  );
};

/**
 * Foto dentro de moldura de papel (com legenda), entrando sobre o fundo azul-noite ou sobre o mapa.
 * Use para retratos, documentos fotografados e fotos que não aguentam tela cheia.
 */
export const FotoMoldura: React.FC<{
  src: string;
  legenda?: string;
  sub?: string;
  credito?: string;
  rotacao?: number;
  largura?: number;
  x?: number; // posição do centro em % da tela
  y?: number;
  pb?: boolean;
  aos?: number;
}> = ({ src, legenda, sub, credito, rotacao = -2, largura = 760, x = 50, y = 50, pb = false, aos = 0.05 }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrada = mola(frame, fps, aos, 130, 15);
  const deriva = interpolate(frame, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: largura,
          transform: `translate(-50%, -50%) translateY(${(1 - entrada) * 60}px) rotate(${rotacao + (1 - entrada) * 4}deg) scale(${0.94 + entrada * 0.06 + deriva * 0.03})`,
          opacity: entrada,
          background: T.cor.papel,
          padding: '18px 18px 0',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          border: `1px solid ${T.cor.papelBorda}`,
        }}
      >
        <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#222' }}>
          <Img
            src={arquivo(src)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: pb ? 'grayscale(1) contrast(1.1)' : T.filtroArquivo }}
          />
        </div>
        <div style={{ padding: '14px 6px 16px', textAlign: 'center' }}>
          {legenda && (
            <div style={{ fontFamily: T.fonte.titulo, fontVariant: 'small-caps', letterSpacing: 2, fontSize: 30, color: T.cor.tinta }}>
              {legenda}
            </div>
          )}
          {sub && <div style={{ fontFamily: T.fonte.serif, fontStyle: 'italic', fontSize: 22, color: T.cor.tintaSuave }}>{sub}</div>}
          {credito && (
            <div style={{ fontFamily: T.fonte.sans, fontSize: 13, color: T.cor.tintaSuave, marginTop: 6, textAlign: 'right' }}>{credito}</div>
          )}
        </div>
        <OrnamentoCartao />
      </div>
    </AbsoluteFill>
  );
};
