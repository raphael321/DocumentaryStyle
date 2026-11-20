// Animações próprias do documentário do Learjet (entram no plano como bloco { tipo: 'componente', props: { nome } }).
// Tudo em SVG 1920x1080, no tema do vídeo (useTema), sem texto pequeno: o mínimo é 26 px.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { registrarComponente, useTema } from '../doc';
import { mola, surgir } from '../doc';

const SOMBRA = '0 2px 8px rgba(0,0,0,0.9)';
const lerp = (t: number, a: number[], b: number[]) =>
  interpolate(t, a, b, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });

const Titulo: React.FC<{ texto: string; sub?: string; aos?: number }> = ({ texto, sub, aos = 0 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = surgir(f, fps, aos, 0.5);
  return (
    <div style={{ position: 'absolute', left: 130, top: 92, opacity: p, transform: `translateY(${(1 - p) * -14}px)` }}>
      <div style={{ width: 80 * p, height: 4, background: T.cor.ouro, marginBottom: 14 }} />
      <div style={{ fontFamily: T.fonte.titulo, fontWeight: 600, fontSize: 46, letterSpacing: 3, textTransform: 'uppercase', color: T.cor.branco, textShadow: SOMBRA }}>{texto}</div>
      {sub && <div style={{ fontFamily: T.fonte.sans, fontSize: 28, color: T.cor.branco, opacity: 0.75, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

/** Texto preso a um ponto do SVG (fora do SVG para usar as fontes do tema). */
const Nota: React.FC<{ x: number; y: number; texto: string; sub?: string; aos: number; cor?: string; alinhar?: 'esquerda' | 'direita' | 'centro'; tamanho?: number }> = ({
  x, y, texto, sub, aos, cor, alinhar = 'esquerda', tamanho = 32,
}) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = surgir(f, fps, aos, 0.45);
  const tx = alinhar === 'esquerda' ? '0' : alinhar === 'direita' ? '-100%' : '-50%';
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%) translateY(${(1 - p) * 10}px)`, opacity: p, textAlign: alinhar === 'centro' ? 'center' : alinhar === 'direita' ? 'right' : 'left', whiteSpace: 'nowrap' }}>
      <div style={{ fontFamily: T.fonte.sans, fontWeight: 800, fontSize: tamanho, color: cor ?? T.cor.branco, textShadow: SOMBRA }}>{texto}</div>
      {sub && <div style={{ fontFamily: T.fonte.sans, fontSize: tamanho * 0.78, color: T.cor.branco, opacity: 0.8, textShadow: SOMBRA }}>{sub}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// 1 · PERFIL DA QUEDA: altitude x tempo, só com os pontos relatados (FAA/NTSB/imprensa)
// ---------------------------------------------------------------------------------------------
type Marco = 'gelo' | 'subida' | 'queda' | 'faa' | 'impacto';
export const PerfilQueda: React.FC<{ aos?: Partial<Record<Marco, number>>; desenharEm?: number; ate?: number }> = ({ aos = {}, desenharEm = 6, ate = 1 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  // eixo: 12:46:30 (0 s) a 12:50:30 (240 s); altitude 0 a 40.000 pés
  const X0 = 260, X1 = 1680, Y0 = 900, Y1 = 260;
  const px = (s: number) => X0 + (s / 240) * (X1 - X0);
  const py = (pes: number) => Y0 - (pes / 40000) * (Y0 - Y1);
  // pontos: cruzeiro com desvios de ~700 pés, pico de 35.250, queda até 8.750 em pouco mais de 1 min, impacto ~12:50
  const pts: [number, number][] = [];
  for (let s = 0; s <= 90; s += 3) pts.push([s, 35000 + (s > 30 ? Math.sin(s * 0.9) * 700 * Math.min(1, (s - 30) / 20) : 0)]);
  pts.push([96, 35250]);
  for (let s = 100; s <= 170; s += 5) {
    const k = (s - 96) / 74;
    pts.push([s, 35250 - (35250 - 8750) * (k * k * (3 - 2 * k))]);
  }
  pts.push([210, 0]);
  const n = pts.length;
  const prog = lerp(t, [0, desenharEm], [0, ate]) * (n - 1);
  const vis = pts.slice(0, Math.floor(prog) + 1);
  const d = vis.map(([s, a], i) => `${i ? 'L' : 'M'}${px(s).toFixed(1)},${py(a).toFixed(1)}`).join(' ');
  const pontoFim = vis[vis.length - 1];
  const tracejadoDe = pts.findIndex((p) => p[0] === 170);
  const eixo = surgir(f, fps, 0, 0.6);
  const ever = py(29032);
  return (
    <AbsoluteFill>
      <Titulo texto="Perfil de altitude" sub="pontos relatados pela FAA e pela tripulação · traço entre eles é ilustrativo" />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <g opacity={eixo}>
          {[0, 10000, 20000, 30000, 40000].map((a) => (
            <g key={a}>
              <line x1={X0} x2={X1} y1={py(a)} y2={py(a)} stroke={T.cor.branco} strokeOpacity={0.12} strokeWidth={2} />
            </g>
          ))}
          <line x1={X0} x2={X1} y1={ever} y2={ever} stroke={T.cor.azul} strokeOpacity={0.6} strokeDasharray="10 10" strokeWidth={3} />
          {[0, 60, 120, 180, 240].map((s) => (
            <line key={s} x1={px(s)} x2={px(s)} y1={Y0} y2={Y0 + 14} stroke={T.cor.branco} strokeOpacity={0.5} strokeWidth={3} />
          ))}
        </g>
        {/* trecho com dado (cheio) e trecho final sem dado (tracejado) */}
        <path d={d} fill="none" stroke={T.cor.vermelho} strokeWidth={7} strokeLinejoin="round" strokeDasharray={vis.length > tracejadoDe + 1 ? undefined : undefined} />
        {vis.length > tracejadoDe + 1 && (
          <line x1={px(170)} y1={py(8750)} x2={px(pontoFim[0])} y2={py(pontoFim[1])} stroke={T.cor.branco} strokeWidth={8} strokeDasharray="4 14" strokeLinecap="round" />
        )}
        {pontoFim && <circle cx={px(pontoFim[0])} cy={py(pontoFim[1])} r={12} fill={T.cor.ouro} />}
      </svg>
      <div style={{ opacity: eixo }}>
        {[0, 10000, 20000, 30000, 40000].map((a) => (
          <Nota key={a} x={X0 - 24} y={py(a)} texto={`${(a / 1000).toLocaleString('pt-BR')} mil pés`} aos={0} alinhar="direita" tamanho={26} />
        ))}
        {['12:46:30', '12:47:30', '12:48:30', '12:49:30', '12:50:30'].map((h, i) => (
          <Nota key={h} x={px(i * 60)} y={Y0 + 44} texto={h} aos={0} alinhar="centro" tamanho={26} />
        ))}
        <Nota x={X1} y={ever - 26} texto="topo do Everest · 8.849 m" aos={0.3} alinhar="direita" tamanho={26} cor={T.cor.azul} />
      </div>
      {aos.gelo !== undefined && <Nota x={px(4)} y={py(35000) - 70} texto="~12:47 · gelo claro leve" sub="turbulência moderada, desvios de ~200 m" aos={aos.gelo} />}
      {aos.subida !== undefined && <Nota x={px(34)} y={py(35000) + 64} texto="autorizado: 37 mil pés" aos={aos.subida} cor={T.cor.verde} />}
      {aos.queda !== undefined && <Nota x={px(112)} y={py(26000)} texto="~12:48 · Mayday" sub="sobrevelocidade" aos={aos.queda} cor={T.cor.vermelho} />}
      {aos.faa !== undefined && <Nota x={px(176)} y={py(8750) - 10} texto="8.750 pés" sub="em pouco mais de 1 minuto (FAA)" aos={aos.faa} cor={T.cor.ouro} />}
      {aos.impacto !== undefined && <Nota x={px(210) + 24} y={py(0) - 40} texto="~12:50 · impacto" aos={aos.impacto} cor={T.cor.vermelho} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 2 · TORRE EIFFEL: 300 m a cada ~2,6 s (velocidade média da queda relatada pela FAA)
// ---------------------------------------------------------------------------------------------
const TORRE = 'M0,0 L-6,40 L-12,40 L-14,90 L-26,92 L-40,170 L-52,172 L-84,300 L-58,300 C-40,250 40,250 58,300 L84,300 L52,172 L40,170 L26,92 L14,90 L12,40 L6,40 Z';
export const TorresEiffel: React.FC<{ aos?: number; segundosPorTorre?: number }> = ({ aos = 0.3, segundosPorTorre = 2.6 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, f / fps - aos);
  const total = 27; // 8,1 km / 300 m
  const caidas = Math.min(total, Math.floor(t / segundosPorTorre * 4)); // 4x mais rápido para caber na cena
  const frac = ((t / segundosPorTorre) * 4) % 1;
  const ent = mola(f, fps, aos, 120, 16);
  const ESC = 2.1;
  return (
    <AbsoluteFill>
      <Titulo texto="A velocidade da queda" sub="média de mais de 20 mil pés por minuto" />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <g transform={`translate(560, ${300 + (1 - ent) * 60}) scale(${ESC})`} opacity={ent}>
          <path d={TORRE} fill="none" stroke={T.cor.ouro} strokeWidth={2.2} />
          {[90, 172, 240].map((y) => <line key={y} x1={-70} x2={70} y1={y} y2={y} stroke={T.cor.ouro} strokeOpacity={0.35} strokeWidth={1.2} />)}
          {/* jato caindo ao lado da torre: do topo à base a cada ciclo */}
          <g transform={`translate(150, ${frac * 300})`}>
            <path d="M0,-26 L6,-6 L22,4 L6,4 L4,20 L10,26 L-10,26 L-4,20 L-6,4 L-22,4 L-6,-6 Z" fill={T.cor.vermelho} transform="rotate(180)" />
          </g>
          <line x1={110} x2={110} y1={0} y2={300} stroke={T.cor.branco} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 6" />
        </g>
        {/* contador de torres empilhadas */}
        <g transform="translate(1080, 330)">
          {Array.from({ length: total }).map((_, i) => (
            <rect key={i} x={(i % 9) * 62} y={Math.floor(i / 9) * 120} width={46} height={100} rx={4}
              fill={i < caidas ? T.cor.ouro : 'none'} fillOpacity={i < caidas ? 0.85 : 0} stroke={T.cor.ouro} strokeOpacity={0.45} strokeWidth={2} />
          ))}
        </g>
      </svg>
      <Nota x={560} y={980} texto="300 m a cada 2 ou 3 segundos" aos={aos + 0.6} alinhar="centro" tamanho={36} cor={T.cor.ouro} />
      <Nota x={1355} y={720} texto={`${caidas} de 27 torres`} sub="8 km de queda = 27 Torres Eiffel" aos={aos + 0.4} alinhar="centro" tamanho={40} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 3 · CORRENTES NA TEMPESTADE + "canto do caixão" (margem entre estol e velocidade máxima)
// ---------------------------------------------------------------------------------------------
export const Correntes: React.FC<{ aosMargem?: number }> = ({ aosMargem = 6 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const nuvem = surgir(f, fps, 0, 0.8);
  const jatoY = 470 + Math.sin(t * 2.4) * 70 + Math.sin(t * 5.1) * 18;
  const jatoX = interpolate(t, [0, 12], [260, 1100], { extrapolateRight: 'clamp' });
  const margem = surgir(f, fps, aosMargem, 0.6);
  const setas = [
    { x: 520, sobe: true }, { x: 760, sobe: false }, { x: 1000, sobe: true }, { x: 1240, sobe: false },
  ];
  // gráfico: altitude (eixo y) x velocidade (eixo x); estol sobe com a altitude, velocidade máxima cai
  const GX = 1240, GY = 260, GW = 520, GH = 560;
  const vel = (frac: number, lado: 'estol' | 'max') => (lado === 'estol' ? GX + 40 + frac * 210 : GX + GW - 30 - frac * 190);
  const alt = (frac: number) => GY + GH - frac * GH;
  const curva = (lado: 'estol' | 'max') => Array.from({ length: 21 }, (_, i) => {
    const k = i / 20;
    const fr = Math.pow(k, 2.2);
    return `${i ? 'L' : 'M'}${vel(fr, lado).toFixed(1)},${alt(k).toFixed(1)}`;
  }).join(' ');
  return (
    <AbsoluteFill>
      <Titulo texto="Hipótese 1 · Correntes da tempestade" sub="ar que sobe e desce com violência dentro da nuvem" />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <g opacity={nuvem * (1 - margem * 0.55)}>
          {[[640, 560, 420], [900, 470, 380], [420, 620, 300], [1120, 600, 300]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={T.cor.azul} fillOpacity={0.07} />
          ))}
          {setas.map((s, i) => {
            const fase = ((t * 0.9 + i * 0.37) % 1);
            const y = s.sobe ? 820 - fase * 520 : 300 + fase * 520;
            const cor = s.sobe ? T.cor.verde : T.cor.vermelho;
            return (
              <g key={i} opacity={Math.sin(fase * Math.PI)}>
                <line x1={s.x} x2={s.x} y1={s.sobe ? y + 160 : y - 160} y2={y} stroke={cor} strokeWidth={14} strokeLinecap="round" />
                <path d={s.sobe ? `M${s.x - 28},${y + 24} L${s.x},${y - 20} L${s.x + 28},${y + 24}` : `M${s.x - 28},${y - 24} L${s.x},${y + 20} L${s.x + 28},${y - 24}`} fill="none" stroke={cor} strokeWidth={14} strokeLinejoin="round" />
              </g>
            );
          })}
          <g transform={`translate(${jatoX}, ${jatoY}) rotate(${Math.cos(t * 2.4) * 10})`}>
            <path d="M-60,0 L40,-6 L64,0 L40,6 Z M-10,-4 L-30,-44 L-16,-44 L14,-4 Z M-10,4 L-30,44 L-16,44 L14,4 Z M-58,-2 L-70,-22 L-62,-22 L-50,-2 Z" fill={T.cor.branco} />
          </g>
        </g>
        <g opacity={margem}>
          <rect x={GX - 20} y={GY - 30} width={GW + 40} height={GH + 60} fill={T.cor.fundo} fillOpacity={0.88} stroke={T.cor.branco} strokeOpacity={0.25} strokeWidth={2} rx={8} />
          <path d={curva('estol')} fill="none" stroke={T.cor.vermelho} strokeWidth={6} />
          <path d={curva('max')} fill="none" stroke={T.cor.ouro} strokeWidth={6} />
          <line x1={vel(Math.pow(0.86, 2.2), 'estol')} x2={vel(Math.pow(0.86, 2.2), 'max')} y1={alt(0.86)} y2={alt(0.86)} stroke={T.cor.branco} strokeWidth={4} strokeDasharray="8 8" />
        </g>
      </svg>
      {margem > 0 && (
        <div style={{ opacity: margem }}>
          <Nota x={GX + 20} y={GY + GH - 20} texto="lento demais" sub="(estol)" aos={aosMargem + 0.3} cor={T.cor.vermelho} tamanho={28} />
          <Nota x={GX + GW - 10} y={GY + GH - 20} texto="rápido demais" sub="(limite)" aos={aosMargem + 0.5} cor={T.cor.ouro} alinhar="direita" tamanho={28} />
          <Nota x={GX + GW / 2} y={alt(0.86) - 44} texto="margem estreita" sub="a 35 mil pés" aos={aosMargem + 1} alinhar="centro" tamanho={30} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 4 · GELO NA ASA: perfil da asa com linhas de ar; o gelo cresce no bordo de ataque e o fluxo descola
// ---------------------------------------------------------------------------------------------
const PERFIL = 'M0,0 C40,-46 160,-62 300,-52 C480,-38 640,-14 760,0 C640,10 480,18 300,22 C160,26 40,22 0,0 Z';
export const AsaGelo: React.FC<{ aosGelo?: number; aosDescola?: number }> = ({ aosGelo = 1.5, aosDescola = 4 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const gelo = surgir(f, fps, aosGelo, 2.2);
  const descola = surgir(f, fps, aosDescola, 1.2);
  const OX = 560, OY = 560;
  const linhas = [-150, -110, -75, 70, 110];
  const sust = 1 - descola * 0.55;
  return (
    <AbsoluteFill>
      <Titulo texto="Hipótese 2 · Gelo na asa" sub="corte da asa, visto de lado" />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {linhas.map((dy, i) => {
          const topo = dy < 0;
          const perto = topo && dy > -120;
          const d = topo
            ? `M200,${OY + dy} C${OX - 40},${OY + dy} ${OX + 120},${OY + dy - 50} ${OX + 380},${OY + dy - 30 + (perto ? descola * 60 : 0)} S${OX + 900},${OY + dy + (perto ? descola * 80 : 10)} 1760,${OY + dy + 20}`
            : `M200,${OY + dy} C${OX - 40},${OY + dy} ${OX + 200},${OY + dy + 20} ${OX + 500},${OY + dy + 10} S${OX + 900},${OY + dy} 1760,${OY + dy}`;
          const cor = perto && descola > 0.3 ? T.cor.vermelho : T.cor.azul;
          return <path key={i} d={d} fill="none" stroke={cor} strokeWidth={4} strokeOpacity={0.85} strokeDasharray="26 22" strokeDashoffset={-t * (perto ? 140 * (1 - descola * 0.7) : 140)} />;
        })}
        {/* redemoinhos atrás do descolamento */}
        {descola > 0.2 && [0, 1, 2].map((k) => {
          const cx = OX + 480 + k * 150 + ((t * 60) % 60);
          return <circle key={k} cx={cx} cy={OY - 70 + k * 6} r={26 + k * 6} fill="none" stroke={T.cor.vermelho} strokeWidth={4} strokeDasharray="14 10" opacity={descola * 0.8} transform={`rotate(${t * 180} ${cx} ${OY - 70 + k * 6})`} />;
        })}
        <g transform={`translate(${OX}, ${OY})`}>
          <path d={PERFIL} fill={T.cor.fundoClaro} stroke={T.cor.branco} strokeWidth={4} />
          {/* gelo claro: camada transparente no bordo de ataque */}
          <path d={`M4,-2 C${-12 - gelo * 26},${-20 - gelo * 22} ${30},${-58 - gelo * 14} ${120 + gelo * 30},${-62 - gelo * 6} L120,-58 C40,-50 14,-30 4,-2 Z`} fill="#bfe9ff" fillOpacity={0.55 * gelo} stroke="#e8f8ff" strokeWidth={3} strokeOpacity={gelo} />
          <path d={`M4,2 C${-10 - gelo * 20},${12 + gelo * 10} 20,${22 + gelo * 6} 70,${22 + gelo * 4} L70,20 C30,20 12,14 4,2 Z`} fill="#bfe9ff" fillOpacity={0.5 * gelo} />
          {/* seta de sustentação */}
          <line x1={330} x2={330} y1={-60} y2={-60 - 220 * sust} stroke={T.cor.verde} strokeWidth={14} />
          <path d={`M300,${-50 - 220 * sust} L330,${-100 - 220 * sust} L360,${-50 - 220 * sust} Z`} fill={T.cor.verde} />
        </g>
      </svg>
      <Nota x={OX - 70} y={OY + 120} texto="gelo claro" sub="transparente como vidro" aos={aosGelo + 0.4} cor="#bfe9ff" alinhar="centro" />
      <Nota x={OX + 380} y={OY - 330 * sust + 30} texto={descola > 0.5 ? 'menos sustentação' : 'sustentação'} aos={0.6} cor={T.cor.verde} />
      <Nota x={OX + 760} y={OY + 170} texto="o ar descola do topo da asa" aos={aosDescola + 0.6} cor={T.cor.vermelho} alinhar="centro" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 5 · TUBO DE PITOT: o ar entra, o gelo fecha a entrada e o velocímetro mente
// ---------------------------------------------------------------------------------------------
export const Pitot: React.FC<{ aosGelo?: number }> = ({ aosGelo = 2.5 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const gelo = surgir(f, fps, aosGelo, 1.6);
  const real = 250 + Math.sin(t * 0.7) * 6;
  const lido = interpolate(gelo, [0, 1], [real, 95]) + Math.sin(t * 7) * 6 * gelo;
  const ang = (v: number) => -220 + (v / 350) * 260;
  const CX = 1440, CY = 560, R = 210;
  return (
    <AbsoluteFill>
      <Titulo texto="Tubo de Pitot" sub="o sensor que mede a velocidade do avião" />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {/* tubo */}
        <g transform="translate(220, 520)">
          <path d="M0,-18 L520,-18 L560,-40 L760,-40 L760,40 L560,40 L520,18 L0,18 Z" fill={T.cor.fundoClaro} stroke={T.cor.branco} strokeWidth={4} />
          <rect x={-6} y={-18} width={14} height={36} fill="#bfe9ff" opacity={gelo} />
          {Array.from({ length: 14 }).map((_, i) => {
            const fase = (t * 0.8 + i / 14) % 1;
            const x = -260 + fase * 900;
            const bloqueado = gelo > 0.6 && x > -10;
            if (bloqueado) return null;
            return <circle key={i} cx={x} cy={((i * 37) % 30) - 15} r={7} fill={T.cor.azul} opacity={x > 0 ? 1 - gelo : 0.9} />;
          })}
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={`c${i}`} d="M0,-8 L3,0 L0,8 L-3,0 Z" fill="#e8f8ff" opacity={gelo} transform={`translate(${-4 + (i % 3) * 5}, ${-14 + i * 3})`} />
          ))}
        </g>
        {/* velocímetro */}
        <circle cx={CX} cy={CY} r={R} fill={T.cor.fundo} stroke={T.cor.branco} strokeWidth={5} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = ((ang(i * 50) - 90) * Math.PI) / 180 + Math.PI / 2;
          return <line key={i} x1={CX + Math.cos(a) * (R - 10)} y1={CY + Math.sin(a) * (R - 10)} x2={CX + Math.cos(a) * (R - 40)} y2={CY + Math.sin(a) * (R - 40)} stroke={T.cor.branco} strokeWidth={4} />;
        })}
        <line x1={CX} y1={CY} x2={CX + Math.cos(((ang(real) - 90) * Math.PI) / 180 + Math.PI / 2) * (R - 50)} y2={CY + Math.sin(((ang(real) - 90) * Math.PI) / 180 + Math.PI / 2) * (R - 50)} stroke={T.cor.verde} strokeWidth={6} strokeDasharray="10 8" opacity={gelo} />
        <line x1={CX} y1={CY} x2={CX + Math.cos(((ang(lido) - 90) * Math.PI) / 180 + Math.PI / 2) * (R - 30)} y2={CY + Math.sin(((ang(lido) - 90) * Math.PI) / 180 + Math.PI / 2) * (R - 30)} stroke={gelo > 0.4 ? T.cor.vermelho : T.cor.ouro} strokeWidth={10} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={16} fill={T.cor.branco} />
      </svg>
      <Nota x={220} y={440} texto="entrada de ar" aos={0.5} />
      <Nota x={220} y={640} texto="cristais de gelo fecham a entrada" aos={aosGelo + 0.4} cor="#bfe9ff" />
      <Nota x={CX} y={CY + R + 50} texto={gelo > 0.4 ? 'leitura falsa' : 'velocidade medida'} aos={0.8} alinhar="centro" cor={gelo > 0.4 ? T.cor.vermelho : T.cor.ouro} />
      <Nota x={CX} y={CY - R - 44} texto="velocidade real" aos={aosGelo + 0.8} alinhar="centro" cor={T.cor.verde} tamanho={28} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 6 · DESORIENTAÇÃO: o que o avião faz x o que o piloto sente, depois a espiral
// ---------------------------------------------------------------------------------------------
const Horizonte: React.FC<{ cx: number; cy: number; r: number; inclinacao: number; rotulo: string; sub: string; cor: string; aos: number }> = ({ cx, cy, r, inclinacao, rotulo, sub, cor, aos }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = mola(f, fps, aos, 120, 16);
  const id = `clip${cx}`;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute' }} opacity={p}>
        <defs><clipPath id={id}><circle cx={cx} cy={cy} r={r} /></clipPath></defs>
        <g clipPath={`url(#${id})`}>
          <g transform={`rotate(${inclinacao} ${cx} ${cy})`}>
            <rect x={cx - r * 2} y={cy - r * 2} width={r * 4} height={r * 2} fill="#2c6fb3" />
            <rect x={cx - r * 2} y={cy} width={r * 4} height={r * 2} fill="#6b4a2b" />
            <line x1={cx - r * 2} x2={cx + r * 2} y1={cy} y2={cy} stroke="#fff" strokeWidth={4} />
          </g>
        </g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor} strokeWidth={6} />
        <path d={`M${cx - 110},${cy} L${cx - 40},${cy} L${cx - 20},${cy + 22} M${cx + 110},${cy} L${cx + 40},${cy} L${cx + 20},${cy + 22}`} stroke={T.cor.ouro} strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={8} fill={T.cor.ouro} />
      </svg>
      <Nota x={cx} y={cy + r + 56} texto={rotulo} sub={sub} aos={aos + 0.3} alinhar="centro" cor={cor} />
    </>
  );
};

export const Desorientacao: React.FC<{ aosSente?: number; aosEspiral?: number }> = ({ aosSente = 2, aosEspiral = 7 }) => {
  const T = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const incl = lerp(t, [0.5, 4], [0, 38]);
  const esp = surgir(f, fps, aosEspiral, 0.6);
  const desenho = lerp(t, [aosEspiral, aosEspiral + 5], [0, 1]);
  const voltas = 3.2;
  const pts = Array.from({ length: 160 }, (_, i) => {
    const k = (i / 159) * desenho;
    const ang = k * voltas * Math.PI * 2;
    const raio = 300 * (1 - k * 0.7);
    return [960 + Math.cos(ang) * raio, 330 + k * 560 + Math.sin(ang) * raio * 0.28] as [number, number];
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fim = pts[pts.length - 1];
  return (
    <AbsoluteFill>
      <Titulo texto="Hipótese 3 · Desorientação espacial" sub="dentro da nuvem não há horizonte" />
      <div style={{ opacity: 1 - esp }}>
        <Horizonte cx={600} cy={540} r={220} inclinacao={incl} rotulo="o que o avião faz" sub={`inclinado ${Math.round(incl)}°`} cor={T.cor.vermelho} aos={0.2} />
        <Horizonte cx={1320} cy={540} r={220} inclinacao={0} rotulo="o que o piloto sente" sub="asas niveladas" cor={T.cor.verde} aos={aosSente} />
      </div>
      {esp > 0 && (
        <div style={{ opacity: esp }}>
          <svg width={1920} height={1080} style={{ position: 'absolute' }}>
            <path d={d} fill="none" stroke={T.cor.vermelho} strokeWidth={8} strokeLinecap="round" />
            <circle cx={fim[0]} cy={fim[1]} r={14} fill={T.cor.ouro} />
          </svg>
          <Nota x={1460} y={420} texto="puxar o manche" sub="sem nivelar as asas" aos={aosEspiral + 0.8} />
          <Nota x={1460} y={640} texto="a curva aperta" sub="e a velocidade sobe" aos={aosEspiral + 2.4} cor={T.cor.ouro} />
          <Nota x={460} y={900} texto="espiral da morte" aos={aosEspiral + 4} cor={T.cor.vermelho} tamanho={44} />
        </div>
      )}
    </AbsoluteFill>
  );
};

registrarComponente('perfilQueda', PerfilQueda);
registrarComponente('torresEiffel', TorresEiffel);
registrarComponente('correntes', Correntes);
registrarComponente('asaGelo', AsaGelo);
registrarComponente('pitot', Pitot);
registrarComponente('desorientacao', Desorientacao);
