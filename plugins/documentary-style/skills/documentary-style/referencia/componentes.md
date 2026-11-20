# Componentes (src/doc)

Tempos (`aos`, `dur`, `t`) são **segundos contados a partir do início do bloco**. Coordenadas são `[lon, lat]`
(longitude primeiro). Caminhos de arquivo são relativos a `public/` (ex.: `fornovo/acervo/rendicao.mp4`).

## DocVideo + Plano
```ts
type Plano = { cenas: CenaPlano[]; fusao?: number /*0.4*/; trilha?: { src: string; volume?: number } };
type CenaPlano = { id: string; duracao: number; audio?: string; fundo?: 'doc' | 'preto' | 'nenhum'; blocos: Bloco[] };
type Bloco = { tipo: 'arquivo'|'foto'|'documento'|'mapa'|'globo'|'barras'|'numero'|'linhaTempo'|'conexoes'|'legenda'|'credito';
               inicio?: number; duracao?: number; props: {...} };
```
`duracaoDoPlano(plano)` devolve os segundos totais para o `durationInFrames`.

## arquivo: vídeo/foto real em tela cheia
`src`, `tipo?: 'video'|'foto'` (é detectado pela extensão), `inicioSeg?` (corte inicial do vídeo), `volume?` (0 = mudo),
`pb?`, `modo?: 'cobrir'|'desfocado'`, `kenBurns?: { de: {escala,x,y}, para: {escala,x,y} } | false`,
`legenda?: { local, data? }`, `credito?`, `graos?` (0.07).

## foto: foto em moldura de papel
`src`, `legenda?`, `sub?`, `credito?`, `rotacao?` (-2), `largura?` (760), `x?`/`y?` (centro em %), `pb?`, `aos?`.

## documento: cartão de documento
`cabecalho` ("Telegrama do embaixador · 30 de maio de 1950"), `texto` (use `[[trecho]]` para o marca-texto),
`credito?`, `carimbo?: { texto, aos, cor? }`, `aosMarca?`, `largura?` (1180), `tamanhoTexto?` (44).

## mapa: mapa real com câmera
```ts
camera: { t, lon, lat, altura }[]   // altura = graus de latitude visíveis (zoom). Europa ~40, Itália ~13, região ~3
textura?: 'doc/mapa/terra.jpg'      // base (5400 px). NÃO use terra-hd.jpg aqui: derruba a aba do render
hd?: true | 'pasta/dos/blocos'     // satélite HD em blocos de 45° (blocos-hd.mjs); entra com altura < 30
texturasExtras?: { src, oeste, sul, leste, norte }[]   // recortes de satélite de alta resolução
escurecer?: 0.1
paises?:   { iso, cor?, aos?, opacidade? (0.72), borda? }[]      // iso = ADM0_A3 (BRA, ITA, DEU...)
rios?:     boolean | { cor?, aos? }
areas?:    { pontos: [lon,lat][], cor?, aos?, opacidade?, borda? }[]   // bolsões, zonas ocupadas
circulos?: { lon, lat, raioKm, aos?, cor? }[]                          // cerco, raio de alcance
rotas?:    { pontos: [lon,lat][], aos?, dur?, cor?, curva?, icone?, tracejado?, largura?, selo? }[]
           // selo: círculo claro com borda na cor da rota atrás do ícone. Ligado por padrão em tanque/caminhão/soldado
           // (verde-oliva some em cima do satélite). Rota curta (< ~80 px na tela) fica escondida atrás do selo: aproxime a câmera.
setas?:    { de, para, aos?, dur?, cor?, curva?, largura? (12), icone? }[]   // avanço/ataque
pinos?:    { lon, lat, rotulo?, sub?, aos?, cor?, bandeira? (imagem), pulso?, lado? }[]
medalhoes?:{ lon, lat, foto, nome?, aos?, cor?, tamanho? (118), pb? }[]
rotulos?:  { lon, lat, texto, sub?, aos?, tamanho? }[]
```
Ícones prontos: `navio`, `submarino`, `aviao`, `tanque`, `caminhao`, `soldado`, ou o caminho de uma imagem.
`curva` positiva arqueia para um lado, negativa para o outro.

## cena3d: cena 3D com motion graphics (prioridade para animações)
Requer `@remotion/three` (mesma versão do `remotion`), `three`, `@react-three/fiber`. Render com `--gl=angle` (ou `swangle`).
Unidades: **km** a partir de `centro`. Tempos `aos`/`dur`/`t` em segundos desde o início do bloco.
```ts
centro: [lon, lat]
camera: { t, lon, lat, distancia /*km*/, inclinacao? /*0 = de cima, 75 = rasante; 45*/, giro? /*graus, 0 = olhando o norte*/ }[]
paises?:  { iso, cor? (papel), altura? (4), borda? (ouro), lateral?, aos? }[]           // país em relevo que sobe com mola
areas?:   { pontos: [lon,lat][], cor? (azul), altura? (6), base? (0.1), opacidade? (0.78), aos?, dur? (1.4) }[]  // enchente, zona
colunas?: { lon, lat, valor /*0..1*/, rotulo?, sub?, cor? (ouro), raio? (7), aos? }[]   // altura = valor * alturaColunas
alturaColunas?: 70
pinos?:   { lon, lat, rotulo?, sub?, cor? (vermelho), altura? (22), aos? }[]             // cai do alto + anel pulsando
rotas?:   { pontos: [lon,lat][], aos?, dur? (1.6), cor?, arco? (km; 22% do comprimento), largura? (1.6), ponta? (true) }[]
fotos?:   { src, lon, lat, largura? (60 km), altura?, elevacao? (8), giro? (omitido = vira para a câmera), legenda?, credito?, aos? }[]
modelos?: { src (.glb/.gltf), lon, lat, escala? (1), elevacao? (0), giro?, girarPorSeg?, aos? }[]
chao?:    { src, oeste, sul, leste, norte, escurecer? }   // satélite ou mapa antigo deitado no chão
titulo?:  { texto, sub?, aos?, ate? }
neblina? (true), grade? (true), graos? (0.05), fov? (34)
```
Rótulos (pinos, colunas, legendas de foto) são HTML projetado na tela, com as fontes do estilo em tamanho grande
(44–54 px a 1080p). Créditos das fotos aparecem juntos no canto inferior direito.

## globo: globo 3D
`camera: { t, lon, lat, raio }[]` (raio em px: 360 = Terra inteira, 900+ = mergulho),
`paises?`, `pinos?`, `arcos?: { de, para, aos?, dur?, cor? }[]`, `textura?`.

## numero
`rotulo`, `numero` (number conta de `contarDe` até ele; string aparece direto, como "~16x"), `prefixo?`, `sufixo?`, `sub?` (fonte), `cor?`.

## barras
`titulo`, `itens: { rotulo, valor, cor?, prefixo?, sufixo? }[]`, `fonte?`, `casas?`, `maximo?`.

## linhaTempo
`de`, `para` (anos), `inicio?`/`fim?` (limites da régua), `passo?`, `local?`, `modo?: 'regua'|'selo'`, `dur?`.

## conexoes: quadro de ligações
`nos: { id, x, y (em %), titulo, sub?, foto?, aos?, rotacao?, destaque? }[]`,
`ligacoes: { de, para, rotulo?, aos?, cor?, dur? }[]`, `foco?: { id | '*', aos, zoom? }[]`.

## legenda / credito (soltos)
`legenda`: `{ local, data?, aos? }`. `credito`: `{ texto }`. Use por cima de qualquer bloco.
