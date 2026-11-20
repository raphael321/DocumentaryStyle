---
name: documentary-style
description: Monta vídeos no estilo DOCUMENTÁRIO DE ARQUIVO em Remotion (16:9). Usa vídeo e foto reais em tela cheia com legenda de lugar e crédito, cenas 3D com motion graphics sobre o MAPA REAL (satélite NASA/Sentinel-2 deitado sobre o relevo real, com fronteiras, pinos, arcos, áreas, colunas, fotos reais e modelos .glb por cima, câmera em movimento; prioridade em toda animação), globo 3D e mapa de satélite real (NASA + Natural Earth) com países pintados, rotas, setas, pinos, medalhões de pessoas e cercos, cartões de documento com marca-texto e carimbo, número grande, barras, linha do tempo e quadro de ligações de fatos. Use para "documentário", "vídeo de história", "explicar um acontecimento", "canal dark de história/geopolítica", "edição estilo documentário", "mapa animado", "DocumentaryStyle", ou para transformar um roteiro narrado em vídeo. Não use para shorts verticais de humor nem para vídeo com apresentador na câmera.
---

# DocumentaryStyle

**Um roteiro narrado vira um documentário de arquivo.** Cada fala vira um visual com função clara:
material real em tela cheia quando existe imagem do fato, mapa real quando a fala é sobre lugar ou movimento,
cartão de documento quando a prova é um texto, número grande quando o fato é um número, e quadro de ligações
quando a fala é sobre quem fez o quê.

Tudo é Remotion + React. Os blocos 2D usam só o `remotion`; o bloco `cena3d` usa também
`@remotion/three`, `three` e `@react-three/fiber` (veja "Animações 3D" abaixo).

## Regra principal: mapa real + animação 3D primeiro

**Sempre que o vídeo precisar de uma animação (algo que não é material real de arquivo), faça em 3D com o bloco
`cena3d` em cima do MAPA REAL (`terreno`) antes de pensar em 2D.** O chão é o satélite real (NASA Blue Marble,
com recorte Sentinel-2 da região por cima) sobre o relevo real (AWS Terrain Tiles); fronteira, pinos, rotas,
áreas, colunas, fotos e modelos 3D entram por cima dele. O país "de papel" estilizado (sem `terreno`) só entra
quando não há satélite da região ou para um gráfico abstrato. Mapa de lugar ou movimento, número de impacto, comparação, rota, enchente,
zona ocupada, linha de frente, objeto do tema (moeda, navio, barril, avião): tudo isso vira cena 3D com câmera
em movimento (órbita, mergulho, travelling).

- Use os blocos 2D (`mapa`, `numero`, `barras`, `documento`, `conexoes`, `linhaTempo`) só quando o 3D não
  servir: prova escrita (documento sempre 2D), quadro de ligações, zoom de cidade em satélite HD que o 3D não
  tem, ou quando o render 3D estourar o tempo. Diga no plano por que aquela cena ficou em 2D.
- **O 3D não substitui o material real.** Quando existe foto ou filme do fato, ele continua em tela cheia
  (`arquivo`). Dentro da cena 3D, foto real entra como placa no espaço (`fotos`), sempre com crédito.
- Mire em pelo menos uma cena 3D a cada 60 a 90 s de vídeo, e sempre na abertura (o "onde e quando").
- Mesmo estilo do canal: paleta do `tema.ts`, fontes grandes e legíveis na TV, um destaque por vez.

## Leia primeiro

| Preciso… | Vá para |
|---|---|
| Entender o visual (cores, fontes, ritmo, o que entra em cada moldura) | `referencia/estilo.md` |
| Saber as props de cada componente | `referencia/componentes.md` |
| Achar vídeo e foto de arquivo que posso usar e creditar | `referencia/acervo.md` |
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

### 2. Roteiro → plano
Escreva `src/<slug>/plano.ts` exportando um `Plano` (veja `templates/doc/demo.ts`). Uma **cena** é um trecho de
narração (um MP3). Ela tem `duracao` (segundos do áudio) e uma lista de **blocos**, que podem ficar empilhados.

Escolha o visual pela função da fala:

| A fala é sobre… | Bloco |
|---|---|
| Um evento que tem imagem real | `arquivo` em tela cheia + `legenda` (LOCAL + data) + `credito` |
| Um lugar, uma distância, um movimento de tropas/navios | **`cena3d`** (país em relevo + `pinos`, `rotas`, `areas`); `mapa` 2D só para zoom de cidade em satélite |
| Uma área atingida (enchente, ocupação, bombardeio, frente) | **`cena3d`** com `areas` que sobem |
| Um número que choca / uma comparação por lugar | **`cena3d`** com `colunas` (ou `numero`/`barras` 2D se não houver lugar) |
| Um objeto do tema (moeda, navio, avião, barril, prédio) | **`cena3d`** com `modelos` (.glb) girando |
| Trocar de continente / abrir o vídeo | `globo` girando e aproximando, depois corta para `cena3d` |
| Uma pessoa sendo apresentada | `medalhoes` no mapa (se o lugar importa) ou `foto` em moldura |
| Uma prova escrita (lei, telegrama, relatório, tratado, citação) | `documento`: marque o trecho-chave com `[[...]]` e use `carimbo` na virada |
| Um número que choca (sem lugar) | `numero` |
| Uma comparação (sem lugar) | `barras` |
| Um salto no tempo | `linhaTempo` (régua) ou `linhaTempo` modo `selo` por cima do arquivo |
| Causa e efeito, quem fez o quê, como os fatos se ligam | `conexoes` |

Regras de ritmo:
- **Troque o visual a cada 4 a 8 segundos.** Um bloco parado por mais de 10 s precisa de movimento (câmera do mapa, Ken Burns, novo pino).
- **Alterne real e gráfico**: arquivo → mapa → documento → arquivo. Mire em 40 a 60% do tempo com material real.
- **Os tempos `aos` acompanham a narração**: o pino aparece quando o nome do lugar é dito. Se houver `falas.json`
  com tempos por palavra (Whisper), use esses tempos.
- **Um destaque por vez.** Nunca dois carimbos, duas setas e três pinos entrando juntos.

### 2b. Animações 3D (`cena3d`) sobre o mapa real
Instale uma vez no projeto (a versão de `@remotion/three` tem que ser **igual** à do `remotion`):
```bash
npm i @remotion/three@<versão do remotion> three @react-three/fiber @types/three
```
Render com WebGL: no Windows/Mac use `--gl=angle`; em Linux sem GPU, `--gl=swangle`
(ex.: `npx remotion render src/index.ts MeuVideo out/x.mp4 --gl=angle`).
Precisa de `doc/mapa/paises-10m.geojson` (fronteiras finas que casam com o satélite) e `paises-50m.geojson`,
que vêm no `baixar-mapas.mjs`. O relevo real da região se baixa uma vez por vídeo (~0,1 MB por bloco):
```bash
node <pasta-da-skill>/scripts/baixar-relevo.mjs --oeste 1 --sul 49.9 --leste 7.8 --norte 54.2 --nome holanda --saida <projeto>/public/doc/relevo
```
Satélite: use os blocos NASA que já existem (`doc/mapa/hd/<col>_<lin>.jpg`: col = floor((lon+180)/45),
lin = floor((90-lat)/45); a Holanda é `4_0`) como base e, para a região do vídeo, um recorte Sentinel-2
(`recortar-regiao.mjs`, ex.: `regiao-zeeland2.jpg`) por cima. O recorte entra com a borda suavizada.

O mundo 3D é em **km**, com origem em `centro` (lon, lat). A câmera anda entre quadros:
```ts
{ tipo: 'cena3d', props: {
  centro: [4.6, 52.1],
  terreno: {                                            // MAPA REAL: sempre que houver satélite da região
    oeste: 1.0, sul: 49.9, leste: 7.8, norte: 54.2,
    satelite: [ { src: 'doc/mapa/hd/4_0.jpg', oeste: 0, sul: 45, leste: 45, norte: 90 },              // base NASA
                { src: 'doc/mapa/regiao-zeeland2.jpg', oeste: 2.9, sul: 50.9, leste: 5.3, norte: 52.4, suavizar: 0.15 } ], // Sentinel-2
    relevo: 'doc/relevo/holanda', exagero: 12, resolucao: 6144,
  },
  camera: [ { t: 0, lon: 5.2, lat: 51.9, distancia: 900, inclinacao: 38, giro: -18 },   // longe, vendo o país inteiro
            { t: 8, lon: 3.95, lat: 51.78, distancia: 300, inclinacao: 60, giro: 12 } ], // mergulha na região
  paises: [ { iso: 'NLD', borda: '#d9a93a', aos: 0.4, dur: 2.2 } ],   // fronteira dourada se desenhando no mapa real
  pinos:  [ { lon: 3.9, lat: 51.5, rotulo: 'Zeeland', aos: 5.3 } ],
  areas:  [ { pontos: [[3.45,51.76],[4.45,51.76],[4.3,51.45],[3.72,51.5]], altura: 1.2, opacidade: 0.5, aos: 11 } ],
  rotas:  [ { pontos: [[1.0,55.6],[2.3,53.4],[3.7,51.72]], aos: 10.6, dur: 1.6, arco: 25 } ],
  fotos:  [ { src: 'meu-video/photos/x.jpg', lon: 3.05, lat: 51.62, largura: 54, elevacao: 14, aos: 9,
              legenda: 'Zierikzee · 1953', credito: 'Foto: Nationaal Archief / Anefo (CC0)' } ],
  titulo: { texto: '31 januari 1953', sub: 'Zaterdagavond', aos: 0.3, ate: 4.6 },
} }
```
Exemplo completo: `templates/doc/demo3d.ts`. Props: `referencia/componentes.md`.

Movimentos de câmera que funcionam:
- **Abertura**: longe e baixo (`inclinacao` 35–45) → aproxima e sobe o ângulo (55–65) enquanto o país sobe.
- **Órbita**: mesmo alvo, `giro` andando 20–40° em 5–8 s. Dá vida a uma cena parada.
- **Mergulho**: `distancia` cai 3–4x até a região citada; a distância é interpolada em escala log (suave).
- Nunca deixe a câmera parada mais de 3 s numa cena 3D.

Modelos .glb (navio, avião, moeda, prédio): use modelos com licença livre (Sketchfab CC-BY, Poly Pizza CC0,
Khronos glTF samples) ou gere um (ex.: Higgsfield `generate_3d`). Crédito na tela quando a licença pedir.

### 3. Acervo e créditos
Leia `referencia/acervo.md` antes de baixar qualquer material. Regras que não mudam:
- Todo arquivo real leva `credito` na tela e entra em `public/<slug>/acervo/creditos.json`.
- Nada de vídeo tirado de outro canal do YouTube ou de emissora de TV.
- Peça permissão ao usuário antes de baixar e diga a fonte e o tamanho.

### 4. Conferir antes de renderizar tudo
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

Depois:
```bash
npx remotion render src/index.ts MeuVideo out/meu-video.mp4
```

## Armadilhas que já aconteceram
- **Cena 3D preta ou erro de WebGL no render**: falta `--gl=angle` (Windows/Mac) ou `--gl=swangle` (Linux sem GPU).
- **`@remotion/three` com versão diferente do `remotion`**: o render falha. Instale com a mesma versão exata.
- **Área 3D escondida dentro do país** (modo sem terreno): área sobre terra precisa de `base` igual à `altura` do país (ex.: país 5 → `base: 5.3`).
- **Terreno aparece como uma laje quadrada**: aumente a caixa do `terreno` além do que a câmera vê; as bordas já se dissolvem no fundo (`bordaSuave`).
- **Emenda entre NASA e Sentinel**: aumente `suavizar` do recorte (0.12 a 0.2).
- **Fronteira fora da costa no zoom**: use `fronteiras: '10m'` (padrão com terreno) e confira se `paises-10m.geojson` existe.
- **Holanda parece plana**: é real (ponto mais alto 322 m). O relevo aparece em dunas, Veluwe e Limburg com `exagero` 12–20; em montanha use 3–5.
- **Rótulos 3D um em cima do outro**: espalhe os `aos` e afaste a câmera; o título da abertura sai com `ate`.
- **`--scale` que dá altura quebrada** (ex.: 0.3334 → 360.07): renderize com `--scale=0.5` e reduza com ffmpeg.
- **Mapa borrado no zoom**: a textura de 5400 px dá ~15 px por grau. Com `altura` de 3°, isso amplia 25 vezes. Use `hd: true` ou `texturasExtras`.
- **Ícone de tanque invisível**: verde-oliva em cima do satélite verde-oliva. Os ícones terrestres agora vão num selo claro (`selo`), e a rota precisa ter comprimento na tela para o movimento aparecer.
- **Zoom fechado sem nitidez**: a NASA tem ~500 m por pixel. Com `hd: true` dá até ~1,2° de `altura`; mais perto que isso, só com recorte regional (Sentinel-2, 10 m).
- **Render trava ou a aba cai no mapa** ("Session closed", timeout): nunca passe `textura: 'doc/mapa/terra-hd.jpg'`. A imagem de 21600 px inteira estoura a memória do navegador. Use `hd: true` (blocos). Se sobrar `chrome-headless-shell` de um render que caiu, feche esses processos antes de tentar de novo.
- **Wikimedia bloqueia miniatura grande** (erro 400/429): baixe a NASA direto de `assets.science.nasa.gov` (o script já faz isso).
- **País não aparece**: o código é o `ADM0_A3` do Natural Earth (BRA, ITA, DEU, FRA, PRK, KOR, USA, RUS…), não o nome.
- **Globo com país atrás do horizonte**: ele é desenhado colado na borda. Gire a câmera até o país estar de frente antes de destacá-lo.
- **Render lento no globo**: cada quadro reprojeta o satélite pixel a pixel. Use o globo só em aberturas e transições curtas (3 a 6 s).
