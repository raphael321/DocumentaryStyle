#!/usr/bin/env node
// DocumentaryStyle: baixa os mapas reais (domínio público) para public/doc/mapa.
// uso: node baixar-mapas.mjs <destino> [--hd]
//   padrão (~13 MB): terra.jpg (NASA 5400x2700), paises-50m.geojson, rios-10m.geojson
//   --hd  (+27 MB): terra-hd.jpg (NASA 21600x10800), cortada em 32 blocos em hd/ para zoom em país/região
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const destino = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'public/doc/mapa');
const hd = args.includes('--hd');

const NASA = 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/august';
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const arquivos = [
  { nome: 'terra.jpg', url: `${NASA}/world.topo.bathy.200408.3x5400x2700.jpg`, credito: 'NASA Earth Observatory, Blue Marble Next Generation (domínio público)' },
  { nome: 'paises-50m.geojson', url: `${NE}/ne_50m_admin_0_countries.geojson`, credito: 'Natural Earth (domínio público)' },
  { nome: 'rios-10m.geojson', url: `${NE}/ne_10m_rivers_lake_centerlines.geojson`, credito: 'Natural Earth (domínio público)' },
];
if (hd) arquivos.push({ nome: 'terra-hd.jpg', url: `${NASA}/world.topo.bathy.200408.3x21600x10800.jpg`, credito: 'NASA Earth Observatory, Blue Marble Next Generation (domínio público)' });

fs.mkdirSync(destino, { recursive: true });
for (const a of arquivos) {
  const alvo = path.join(destino, a.nome);
  if (fs.existsSync(alvo) && fs.statSync(alvo).size > 10_000) {
    console.log(`ok (já existe)  ${a.nome}`);
    continue;
  }
  process.stdout.write(`baixando       ${a.nome} ... `);
  const r = await fetch(a.url, { headers: { 'User-Agent': 'DocumentaryStyle/0.1 (Remotion map assets)' } });
  if (!r.ok) {
    console.log(`ERRO ${r.status}`);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (a.nome.endsWith('.jpg') && buf[0] !== 0xff) {
    console.log('ERRO: a resposta não é JPEG');
    process.exitCode = 1;
    continue;
  }
  fs.writeFileSync(alvo, buf);
  console.log(`${(buf.length / 1e6).toFixed(1)} MB`);
}
fs.writeFileSync(
  path.join(destino, 'CREDITOS-MAPA.txt'),
  arquivos.map((a) => `${a.nome}: ${a.credito}\n  ${a.url}`).join('\n') + '\n',
);
console.log(`\nCréditos em ${path.join(destino, 'CREDITOS-MAPA.txt')}`);

// o HD inteiro derruba o navegador do render: corta em blocos (usa o ffmpeg do Remotion, a partir do projeto)
if (hd && !fs.existsSync(path.join(destino, 'hd', '7_3.jpg'))) {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'blocos-hd.mjs');
  const projeto = path.resolve(destino, '..', '..', '..'); // <projeto>/public/doc/mapa
  const r = spawnSync(process.execPath, [script, destino], { stdio: 'inherit', cwd: projeto });
  if (r.status !== 0) console.log(`Corte em blocos falhou. Rode de dentro do projeto: node ${script} ${destino}`);
}
