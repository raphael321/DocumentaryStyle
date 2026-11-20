# O visual do DocumentaryStyle

Estilo de documentário de arquivo com narração em off. A tela nunca fica "vazia de informação": ou mostra o
fato (material real), ou mostra onde ele aconteceu (mapa), ou mostra a prova (documento/número).

## Paleta (`tema.ts`)
| Uso | Cor |
|---|---|
| Fundo dos cartões e gráficos (azul-noite com estrelas) | `#0c1420` → `#18243a` |
| Papel dos cartões e molduras | `#f3ecdc`, borda `#cbb98d` |
| Tinta do texto no papel | `#1d1a16`, secundária `#6a6052` |
| Ouro (barra da legenda, linhas, setas de avanço) | `#d9a93a` |
| Vermelho (inimigo, carimbo, pinos, ligações) | `#c8372d` |
| Azul / verde (o outro lado, aliados) | `#2f6fd6` / `#2e9e5b` |
| Marca-texto | amarelo 55% |

Cor tem significado: escolha **uma cor por lado** do conflito e mantenha no vídeo todo (país, setas, barras e pinos).

## Tipografia
- **EB Garamond**: documentos (itálico), cabeçalhos em versalete, nomes de lugar em CAIXA ALTA espaçada, anos grandes.
- **Fira Sans**: legenda de lugar (800, caixa alta), rótulos de pino (700), números e créditos.
- Texto por cima de imagem sempre com `SOMBRA_TEXTO`.

## As molduras
1. **Arquivo em tela cheia**: vídeo ou foto ocupa 16:9 inteiro (`modo: 'cobrir'`). Material 4:3 ou vertical usa
   `modo: 'desfocado'`, com o próprio material desfocado preenchendo as laterais. Sempre com Ken Burns leve,
   granulação e vinheta. Canto inferior esquerdo: barra dourada + LOCAL + data. Canto inferior direito: crédito.
2. **Cartão de documento**: papel claro centralizado sobre o azul-noite. Cabeçalho em versalete com fonte e data,
   citação em itálico revelada palavra por palavra, trecho-chave com marca-texto, crédito pequeno à direita.
   Na virada do argumento, um **carimbo vermelho** bate por cima ("O ACORDO NUNCA VEIO").
3. **Foto em moldura**: retrato ou foto que não aguenta tela cheia vira uma foto de papel levemente girada, com legenda.
4. **Mapa real**: satélite da NASA levemente escurecido. Países em cor sólida translúcida com borda branca. Setas
   grossas com ponta para avanços. Linhas tracejadas para rotas, com ícone (navio, avião, tanque, submarino) na ponta.
   Pinos com pulso. Medalhões (foto redonda com anel colorido) para pessoas. Nomes de lugar em versalete com data.
5. **Cena 3D (motion graphics)**: a moldura preferida para tudo que é animação. Fundo azul-noite com neblina,
   mar escuro com grade sutil, país em relevo cor de papel com borda dourada, vizinhos em cinza-azulado baixo.
   Pinos vermelhos com anel pulsando, arcos de rota vermelhos com ponta, áreas azuis translúcidas, colunas
   douradas. Fotos reais entram como placas de papel no espaço. A câmera está sempre andando.
6. **Globo 3D**: para abrir o vídeo e para trocar de continente. Gira até o lugar, aproxima e corta para o mapa.
7. **Número grande / barras**: sobre o azul-noite, com fio dourado e a fonte do dado embaixo.
8. **Linha do tempo**: ano grande no topo e régua deslizando. O modo `selo` (ano + lugar) vai por cima de vídeo.
9. **Quadro de ligações**: cartões de papel com alfinete, ligados por linhas com rótulo ("ordenou", "financiou",
   "3 dias depois"). A câmera aproxima do cartão central no fim.

## Ritmo
- Corte ou fusão de 0,4 s entre cenas. Dentro da cena, os elementos entram em sequência, nunca todos juntos.
- Cada visual dura de 4 a 8 s. Mapas podem durar mais se a câmera estiver andando.
- O elemento entra quando a narração o cita (pino quando o lugar é dito, carimbo na frase da virada).
