# Componentes (src/doc)

Tempos (`aos`, `dur`, `t`) são **segundos contados a partir do início do bloco**. Coordenadas são `[lon, lat]`
(longitude primeiro). Caminhos de arquivo são relativos a `public/` (ex.: `fornovo/acervo/rendicao.mp4`).

## DocVideo + Plano
```ts
type Plano = { tema?: EscolhaTema; cenas: CenaPlano[]; fusao?: number /*0.4*/; trilha?: { src: string; volume?: number } };
type CenaPlano = { id: string; duracao: number; audio?: string; fundo?: 'doc' | 'preto' | 'nenhum'; tema?: EscolhaTema;
                   moldura?: boolean /*true*/; blocos: Bloco[] };
type EscolhaTema = 'padrao' | 'guerra' | 'investigacao' | 'realeza' | 'ditadura' | 'mar' | 'antiguidade'
                 | 'guerraClassica' | 'aviacao' | 'crime'
                 | { base: TemaId; cor?: {...}; fonte?: {...}; fundo?: EstiloFundo; ornamento?: EstiloOrnamento; filtroArquivo?: string; graos?: number };
type Bloco = { tipo: 'arquivo'|'foto'|'documento'|'mapa'|'globo'|'barras'|'numero'|'linhaTempo'|'conexoes'|'legenda'|'credito';
               inicio?: number; duracao?: number; props: {...} };
```
`duracaoDoPlano(plano)` devolve os segundos totais para o `durationInFrames`.
Cena: `audioInicio?` (respiro antes da fala) e `audioDuracao?` (duração da fala, usada no ducking).
Plano: `som?: { trilha?: 'auto' | { src, volume? } | false; ritmo?: 'serio' | 'dinamico'; efeitos?: boolean;
volumeTrilha?; volumeEfeitos?; pasta? ('doc/sons'); extensao? ('mp3') }`. Arquivos: `scripts/gerar-sons.py`.
`eventosDeSom(plano)` lista os efeitos que vão tocar; `conferirPlano(plano)` mede a intercalação com material real.

## Temas (tema.ts + Fundos.tsx)
`tema` no Plano muda o visual das cenas gráficas: fundo (`fundo: 'doc'`), cores, fontes, moldura da tela e enfeite dos
cartões de papel. No arquivo real ele só muda o filtro de cor, a granulação, a barra da legenda e as fontes.
Os componentes leem o tema com `useTema()` (`T.cor.ouro`, `T.fonte.titulo`...). `COR`/`FONTE` continuam existindo e são
sempre as cores do tema padrão: use-as no plano para cores com significado fixo (um lado do conflito = uma cor).
Fora do `DocVideo`, envolva com `<ProvedorTema tema="guerra">`. `TEMAS` lista todos os temas prontos.

Mistura: `{ base: 'guerra', variar: ['investigacao', 'guerraClassica'], cartoesDe: 'investigacao' }`. A cada cena com
`fundo: 'doc'` o fundo e a moldura da tela passam para o próximo tema da lista; cores, fontes e filtro do arquivo ficam
os do `base`. `cartoesDe` copia papel, tinta, marca-texto, fonte do documento e enfeite dos cartões. `MISTURAS` tem uma
mistura pronta por tema.

## arquivo: vídeo/foto real em tela cheia
`src`, `tipo?: 'video'|'foto'` (é detectado pela extensão), `inicioSeg?` (corte inicial do vídeo), `volume?` (0 = mudo),
`pb?`, `modo?: 'cobrir'|'desfocado'`, `kenBurns?: { de: {escala,x,y}, para: {escala,x,y} } | false`,
`legenda?: { local, data? }`, `credito?`, `graos?` (do tema), `etiqueta?` (modo painel).
`modo: 'painel'` põe o material num painel 16:9 com etiqueta sobre o fundo do tema (use `fundo: 'doc'` na cena).

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
satelite?: false | { pasta?, url?, zoomMax?, credito? }  // padrão {}: blocos Sentinel-2 de public/doc/mapa/tiles (baixar-tiles.mjs)
                                    // lê tiles/indice.json; sem índice não muda nada. { url: '.../{z}/{x}/{y}.jpg' } busca na hora
texturasExtras?: { src, oeste, sul, leste, norte, opcional? }[]   // recortes de satélite de alta resolução
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

## inscreva: curtir + inscreva-se + sininho (automático)
Vem ligado em todo plano (`plano.inscreva`). Padrão: depois da 1ª cena, a cada ~6 min e ~25 s antes do fim.
`{ momentos?: number[]; texto?: 'INSCREVA-SE'; textoInscrito?: 'INSCRITO'; chamada?; cor?: '#E0262B'; posicao?: 'direita'|'centro' }`
ou `false`. Duração `DURACAO_INSCREVA` (6,2 s). Efeitos: clique no curtir e no inscrever, `sino` no sininho
(gere com `gerar-sons.py --so-efeitos` se o projeto já tinha os sons). Componente solto: `BotaoInscreva`.

## legenda / credito (soltos)
`legenda`: `{ local, data?, aos? }`. `credito`: `{ texto }`. Use por cima de qualquer bloco.
