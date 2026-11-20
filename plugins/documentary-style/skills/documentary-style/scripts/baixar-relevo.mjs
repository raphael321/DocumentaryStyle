#!/usr/bin/env node
// DocumentaryStyle: baixa o relevo REAL de uma região (altitude do terreno) para o bloco cena3d.
// Fonte: AWS Terrain Tiles (formato Terrarium; SRTM, GMTED, ETOPO1 e outros, dados abertos).
// uso: node baixar-relevo.mjs --oeste 1.5 --sul 50.3 --leste 7.6 --norte 53.9 --nome holanda --saida <projeto>/public/doc/relevo [--zoom 8]
// Saída: <saida>/<nome>/<z>_<x>_<y>.png + info.json  →  na cena: terreno.relevo = 'doc/relevo/<nome>'
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const oeste = Number(arg('oeste')), sul = Number(arg('sul')), leste = Number(arg('leste')), norte = Number(arg('norte'));
const nome = arg('nome', 'regiao');
const saidaBase = path.resolve(arg('saida', 'public/doc/relevo'));
if ([oeste, sul, leste, norte].some((v) => Number.isNaN(v))) {
  console.error('Passe --oeste --sul --leste --norte (graus) e --nome.');
  process.exit(1);
}
const xTile = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const yTile = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
// zoom automático: ~40 blocos no máximo (cada bloco 256 px)
let z = Number(arg('zoom', 0));
if (!z) {
  z = 11;
  while (z > 3 && (xTile(leste, z) - xTile(oeste, z) + 1) * (yTile(sul, z) - yTile(norte, z) + 1) > 40) z--;
}
const x0 = xTile(oeste, z), x1 = xTile(leste, z), y0 = yTile(norte, z), y1 = yTile(sul, z);
const pasta = path.join(saidaBase, nome);
fs.mkdirSync(pasta, { recursive: true });
const total = (x1 - x0 + 1) * (y1 - y0 + 1);
console.log(`Relevo ${nome}: zoom ${z}, ${total} blocos (~${Math.round(total * 0.1)} MB) em ${pasta}`);
let feitos = 0;
for (let x = x0; x <= x1; x++)
  for (let y = y0; y <= y1; y++) {
    const destino = path.join(pasta, `${z}_${x}_${y}.png`);
    if (fs.existsSync(destino) && fs.statSync(destino).size > 0) { feitos++; continue; }
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
    let ok = false;
    for (let t = 0; t < 4 && !ok; t++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
        ok = true;
      } catch (e) {
        if (t === 3) { console.error(`falhou ${url}: ${e.message}`); process.exit(1); }
        await new Promise((res) => setTimeout(res, 1500 * (t + 1)));
      }
    }
    feitos++;
    process.stdout.write(`\r  ${feitos}/${total}`);
  }
fs.writeFileSync(
  path.join(pasta, 'info.json'),
  JSON.stringify({ formato: 'terrarium', z, x0, x1, y0, y1, oeste, sul, leste, norte,
    credito: 'Relevo: AWS Terrain Tiles (SRTM/NASA, GMTED/USGS, ETOPO1/NOAA)' }, null, 1),
);
console.log(`\nPronto. Use na cena: terreno: { relevo: 'doc/relevo/${nome}', ... }`);
