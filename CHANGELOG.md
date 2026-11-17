# Changelog

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
