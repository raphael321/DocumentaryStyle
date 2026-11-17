# Acervo: material real que pode ir para um vídeo monetizado

**Regra de ouro:** só entra material com licença conhecida, e cada arquivo é registrado em
`public/<slug>/acervo/creditos.json`. Na dúvida, não use. Peça permissão ao usuário antes de baixar e diga a fonte e o tamanho.

## Onde procurar
| Fonte | O que tem | Licença típica | Cuidado |
|---|---|---|---|
| **Wikimedia Commons** (commons.wikimedia.org) | fotos e vídeos históricos, mapas | domínio público, CC BY, CC BY-SA | Leia a licença de **cada** arquivo. Evite NC (não comercial) e ND. |
| **NARA**, Arquivo Nacional dos EUA (catalog.archives.gov) | filmes e fotos do governo americano (Signal Corps, Marinha) | domínio público (obra do governo dos EUA) | Confira "Use Restrictions" no item. |
| **Library of Congress** (loc.gov) | fotos, jornais, mapas | varia; muitas "No known restrictions" | Leia "Rights Advisory". |
| **Internet Archive** (archive.org) | cinejornais e filmes do governo | só o que está marcado como Public Domain | Muito upload ali **não** é domínio público. |
| **Arquivo Nacional** do Brasil (sian.an.gov.br) | fotos e filmes brasileiros, FEB, governo | muitas em domínio público pela idade | Confira os termos de uso do acervo. |
| **Bundesarchiv** (via Wikimedia Commons) | fotos alemãs | CC BY-SA 3.0 DE | Crédito: "Bundesarchiv, Bild …". |
| **NASA** | satélite, espaço | domínio público | Crédito: "NASA". |

Lei brasileira (9.610/98, art. 44): obra fotográfica e audiovisual cai em domínio público **70 anos depois de 1º de
janeiro do ano seguinte à publicação**. Foto publicada em 1945 está livre desde 2016. Isso vale no Brasil: confira
também a regra do país de origem.

## O que NÃO usar
- Trechos de outros canais do YouTube, documentários de TV ou streaming, mesmo curtos.
- Versões colorizadas ou restauradas por empresas: a colorização pode ter direito autoral próprio, mesmo sobre original livre.
- Material do Imperial War Museum (licença não comercial) em vídeo monetizado.
- Banco de imagens sem licença comprada.

## Content ID
Até material em domínio público pode tomar reivindicação automática (outra pessoa enviou a mesma filmagem).
Guarde o link da fonte original no `creditos.json` para contestar.

## creditos.json
```json
[
  {
    "arquivo": "fornovo/acervo/rendicao-1945.jpg",
    "titulo": "Prisioneiros alemães em Fornovo di Taro",
    "autor": "Exército dos EUA / Signal Corps",
    "fonte": "https://commons.wikimedia.org/wiki/File:...",
    "licenca": "Domínio público",
    "credito_tela": "Arquivo: Exército dos EUA / domínio público"
  }
]
```
O texto de `credito_tela` vai na prop `credito` do bloco. A lista inteira vai na descrição do vídeo.

## Tratamento
- Vídeo antigo: `pb: true` quando o original é P&B (não "descolorir" material colorido sem motivo).
- Vídeo 4:3: `modo: 'desfocado'`, para não cortar cabeças.
- Sem imagem real de cadáveres ou feridos. Prefira mapa, documento ou silhueta.
- Sem suástica em thumbnail ou em destaque. No Brasil, a Lei 7.716/89, art. 20, pune a divulgação do símbolo, e o YouTube limita anúncios.
