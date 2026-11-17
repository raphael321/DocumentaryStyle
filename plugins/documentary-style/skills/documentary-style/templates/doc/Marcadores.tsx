// Marcadores desenhados em coordenadas de TELA (não crescem com o zoom do mapa).
import React from 'react';
import { Img } from 'remotion';
import { COR, FONTE, SOMBRA_TEXTO } from './tema';
import { arquivo } from './base';
import { Ponto, caminhoTela, cortarLinha } from './geo';

export type NomeIcone = 'navio' | 'aviao' | 'tanque' | 'soldado' | 'caminhao' | 'submarino';

/** Silhuetas simples, desenhadas apontando para a DIREITA, numa caixa de 64x32 centrada em 0,0. */
const ICONES: Record<NomeIcone, React.ReactNode> = {
  navio: (
    <g>
      <path d="M-30 4 L30 4 L22 14 L-24 14 Z" fill="#2b2b2b" />
      <rect x="-14" y="-6" width="22" height="10" fill="#f1efe8" />
      <rect x="-8" y="-14" width="10" height="8" fill="#f1efe8" />
      <rect x="10" y="-4" width="4" height="8" fill="#c8372d" />
    </g>
  ),
  submarino: (
    <g>
      <ellipse cx="0" cy="4" rx="32" ry="7" fill="#3a4148" />
      <rect x="-6" y="-8" width="12" height="9" rx="2" fill="#3a4148" />
      <rect x="-1" y="-15" width="2" height="8" fill="#3a4148" />
    </g>
  ),
  aviao: (
    <g fill="#f1efe8" stroke="#1d1a16" strokeWidth="1.2">
      <path d="M30 0 L-24 -3 L-30 -12 L-34 -12 L-30 0 L-34 12 L-30 12 L-24 3 Z" />
      <path d="M6 -2 L-8 -24 L-14 -24 L-6 -2 Z M6 2 L-8 24 L-14 24 L-6 2 Z" />
    </g>
  ),
  tanque: (
    <g>
      <rect x="-28" y="2" width="56" height="12" rx="6" fill="#3d4a2a" />
      <rect x="-20" y="-8" width="34" height="11" rx="2" fill="#52613a" />
      <rect x="12" y="-5" width="26" height="4" fill="#3d4a2a" />
    </g>
  ),
  caminhao: (
    <g>
      <rect x="-28" y="-10" width="38" height="20" fill="#52613a" />
      <rect x="10" y="-4" width="16" height="14" fill="#3d4a2a" />
      <circle cx="-18" cy="12" r="5" fill="#222" />
      <circle cx="16" cy="12" r="5" fill="#222" />
    </g>
  ),
  soldado: (
    <g fill="#e9e3d2">
      <circle cx="0" cy="-12" r="6" />
      <rect x="-6" y="-5" width="12" height="18" rx="3" />
    </g>
  ),
};

export const Icone: React.FC<{
  nome: NomeIcone | string;
  x: number;
  y: number;
  angulo: number;
  escala?: number;
  /** selo claro com borda colorida atrás do ícone: sem ele, tanque/caminhão somem em cima do satélite */
  selo?: boolean;
  cor?: string;
}> = ({ nome, x, y, angulo, escala = 1, selo = nome === 'tanque' || nome === 'caminhao' || nome === 'soldado', cor = COR.ouro }) => {
  const graus = (angulo * 180) / Math.PI;
  const espelhar = Math.abs(graus) > 90; // mantém navio/tanque "em pé" quando vai para a esquerda
  const rot = espelhar ? graus - 180 : graus;
  const conteudo =
    nome in ICONES ? (
      ICONES[nome as NomeIcone]
    ) : (
      <image href={arquivo(nome)} x={-32} y={-32} width={64} height={64} />
    );
  const terrestre = nome === 'tanque' || nome === 'caminhao' || nome === 'soldado' || nome === 'navio' || nome === 'submarino';
  if (selo) {
    return (
      <g transform={`translate(${x} ${y}) scale(${escala})`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.75))' }}>
        <circle r={33} fill="#f1efe8" stroke={cor} strokeWidth={4} />
        <g transform={`scale(${espelhar ? -0.78 : 0.78} 0.78) translate(-4 -2)`}>{conteudo}</g>
      </g>
    );
  }
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${terrestre ? rot * 0.25 : rot}) scale(${(espelhar ? -1 : 1) * escala} ${escala})`}
      style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.7))' }}
    >
      {conteudo}
    </g>
  );
};

/** Linha (tracejada ou contínua) que se desenha até a fração p, opcionalmente levando um ícone na ponta. */
export const LinhaAnimada: React.FC<{
  pontos: Ponto[];
  p: number;
  cor?: string;
  largura?: number;
  tracejado?: boolean;
  icone?: string;
  ponta?: boolean;
  selo?: boolean;
}> = ({ pontos, p, cor = COR.branco, largura = 3, tracejado = true, icone, ponta = false, selo }) => {
  if (p <= 0 || pontos.length < 2) return null;
  const { pontos: parte, angulo } = cortarLinha(pontos, p);
  const d = caminhoTela(parte);
  const fim = parte[parte.length - 1];
  const cab = largura * 3.2;
  return (
    <g>
      {ponta && <path d={d} stroke="rgba(0,0,0,0.55)" strokeWidth={largura + 5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <path
        d={d}
        stroke={cor}
        strokeWidth={largura}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={tracejado ? `${largura * 3} ${largura * 3}` : undefined}
        style={{ filter: ponta ? undefined : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
      />
      {ponta && (
        <polygon
          points={`${cab * 1.4},0 ${-cab * 0.6},${-cab} ${-cab * 0.6},${cab}`}
          fill={cor}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={2}
          transform={`translate(${fim[0]} ${fim[1]}) rotate(${(angulo * 180) / Math.PI})`}
        />
      )}
      {icone && p < 1.0001 && <Icone nome={icone} x={fim[0]} y={fim[1]} angulo={angulo} selo={selo} cor={cor} />}
    </g>
  );
};

/** Pino de lugar: ponto com pulso ou círculo com bandeira/foto, e rótulo. */
export const Pino: React.FC<{
  x: number;
  y: number;
  p: number;
  rotulo?: string;
  sub?: string;
  cor?: string;
  bandeira?: string;
  pulso?: number; // 0..1 fase do pulso
  lado?: 'baixo' | 'direita' | 'cima' | 'esquerda';
}> = ({ x, y, p, rotulo, sub, cor = COR.vermelho, bandeira, pulso = 0, lado = 'baixo' }) => {
  if (p <= 0) return null;
  const tam = bandeira ? 58 : 18;
  const posTexto: React.CSSProperties =
    lado === 'direita'
      ? { left: x + tam / 2 + 12, top: y, transform: 'translateY(-50%)', textAlign: 'left' }
      : lado === 'esquerda'
        ? { left: x - tam / 2 - 12, top: y, transform: 'translate(-100%, -50%)', textAlign: 'right' }
        : lado === 'cima'
          ? { left: x, top: y - tam / 2 - 10, transform: 'translate(-50%, -100%)', textAlign: 'center' }
          : { left: x, top: y + tam / 2 + 8, transform: 'translateX(-50%)', textAlign: 'center' };
  return (
    <>
      {!bandeira && pulso > 0 && (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 18 + pulso * 70,
            height: 18 + pulso * 70,
            borderRadius: '50%',
            border: `3px solid ${cor}`,
            opacity: (1 - pulso) * 0.9 * p,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: tam,
          height: tam,
          borderRadius: '50%',
          background: bandeira ? '#fff' : cor,
          border: `${bandeira ? 4 : 3}px solid #fff`,
          boxShadow: '0 3px 10px rgba(0,0,0,0.7)',
          transform: `translate(-50%, -50%) scale(${p})`,
          overflow: 'hidden',
        }}
      >
        {bandeira && <Img src={arquivo(bandeira)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      {rotulo && (
        <div style={{ position: 'absolute', whiteSpace: 'nowrap', opacity: p, ...posTexto }}>
          <div style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: 27, color: COR.branco, textShadow: SOMBRA_TEXTO }}>{rotulo}</div>
          {sub && (
            <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: 21, color: 'rgba(246,242,233,0.9)', textShadow: SOMBRA_TEXTO }}>
              {sub}
            </div>
          )}
        </div>
      )}
    </>
  );
};

/** Medalhão: foto redonda de uma pessoa presa no mapa, com anel colorido e nome. */
export const Medalhao: React.FC<{ x: number; y: number; p: number; foto: string; nome?: string; cor?: string; tamanho?: number; pb?: boolean }> = ({
  x,
  y,
  p,
  foto,
  nome,
  cor = COR.vermelho,
  tamanho = 118,
  pb = true,
}) => {
  if (p <= 0) return null;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: tamanho,
          height: tamanho,
          borderRadius: '50%',
          border: `5px solid #fff`,
          boxShadow: `0 0 0 6px ${cor}, 0 8px 22px rgba(0,0,0,0.7)`,
          overflow: 'hidden',
          transform: `translate(-50%, -50%) scale(${p})`,
          background: '#333',
        }}
      >
        <Img src={arquivo(foto)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: pb ? 'grayscale(1) contrast(1.1)' : undefined }} />
      </div>
      {nome && (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y + tamanho / 2 + 16,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: FONTE.serif,
            fontVariant: 'small-caps',
            letterSpacing: 2,
            fontSize: 28,
            color: COR.branco,
            textShadow: SOMBRA_TEXTO,
            opacity: p,
          }}
        >
          {nome}
        </div>
      )}
    </>
  );
};

/** Rótulo de lugar em versalete (cidade, região, mar), com data opcional. */
export const Rotulo: React.FC<{ x: number; y: number; p: number; texto: string; sub?: string; tamanho?: number }> = ({
  x,
  y,
  p,
  texto,
  sub,
  tamanho = 34,
}) => {
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 10}px)`,
        opacity: p,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontFamily: FONTE.serif, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 4, fontSize: tamanho, color: COR.branco, textShadow: SOMBRA_TEXTO }}>
        {texto}
      </div>
      {sub && (
        <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: tamanho * 0.62, color: 'rgba(246,242,233,0.92)', textShadow: SOMBRA_TEXTO }}>{sub}</div>
      )}
    </div>
  );
};
