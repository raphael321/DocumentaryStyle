#!/usr/bin/env node
// DocumentaryStyle: copia os componentes para um projeto Remotion.
// uso: node instalar.mjs <pasta-do-projeto> [--forcar]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const templates = path.resolve(aqui, '..', 'templates');
const args = process.argv.slice(2);
const forcar = args.includes('--forcar');
const projeto = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');

const pkgPath = path.join(projeto, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error(`Não achei package.json em ${projeto}. Passe a pasta do projeto Remotion.`);
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
if (!deps.remotion) console.warn('Aviso: "remotion" não está no package.json deste projeto.');

const copiados = [], pulados = [];
const copiar = (de, para) => {
  fs.mkdirSync(para, { recursive: true });
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    const o = path.join(de, item.name), d = path.join(para, item.name);
    if (item.isDirectory()) copiar(o, d);
    else if (fs.existsSync(d) && !forcar) pulados.push(path.relative(projeto, d));
    else {
      fs.copyFileSync(o, d);
      copiados.push(path.relative(projeto, d));
    }
  }
};
copiar(path.join(templates, 'doc'), path.join(projeto, 'src', 'doc'));
copiar(path.join(templates, 'public'), path.join(projeto, 'public'));

console.log(`Copiados (${copiados.length}):\n  ${copiados.join('\n  ') || '-'}`);
if (pulados.length) console.log(`Já existiam, mantidos (${pulados.length}). Use --forcar para sobrescrever:\n  ${pulados.join('\n  ')}`);
const temMapa = fs.existsSync(path.join(projeto, 'public', 'doc', 'mapa', 'terra.jpg'));
console.log(`
Próximos passos:
${temMapa ? '  - mapas: já existem em public/doc/mapa' : '  - mapas: node ' + path.join(aqui, 'baixar-mapas.mjs') + ' ' + path.join(projeto, 'public', 'doc', 'mapa') + ' --hd'}
  - registre no Root.tsx:
      import { DocVideo, duracaoDoPlano } from './doc';
      import { PLANO_DEMO } from './doc/demo';
      <Composition id="DocDemo" component={DocVideo} fps={30} width={1920} height={1080}
        durationInFrames={Math.round(duracaoDoPlano(PLANO_DEMO) * 30)} defaultProps={{ plano: PLANO_DEMO }} />`);
