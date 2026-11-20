import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useTema } from './tema';
import { arquivo, mola, surgir } from './base';
import { Ponto, amostrarCurva, caminhoTela, cortarLinha } from './geo';

export type No = {
  id: string;
  x: number; // centro em % da largura
  y: number; // centro em % da altura
  titulo: string;
  sub?: string;
  foto?: string;
  aos?: number;
  rotacao?: number;
  destaque?: boolean;
};
export type Ligacao = { de: string; para: string; rotulo?: string; aos?: number; cor?: string; dur?: number };

/**
 * QUADRO DE LIGAÇÕES: liga fatos, pessoas, lugares e documentos com linhas, como um quadro de investigação.
 * Os cartões entram um a um; as linhas se desenham entre eles com um rótulo no meio ("ordenou", "financiou", "3 dias depois").
 * `foco` aproxima a câmera de um cartão (id) a partir de um tempo.
 */
export const QuadroConexoes: React.FC<{
  nos: No[];
  ligacoes: Ligacao[];
  foco?: { id: string; aos: number; zoom?: number }[];
}> = ({ nos, ligacoes, foco = [] }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pos = new Map(nos.map((n) => [n.id, [(n.x / 100) * width, (n.y / 100) * height] as Ponto]));

  // câmera: interpola entre os focos
  let camX = width / 2, camY = height / 2, zoom = 1;
  const seg = frame / fps;
  for (const f of foco) {
    const p = interpolate(seg, [f.aos, f.aos + 1.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (p <= 0) continue;
    const alvo = f.id === '*' ? [width / 2, height / 2] : pos.get(f.id) ?? [width / 2, height / 2];
    const z = f.id === '*' ? 1 : f.zoom ?? 1.6;
    camX += (alvo[0] - camX) * p;
    camY += (alvo[1] - camY) * p;
    zoom += (z - zoom) * p;
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${width / 2 - camX * zoom}px, ${height / 2 - camY * zoom}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <svg width={width} height={height} style={{ position: 'absolute', overflow: 'visible' }}>
          {ligacoes.map((l, i) => {
            const a = pos.get(l.de), b = pos.get(l.para);
            if (!a || !b) return null;
            const p = surgir(frame, fps, l.aos ?? 0, l.dur ?? 0.9);
            if (p <= 0) return null;
            const pts = amostrarCurva([a, b], 0.08);
            const { pontos } = cortarLinha(pts, p);
            const meio = pts[Math.floor(pts.length / 2)];
            const cor = l.cor ?? T.cor.vermelho;
            return (
              <g key={i}>
                <path d={caminhoTela(pontos)} stroke="rgba(0,0,0,0.5)" strokeWidth={7} fill="none" strokeLinecap="round" />
                <path d={caminhoTela(pontos)} stroke={cor} strokeWidth={4} fill="none" strokeLinecap="round" />
                {l.rotulo && p > 0.55 && (
                  <g transform={`translate(${meio[0]} ${meio[1]})`} opacity={Math.min(1, (p - 0.55) * 3)}>
                    <rect x={-(l.rotulo.length * 7.6 + 18)} y={-19} width={l.rotulo.length * 15.2 + 36} height={38} rx={19} fill={T.cor.fundo} stroke={cor} strokeWidth={2} />
                    <text x={0} y={7} textAnchor="middle" fontFamily={T.fonte.sans} fontWeight={700} fontSize={21} fill={T.cor.branco}>
                      {l.rotulo}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        {nos.map((n) => {
          const [x, y] = pos.get(n.id)!;
          const p = mola(frame, fps, n.aos ?? 0, 150, 14);
          if (p <= 0.001) return null;
          const larg = n.foto ? 250 : 300;
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: larg,
                transform: `translate(-50%, -50%) rotate(${n.rotacao ?? 0}deg) scale(${Math.min(1.1, p)})`,
                opacity: Math.min(1, p),
                background: T.cor.papel,
                border: `1px solid ${T.cor.papelBorda}`,
                boxShadow: n.destaque ? `0 0 0 4px ${T.cor.ouro}, 0 18px 40px rgba(0,0,0,0.6)` : '0 18px 40px rgba(0,0,0,0.6)',
                padding: n.foto ? '12px 12px 10px' : '18px 18px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'absolute', left: '50%', top: -9, width: 18, height: 18, borderRadius: '50%', background: T.cor.vermelho, transform: 'translateX(-50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.6)' }} />
              {n.foto && (
                <div style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#333', marginBottom: 10 }}>
                  <Img src={arquivo(n.foto)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.08)' }} />
                </div>
              )}
              <div style={{ fontFamily: T.fonte.titulo, fontVariant: 'small-caps', letterSpacing: 1.5, fontWeight: 600, fontSize: 28, color: T.cor.tinta, lineHeight: 1.1 }}>{n.titulo}</div>
              {n.sub && <div style={{ fontFamily: T.fonte.serif, fontStyle: 'italic', fontSize: 20, color: T.cor.tintaSuave, marginTop: 4 }}>{n.sub}</div>}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
