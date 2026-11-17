// DocumentaryStyle: fundos e molduras por TEMA.
// Tudo é desenhado em SVG/CSS (sem imagem externa) e anima devagar com o frame, sempre determinístico.
import React, { useMemo } from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tema, useTema } from './tema';

// ---------- peças reutilizáveis ----------

/** Fumaça/névoa: ruído fractal colorido que desliza devagar. */
const Nevoa: React.FC<{ id: string; cor: [number, number, number]; alfa: number; freq: string; velocidade: number; semente: number }> = ({
  id,
  cor,
  alfa,
  freq,
  velocidade,
  semente,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [r, g, b] = cor.map((c) => c / 255);
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={semente} />
        <feColorMatrix type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${alfa * 2.2} 0 0 0 ${-alfa * 0.7}`} />
      </filter>
      <g transform={`translate(${-frame * velocidade} ${-frame * velocidade * 0.25})`}>
        <rect x={0} y={0} width={width + 1400} height={height + 400} filter={`url(#${id})`} />
      </g>
    </svg>
  );
};

/** Partículas (brasas, poeira de ouro, poeira no feixe de luz). */
const Particulas: React.FC<{
  semente: string;
  n: number;
  cor: string;
  tamanho: [number, number];
  subir: number;
  alfa: [number, number];
  brilho?: boolean;
}> = ({ semente, n, cor, tamanho, subir, alfa, brilho }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ps = useMemo(
    () =>
      new Array(n).fill(0).map((_, i) => ({
        x: random(`${semente}-px-${i}`) * width,
        y: random(`${semente}-py-${i}`) * height,
        r: tamanho[0] + random(`${semente}-pr-${i}`) * (tamanho[1] - tamanho[0]),
        a: alfa[0] + random(`${semente}-pa-${i}`) * (alfa[1] - alfa[0]),
        v: 0.5 + random(`${semente}-pv-${i}`),
        f: random(`${semente}-pf-${i}`) * 6.28,
      })),
    [semente, n, width, height, tamanho, alfa],
  );
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
      {ps.map((p, i) => {
        const y = (((p.y - frame * subir * p.v) % (height + 40)) + height + 40) % (height + 40) - 20;
        const x = p.x + Math.sin(frame / 40 + p.f) * 14;
        const pisca = 0.55 + 0.45 * Math.sin(frame / 9 + p.f * 3);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={p.r}
            fill={cor}
            opacity={p.a * pisca}
            style={brilho ? { filter: `drop-shadow(0 0 ${p.r * 2.5}px ${cor})` } : undefined}
          />
        );
      })}
    </svg>
  );
};

const Vinheta: React.FC<{ forca?: number }> = ({ forca = 0.6 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,${forca}) 100%)` }} />
);

/** Fundo base: gradiente radial do tema. */
const Base: React.FC<{ T: Tema; centro?: string; fim?: string }> = ({ T, centro = '50% 42%', fim = '#050505' }) => (
  <AbsoluteFill
    style={{ background: `radial-gradient(ellipse at ${centro}, ${T.cor.fundoClaro} 0%, ${T.cor.fundo} 62%, ${fim} 100%)` }}
  />
);

// ---------- fundos ----------

const FundoEstrelas: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const estrelas = useMemo(
    () =>
      new Array(140).fill(0).map((_, i) => ({
        x: random(`${semente}-x-${i}`) * width,
        y: random(`${semente}-y-${i}`) * height,
        r: 0.6 + random(`${semente}-r-${i}`) * 1.4,
        a: 0.15 + random(`${semente}-a-${i}`) * 0.45,
        f: random(`${semente}-f-${i}`) * 6,
      })),
    [semente, width, height],
  );
  return (
    <AbsoluteFill>
      <Base T={T} fim="#070b12" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {estrelas.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="#dfe8ff" opacity={e.a * (0.75 + 0.25 * Math.sin(frame / 18 + e.f))} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** GUERRA: carvão e oliva, quadrícula de carta militar, curvas de nível, fumaça e brasas. */
const FundoFumaca: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const { width, height } = useVideoConfig();
  const curvas = useMemo(() => {
    const cx = width * (0.25 + random(`${semente}-cx`) * 0.5);
    const cy = height * (0.3 + random(`${semente}-cy`) * 0.4);
    return new Array(9).fill(0).map((_, k) => {
      const raio = 90 + k * 85;
      const pts: string[] = [];
      for (let a = 0; a <= 64; a++) {
        const ang = (a / 64) * Math.PI * 2;
        const ruido = 1 + 0.16 * Math.sin(ang * 3 + k * 0.7) + 0.08 * Math.sin(ang * 7 + k);
        pts.push(`${(cx + Math.cos(ang) * raio * 1.35 * ruido).toFixed(1)},${(cy + Math.sin(ang) * raio * ruido).toFixed(1)}`);
      }
      return `M${pts.join(' L')} Z`;
    });
  }, [semente, width, height]);
  const passo = 120;
  return (
    <AbsoluteFill>
      <Base T={T} fim="#050604" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {new Array(Math.ceil(width / passo) + 1).fill(0).map((_, i) => (
          <line key={`v${i}`} x1={i * passo} y1={0} x2={i * passo} y2={height} stroke="rgba(210,200,160,0.055)" strokeWidth={1} />
        ))}
        {new Array(Math.ceil(height / passo) + 1).fill(0).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * passo} x2={width} y2={i * passo} stroke="rgba(210,200,160,0.055)" strokeWidth={1} />
        ))}
        {new Array(Math.ceil(width / passo)).fill(0).map((_, i) => (
          <text key={`t${i}`} x={i * passo + 6} y={22} fontFamily={T.fonte.sans} fontSize={12} fill="rgba(210,200,160,0.22)">
            {String(40 + i).padStart(2, '0')}
          </text>
        ))}
        {curvas.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={T.cor.ouro} strokeOpacity={i % 3 === 0 ? 0.09 : 0.05} strokeWidth={i % 3 === 0 ? 1.6 : 1} />
        ))}
      </svg>
      <Nevoa id={`fumaca-${semente}`} cor={[150, 148, 130]} alfa={0.22} freq="0.0025 0.005" velocidade={0.35} semente={7} />
      <Particulas semente={`${semente}-brasa`} n={38} cor="#ff8a3a" tamanho={[1, 2.6]} subir={0.9} alfa={[0.25, 0.75]} brilho />
      <Vinheta forca={0.7} />
    </AbsoluteFill>
  );
};

const FLOR_DE_LIS =
  'M0,-34 C7,-24 9,-12 4,-2 C12,-8 22,-6 24,2 C26,10 18,16 10,12 C14,6 10,2 5,6 L4,10 L12,10 L12,14 L4,14 C4,22 8,28 14,30 L-14,30 C-8,28 -4,22 -4,14 L-12,14 L-12,10 L-4,10 L-5,6 C-10,2 -14,6 -10,12 C-18,16 -26,10 -24,2 C-22,-6 -12,-8 -4,-2 C-9,-12 -7,-24 0,-34 Z';

/** REALEZA: veludo vinho com padrão damasco em ouro, faixa de luz e poeira dourada. */
const FundoDamasco: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const id = `damasco-${semente}`;
  const varre = ((frame * 2.2) % (width * 2.4)) - width * 0.7;
  return (
    <AbsoluteFill>
      <Base T={T} fim="#0a0206" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <defs>
          <pattern id={id} width={150} height={190} patternUnits="userSpaceOnUse">
            <g fill={T.cor.ouro} fillOpacity={0.085}>
              <path d={FLOR_DE_LIS} transform="translate(75 95) scale(1.15)" />
              <path d={FLOR_DE_LIS} transform="translate(0 0) scale(0.7)" />
              <path d={FLOR_DE_LIS} transform="translate(150 0) scale(0.7)" />
              <path d={FLOR_DE_LIS} transform="translate(0 190) scale(0.7)" />
              <path d={FLOR_DE_LIS} transform="translate(150 190) scale(0.7)" />
            </g>
            <g fill="none" stroke={T.cor.ouro} strokeOpacity={0.06} strokeWidth={1.2}>
              <path d="M75,30 C110,45 120,80 140,95 C120,110 110,145 75,160 C40,145 30,110 10,95 C30,80 40,45 75,30 Z" />
            </g>
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${id})`} />
      </svg>
      <AbsoluteFill
        style={{
          background: `linear-gradient(105deg, transparent ${0}px, rgba(255,220,150,0.07) 50%, transparent 100%)`,
          width: 700,
          left: varre,
          transform: 'skewX(-18deg)',
        }}
      />
      <Particulas semente={`${semente}-ouro`} n={55} cor="#ffd98a" tamanho={[0.8, 2]} subir={0.18} alfa={[0.2, 0.7]} brilho />
      <Vinheta forca={0.72} />
    </AbsoluteFill>
  );
};

/** DITADURA: concreto escuro, raios de propaganda girando devagar e linhas de TV antiga. */
const FundoPropaganda: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2, cy = height * 0.56;
  const raio = Math.hypot(width, height);
  const n = 28;
  const raios = new Array(n).fill(0).map((_, i) => {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2;
    return `M${cx},${cy} L${cx + Math.cos(a0) * raio},${cy + Math.sin(a0) * raio} L${cx + Math.cos(a1) * raio},${cy + Math.sin(a1) * raio} Z`;
  });
  const id = `concreto-${semente}`;
  return (
    <AbsoluteFill>
      <Base T={T} centro="50% 56%" fim="#030303" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <g transform={`rotate(${frame * 0.04} ${cx} ${cy})`} fill={T.cor.vermelho} fillOpacity={0.075}>
          {raios.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} seed={3} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter={`url(#${id})`} opacity={0.09} style={{ mixBlendMode: 'overlay' }} />
      </svg>
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)' }} />
      <Vinheta forca={0.8} />
    </AbsoluteFill>
  );
};

/** AVIAÇÃO: azul-aço, grade de navegação, radar com varredura e nuvens finas. */
const FundoRadar: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2, cy = height * 0.54;
  const angulo = (frame * 2.4) % 360;
  const alvos = useMemo(
    () =>
      new Array(7).fill(0).map((_, i) => ({
        ang: random(`${semente}-ra-${i}`) * 360,
        dist: 180 + random(`${semente}-rd-${i}`) * 520,
      })),
    [semente],
  );
  const passo = 80;
  return (
    <AbsoluteFill>
      <Base T={T} centro="50% 54%" fim="#02060c" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {new Array(Math.ceil(width / passo) + 1).fill(0).map((_, i) => (
          <line key={`v${i}`} x1={i * passo} y1={0} x2={i * passo} y2={height} stroke={T.cor.azul} strokeOpacity={i % 5 === 0 ? 0.11 : 0.045} />
        ))}
        {new Array(Math.ceil(height / passo) + 1).fill(0).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * passo} x2={width} y2={i * passo} stroke={T.cor.azul} strokeOpacity={i % 5 === 0 ? 0.11 : 0.045} />
        ))}
        {[160, 320, 480, 640, 800].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={T.cor.azul} strokeOpacity={0.12} strokeWidth={1.2} />
        ))}
        <line x1={cx - 820} y1={cy} x2={cx + 820} y2={cy} stroke={T.cor.azul} strokeOpacity={0.08} />
        <line x1={cx} y1={cy - 820} x2={cx} y2={cy + 820} stroke={T.cor.azul} strokeOpacity={0.08} />
        {alvos.map((a, i) => {
          const desde = (angulo - a.ang + 360) % 360; // graus desde que a varredura passou
          const op = Math.max(0, 1 - desde / 220);
          const rad = (a.ang * Math.PI) / 180;
          return <circle key={i} cx={cx + Math.cos(rad) * a.dist} cy={cy + Math.sin(rad) * a.dist} r={4} fill={T.cor.verde} opacity={op * 0.8} />;
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - 800,
          top: cy - 800,
          width: 1600,
          height: 1600,
          borderRadius: '50%',
          background: `conic-gradient(from ${angulo + 90}deg, rgba(58,160,255,0.16) 0deg, rgba(58,160,255,0) 50deg, rgba(58,160,255,0) 360deg)`,
          transform: 'scaleX(-1)',
        }}
      />
      <Nevoa id={`nuvem-${semente}`} cor={[220, 235, 255]} alfa={0.1} freq="0.0018 0.004" velocidade={0.6} semente={11} />
      <Vinheta forca={0.65} />
    </AbsoluteFill>
  );
};

const RosaDosVentos: React.FC<{ x: number; y: number; r: number; cor: string }> = ({ x, y, r, cor }) => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={cor}>
    <circle r={r} strokeOpacity={0.35} />
    <circle r={r * 0.82} strokeOpacity={0.25} />
    {new Array(32).fill(0).map((_, i) => {
      const a = (i / 32) * Math.PI * 2;
      const l = i % 4 === 0 ? 0.7 : 0.88;
      return <line key={i} x1={Math.cos(a) * r * l} y1={Math.sin(a) * r * l} x2={Math.cos(a) * r} y2={Math.sin(a) * r} strokeOpacity={0.35} />;
    })}
    {[0, 1, 2, 3].map((k) => (
      <path
        key={k}
        d={`M0,${-r * 0.78} L${r * 0.11},${-r * 0.11} L0,0 L${-r * 0.11},${-r * 0.11} Z`}
        transform={`rotate(${k * 90})`}
        fill={cor}
        fillOpacity={k === 0 ? 0.45 : 0.22}
        strokeOpacity={0.5}
      />
    ))}
    {[0, 1, 2, 3].map((k) => (
      <path key={`d${k}`} d={`M0,${-r * 0.5} L${r * 0.07},${-r * 0.07} L${-r * 0.07},${-r * 0.07} Z`} transform={`rotate(${45 + k * 90})`} fill={cor} fillOpacity={0.15} strokeOpacity={0.35} />
    ))}
  </g>
);

/** MAR: azul profundo, carta náutica com linhas de rumo, rosa dos ventos e ondas. */
const FundoOceano: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rx = width * 0.86, ry = height * 0.76;
  const passo = 160;
  const ondas = new Array(6).fill(0).map((_, k) => {
    const base = height * 0.68 + k * 52;
    const amp = 10 + k * 3;
    const comp = 260 + k * 40;
    const fase = frame * (0.03 + k * 0.006) + k;
    const pts: string[] = [];
    for (let x = -20; x <= width + 20; x += 20) pts.push(`${x},${(base + Math.sin(x / comp * Math.PI * 2 + fase) * amp).toFixed(1)}`);
    return `M${pts.join(' L')}`;
  });
  return (
    <AbsoluteFill>
      <Base T={T} centro="50% 30%" fim="#01070a" />
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {new Array(Math.ceil(width / passo) + 1).fill(0).map((_, i) => (
          <line key={`v${i}`} x1={i * passo} y1={0} x2={i * passo} y2={height} stroke={T.cor.ouro} strokeOpacity={0.06} />
        ))}
        {new Array(Math.ceil(height / passo) + 1).fill(0).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * passo} x2={width} y2={i * passo} stroke={T.cor.ouro} strokeOpacity={0.06} />
        ))}
        {new Array(16).fill(0).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <line key={`r${i}`} x1={rx} y1={ry} x2={rx + Math.cos(a) * 2600} y2={ry + Math.sin(a) * 2600} stroke={T.cor.ouro} strokeOpacity={0.05} />;
        })}
        <RosaDosVentos x={rx} y={ry} r={120} cor={T.cor.ouro} />
        {ondas.map((d, k) => (
          <path key={k} d={d} fill="none" stroke="#9fdbe6" strokeOpacity={0.05 + k * 0.018} strokeWidth={1.4} />
        ))}
      </svg>
      <Nevoa id={`agua-${semente}`} cor={[120, 200, 220]} alfa={0.07} freq="0.006 0.012" velocidade={0.25} semente={5} />
      <Vinheta forca={0.7} />
    </AbsoluteFill>
  );
};

/** ANTIGUIDADE: pedra iluminada de lado, tons de terracota, feixe de luz com poeira. */
const FundoPedra: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const { width, height } = useVideoConfig();
  const id = `pedra-${semente}`;
  return (
    <AbsoluteFill>
      <Base T={T} centro="40% 35%" fim="#070403" />
      <svg width={width} height={height} style={{ position: 'absolute', mixBlendMode: 'soft-light', opacity: 0.55 }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={5} seed={9} result="r" />
          <feDiffuseLighting in="r" lightingColor="#f0c890" surfaceScale={4} result="luz">
            <feDistantLight azimuth={225} elevation={38} />
          </feDiffuseLighting>
        </filter>
        <rect width={width} height={height} filter={`url(#${id})`} />
      </svg>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(118deg, rgba(255,214,150,0) 18%, rgba(255,214,150,0.09) 32%, rgba(255,214,150,0) 48%)',
        }}
      />
      <Particulas semente={`${semente}-poeira`} n={45} cor="#f3d2a0" tamanho={[0.7, 1.8]} subir={0.12} alfa={[0.15, 0.5]} />
      <Vinheta forca={0.72} />
    </AbsoluteFill>
  );
};

/** CRIME: escuridão noir com luz de persiana e fumaça de cigarro. */
const FundoNoir: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const deriva = frame * 0.15;
  return (
    <AbsoluteFill>
      <Base T={T} centro="62% 38%" fim="#000" />
      <div
        style={{
          position: 'absolute',
          left: width * 0.18 + deriva,
          top: -height * 0.3,
          width: width * 0.9,
          height: height * 1.6,
          transform: 'rotate(-24deg)',
          background:
            'repeating-linear-gradient(0deg, rgba(255,236,200,0.085) 0px, rgba(255,236,200,0.085) 30px, rgba(0,0,0,0) 30px, rgba(0,0,0,0) 52px)',
          maskImage: 'radial-gradient(ellipse at 45% 50%, #000 0%, rgba(0,0,0,0.6) 35%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 45% 50%, #000 0%, rgba(0,0,0,0.6) 35%, transparent 65%)',
        }}
      />
      <Nevoa id={`cigarro-${semente}`} cor={[180, 180, 175]} alfa={0.13} freq="0.003 0.006" velocidade={0.3} semente={13} />
      <Particulas semente={`${semente}-poeira`} n={30} cor="#f5ead2" tamanho={[0.6, 1.5]} subir={0.08} alfa={[0.1, 0.4]} />
      <Vinheta forca={0.85} />
    </AbsoluteFill>
  );
};

/** GUERRA · SONAR: preto total, tela de sonar enorme e apagada, varredura com eco que acende e apaga. */
const FundoSonar: React.FC<{ semente: string }> = ({ semente }) => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const eco = T.cor.azul;
  const cx = width / 2, cy = height / 2, R = height * 0.62;
  const s = frame / fps;
  const VEL = 1.15; // rad/s, igual ao estilo original
  const sw = (s * VEL + random(`${semente}-sw`) * 6.28) % (Math.PI * 2);
  const idade = (ang: number) => ((((sw - ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / VEL;
  const ecos = useMemo(
    () =>
      new Array(46).fill(0).map((_, i) => ({
        a: random(`${semente}-ea-${i}`) * Math.PI * 2,
        r: Math.sqrt(random(`${semente}-er-${i}`)) * R,
        quente: random(`${semente}-eq-${i}`) > 0.93,
      })),
    [semente, R],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={`rastro-${semente}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={eco} stopOpacity={0.5} />
            <stop offset="1" stopColor={eco} stopOpacity={0} />
          </linearGradient>
          <filter id={`bloom-${semente}`}>
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`ppi-${semente}`}>
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>
        <g filter={`url(#bloom-${semente})`}>
          <circle cx={cx} cy={cy} r={R} fill="#03070c" stroke={eco} strokeOpacity={0.28} strokeWidth={1.5} />
          {[0.25, 0.5, 0.75].map((k) => (
            <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke={eco} strokeOpacity={0.09} />
          ))}
          {new Array(12).fill(0).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke={eco} strokeOpacity={0.05} />;
          })}
          {new Array(72).fill(0).map((_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const l = i % 6 ? 8 : 18;
            return <line key={`k${i}`} x1={cx + Math.cos(a) * R} y1={cy + Math.sin(a) * R} x2={cx + Math.cos(a) * (R + l)} y2={cy + Math.sin(a) * (R + l)} stroke="#96A2B0" strokeOpacity={0.5} />;
          })}
          <g clipPath={`url(#ppi-${semente})`}>
            {ecos.map((e, i) => (
              <circle
                key={i}
                cx={cx + Math.cos(e.a) * e.r}
                cy={cy + Math.sin(e.a) * e.r}
                r={e.quente ? 4 : 1.8}
                fill={e.quente ? T.cor.ouro : eco}
                opacity={(e.quente ? 0.25 : 0.05) + (e.quente ? 0.7 : 0.55) * Math.exp(-idade(e.a) / (e.quente ? 2 : 0.8))}
              />
            ))}
            <path
              d={`M${cx} ${cy} L${cx + Math.cos(sw) * R} ${cy + Math.sin(sw) * R} A${R} ${R} 0 0 0 ${cx + Math.cos(sw - 0.6) * R} ${cy + Math.sin(sw - 0.6) * R}Z`}
              fill={`url(#rastro-${semente})`}
              opacity={0.22}
            />
            <line x1={cx} y1={cy} x2={cx + Math.cos(sw) * R} y2={cy + Math.sin(sw) * R} stroke="#fff" strokeOpacity={0.55} strokeWidth={2} />
          </g>
        </g>
      </svg>
      <Vinheta forca={0.75} />
    </AbsoluteFill>
  );
};

/** INVESTIGAÇÃO VISUAL: preto grafite liso, quadrícula fina de prancheta e marcas de registro. */
const FundoInvestigacao: React.FC<{ semente: string }> = () => {
  const T = useTema();
  const { width, height } = useVideoConfig();
  const passo = 60;
  return (
    <AbsoluteFill style={{ backgroundColor: T.cor.fundo }}>
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {new Array(Math.ceil(width / passo) + 1).fill(0).map((_, i) => (
          <line key={`v${i}`} x1={i * passo} y1={0} x2={i * passo} y2={height} stroke="#2E3238" strokeOpacity={i % 4 === 0 ? 0.55 : 0.22} />
        ))}
        {new Array(Math.ceil(height / passo) + 1).fill(0).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * passo} x2={width} y2={i * passo} stroke="#2E3238" strokeOpacity={i % 4 === 0 ? 0.55 : 0.22} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(20,22,25,0) 40%, rgba(5,6,7,0.85) 100%)' }} />
    </AbsoluteFill>
  );
};

// ---------- molduras da tela (só nas cenas com fundo do tema) ----------

const MEANDRO_PASSO = 40;
const meandro = (x0: number, y0: number, largura: number, a: number) => {
  // gregas: uma "chave" a cada 40 px, altura a
  const s = a / 4;
  let d = '';
  for (let x = x0; x < x0 + largura - MEANDRO_PASSO + 1; x += MEANDRO_PASSO) {
    d += `M${x},${y0 + a} L${x},${y0} L${x + 3 * s},${y0} L${x + 3 * s},${y0 + 3 * s} L${x + s},${y0 + 3 * s} L${x + s},${y0 + s} L${x + 2 * s},${y0 + s} L${x + 2 * s},${y0 + 2 * s} `;
    d += `M${x},${y0 + a} L${x + MEANDRO_PASSO},${y0 + a} `;
  }
  return d;
};

const Canto: React.FC<{ x: number; y: number; sx: number; sy: number; children: React.ReactNode }> = ({ x, y, sx, sy, children }) => (
  <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>{children}</g>
);

const CANTOS = (w: number, h: number, m: number) => [
  { x: m, y: m, sx: 1, sy: 1 },
  { x: w - m, y: m, sx: -1, sy: 1 },
  { x: m, y: h - m, sx: 1, sy: -1 },
  { x: w - m, y: h - m, sx: -1, sy: -1 },
];

export const OrnamentoTela: React.FC = () => {
  const T = useTema();
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const o = T.ornamento;
  if (o === 'nenhum' || o === 'dossie') return null;
  const ouro = T.cor.ouro;
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {o === 'filigrana' && (
        <g fill="none" stroke={ouro}>
          <rect x={34} y={34} width={w - 68} height={h - 68} strokeOpacity={0.55} strokeWidth={1.5} />
          <rect x={44} y={44} width={w - 88} height={h - 88} strokeOpacity={0.3} strokeWidth={1} />
          {CANTOS(w, h, 34).map((c, i) => (
            <Canto key={i} {...c}>
              <path d="M0,70 C0,30 30,0 70,0" strokeOpacity={0.8} strokeWidth={2} />
              <path d="M18,95 C14,50 50,14 95,18" strokeOpacity={0.55} strokeWidth={1.4} />
              <path d="M30,30 C48,20 60,36 46,46 C36,54 26,42 36,36" strokeOpacity={0.75} strokeWidth={1.6} />
              <circle cx={30} cy={30} r={5} fill={ouro} fillOpacity={0.7} stroke="none" />
              <path d="M70,0 C90,4 104,16 120,10 M0,70 C4,90 16,104 10,120" strokeOpacity={0.5} strokeWidth={1.2} />
            </Canto>
          ))}
          <path d={`M${w / 2 - 90},34 C${w / 2 - 40},34 ${w / 2 - 20},58 ${w / 2},58 C${w / 2 + 20},58 ${w / 2 + 40},34 ${w / 2 + 90},34`} strokeOpacity={0.6} strokeWidth={1.4} />
          <path d={FLOR_DE_LIS} transform={`translate(${w / 2} ${h - 60}) scale(0.55)`} fill={ouro} fillOpacity={0.6} stroke="none" />
        </g>
      )}
      {o === 'militar' && (
        <g>
          {CANTOS(w, h, 40).map((c, i) => (
            <Canto key={i} {...c}>
              <path d="M0,60 L0,0 L60,0" fill="none" stroke={T.cor.branco} strokeOpacity={0.5} strokeWidth={3} />
              <path d="M12,30 L12,12 L30,12" fill="none" stroke={ouro} strokeOpacity={0.6} strokeWidth={1.5} />
            </Canto>
          ))}
          <text x={w - 46} y={h - 50} textAnchor="end" fontFamily={T.fonte.titulo} fontSize={15} letterSpacing={3} fill={T.cor.branco} fillOpacity={0.35}>
            QUADRÍCULA 32T · ESC 1:50.000
          </text>
        </g>
      )}
      {o === 'sonar' && (
        <g fill="none" stroke={T.cor.azul} strokeOpacity={0.45}>
          {CANTOS(w, h, 48).map((c, i) => (
            <Canto key={i} {...c}>
              <path d="M0,34 L0,0 L34,0" strokeWidth={1.5} />
            </Canto>
          ))}
        </g>
      )}
      {o === 'investigacao' && (
        <g stroke="#8B9097" strokeOpacity={0.55} strokeWidth={1.2}>
          {CANTOS(w, h, 56).map((c, i) => (
            <Canto key={i} {...c}>
              <line x1={-12} y1={0} x2={12} y2={0} />
              <line x1={0} y1={-12} x2={0} y2={12} />
            </Canto>
          ))}
          <rect x={56} y={h / 2 - 10} width={4} height={20} fill={T.cor.vermelho} stroke="none" />
        </g>
      )}
      {o === 'faixas' && (
        <g>
          <rect x={0} y={0} width={w} height={16} fill={T.cor.vermelho} fillOpacity={0.85} />
          <rect x={0} y={22} width={w} height={2} fill={T.cor.vermelho} fillOpacity={0.6} />
          <rect x={0} y={h - 16} width={w} height={16} fill={T.cor.vermelho} fillOpacity={0.85} />
          <rect x={0} y={h - 24} width={w} height={2} fill={T.cor.vermelho} fillOpacity={0.6} />
        </g>
      )}
      {o === 'hud' && (
        <g fill="none" stroke={ouro} strokeOpacity={0.7}>
          {CANTOS(w, h, 46).map((c, i) => (
            <Canto key={i} {...c}>
              <path d="M0,46 L0,0 L46,0" strokeWidth={2.5} />
            </Canto>
          ))}
          {new Array(41).fill(0).map((_, i) => {
            const x = w / 2 - 400 + i * 20 - ((frame * 0.6) % 20);
            return <line key={i} x1={x} y1={52} x2={x} y2={i % 5 === 0 ? 70 : 62} strokeOpacity={0.4} />;
          })}
          <path d={`M${w / 2 - 8},80 L${w / 2},72 L${w / 2 + 8},80`} strokeWidth={2} />
        </g>
      )}
      {o === 'nautico' && (
        <g fill="none" stroke={ouro}>
          <rect x={36} y={36} width={w - 72} height={h - 72} strokeOpacity={0.4} strokeWidth={1.2} />
          <rect x={30} y={30} width={w - 60} height={h - 60} strokeOpacity={0.3} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" />
          {CANTOS(w, h, 36).map((c, i) => (
            <Canto key={i} {...c}>
              <circle cx={0} cy={0} r={10} strokeOpacity={0.6} strokeWidth={1.5} />
              <circle cx={0} cy={0} r={4} fill={ouro} fillOpacity={0.6} stroke="none" />
            </Canto>
          ))}
        </g>
      )}
      {o === 'meandro' && (
        <g fill="none" stroke={ouro} strokeOpacity={0.5} strokeWidth={3}>
          <path d={meandro(40, 30, w - 80, 28)} />
          <path d={meandro(40, h - 58, w - 80, 28)} />
          <line x1={40} y1={24} x2={w - 40} y2={24} strokeWidth={1.5} />
          <line x1={40} y1={h - 24} x2={w - 40} y2={h - 24} strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
};

// ---------- enfeite dos cartões de papel ----------

/** Vai DENTRO de um cartão de papel (position: relative). Desenha o enfeite do tema por cima das bordas. */
export const OrnamentoCartao: React.FC = () => {
  const T = useTema();
  const o = T.ornamento;
  const abs: React.CSSProperties = { position: 'absolute', pointerEvents: 'none' };
  if (o === 'nenhum' || o === 'hud') return null;
  if (o === 'sonar')
    return (
      <>
        {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
          <div
            key={k}
            style={{
              ...abs,
              [k[0] === 't' ? 'top' : 'bottom']: -6,
              [k[1] === 'l' ? 'left' : 'right']: -6,
              width: 22,
              height: 22,
              [k[0] === 't' ? 'borderTop' : 'borderBottom']: `2px solid ${T.cor.azul}`,
              [k[1] === 'l' ? 'borderLeft' : 'borderRight']: `2px solid ${T.cor.azul}`,
            }}
          />
        ))}
      </>
    );
  if (o === 'investigacao')
    return <div style={{ ...abs, top: -26, left: 0, width: 8, height: 16, background: T.cor.vermelho }} />;
  if (o === 'filigrana')
    return (
      <>
        <div style={{ ...abs, inset: 6, border: `2px solid ${T.cor.papelBorda}` }} />
        <div style={{ ...abs, inset: 12, border: `1px solid ${T.cor.papelBorda}`, opacity: 0.7 }} />
        {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
          <svg key={k} width={46} height={46} viewBox="0 0 46 46" style={{ ...abs, [k[0] === 't' ? 'top' : 'bottom']: 2, [k[1] === 'l' ? 'left' : 'right']: 2, transform: `scale(${k[1] === 'l' ? 1 : -1}, ${k[0] === 't' ? 1 : -1})` }}>
            <path d="M6,40 C6,20 20,6 40,6 M14,30 C20,22 26,24 24,30 C22,34 16,32 18,28" fill="none" stroke={T.cor.ouro} strokeWidth={2} />
            <circle cx={11} cy={11} r={3.5} fill={T.cor.ouro} />
          </svg>
        ))}
      </>
    );
  if (o === 'militar')
    return (
      <>
        <div style={{ ...abs, left: 0, right: 0, top: 0, height: 7, background: `repeating-linear-gradient(45deg, ${T.cor.verde} 0 14px, #2a2e22 14px 28px)`, opacity: 0.75 }} />
        {[
          { top: 16, left: 14 },
          { top: 16, right: 14 },
          { bottom: 12, left: 14 },
          { bottom: 12, right: 14 },
        ].map((p, i) => (
          <div key={i} style={{ ...abs, ...p, width: 11, height: 11, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #d8d2bf, #6d6650 70%)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
        ))}
      </>
    );
  if (o === 'faixas')
    return (
      <>
        <div style={{ ...abs, left: 0, top: 0, bottom: 0, width: 10, background: T.cor.vermelho }} />
        <div style={{ ...abs, right: 0, top: 0, width: 0, height: 0, borderTop: `56px solid ${T.cor.vermelho}`, borderLeft: '56px solid transparent' }} />
      </>
    );
  if (o === 'nautico')
    return (
      <>
        <div style={{ ...abs, inset: 7, border: `1px solid ${T.cor.papelBorda}` }} />
        <div style={{ ...abs, inset: 11, border: `1px dashed ${T.cor.papelBorda}`, opacity: 0.8 }} />
      </>
    );
  if (o === 'meandro') {
    const faixa = (lado: 'top' | 'bottom') => (
      <svg key={lado} width="100%" height={18} style={{ ...abs, left: 0, [lado]: 6 }} preserveAspectRatio="none">
        <defs>
          <pattern id={`mc-${lado}`} width={24} height={18} patternUnits="userSpaceOnUse">
            <path d="M0,16 L0,2 L18,2 L18,14 L6,14 L6,8 L12,8 M0,16 L24,16" fill="none" stroke={T.cor.ouro} strokeWidth={2} />
          </pattern>
        </defs>
        <rect width="100%" height={18} fill={`url(#mc-${lado})`} />
      </svg>
    );
    return <>{faixa('top')}{faixa('bottom')}</>;
  }
  // dossie: duas fitas adesivas e um clipe
  return (
    <>
      <div style={{ ...abs, top: -14, left: 40, width: 120, height: 32, background: 'rgba(240,230,190,0.6)', transform: 'rotate(-6deg)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      <div style={{ ...abs, top: -14, right: 40, width: 120, height: 32, background: 'rgba(240,230,190,0.6)', transform: 'rotate(5deg)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      <svg width={30} height={70} style={{ ...abs, top: -22, left: '50%' }}>
        <path d="M8,64 L8,12 C8,4 22,4 22,12 L22,54 C22,60 14,60 14,54 L14,18" fill="none" stroke="#8a8f96" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </>
  );
};

// ---------- o fundo ----------

/** Fundo das cenas sem material real. Desenha o fundo do tema ativo e a moldura da tela. */
export const FundoDoc: React.FC<{ semente?: string; moldura?: boolean }> = ({ semente = 'doc', moldura = true }) => {
  const T = useTema();
  const F = {
    estrelas: FundoEstrelas,
    sonar: FundoSonar,
    investigacao: FundoInvestigacao,
    fumaca: FundoFumaca,
    damasco: FundoDamasco,
    propaganda: FundoPropaganda,
    radar: FundoRadar,
    oceano: FundoOceano,
    pedra: FundoPedra,
    noir: FundoNoir,
  }[T.fundo] ?? FundoEstrelas;
  return (
    <AbsoluteFill>
      <F semente={semente} />
      {moldura && <OrnamentoTela />}
    </AbsoluteFill>
  );
};
