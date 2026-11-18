#!/usr/bin/env node
// DocumentaryStyle: baixa o satélite em ALTA resolução (blocos XYZ de 256 px) só onde as câmeras do mapa passam.
// Fonte padrão: Sentinel-2 cloudless 2016, EOX IT Services (https://s2maps.eu), ~10 m/px, licença CC BY 4.0.
// O MapaReal usa os blocos sozinho (lê public/doc/mapa/tiles/indice.json) e põe o crédito no canto.
//
// uso (de dentro do projeto Remotion):
//   1) exporte as câmeras do plano:
//      npx tsx -e "import {camerasDoPlano} from './src/doc'; import {PLANO} from './src/<slug>/plano'; console.log(JSON.stringify(camerasDoPlano(PLANO)))" > cameras.json
//   2) veja quanto vai baixar:   node baixar-tiles.mjs --cameras cameras.json --simular
//   3) baixe:                    node baixar-tiles.mjs --cameras cameras.json
// ou à mão:  --camera 10.13,44.64,2.6 --camera 10.13,44.67,2.2   (lon,lat,altura em graus; repita)
// opções:    --saida public/doc/mapa/tiles  --zoom-max 14  --url 'https://.../{z}/{x}/{y}.jpg'  --credito '...'
//            --largura 1920 --altura 1080  --paralelo 8  --lista blocos.txt (grava a lista z/x/y)
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i > -1 ? args[i + 1] : padrao;
};
const todos = (nome) => args.flatMap((a, i) => (a === `--${nome}` ? [args[i + 1]] : []));

const URL_PADRAO = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
const CREDITO_PADRAO = 'Satélite: Sentinel-2 cloudless 2016 · s2maps.eu · EOX IT Services (CC BY 4.0)';
const url = arg('url', URL_PADRAO);
const credito = arg('credito', url === URL_PADRAO ? CREDITO_PADRAO : 'Satélite: ' + new URL(url.replace(/[{}]/g, '')).hostname);
const saida = path.resolve(arg('saida', 'public/doc/mapa/tiles'));
const zoomMax = Number(arg('zoom-max', 14));
const W = Number(arg('largura', 1920)), H = Number(arg('altura', 1080));
const paralelo = Number(arg('paralelo', 8));
const simular = args.includes('--simular');
const ZOOM_MIN = 5, FATOR = 0.8, MARGEM = 1.12;

// ---- câmeras ----
let trajetos = [];
if (arg('cameras')) trajetos = JSON.parse(fs.readFileSync(arg('cameras'), 'utf8'));
const avulsas = todos('camera').map((c) => {
  const [lon, lat, altura] = c.split(',').map(Number);
  return { t: 0, lon, lat, altura };
});
if (avulsas.length) trajetos.push(avulsas);
if (!trajetos.length) {
  console.error('Passe --cameras cameras.json (de camerasDoPlano) ou --camera lon,lat,altura. Veja o topo do arquivo.');
  process.exit(1);
}

// ---- mesma matemática do MapaReal (geo.ts / tiles.ts) ----
const RAD = Math.PI / 180;
const lonX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latY = (lat, z) => {
  const l = Math.max(-85.05, Math.min(85.05, lat)) * RAD;
  return ((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * 2 ** z;
};
const visivel = (c) => {
  const ppd = H / c.altura, sx = ppd * Math.cos(c.lat * RAD);
  const ml = (W / 2 / sx) * MARGEM, mt = (H / 2 / ppd) * MARGEM;
  return { sx, oeste: c.lon - ml, leste: c.lon + ml, sul: c.lat - mt, norte: c.lat + mt };
};
const zoomDe = (sx) => Math.min(zoomMax, Math.ceil(Math.log2((sx * FATOR * 360) / 256)));

const precisa = new Set();
const addCaixa = (v, z) => {
  if (z < ZOOM_MIN) return;
  const n = 2 ** z;
  const x0 = Math.floor(lonX(v.oeste, z)), x1 = Math.floor(lonX(v.leste, z));
  const y0 = Math.max(0, Math.floor(latY(v.norte, z))), y1 = Math.min(n - 1, Math.floor(latY(v.sul, z)));
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) precisa.add(`${z}/${((x % n) + n) % n}/${y}`);
};
for (const quadros of trajetos) {
  const q = [...quadros].sort((a, b) => a.t - b.t);
  const amostras = q.length === 1 ? q : [];
  for (let i = 0; i < q.length - 1; i++) {
    const a = q[i], b = q[i + 1];
    for (let k = 0; k <= 40; k++) {
      const p = k / 40;
      amostras.push({
        lon: a.lon + (b.lon - a.lon) * p,
        lat: a.lat + (b.lat - a.lat) * p,
        altura: Math.exp(Math.log(a.altura) + (Math.log(b.altura) - Math.log(a.altura)) * p),
      });
    }
  }
  for (const c of amostras) {
    const v = visivel(c);
    const z = zoomDe(v.sx);
    addCaixa(v, z);
    addCaixa(v, z - 1); // reserva para a transição de zoom
  }
}

const lista = [...precisa].sort();
const faltam = lista.filter((k) => !fs.existsSync(path.join(saida, `${k}.jpg`)));
const porZoom = {};
for (const k of lista) porZoom[k.split('/')[0]] = (porZoom[k.split('/')[0]] ?? 0) + 1;
console.log(`blocos necessários: ${lista.length} (por zoom: ${Object.entries(porZoom).map(([z, n]) => `z${z}=${n}`).join(' ')})`);
console.log(`faltam baixar: ${faltam.length} (~${Math.round((faltam.length * 28) / 1024)} MB estimados)`);
console.log(`fonte: ${url}\ncrédito: ${credito}`);
if (arg('lista')) fs.writeFileSync(arg('lista'), lista.join('\n'));
if (simular) process.exit(0);

// ---- download ----
let feitos = 0, falhas = 0;
const baixar = async (k) => {
  const [z, x, y] = k.split('/');
  const u = url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'DocumentaryStyle/0.2 (Remotion documentary maps)' } });
      const buf = Buffer.from(await r.arrayBuffer());
      if (!r.ok || buf.length < 100) throw new Error(`HTTP ${r.status}`);
      const arq = path.join(saida, `${k}.jpg`);
      fs.mkdirSync(path.dirname(arq), { recursive: true });
      fs.writeFileSync(arq, buf);
      return;
    } catch (e) {
      if (tentativa === 4) {
        falhas++;
        console.error(`falhou ${k}: ${e.message}`);
      } else await new Promise((r) => setTimeout(r, 500 * 2 ** tentativa));
    }
  }
};
const fila = [...faltam];
await Promise.all(
  Array.from({ length: paralelo }, async () => {
    while (fila.length) {
      await baixar(fila.shift());
      if (++feitos % 50 === 0) console.log(`${feitos}/${faltam.length}`);
    }
  }),
);

// ---- índice (junta com o que já existia) ----
const arqIndice = path.join(saida, 'indice.json');
const antigo = fs.existsSync(arqIndice) ? JSON.parse(fs.readFileSync(arqIndice, 'utf8')) : { tiles: [] };
const existentes = new Set(antigo.tiles);
for (const k of lista) if (fs.existsSync(path.join(saida, `${k}.jpg`))) existentes.add(k);
fs.mkdirSync(saida, { recursive: true });
fs.writeFileSync(arqIndice, JSON.stringify({ url, credito, zoomMax, tiles: [...existentes].sort() }));
console.log(`pronto: ${existentes.size} blocos no índice, ${falhas} falhas. ${arqIndice}`);
