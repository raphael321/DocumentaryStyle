// DocumentaryStyle: cena 3D com motion graphics (Remotion + @remotion/three + three.js).
// Mapa em relevo com países que sobem, áreas (enchente, zona ocupada), colunas, pinos, arcos de rota,
// fotos reais em placas no espaço e modelos .glb. Câmera 3D que orbita e mergulha.
// Dependências extras (uma vez por projeto): npm i @remotion/three@<mesma versão do remotion> three @react-three/fiber @types/three
import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { COR, FONTE, SOMBRA_TEXTO } from './tema';
import { Granulacao, arquivo, carregarImagem, carregarJson, mola, surgir, useRecurso } from './base';
import { ARQUIVO_PAISES, type LonLat } from './geo';

// ---------- tipos ----------

/** Quadro de câmera. `distancia` em km até o alvo; `inclinacao` 0 = olhando de cima, 75 = quase rasante; `giro` 0 = olhando para o norte. */
export type QuadroCamera3D = { t: number; lon: number; lat: number; distancia: number; inclinacao?: number; giro?: number };

type Entrada = { aos?: number };
export type Pais3D = Entrada & { iso: string; cor?: string; altura?: number; borda?: string; lateral?: string };
export type Area3D = Entrada & { pontos: LonLat[]; cor?: string; altura?: number; opacidade?: number; dur?: number; base?: number };
export type Coluna3D = Entrada & { lon: number; lat: number; valor: number; rotulo?: string; sub?: string; cor?: string; raio?: number };
export type Pino3D = Entrada & { lon: number; lat: number; rotulo?: string; sub?: string; cor?: string; altura?: number };
export type Rota3D = Entrada & { pontos: LonLat[]; dur?: number; cor?: string; arco?: number; largura?: number; ponta?: boolean };
export type Foto3D = Entrada & {
  src: string; lon: number; lat: number; altura?: number; largura?: number; elevacao?: number;
  /** graus; omitido = a placa sempre vira para a câmera */
  giro?: number; legenda?: string; credito?: string;
};
export type Modelo3D = Entrada & { src: string; lon: number; lat: number; escala?: number; elevacao?: number; giro?: number; girarPorSeg?: number };
export type Chao3D = { src: string; oeste: number; sul: number; leste: number; norte: number; escurecer?: number };

export type Cena3DProps = {
  /** ponto (lon, lat) que vira a origem do mundo 3D; normalmente o centro da região */
  centro: LonLat;
  camera: QuadroCamera3D[];
  paises?: Pais3D[];
  areas?: Area3D[];
  colunas?: Coluna3D[];
  pinos?: Pino3D[];
  rotas?: Rota3D[];
  fotos?: Foto3D[];
  modelos?: Modelo3D[];
  /** imagem de satélite/mapa antigo deitada no chão (caixa em graus) */
  chao?: Chao3D;
  /** altura (km de cena) da coluna com valor 1 */
  alturaColunas?: number;
  titulo?: { texto: string; sub?: string; aos?: number; /** segundos em que o título sai (padrão: fica até o fim) */ ate?: number };
  /** neblina para dar profundidade (padrão true) */
  neblina?: boolean;
  /** granulação de filme por cima (padrão 0.05; 0 desliga) */
  graos?: number;
  /** grade sutil no chão (padrão true) */
  grade?: boolean;
  fov?: number;
};

// ---------- geometria ----------

const KM_LAT = 110.57;
const kmLon = (lat0: number) => 111.32 * Math.cos((lat0 * Math.PI) / 180);
/** lon/lat → coordenadas da cena em km (x = leste, z = sul). */
const paraCena = (centro: LonLat, [lon, lat]: LonLat): [number, number] => [(lon - centro[0]) * kmLon(centro[1]), -(lat - centro[1]) * KM_LAT];

const segmento = (quadros: QuadroCamera3D[], seg: number): [QuadroCamera3D, QuadroCamera3D, number] => {
  if (quadros.length === 1 || seg <= quadros[0].t) return [quadros[0], quadros[0], 0];
  for (let i = 0; i < quadros.length - 1; i++) {
    const a = quadros[i], b = quadros[i + 1];
    if (seg <= b.t) return [a, b, interpolate(seg, [a.t, b.t], [0, 1], { easing: Easing.inOut(Easing.cubic) })];
  }
  const u = quadros[quadros.length - 1];
  return [u, u, 0];
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const camera3DNoTempo = (quadros: QuadroCamera3D[], seg: number, centro: LonLat) => {
  const [a, b, p] = segmento(quadros, seg);
  const lon = lerp(a.lon, b.lon, p), lat = lerp(a.lat, b.lat, p);
  const d = Math.exp(lerp(Math.log(a.distancia), Math.log(b.distancia), p));
  const inc = (lerp(a.inclinacao ?? 45, b.inclinacao ?? 45, p) * Math.PI) / 180;
  const giro = (lerp(a.giro ?? 0, b.giro ?? 0, p) * Math.PI) / 180;
  const [tx, tz] = paraCena(centro, [lon, lat]);
  const h = d * Math.sin(inc);
  return {
    alvo: new THREE.Vector3(tx, 0, tz),
    pos: new THREE.Vector3(tx - h * Math.sin(giro), d * Math.cos(inc), tz + h * Math.cos(giro)),
    distancia: d,
  };
};

const formaDeAneis = (centro: LonLat, aneis: LonLat[][]) => {
  const vec = (ll: LonLat) => {
    const [x, z] = paraCena(centro, ll);
    return new THREE.Vector2(x, -z);
  };
  const forma = new THREE.Shape(aneis[0].map(vec));
  for (const furo of aneis.slice(1)) forma.holes.push(new THREE.Path(furo.map(vec)));
  return forma;
};

type Feicao = { properties: Record<string, any>; geometry: { type: string; coordinates: any } | null };

const poligonosDoPais = (geo: { features: Feicao[] }, iso: string): LonLat[][][] => {
  const f = geo.features.find((x) => String(x.properties.ADM0_A3 ?? x.properties.ISO_A3) === iso);
  if (!f?.geometry) return [];
  if (f.geometry.type === 'Polygon') return [f.geometry.coordinates];
  if (f.geometry.type === 'MultiPolygon') return f.geometry.coordinates;
  return [];
};

// ---------- peças da cena (dentro do canvas) ----------

const CameraRig: React.FC<{ pos: THREE.Vector3; alvo: THREE.Vector3; fov: number }> = ({ pos, alvo, fov }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    cam.fov = fov;
    cam.near = 0.5;
    cam.far = 50000;
    cam.position.copy(pos);
    cam.lookAt(alvo);
    cam.updateProjectionMatrix();
  });
  return null;
};

/** Sobe de 0 a 1 com mola (sem passar de 1 visivelmente). */
const subida = (frame: number, fps: number, aos = 0) => Math.max(0.0001, Math.min(1.02, mola(frame, fps, aos, 90, 15)));

const Extrudado: React.FC<{
  formas: THREE.Shape[]; altura: number; cor: string; lateral?: string; borda?: string; opacidade?: number;
  escalaY: number; base?: number; sombra?: boolean;
}> = ({ formas, altura, cor, lateral, borda, opacidade = 1, escalaY, base = 0, sombra = true }) => {
  const geom = useMemo(
    () => new THREE.ExtrudeGeometry(formas, { depth: altura, bevelEnabled: true, bevelThickness: altura * 0.12, bevelSize: 0.5, bevelSegments: 2, curveSegments: 4 }),
    [formas, altura],
  );
  const bordas = useMemo(() => (borda ? new THREE.EdgesGeometry(geom, 35) : null), [geom, borda]);
  const transp = opacidade < 1;
  return (
    <group position={[0, base, 0]} scale={[1, escalaY, 1]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geom} castShadow={sombra && !transp} receiveShadow>
          <meshStandardMaterial attach="material-0" color={cor} roughness={0.85} transparent={transp} opacity={opacidade} />
          <meshStandardMaterial attach="material-1" color={lateral ?? new THREE.Color(cor).multiplyScalar(0.62).getStyle()} roughness={0.9} transparent={transp} opacity={opacidade} />
        </mesh>
        {bordas && (
          <lineSegments geometry={bordas}>
            <lineBasicMaterial color={borda} transparent opacity={0.85} />
          </lineSegments>
        )}
      </group>
    </group>
  );
};

const Arco: React.FC<{ r: Rota3D; centro: LonLat; seg: number }> = ({ r, centro, seg }) => {
  const largura = r.largura ?? 1.6;
  const { curva, geom, total } = useMemo(() => {
    const pts = r.pontos.map((ll) => paraCena(centro, ll));
    let comp = 0;
    for (let i = 1; i < pts.length; i++) comp += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const arco = r.arco ?? comp * 0.22;
    const amostras: THREE.Vector3[] = [];
    const n = 60;
    const linha = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    for (let i = 0; i <= n; i++) {
      const p = linha.getPoint(i / n);
      p.y = 1.5 + Math.sin((Math.PI * i) / n) * arco;
      amostras.push(p);
    }
    const c = new THREE.CatmullRomCurve3(amostras);
    const tubular = 220, radial = 10;
    const g = new THREE.TubeGeometry(c, tubular, largura, radial, false);
    return { curva: c, geom: g, total: tubular * radial * 6 };
  }, [r, centro, largura]);
  const p = interpolate(seg, [r.aos ?? 0, (r.aos ?? 0) + (r.dur ?? 1.6)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  });
  geom.setDrawRange(0, Math.floor((total * p) / 60) * 60);
  if (p <= 0) return null;
  const cabeca = curva.getPointAt(Math.min(0.999, p));
  const tang = curva.getTangentAt(Math.min(0.999, p));
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang.normalize());
  const cor = r.cor ?? COR.vermelho;
  return (
    <group>
      <mesh geometry={geom}>
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.35} roughness={0.5} />
      </mesh>
      {(r.ponta ?? true) && (
        <mesh position={cabeca} quaternion={quat}>
          <coneGeometry args={[largura * 3.2, largura * 8, 20]} />
          <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.35} />
        </mesh>
      )}
    </group>
  );
};

const PlacaFoto: React.FC<{ f: Foto3D; img: HTMLImageElement; centro: LonLat; frame: number; fps: number; camPos: THREE.Vector3 }> = ({ f, img, centro, frame, fps, camPos }) => {
  const tex = useMemo(() => {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [img]);
  const largura = f.largura ?? 60;
  const alt = f.altura ?? (largura * img.naturalHeight) / img.naturalWidth;
  const [x, z] = paraCena(centro, [f.lon, f.lat]);
  const s = subida(frame, fps, f.aos ?? 0);
  const yBase = (f.elevacao ?? 8) + alt / 2;
  const giro = f.giro !== undefined ? (f.giro * Math.PI) / 180 : Math.atan2(camPos.x - x, camPos.z - z);
  const borda = largura * 0.035;
  return (
    <group position={[x, yBase * s + (1 - s) * -alt * 0.2, z]} rotation={[0, giro, 0]} scale={[s, s, s]}>
      <mesh position={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[largura + borda * 2, alt + borda * 2, 0.6]} />
        <meshStandardMaterial color={COR.papel} roughness={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[largura, alt]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};

const ModeloGlb: React.FC<{ m: Modelo3D; cena: THREE.Object3D; centro: LonLat; frame: number; fps: number }> = ({ m, cena, centro, frame, fps }) => {
  const obj = useMemo(() => cena.clone(true), [cena]);
  useMemo(() => obj.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o.castShadow = true), (o.receiveShadow = true)) : null)), [obj]);
  const [x, z] = paraCena(centro, [m.lon, m.lat]);
  const s = subida(frame, fps, m.aos ?? 0) * (m.escala ?? 1);
  const giro = (((m.giro ?? 0) + (m.girarPorSeg ?? 0) * (frame / fps)) * Math.PI) / 180;
  return <primitive object={obj} position={[x, m.elevacao ?? 0, z]} rotation={[0, giro, 0]} scale={[s, s, s]} />;
};

// ---------- componente ----------

type Rotulo = { id: string; pos: THREE.Vector3; texto?: string; sub?: string; cor: string; op: number; grande?: boolean };

export const Cena3D: React.FC<Cena3DProps> = (props) => {
  const {
    centro, camera, paises = [], areas = [], colunas = [], pinos = [], rotas = [], fotos = [], modelos = [], chao,
    alturaColunas = 70, titulo, neblina = true, graos = 0.05, grade = true, fov = 34,
  } = props;
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const seg = frame / fps;

  const chave = JSON.stringify([paises.map((p) => p.iso), fotos.map((f) => f.src), modelos.map((m) => m.src), chao?.src]);
  const rec = useRecurso(chave, async () => {
    const geo = paises.length ? await carregarJson<{ features: Feicao[] }>(ARQUIVO_PAISES) : { features: [] };
    const imgs = await Promise.all(fotos.map((f) => carregarImagem(f.src)));
    const loader = new GLTFLoader();
    const glbs = await Promise.all(modelos.map((m) => loader.loadAsync(arquivo(m.src)).then((g) => g.scene)));
    const imgChao = chao ? await carregarImagem(chao.src) : null;
    return { geo, imgs, glbs, imgChao };
  });

  const formasPaises = useMemo(
    () => (rec ? paises.map((p) => poligonosDoPais(rec.geo, p.iso).map((pol) => formaDeAneis(centro, pol))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rec, JSON.stringify(paises.map((p) => p.iso)), centro[0], centro[1]],
  );
  const formasAreas = useMemo(
    () => areas.map((a) => [formaDeAneis(centro, [a.pontos])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(areas.map((a) => a.pontos)), centro[0], centro[1]],
  );
  const texChao = useMemo(() => {
    if (!rec?.imgChao) return null;
    const t = new THREE.Texture(rec.imgChao);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [rec]);

  const cam = camera3DNoTempo(camera, seg, centro);
  if (!rec) return null;

  // rótulos em HTML: projeta o ponto 3D na tela com uma câmera igual à da cena
  const proj = new THREE.PerspectiveCamera(fov, width / height, 0.5, 50000);
  proj.position.copy(cam.pos);
  proj.lookAt(cam.alvo);
  proj.updateMatrixWorld();
  proj.updateProjectionMatrix();
  const naTela = (v: THREE.Vector3) => {
    const p = v.clone().project(proj);
    return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height, atras: p.z > 1 };
  };

  const rotulos: Rotulo[] = [];
  pinos.forEach((p, i) => {
    const [x, z] = paraCena(centro, [p.lon, p.lat]);
    const h = p.altura ?? 22;
    if (p.rotulo) rotulos.push({ id: `p${i}`, pos: new THREE.Vector3(x, h + 6, z), texto: p.rotulo, sub: p.sub, cor: p.cor ?? COR.vermelho, op: surgir(frame, fps, (p.aos ?? 0) + 0.35, 0.4) });
  });
  colunas.forEach((c, i) => {
    const [x, z] = paraCena(centro, [c.lon, c.lat]);
    const s = subida(frame, fps, c.aos ?? 0);
    if (c.rotulo) rotulos.push({ id: `c${i}`, pos: new THREE.Vector3(x, c.valor * alturaColunas * s + 6, z), texto: c.rotulo, sub: c.sub, cor: c.cor ?? COR.ouro, op: surgir(frame, fps, (c.aos ?? 0) + 0.5, 0.4), grande: true });
  });
  fotos.forEach((f, i) => {
    if (!f.legenda) return;
    const [x, z] = paraCena(centro, [f.lon, f.lat]);
    rotulos.push({ id: `f${i}`, pos: new THREE.Vector3(x, (f.elevacao ?? 8) - 2, z), texto: f.legenda, cor: COR.ouro, op: surgir(frame, fps, (f.aos ?? 0) + 0.6, 0.4) });
  });
  const creditos = fotos.filter((f, i) => f.credito && seg >= (fotos[i].aos ?? 0)).map((f) => f.credito!);

  const dNeblina = cam.distancia;

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov, near: 0.5, far: 50000 }}>
        <CameraRig pos={cam.pos} alvo={cam.alvo} fov={fov} />
        <color attach="background" args={[COR.fundo]} />
        {neblina && <fog attach="fog" args={[COR.fundo, dNeblina * 1.1, dNeblina * 3.2]} />}
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#dfe8ff', '#0c1420', 0.55]} />
        <directionalLight
          position={[cam.alvo.x - 300, 600, cam.alvo.z - 200]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
          shadow-camera-near={1}
          shadow-camera-far={3000}
          shadow-bias={-0.0004}
        >
          <object3D attach="target" position={[cam.alvo.x, 0, cam.alvo.z]} />
        </directionalLight>

        {/* mar / chão */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
          <planeGeometry args={[20000, 20000]} />
          <meshStandardMaterial color="#132a44" roughness={0.95} />
        </mesh>
        {grade && <gridHelper args={[4000, 160, '#2b4566', '#1d3452']} position={[0, 0, 0]} />}
        {chao && texChao && (() => {
          const [x0, z0] = paraCena(centro, [chao.oeste, chao.norte]);
          const [x1, z1] = paraCena(centro, [chao.leste, chao.sul]);
          return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.05, (z0 + z1) / 2]} receiveShadow>
              <planeGeometry args={[x1 - x0, z1 - z0]} />
              <meshStandardMaterial map={texChao} color={new THREE.Color(1, 1, 1).multiplyScalar(1 - (chao.escurecer ?? 0.15))} roughness={1} />
            </mesh>
          );
        })()}

        {paises.map((p, i) => (
          <Extrudado key={`pais${i}`} formas={formasPaises[i] ?? []} altura={p.altura ?? 4} cor={p.cor ?? COR.papel} lateral={p.lateral}
            borda={p.borda ?? COR.ouro} escalaY={subida(frame, fps, p.aos ?? 0)} />
        ))}
        {areas.map((a, i) => {
          if (seg < (a.aos ?? 0)) return null;
          const pr = interpolate(seg, [a.aos ?? 0, (a.aos ?? 0) + (a.dur ?? 1.4)], [0.0001, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
          return (
            <Extrudado key={`area${i}`} formas={formasAreas[i]} altura={a.altura ?? 6} cor={a.cor ?? COR.azul} opacidade={a.opacidade ?? 0.78}
              borda="#cfe3ff" escalaY={pr} base={a.base ?? 0.1} sombra={false} />
          );
        })}
        {colunas.map((c, i) => {
          const [x, z] = paraCena(centro, [c.lon, c.lat]);
          const h = Math.max(0.01, c.valor * alturaColunas * subida(frame, fps, c.aos ?? 0));
          const r = c.raio ?? 7;
          return (
            <mesh key={`col${i}`} position={[x, h / 2, z]} castShadow>
              <cylinderGeometry args={[r, r, h, 40]} />
              <meshStandardMaterial color={c.cor ?? COR.ouro} roughness={0.45} metalness={0.25} />
            </mesh>
          );
        })}
        {pinos.map((p, i) => {
          const [x, z] = paraCena(centro, [p.lon, p.lat]);
          const h = p.altura ?? 22;
          const s = subida(frame, fps, p.aos ?? 0);
          const cor = p.cor ?? COR.vermelho;
          const pulso = ((seg - (p.aos ?? 0)) % 1.6) / 1.6;
          return (
            <group key={`pin${i}`} position={[x, (1 - s) * 60, z]} visible={seg >= (p.aos ?? 0)}>
              <mesh position={[0, h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.7, h, 12]} />
                <meshStandardMaterial color="#f6f2e9" />
              </mesh>
              <mesh position={[0, h, 0]} castShadow>
                <sphereGeometry args={[3.6, 32, 16]} />
                <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.3} roughness={0.35} />
              </mesh>
              {seg >= (p.aos ?? 0) && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} scale={[1 + pulso * 4, 1 + pulso * 4, 1]}>
                  <ringGeometry args={[3, 4.2, 48]} />
                  <meshBasicMaterial color={cor} transparent opacity={(1 - pulso) * 0.8} />
                </mesh>
              )}
            </group>
          );
        })}
        {rotas.map((r, i) => <Arco key={`rota${i}`} r={r} centro={centro} seg={seg} />)}
        {fotos.map((f, i) => seg >= (f.aos ?? 0) && <PlacaFoto key={`foto${i}`} f={f} img={rec.imgs[i]} centro={centro} frame={frame} fps={fps} camPos={cam.pos} />)}
        {modelos.map((m, i) => seg >= (m.aos ?? 0) && <ModeloGlb key={`mod${i}`} m={m} cena={rec.glbs[i]} centro={centro} frame={frame} fps={fps} />)}
      </ThreeCanvas>

      {/* rótulos e títulos em HTML (fontes do estilo, nítidos em qualquer resolução) */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {rotulos.map((r) => {
          const t = naTela(r.pos);
          if (t.atras || r.op <= 0) return null;
          return (
            <div key={r.id} style={{ position: 'absolute', left: t.x, top: t.y, transform: `translate(-50%, -100%) translateY(${(1 - r.op) * 14}px)`, opacity: r.op, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div style={{ fontFamily: FONTE.sans, fontWeight: 800, fontSize: r.grande ? 54 : 44, color: COR.branco, textTransform: 'uppercase', letterSpacing: 1, textShadow: SOMBRA_TEXTO, lineHeight: 1.05 }}>{r.texto}</div>
              {r.sub && <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: 34, color: COR.branco, textShadow: SOMBRA_TEXTO, marginTop: 2 }}>{r.sub}</div>}
              <div style={{ width: 54, height: 5, background: r.cor, margin: '8px auto 0' }} />
            </div>
          );
        })}
        {titulo && (() => {
          const op = surgir(frame, fps, titulo.aos ?? 0.2, 0.6) * (titulo.ate !== undefined ? 1 - surgir(frame, fps, titulo.ate, 0.5) : 1);
          if (op <= 0) return null;
          return (
            <div style={{ position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center', opacity: op, transform: `translateY(${(1 - op) * -20}px)` }}>
              <div style={{ fontFamily: FONTE.serif, fontWeight: 600, fontSize: 92, color: COR.branco, letterSpacing: 6, textTransform: 'uppercase', textShadow: SOMBRA_TEXTO }}>{titulo.texto}</div>
              {titulo.sub && <div style={{ fontFamily: FONTE.serif, fontStyle: 'italic', fontSize: 44, color: COR.ouro, textShadow: SOMBRA_TEXTO }}>{titulo.sub}</div>}
            </div>
          );
        })()}
        {creditos.length > 0 && (
          <div style={{ position: 'absolute', right: 40, bottom: 30, fontFamily: FONTE.sans, fontSize: 20, color: 'rgba(246,242,233,0.7)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
            {Array.from(new Set(creditos)).join(' · ')}
          </div>
        )}
      </AbsoluteFill>
      {graos > 0 && <Granulacao intensidade={graos} />}
    </AbsoluteFill>
  );
};
