import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR, FONTE } from './tema';
import { Granulacao, arquivo, mola } from './base';
import { Credito, Legenda } from './Textos';

type Enquadramento = { escala: number; x: number; y: number };

/**
 * Vídeo ou foto de arquivo ocupando a TELA INTEIRA.
 * - modo 'cobrir': corta as bordas para preencher 16:9 (padrão)
 * - modo 'desfocado': material 4:3 ou vertical inteiro no centro, com o próprio material desfocado preenchendo atrás
 * - kenBurns: movimento lento de câmera (foto e vídeo). Padrão: aproximação suave.
 */
export const Arquivo: React.FC<{
  src: string;
  tipo?: 'video' | 'foto';
  inicioSeg?: number;
  volume?: number;
  pb?: boolean;
  modo?: 'cobrir' | 'desfocado';
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
  graos = 0.07,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ehVideo = tipo ? tipo === 'video' : /\.(mp4|webm|mov|mkv)$/i.test(src);
  const kb = kenBurns === false ? null : kenBurns ?? { de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.08, x: 0, y: -1 } };
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  const escala = kb ? kb.de.escala + (kb.para.escala - kb.de.escala) * p : 1;
  const x = kb ? kb.de.x + (kb.para.x - kb.de.x) * p : 0;
  const y = kb ? kb.de.y + (kb.para.y - kb.de.y) * p : 0;
  const filtro = pb ? 'grayscale(1) contrast(1.08)' : 'saturate(0.92) contrast(1.04)';

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
          background: COR.papel,
          padding: '18px 18px 0',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          border: `1px solid ${COR.papelBorda}`,
        }}
      >
        <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#222' }}>
          <Img
            src={arquivo(src)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: pb ? 'grayscale(1) contrast(1.1)' : 'saturate(0.9)' }}
          />
        </div>
        <div style={{ padding: '14px 6px 16px', textAlign: 'center' }}>
          {legenda && (
            <div style={{ fontFamily: FONTE.serif, fontVariant: 'small-caps', letterSpacing: 2, fontSize: 30, color: COR.tinta }}>
              {legenda}
            </div>
          )}
          {sub && <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: 22, color: COR.tintaSuave }}>{sub}</div>}
          {credito && (
            <div style={{ fontFamily: FONTE.sans, fontSize: 13, color: COR.tintaSuave, marginTop: 6, textAlign: 'right' }}>{credito}</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
