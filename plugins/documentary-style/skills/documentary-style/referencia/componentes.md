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
rotas?:    { pontos: [lon,lat][], aos?, dur?, cor?, curva?, icone?, tracejado?, largura? }[]
setas?:    { de, para, aos?, dur?, cor?, curva?, largura? (12), icone? }[]   // avanço/ataque
pinos?:    { lon, lat, rotulo?, sub?, aos?, cor?, bandeira? (imagem), pulso?, lado? }[]
medalhoes?:{ lon, lat, foto, nome?, aos?, cor?, tamanho? (118), pb? }[]
rotulos?:  { lon, lat, texto, sub?, aos?, tamanho? }[]
```
Ícones prontos: `navio`, `submarino`, `aviao`, `tanque`, `caminhao`, `soldado`, ou o caminho de uma imagem.
`curva` positiva arqueia para um lado, negativa para o outro.

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
