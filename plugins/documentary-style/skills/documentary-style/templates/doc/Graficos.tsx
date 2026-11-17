import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR, FONTE, SOMBRA_TEXTO } from './tema';
import { mola, surgir } from './base';

const Titulo: React.FC<{ texto: string; p: number }> = ({ texto, p }) => (
  <div style={{ textAlign: 'center', opacity: p }}>
    <div style={{ width: 70 * p, height: 3, background: COR.ouro, margin: '0 auto 18px' }} />
    <div style={{ fontFamily: FONTE.serif, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 5, fontSize: 38, color: COR.branco }}>{texto}</div>
  </div>
);

const formatar = (v: number, casas: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Comparação em barras horizontais (ex.: renda por pessoa, efetivo de tropas, mortos). */
export const ComparacaoBarras: React.FC<{
  titulo: string;
  itens: { rotulo: string; valor: number; cor?: string; prefixo?: string; sufixo?: string }[];
  fonte?: string;
  casas?: number;
  maximo?: number;
}> = ({ titulo, itens, fonte, casas = 0, maximo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = maximo ?? Math.max(...itens.map((i) => i.valor));
  const cores = [COR.vermelho, COR.azul, COR.ouro, COR.verde];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1100 }}>
        <Titulo texto={titulo} p={surgir(frame, fps, 0.1, 0.5)} />
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 34 }}>
          {itens.map((it, i) => {
            const p = surgir(frame, fps, 0.6 + i * 0.35, 1.1);
            const largura = (it.valor / max) * 640 * p;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: Math.min(1, p * 3) }}>
                <div style={{ width: 300, textAlign: 'right', fontFamily: FONTE.sans, fontWeight: 700, fontSize: 30, color: COR.branco }}>{it.rotulo}</div>
                <div
                  style={{
                    width: largura,
                    height: 46,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${it.cor ?? cores[i % 4]} 0%, ${it.cor ?? cores[i % 4]} 80%, rgba(255,255,255,0.75) 100%)`,
                    boxShadow: `0 0 24px ${it.cor ?? cores[i % 4]}66`,
                  }}
                />
                <div style={{ fontFamily: FONTE.sans, fontWeight: 800, fontSize: 40, color: COR.branco, textShadow: SOMBRA_TEXTO }}>
                  {it.prefixo ?? ''}
                  {formatar(it.valor * p, casas)}
                  {it.sufixo ?? ''}
                </div>
              </div>
            );
          })}
        </div>
        {fonte && (
          <div style={{ marginTop: 44, textAlign: 'center', fontFamily: FONTE.sans, fontSize: 18, color: 'rgba(246,242,233,0.6)', opacity: surgir(frame, fps, 1.4, 0.5) }}>
            {fonte}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Número grande de impacto, com rótulo em cima e explicação embaixo (ex.: "14.779", "~16x"). */
export const NumeroGrande: React.FC<{
  rotulo: string;
  numero: number | string;
  prefixo?: string;
  sufixo?: string;
  sub?: string;
  contarDe?: number;
  cor?: string;
}> = ({ rotulo, numero, prefixo = '', sufixo = '', sub, contarDe = 0, cor = COR.branco }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = surgir(frame, fps, 0.4, 1.4);
  const texto =
    typeof numero === 'number'
      ? `${prefixo}${Math.round(interpolate(p, [0, 1], [contarDe, numero])).toLocaleString('pt-BR')}${sufixo}`
      : `${prefixo}${numero}${sufixo}`;
  const entrada = mola(frame, fps, 0.3, 140, 16);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Titulo texto={rotulo} p={surgir(frame, fps, 0, 0.5)} />
      <div
        style={{
          fontFamily: FONTE.sans,
          fontWeight: 800,
          fontSize: 150,
          color: cor,
          margin: '18px 0 6px',
          transform: `scale(${0.85 + entrada * 0.15})`,
          opacity: Math.min(1, entrada),
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 6px 30px rgba(0,0,0,0.6)',
        }}
      >
        {texto}
      </div>
      <div style={{ width: 600 * surgir(frame, fps, 0.6, 0.6), height: 3, background: COR.ouro }} />
      {sub && (
        <div style={{ marginTop: 22, fontFamily: FONTE.sans, fontSize: 24, color: 'rgba(246,242,233,0.72)', opacity: surgir(frame, fps, 1.0, 0.5), maxWidth: 1100, textAlign: 'center' }}>
          {sub}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Linha do tempo: régua de anos deslizando com o ano grande em cima.
 * modo 'regua' = no topo, sobre fundo ou vídeo. modo 'selo' = só ano + lugar no topo (para pôr sobre vídeo).
 */
export const LinhaDoTempo: React.FC<{
  de: number;
  para: number;
  inicio?: number;
  fim?: number;
  passo?: number;
  local?: string;
  modo?: 'regua' | 'selo';
  dur?: number;
}> = ({ de, para, inicio, fim, passo, local, modo = 'regua', dur = 1.6 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const p = surgir(frame, fps, 0.2, dur);
  const anoAtual = de + (para - de) * p;
  const entrada = surgir(frame, fps, 0, 0.4);
  const a0 = inicio ?? Math.min(de, para) - 10;
  const a1 = fim ?? Math.max(de, para) + 10;
  const pas = passo ?? (a1 - a0 > 60 ? 10 : 5);
  const pxPorAno = 34;
  const marcas: number[] = [];
  for (let a = Math.ceil(a0); a <= a1; a++) marcas.push(a);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: entrada }}>
      <div style={{ position: 'absolute', top: 70, left: 0, width, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTE.serif, fontWeight: 600, fontSize: modo === 'selo' ? 76 : 92, color: COR.branco, textShadow: SOMBRA_TEXTO, lineHeight: 1 }}>
          {Math.round(anoAtual)}
        </div>
        {local && (
          <div style={{ marginTop: 8, fontFamily: FONTE.sans, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: COR.branco, textTransform: 'uppercase', textShadow: SOMBRA_TEXTO }}>
            {local}
          </div>
        )}
      </div>
      {modo === 'regua' && (
        <div style={{ position: 'absolute', top: 205, left: width / 2 - 520, width: 1040, height: 60, overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)' }}>
          <div style={{ position: 'absolute', left: 520 - (anoAtual - a0) * pxPorAno, top: 0 }}>
            <div style={{ position: 'absolute', top: 20, left: 0, width: (a1 - a0) * pxPorAno, height: 1, background: 'rgba(246,242,233,0.5)' }} />
            {marcas.map((a) => {
              const grande = a % pas === 0;
              return (
                <div key={a} style={{ position: 'absolute', left: (a - a0) * pxPorAno, top: grande ? 10 : 15 }}>
                  <div style={{ width: 1, height: grande ? 20 : 10, background: 'rgba(246,242,233,0.7)' }} />
                  {grande && (
                    <div style={{ position: 'absolute', top: 24, left: 0, transform: 'translateX(-50%)', fontFamily: FONTE.sans, fontSize: 16, color: 'rgba(246,242,233,0.75)' }}>{a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', left: 520 - 7, top: 4, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `12px solid ${COR.ouro}` }} />
        </div>
      )}
    </AbsoluteFill>
  );
};
