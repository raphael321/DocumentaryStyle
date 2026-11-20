import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR, FONTE, SOMBRA_TEXTO } from './tema';
import { mola, surgir } from './base';

/** Legenda de lugar no canto inferior esquerdo: barra dourada + LOCAL + data. */
export const Legenda: React.FC<{ local: string; data?: string; aos?: number }> = ({ local, data, aos = 0.3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barra = surgir(frame, fps, aos, 0.35);
  const texto = surgir(frame, fps, aos + 0.15, 0.45);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 260,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)',
          opacity: texto,
        }}
      />
      <div style={{ position: 'absolute', left: 84, bottom: 104, display: 'flex', alignItems: 'stretch', gap: 18 }}>
        <div style={{ width: 6, background: COR.ouro, transform: `scaleY(${barra})`, transformOrigin: 'bottom' }} />
        <div style={{ opacity: texto, transform: `translateX(${(1 - texto) * -24}px)` }}>
          <div
            style={{
              fontFamily: FONTE.sans,
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: 0.5,
              color: COR.branco,
              textTransform: 'uppercase',
              textShadow: SOMBRA_TEXTO,
              lineHeight: 1.1,
            }}
          >
            {local}
          </div>
          {data && (
            <div
              style={{
                fontFamily: FONTE.serif,
                fontStyle: 'italic',
                fontSize: 25,
                color: 'rgba(246,242,233,0.88)',
                textShadow: SOMBRA_TEXTO,
                marginTop: 2,
              }}
            >
              {data}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Crédito da fonte do material, pequeno, no canto inferior direito. Obrigatório em todo arquivo. */
export const Credito: React.FC<{ texto: string }> = ({ texto }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        right: 40,
        bottom: 30,
        fontFamily: FONTE.sans,
        fontSize: 15,
        color: 'rgba(246,242,233,0.62)',
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
      }}
    >
      {texto}
    </div>
  </AbsoluteFill>
);

/**
 * Texto com trechos marcados entre [[colchetes duplos]].
 * Os trechos marcados ganham marca-texto amarelo animado a partir de `aosMarca`.
 */
const TextoMarcado: React.FC<{ texto: string; revelar: number; marca: number }> = ({ texto, revelar, marca }) => {
  const partes = texto.split(/(\[\[[^\]]+\]\])/g).filter(Boolean);
  const totalPalavras = texto.replace(/\[\[|\]\]/g, '').split(/\s+/).filter(Boolean).length;
  let contador = 0;
  return (
    <>
      {partes.map((parte, i) => {
        const marcada = parte.startsWith('[[');
        const limpo = marcada ? parte.slice(2, -2) : parte;
        const palavras = limpo.split(/(\s+)/);
        const conteudo = palavras.map((p, j) => {
          if (/^\s+$/.test(p) || p === '') return <React.Fragment key={j}>{p}</React.Fragment>;
          const idx = contador++;
          const op = Math.min(1, Math.max(0, revelar * totalPalavras - idx));
          return (
            <span key={j} style={{ opacity: op }}>
              {p}
            </span>
          );
        });
        if (!marcada) return <React.Fragment key={i}>{conteudo}</React.Fragment>;
        return (
          <span
            key={i}
            style={{
              backgroundImage: `linear-gradient(${COR.marcaTexto}, ${COR.marcaTexto})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${marca * 100}% 62%`,
              backgroundPosition: '0 78%',
              padding: '0 2px',
            }}
          >
            {conteudo}
          </span>
        );
      })}
    </>
  );
};

/**
 * Cartão de documento: a "moldura" de papel onde entram citações, telegramas, leis e relatórios.
 * - cabecalho: fonte e data em versalete ("Telegrama do embaixador · 30 de maio de 1950")
 * - texto: a citação; use [[...]] para marcar trechos com marca-texto
 * - carimbo: carimbo vermelho que bate por cima ("O ACORDO NUNCA VEIO")
 */
export const CartaoDocumento: React.FC<{
  cabecalho: string;
  texto: string;
  credito?: string;
  carimbo?: { texto: string; aos: number; cor?: string };
  aosMarca?: number;
  largura?: number;
  tamanhoTexto?: number;
}> = ({ cabecalho, texto, credito, carimbo, aosMarca, largura = 1180, tamanhoTexto = 44 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = mola(frame, fps, 0.05, 140, 18);
  const revelar = surgir(frame, fps, 0.35, Math.max(0.8, texto.length / 70));
  const tempoMarca = aosMarca ?? 0.35 + Math.max(0.8, texto.length / 70) + 0.2;
  const marca = surgir(frame, fps, tempoMarca, 0.5);
  const batida = carimbo ? mola(frame, fps, carimbo.aos, 260, 16) : 0;
  const corCarimbo = carimbo?.cor ?? COR.vermelho;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: largura,
          position: 'relative',
          background: `linear-gradient(180deg, #f7f1e3 0%, ${COR.papel} 100%)`,
          border: `1px solid ${COR.papelBorda}`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.55), inset 0 0 40px rgba(160,130,70,0.18)',
          padding: carimbo ? '34px 54px 86px' : '34px 54px 26px',
          opacity: entrada,
          transform: `translateY(${(1 - entrada) * 30}px) scale(${0.96 + entrada * 0.04})`,
        }}
      >
        <div style={{ position: 'absolute', inset: 8, border: `1px solid rgba(150,125,75,0.35)`, pointerEvents: 'none' }} />
        <div
          style={{
            fontFamily: FONTE.serif,
            fontVariant: 'small-caps',
            letterSpacing: 2.5,
            fontSize: 23,
            color: COR.tintaSuave,
            textAlign: 'center',
            marginBottom: 18,
          }}
        >
          {cabecalho}
        </div>
        <div
          style={{
            fontFamily: FONTE.serif,
            fontStyle: 'italic',
            fontSize: tamanhoTexto,
            lineHeight: 1.32,
            color: COR.tinta,
          }}
        >
          <TextoMarcado texto={texto} revelar={revelar} marca={marca} />
        </div>
        {credito && (
          <div
            style={{
              fontFamily: FONTE.sans,
              fontSize: 15,
              color: COR.tintaSuave,
              textAlign: 'right',
              marginTop: 18,
              opacity: revelar,
            }}
          >
            {credito}
          </div>
        )}
        {carimbo && batida > 0.01 && (
          <div
            style={{
              position: 'absolute',
              right: 48,
              bottom: 34,
              transform: `rotate(-8deg) scale(${2.1 - batida * 1.1})`,
              transformOrigin: 'center',
              opacity: Math.min(1, batida * 1.4),
              border: `5px solid ${corCarimbo}`,
              borderRadius: 8,
              padding: '5px 20px',
              color: corCarimbo,
              fontFamily: FONTE.sans,
              fontWeight: 800,
              fontSize: 42,
              letterSpacing: 2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              background: 'rgba(243,236,220,0.65)',
              mixBlendMode: 'multiply',
            }}
          >
            {carimbo.texto}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
