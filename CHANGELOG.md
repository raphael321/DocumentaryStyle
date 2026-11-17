# Changelog

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
