#!/usr/bin/env node
// DocumentaryStyle (EXPERIMENTAL): recorte de satélite em alta resolução de uma região,
// para zoom de vale/cidade no MapaReal (prop texturasExtras).
// Fonte: Sentinel-2 cloudless 2016, EOX IT Services (https://s2maps.eu), licença CC BY 4.0.
// Crédito obrigatório: "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)"
//
// uso: node recortar-regiao.mjs --oeste 9.6 --sul 44.3 --leste 10.7 --norte 45.0 --nome taro --saida public/doc/mapa [--largura 4096]
import fs from 'node:fs';
import path from 'node:path';

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : padrao;
};
const oeste = Number(arg('oeste')), sul = Number(arg('sul')), leste = Number(arg('leste')), norte = Number(arg('norte'));
const nome = arg('nome', 'regiao');
const saida = path.resolve(arg('saida', 'public/doc/mapa'));
const largura = Math.min(4096, Number(arg('largura', 4096)));
if ([oeste, sul, leste, norte].some(Number.isNaN) || leste <= oeste || norte <= sul) {
  console.error('Passe --oeste --sul --leste --norte em graus (oeste < leste, sul < norte).');
  process.exit(1);
}
// altura proporcional à projeção do MapaReal (cosseno da latitude central)
const latMeio = ((sul + norte) / 2) * (Math.PI / 180);
const altura = Math.min(4096, Math.round((largura * (norte - sul)) / ((leste - oeste) * Math.cos(latMeio))));

const url =
  'https://tiles.maps.eox.at/wms?service=WMS&version=1.1.1&request=GetMap&layers=s2cloudless&styles=' +
  `&srs=EPSG:4326&bbox=${oeste},${sul},${leste},${norte}&width=${largura}&height=${altura}&format=image/jpeg`;

const r = await fetch(url, { headers: { 'User-Agent': 'DocumentaryStyle/0.1 (Remotion map assets)' } });
const buf = Buffer.from(await r.arrayBuffer());
if (!r.ok || buf[0] !== 0xff) {
  console.error(`Falhou (${r.status}). Resposta: ${buf.toString('utf8', 0, 300)}`);
  process.exit(1);
}
fs.mkdirSync(saida, { recursive: true });
const arquivo = path.join(saida, `regiao-${nome}.jpg`);
fs.writeFileSync(arquivo, buf);
const rel = path.relative(path.resolve('public'), arquivo).split(path.sep).join('/');
console.log(`Salvo ${arquivo} (${largura}x${altura}, ${(buf.length / 1e6).toFixed(1)} MB)`);
console.log('\nUse no mapa:');
console.log(`  texturasExtras: [{ src: '${rel}', oeste: ${oeste}, sul: ${sul}, leste: ${leste}, norte: ${norte} }],`);
console.log('\nCrédito na tela/descrição: Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)');
