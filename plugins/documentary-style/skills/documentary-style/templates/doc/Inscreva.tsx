// DocumentaryStyle: chamada de "curtir + inscreva-se + sininho" com cursor animado.
// Entra sozinha no DocVideo (logo depois do gancho, no meio dos vídeos longos e perto do fim).
// Ícones desenhados aqui mesmo (sem logos de terceiros), cores e fontes do tema.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { mola, surgir } from './base';
import { useTema } from './tema';

/** Duração da animação, em segundos. */
export const DURACAO_INSCREVA = 6.2;

/** Tempos (s, dentro da animação) dos cliques: usados também pelos efeitos sonoros. */
export const TEMPOS_INSCREVA = { entra: 0, curtir: 1.25, inscrever: 2.35, sino: 3.25, sai: DURACAO_INSCREVA - 0.55 };

const Polegar: React.FC<{ cheio: number; cor: string }> = ({ cheio, cor }) => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <path
      d="M2 10h4v11H2zM8 21h9.2a2 2 0 0 0 1.95-1.56l1.6-7A2 2 0 0 0 18.8 10H14l.9-4.3a1.6 1.6 0 0 0-.43-1.47L13.6 3.4 8 9.2z"
      fill={cheio > 0.5 ? cor : 'none'}
      stroke={cheio > 0.5 ? cor : 'rgba(255,255,255,0.92)'}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </svg>
);

const Sino: React.FC<{ ativo: number; giro: number }> = ({ ativo, giro }) => (
  <svg width={34} height={34} viewBox="0 0 24 24" style={{ transform: `rotate(${giro}deg)`, transformOrigin: '50% 10%' }}>
    <path
      d="M12 2.5a1.5 1.5 0 0 1 1.5 1.5v.6A6 6 0 0 1 18 10.5v4.2l1.8 2.3v1H4.2v-1L6 14.7v-4.2a6 6 0 0 1 4.5-5.9V4A1.5 1.5 0 0 1 12 2.5zM9.6 19.5h4.8a2.4 2.4 0 0 1-4.8 0z"
      fill={ativo > 0.5 ? '#FFFFFF' : 'none'}
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    {ativo > 0.5 && (
      <g stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={ativo}>
        <path d="M3 7.5c.4-1.6 1.2-3 2.4-4" fill="none" />
        <path d="M21 7.5c-.4-1.6-1.2-3-2.4-4" fill="none" />
      </g>
    )}
  </svg>
);

const Cursor: React.FC = () => (
  <svg width={40} height={46} viewBox="0 0 20 23">
    <path d="M2 1l15 12.2-6.6.9 3.9 7.4-2.8 1.4-3.9-7.5L2 20z" fill="#FFFFFF" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
  </svg>
);

/** Anel que se expande no ponto do clique. */
const Onda: React.FC<{ t: number; aos: number; cor: string }> = ({ t, aos, cor }) => {
  const k = interpolate(t, [aos, aos + 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (k <= 0 || k >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 90,
        height: 90,
        marginLeft: -45,
        marginTop: -45,
        borderRadius: '50%',
        border: `3px solid ${cor}`,
        transform: `scale(${0.3 + k * 1.1})`,
        opacity: 1 - k,
      }}
    />
  );
};

/**
 * Botões de curtir, inscrever-se e sininho, com um cursor que clica em cada um.
 * Fica no canto inferior direito, acima do crédito, por ~6 s.
 */
export const BotaoInscreva: React.FC<{
  /** texto do botão antes e depois do clique */
  texto?: string;
  textoInscrito?: string;
  /** chamada pequena acima dos botões (ex.: 'Se esta história te prendeu') */
  chamada?: string;
  /** cor do botão de inscrição (padrão vermelho; troque pela cor do canal se quiser) */
  cor?: string;
  posicao?: 'direita' | 'centro';
}> = ({ texto = 'INSCREVA-SE', textoInscrito = 'INSCRITO', chamada, cor = '#E0262B', posicao = 'direita' }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const P = TEMPOS_INSCREVA;

  const entra = mola(frame, fps, P.entra, 140, 15);
  const sai = interpolate(t, [P.sai, P.sai + 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const curtido = t >= P.curtir ? 1 : 0;
  const inscrito = t >= P.inscrever ? 1 : 0;
  const sinoAtivo = t >= P.sino ? 1 : 0;
  const pulo = (aos: number) => (t >= aos ? 1 + 0.18 * Math.sin(Math.min(1, (t - aos) / 0.35) * Math.PI) : 1);
  const giro = t >= P.sino ? 22 * Math.sin((t - P.sino) * 26) * Math.exp(-(t - P.sino) * 3.2) : 0;

  // posições (px, relativas à caixa) dos três alvos do cursor
  const alvos = [
    { x: 46, y: 46 }, // curtir
    { x: 217, y: 46 }, // inscrever
    { x: 388, y: 46 }, // sino
  ];
  const caminho = (tt: number) => {
    const pts = [
      { t: 0.35, x: 470, y: 150 },
      { t: P.curtir - 0.12, ...alvos[0] },
      { t: P.curtir + 0.25, ...alvos[0] },
      { t: P.inscrever - 0.12, ...alvos[1] },
      { t: P.inscrever + 0.25, ...alvos[1] },
      { t: P.sino - 0.12, ...alvos[2] },
      { t: P.sino + 0.6, ...alvos[2] },
      { t: P.sai, x: 500, y: 160 },
    ];
    const x = interpolate(tt, pts.map((p) => p.t), pts.map((p) => p.x), { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const y = interpolate(tt, pts.map((p) => p.t), pts.map((p) => p.y), { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return { x, y };
  };
  const c = caminho(t);
  const aperta = [P.curtir, P.inscrever, P.sino].some((a) => t >= a - 0.04 && t < a + 0.1) ? 0.85 : 1;
  const cursorVis = surgir(frame, fps, 0.3, 0.3) * (1 - sai);

  const botao: React.CSSProperties = {
    position: 'relative',
    height: 64,
    borderRadius: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: T.fonte.sans,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#FFFFFF',
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 92,
          ...(posicao === 'centro' ? { left: '50%', marginLeft: -217 } : { right: 70 }),
          width: 434,
          opacity: 1 - sai,
          transform: `translateY(${(1 - entra) * 60 + sai * 30}px) scale(${0.92 + 0.08 * entra})`,
          transformOrigin: 'bottom right',
        }}
      >
        {chamada && (
          <div
            style={{
              fontFamily: T.fonte.sans,
              fontSize: 22,
              fontWeight: 600,
              color: T.cor.branco,
              textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              marginBottom: 12,
              marginLeft: 6,
              opacity: surgir(frame, fps, 0.2, 0.4),
            }}
          >
            {chamada}
          </div>
        )}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 46,
            background: 'rgba(12,12,14,0.72)',
            border: `1.5px solid ${T.cor.ouro}55`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* curtir */}
          <div style={{ ...botao, width: 64, background: curtido ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)', transform: `scale(${pulo(P.curtir)})` }}>
            <Polegar cheio={curtido} cor={T.cor.ouro} />
            <Onda t={t} aos={P.curtir} cor={T.cor.ouro} />
          </div>
          {/* inscrever */}
          <div
            style={{
              ...botao,
              width: 250,
              fontSize: 24,
              background: inscrito ? 'rgba(255,255,255,0.14)' : cor,
              color: inscrito ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
              transform: `scale(${pulo(P.inscrever)})`,
              boxShadow: inscrito ? 'none' : `0 0 24px ${cor}66`,
            }}
          >
            {inscrito ? `✓ ${textoInscrito}` : texto}
            <Onda t={t} aos={P.inscrever} cor="#FFFFFF" />
          </div>
          {/* sino */}
          <div style={{ ...botao, width: 64, background: sinoAtivo ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)', transform: `scale(${pulo(P.sino)})` }}>
            <Sino ativo={sinoAtivo} giro={giro} />
            <Onda t={t} aos={P.sino} cor="#FFFFFF" />
          </div>
        </div>
        {/* cursor */}
        <div style={{ position: 'absolute', left: c.x, top: c.y + (chamada ? 46 : 0), opacity: cursorVis, transform: `scale(${aperta})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))' }}>
          <Cursor />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Onde a chamada aparece no plano. */
export type Inscreva =
  | false
  | {
      /** instantes (s do vídeo) em que entra. Padrão: depois do gancho, no meio (vídeos > 6 min) e perto do fim */
      momentos?: number[];
      texto?: string;
      textoInscrito?: string;
      chamada?: string;
      cor?: string;
      posicao?: 'direita' | 'centro';
    };

/** Calcula os momentos padrão: logo depois da 1ª cena (gancho), a cada ~6 min e ~25 s antes do fim. */
export const momentosInscreva = (duracoesCenas: number[], opc?: Inscreva): number[] => {
  if (opc === false) return [];
  if (opc?.momentos) return opc.momentos;
  const total = duracoesCenas.reduce((s, d) => s + d, 0);
  if (total < 20) return [];
  const out: number[] = [];
  const gancho = Math.min(duracoesCenas[0] ?? 15, 45) + 1.5;
  out.push(gancho);
  for (let m = 360; m < total - 90; m += 360) out.push(m);
  const fim = Math.max(gancho + 30, total - 25);
  if (fim + DURACAO_INSCREVA <= total) out.push(fim);
  return out;
};
