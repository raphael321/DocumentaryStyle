# Changelog

## 0.2.0 (2026-11-20)
- **Mapa real em 3D (`terreno`) é a prioridade**: satélite real (bloco NASA Blue Marble + recorte Sentinel-2 por
  cima, com emenda suavizada) deitado sobre o relevo real (AWS Terrain Tiles), bordas que se dissolvem no fundo.
  Pinos, colunas, rotas, fotos e modelos ficam apoiados na altitude real. Fronteira dourada que se desenha
  (`paises[].modo: 'borda'`, fronteiras Natural Earth 10m).
- Novo `scripts/baixar-relevo.mjs` (relevo real por região) e `baixar-mapas.mjs` agora baixa `paises-10m.geojson`.
- **Regra nova: animação = 3D primeiro.** Toda animação do vídeo (lugar, movimento, área atingida, número por lugar,
  objeto do tema) passa a ser feita com o bloco `cena3d`; o 2D fica para documento, quadro de ligações e casos em
  que o 3D não serve. O material real de arquivo continua em tela cheia.
- Novo bloco `cena3d` (`Cena3D.tsx`, Remotion + `@remotion/three` + three.js): país em relevo (Natural Earth) que sobe
  com mola, áreas translúcidas (enchente, ocupação), colunas, pinos com anel pulsando, arcos de rota com ponta,
  fotos reais em placas de papel no espaço, modelos .glb, satélite/mapa antigo no chão, título com entrada e saída,
  neblina, grade e granulação. Câmera em km com órbita e mergulho interpolados.
- Rótulos 3D em HTML projetado, com fontes grandes (44–54 px a 1080p).
- `demo3d.ts` (abertura da Watersnoodramp 1953) e `instalar.mjs` avisando das dependências 3D.
- Testado: prévias de 13,5 s (mapa estilizado e mapa real) renderizadas do começo ao fim (Remotion 4.0.544, three 0.180, `--gl=swangle`).

## 0.1.2 (2026-11-17)
- Corrigido: o render do vídeo inteiro caía na cena do mapa com `terra-hd.jpg` (a aba do navegador estourava a memória).
- Novo `scripts/blocos-hd.mjs`: corta o HD em 32 blocos de 45° (2700 px). `baixar-mapas.mjs --hd` já roda o corte.
- `MapaReal` ganhou a prop `hd`: carrega só os blocos visíveis. A demo usa `hd: true`.
- Vídeo de demonstração completo (48 s) renderizado do começo ao fim.
- O satélite do `MapaReal` agora é desenhado num canvas recortando só a parte visível de cada imagem: some a emenda entre blocos.
- Ícones terrestres (tanque, caminhão, soldado) vão num selo claro com borda na cor da rota; antes o tanque sumia no satélite.
- Demo: câmera do mapa mais próxima (altura 1,15°) e o tanque faz o avanço Collecchio → Fornovo.

## 0.1.1 (2026-11-17)
- Testada a textura HD da NASA (21600 px) no zoom do vale do Taro: relevo, rio Pó e Apeninos nítidos em altura ~2,5°.
- `demo.ts` usa `terra-hd.jpg` na cena do mapa; `instalar.mjs` já sugere `baixar-mapas.mjs --hd`.
- Screenshot do mapa no README atualizado.

## 0.1.0 (2026-11-17)
- Primeira versão.
- Componentes: Arquivo, FotoMoldura, CartaoDocumento, Legenda, Credito, MapaReal, GloboReal, NumeroGrande,
  ComparacaoBarras, LinhaDoTempo, QuadroConexoes e o motor DocVideo (Plano → vídeo).
- Scripts: `instalar.mjs`, `baixar-mapas.mjs` e `recortar-regiao.mjs` (experimental, ainda sem teste).
- Testado com stills de todas as cenas do `demo.ts` (Remotion 4.0.540).

### Limites conhecidos
- O mapa com a textura padrão (5400 px) fica borrado com altura menor que ~20°. Use `--hd` (bom até ~2°) ou um recorte regional.
- O globo reprojeta pixel a pixel, então o render fica mais lento nessas cenas.
- Ainda não renderizamos com vídeo de arquivo real (só com foto/SVG de exemplo).
