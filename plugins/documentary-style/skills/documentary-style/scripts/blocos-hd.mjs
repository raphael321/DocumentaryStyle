#!/usr/bin/env node
// DocumentaryStyle: corta terra-hd.jpg (21600x10800) em 8x4 blocos de 45° (2700 px) em <pasta>/hd/<col>_<lin>.jpg.
// O navegador do Remotion não aguenta abrir a imagem de 21600 px inteira (a aba cai), então o MapaReal
// carrega só os blocos que aparecem na tela (prop `hd`).
// uso (dentro do projeto Remotion, que já traz o ffmpeg): node blocos-hd.mjs [public/doc/mapa]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const pasta = path.resolve(process.argv[2] ?? 'public/doc/mapa');
const origem = path.join(pasta, 'terra-hd.jpg');
if (!fs.existsSync(origem)) {
  console.error(`Não achei ${origem}. Rode antes: node baixar-mapas.mjs ${pasta} --hd`);
  process.exit(1);
}
const COLS = 8, LINS = 4, LADO = 2700;
const saida = path.join(pasta, 'hd');
fs.mkdirSync(saida, { recursive: true });

const n = COLS * LINS;
const rotulos = Array.from({ length: n }, (_, i) => `b${i}`);
let filtro = `[0:v]split=${n}${rotulos.map((r) => `[${r}]`).join('')}`;
const args = ['remotion', 'ffmpeg', '-y', '-v', 'error', '-i', origem];
const mapas = [];
for (let lin = 0; lin < LINS; lin++) {
  for (let col = 0; col < COLS; col++) {
    const i = lin * COLS + col;
    filtro += `;[b${i}]crop=${LADO}:${LADO}:${col * LADO}:${lin * LADO}[o${i}]`;
    mapas.push('-map', `[o${i}]`, '-q:v', '3', path.join(saida, `${col}_${lin}.jpg`));
  }
}
args.push('-filter_complex', filtro, ...mapas);

console.log(`cortando ${n} blocos de ${LADO}px em ${saida} ...`);
// no Windows o npx é .cmd e precisa de shell: aspas em tudo para caminhos com espaço
const win = process.platform === 'win32';
const r = win
  ? spawnSync(['npx', ...args].map((a) => `"${a}"`).join(' '), { stdio: 'inherit', shell: true })
  : spawnSync('npx', args, { stdio: 'inherit' });
if (r.status !== 0) {
  console.error('Falhou. Este script usa o ffmpeg do Remotion (npx remotion ffmpeg): rode de dentro do projeto.');
  process.exit(1);
}
console.log('pronto. No mapa use: hd: true  (carrega só os blocos visíveis)');
