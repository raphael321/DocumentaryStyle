# Changelog

## 0.2.0 (2026-11-17)
- `conferirPlano` agora avisa quando um rótulo, pino, cartão ou carimbo entra a menos de 2 s do fim do bloco (o nome some no corte).
- Novo: **mapa em alta resolução no zoom**. `scripts/baixar-tiles.mjs` baixa blocos de satélite Sentinel-2 cloudless 2016
  (~10 m/px, CC BY 4.0) só no caminho das câmeras do plano (`camerasDoPlano`). O `MapaReal` usa os blocos sozinho
  (prop `satelite`, ligada por padrão), troca para o bloco nítido em cada quadro e põe o crédito no canto.
  Alinhamento conferido contra as fronteiras e rios do Natural Earth (sem deslocamento visível).
- Novo: **curtir + inscreva-se + sininho** em todo vídeo (`plano.inscreva`, ligado por padrão): entra depois do gancho,
  a cada ~6 min e perto do fim, com cursor animado e cliques/sino baixinhos. Novo efeito `sino` no `gerar-sons.py`
  (e a opção `--so-efeitos`).
- Novo: **temas por assunto**. `scripts/detectar-tema.mjs` lê o roteiro/briefing e escolhe o tema; o plano recebe `tema`.
- `guerra` usa o estilo **Sonar** (preto, varredura e eco azul-gelo, alvos em âmbar, documento em painel escuro).
- `investigacao` usa o estilo **Investigação visual** (grafite, quadrícula, etiqueta e grifo vermelhos, transcrição em papel).
  É o tema de acidentes, aviação, crimes e mistérios, e o padrão quando nenhum assunto se destaca.
- Mais temas: `realeza` (damasco e filigrana), `ditadura` (concreto e propaganda), `mar` (carta náutica), `antiguidade`
  (pedra e meandro), e sob pedido `guerraClassica`, `aviacao`, `crime`.
- Tema por cena (`cena.tema`), personalização (`{ base, cor, fonte, fundo, ornamento }`) e `cena.moldura: false`.
- Os componentes leem as cores e fontes com `useTema()`. `COR`/`FONTE` continuam valendo (cores do tema padrão).
- O arquivo real não muda: o tema só ajusta filtro, granulação, legenda e fontes por cima dele.
- **Mistura de temas**: `{ base, variar, cartoesDe }` e `MISTURAS` prontas (ex.: guerra = sonar + investigação + fumaça).
- `arquivo` ganhou `modo: 'painel'` com `etiqueta`: o material real num painel sobre o fundo do tema.
- **Som por tema**: `scripts/gerar-sons.py` sintetiza uma trilha por tema (sério e dinâmico) e os efeitos. Com
  `som: { trilha: 'auto', ritmo }` o DocVideo toca a trilha em loop com ducking (sempre abaixo da voz) e põe efeitos
  pelos blocos do plano: suaves no sério, mais vivos no dinâmico.
- O detector também escolhe o **ritmo** (`serio`/`dinamico`) e imprime a linha `som` do plano.
- `conferirPlano(plano)`: % do tempo com fotos/vídeos reais e o maior trecho sem arquivo.
- Cena ganhou `audioInicio` e `audioDuracao`.
- Testado com stills de documento, número, quadro de ligações, barras e arquivo em todos os temas (Remotion 4.0.540).

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
