---
name: documentary-style
description: Monta vídeos no estilo DOCUMENTÁRIO DE ARQUIVO em Remotion (16:9). Usa vídeo e foto reais em tela cheia com legenda de lugar e crédito, globo 3D e mapa de satélite real (NASA + Natural Earth) com países pintados, rotas, setas, pinos, medalhões de pessoas e cercos, cartões de documento com marca-texto e carimbo, número grande, barras, linha do tempo e quadro de ligações de fatos. Detecta o tema do roteiro (guerra, realeza, ditadura, mar, antiguidade, acidente/crime/mistério) e aplica fundo, cores e molduras coerentes. Use para "documentário", "vídeo de história", "explicar um acontecimento", "canal dark de história/geopolítica", "edição estilo documentário", "mapa animado", "DocumentaryStyle", ou para transformar um roteiro narrado em vídeo. Não use para shorts verticais de humor nem para vídeo com apresentador na câmera.
---

# DocumentaryStyle

**Um roteiro narrado vira um documentário de arquivo.** Cada fala vira um visual com função clara:
material real em tela cheia quando existe imagem do fato, mapa real quando a fala é sobre lugar ou movimento,
cartão de documento quando a prova é um texto, número grande quando o fato é um número, e quadro de ligações
quando a fala é sobre quem fez o quê.

Tudo é Remotion + React, sem dependências além do `remotion` do projeto.

## Leia primeiro

| Preciso… | Vá para |
|---|---|
| Entender o visual (cores, fontes, ritmo, o que entra em cada moldura) | `referencia/estilo.md` |
| Saber as props de cada componente | `referencia/componentes.md` |
| Achar vídeo e foto de arquivo que posso usar e creditar | `referencia/acervo.md` |
| Descobrir o tema do roteiro (fundo, cores, molduras) | `scripts/detectar-tema.mjs` e `referencia/estilo.md` |
| Ver um plano completo funcionando | `templates/doc/demo.ts` (história de Fornovo, 1945) |

## Fluxo

### 1. Instalar no projeto (uma vez por projeto)
```bash
node <pasta-da-skill>/scripts/instalar.mjs <projeto-remotion>
```
Ele copia `templates/doc/` para `<projeto>/src/doc/` e os placeholders para `public/doc/demo/`.
Não sobrescreve nada sem `--forcar`.

Mapas: **pergunte ao usuário antes de baixar** e diga o tamanho de cada arquivo.
```bash
node <pasta-da-skill>/scripts/baixar-mapas.mjs <projeto>/public/doc/mapa          # ~13 MB: NASA 5400px + países + rios
node <pasta-da-skill>/scripts/baixar-mapas.mjs <projeto>/public/doc/mapa --hd     # +27 MB: NASA 21600px, já cortada em 32 blocos (hd/) para zoom em país/região
```
No mapa, ligue o HD com `hd: true`: ele carrega só os blocos que aparecem na tela.
Se os blocos faltarem, rode `node <pasta-da-skill>/scripts/blocos-hd.mjs public/doc/mapa` de dentro do projeto.
Para zoom de vale ou cidade, gere um recorte de satélite da região (Sentinel-2 cloudless 2016, CC BY 4.0).
Esse script ainda é **experimental**: confira a imagem gerada antes de usar.
```bash
node <pasta-da-skill>/scripts/recortar-regiao.mjs --oeste 9.6 --sul 44.3 --leste 10.7 --norte 45.0 --nome taro --saida <projeto>/public/doc/mapa
```
Depois registre a composição no `Root.tsx`:
```tsx
import { DocVideo, duracaoDoPlano } from './doc';
import { PLANO_MEU_VIDEO } from './meu-video/plano';
<Composition id="MeuVideo" component={DocVideo} fps={30} width={1920} height={1080}
  durationInFrames={Math.round(duracaoDoPlano(PLANO_MEU_VIDEO) * 30)} defaultProps={{ plano: PLANO_MEU_VIDEO }} />
```

### 2. Descobrir o tema do roteiro
```bash
node <pasta-da-skill>/scripts/detectar-tema.mjs ROTEIRO.md BRIEFING.md --cenas
```
Ele pontua palavras do roteiro e devolve o tema: `guerra` (estilo Sonar), `investigacao` (estilo Investigação visual:
acidentes, aviação, crimes, mistérios), `realeza`, `ditadura`, `mar` ou `antiguidade`. Sem sinal claro, fica `investigacao`.
Ponha o resultado no plano (`tema: 'guerra'`) e diga ao usuário qual tema saiu e por quê (as "pistas").
- Se o usuário pedir outro visual, ele manda: troque o `tema`. Há também `guerraClassica`, `aviacao`, `crime` e `padrao`.
- Confiança baixa ou dois temas fortes (ex.: submarino na guerra = guerra + mar): fique com o primeiro e cite o segundo.
- `--cenas` aponta cena que fala claramente de outro assunto; só nesses casos use `tema` dentro da cena.
- Para ajustar cores ou fundo: `tema: { base: 'realeza', cor: { ouro: '#e0c068' } }`.
- **Mistura (recomendado para vídeo longo):** `tema: MISTURAS.guerra` mantém as cores e fontes do tema, mas alterna o
  fundo das cenas gráficas (sonar → quadrícula de investigação → fumaça) e usa os cartões da investigação. Fica variado
  sem perder a seriedade. Monte a sua com `{ base, variar: [...], cartoesDe }`.
- Para variar o arquivo sem tirá-lo da tela: `arquivo` com `modo: 'painel'` e `etiqueta` (painel 16:9 sobre o fundo do tema).

### 2b. Som: trilha do tema e efeitos pelo ritmo
O detector também diz o **ritmo**: `serio` (guerra, ditadura, tragédia, investigação) ou `dinamico` (lista, curiosidade,
ação). Uma vez por projeto, gere os sons (trilha sintetizada por tema e efeitos, sem direito autoral, ~16 MB):
```bash
python <pasta-da-skill>/scripts/gerar-sons.py <projeto>/public/doc/sons     # precisa de numpy e scipy; ffmpeg deixa as trilhas em MP3
```
No plano: `som: { trilha: 'auto', ritmo: 'serio' }`, e em cada cena com narração `audioInicio` (respiro antes da fala) e
`audioDuracao` (duração do MP3). Regras que o DocVideo já cumpre sozinho:
- **A trilha nunca passa da voz.** Ela abaixa enquanto há fala (ducking) e sobe só um pouco nas pausas. Medido no teste:
  sério fica ~22 dB abaixo da voz durante a fala e ~15 dB nas pausas; dinâmico, alguns dB mais alto. Ajuste fino com `volumeTrilha` (ex.: 0.7), nunca acima de 1.
- **Efeitos pelo ritmo.** Sério: sopro discreto nas trocas de cena, ping de sonar nas cenas de sonar, batida no carimbo
  e no número. Dinâmico: tudo isso mais vivo, com teclas no documento, contador tiquetaqueando e "pop" nos pinos.
- O ritmo também muda o movimento: no dinâmico o Ken Burns é maior e as fusões mais curtas.
- Música do canal no lugar da sintetizada: `som: { trilha: { src: 'musicas/faixa.mp3' }, ritmo: 'serio' }` (mesmo ducking).
- Sem `som` no plano, nada muda (planos antigos continuam iguais).
- O tema muda **só as cenas gráficas** e o acabamento do arquivo. Continue intercalando fotos e vídeos reais (regras abaixo).

### 3. Roteiro → plano
Escreva `src/<slug>/plano.ts` exportando um `Plano` (veja `templates/doc/demo.ts`), com o `tema` do passo 2. Uma **cena** é um trecho de
narração (um MP3). Ela tem `duracao` (segundos do áudio) e uma lista de **blocos**, que podem ficar empilhados.

Escolha o visual pela função da fala:

| A fala é sobre… | Bloco |
|---|---|
| Um evento que tem imagem real | `arquivo` em tela cheia + `legenda` (LOCAL + data) + `credito` |
| Um lugar, uma distância, um movimento de tropas/navios | `mapa` com `pinos`, `setas`, `rotas`, `circulos` |
| Trocar de continente / abrir o vídeo | `globo` girando e aproximando, depois corta para `mapa` |
| Uma pessoa sendo apresentada | `medalhoes` no mapa (se o lugar importa) ou `foto` em moldura |
| Uma prova escrita (lei, telegrama, relatório, tratado, citação) | `documento`: marque o trecho-chave com `[[...]]` e use `carimbo` na virada |
| Um número que choca | `numero` |
| Uma comparação | `barras` |
| Um salto no tempo | `linhaTempo` (régua) ou `linhaTempo` modo `selo` por cima do arquivo |
| Causa e efeito, quem fez o quê, como os fatos se ligam | `conexoes` |

Regras de ritmo:
- **Troque o visual a cada 4 a 8 segundos.** Um bloco parado por mais de 10 s precisa de movimento (câmera do mapa, Ken Burns, novo pino).
- **Alterne real e gráfico**: arquivo → mapa → documento → arquivo. Mire em 40 a 60% do tempo com material real.
- **Os tempos `aos` acompanham a narração**: o pino aparece quando o nome do lugar é dito. Se houver `falas.json`
  com tempos por palavra (Whisper), use esses tempos.
- **Um destaque por vez.** Nunca dois carimbos, duas setas e três pinos entrando juntos.

### 4. Acervo e créditos
Leia `referencia/acervo.md` antes de baixar qualquer material. Regras que não mudam:
- Todo arquivo real leva `credito` na tela e entra em `public/<slug>/acervo/creditos.json`.
- Nada de vídeo tirado de outro canal do YouTube ou de emissora de TV.
- Peça permissão ao usuário antes de baixar e diga a fonte e o tamanho.

### 5. Conferir antes de renderizar tudo
Renderize quadros parados de cada cena e **olhe cada um**:
```bash
npx remotion still src/index.ts MeuVideo out/check/f0300.png --frame=300
```
Checklist em cada quadro:
- texto legível e dentro da área segura (90 px das bordas)
- o pino ou a seta está no lugar certo do mapa (compare com um mapa de referência)
- o mapa não está borrado: altura < 20° pede `hd: true` (aceitável até ~1,2°), e abaixo disso pede recorte regional
- o crédito aparece em todo arquivo real
- a legenda de lugar tem LOCAL e data
- o fundo e a moldura combinam com o tema e não brigam com o texto do cartão
- há foto ou vídeo real intercalado entre as cenas gráficas (40 a 60% do tempo): `conferirPlano(PLANO)` devolve a % de fotos/vídeos e o maior trecho sem arquivo
- a voz está sempre na frente: ouça o começo, uma cena gráfica e o fim com fone

Depois:
```bash
npx remotion render src/index.ts MeuVideo out/meu-video.mp4
```

## Armadilhas que já aconteceram
- **Mapa borrado no zoom**: a textura de 5400 px dá ~15 px por grau. Com `altura` de 3°, isso amplia 25 vezes. Use `hd: true` ou `texturasExtras`.
- **Ícone de tanque invisível**: verde-oliva em cima do satélite verde-oliva. Os ícones terrestres agora vão num selo claro (`selo`), e a rota precisa ter comprimento na tela para o movimento aparecer.
- **Zoom fechado sem nitidez**: a NASA tem ~500 m por pixel. Com `hd: true` dá até ~1,2° de `altura`; mais perto que isso, só com recorte regional (Sentinel-2, 10 m).
- **Render trava ou a aba cai no mapa** ("Session closed", timeout): nunca passe `textura: 'doc/mapa/terra-hd.jpg'`. A imagem de 21600 px inteira estoura a memória do navegador. Use `hd: true` (blocos). Se sobrar `chrome-headless-shell` de um render que caiu, feche esses processos antes de tentar de novo.
- **Wikimedia bloqueia miniatura grande** (erro 400/429): baixe a NASA direto de `assets.science.nasa.gov` (o script já faz isso).
- **País não aparece**: o código é o `ADM0_A3` do Natural Earth (BRA, ITA, DEU, FRA, PRK, KOR, USA, RUS…), não o nome.
- **Globo com país atrás do horizonte**: ele é desenhado colado na borda. Gire a câmera até o país estar de frente antes de destacá-lo.
- **Render lento no globo**: cada quadro reprojeta o satélite pixel a pixel. Use o globo só em aberturas e transições curtas (3 a 6 s).
