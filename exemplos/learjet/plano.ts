// Learjet 60 N722BD · Greenacres, Flórida, 1º nov 2026. Plano no padrão DocumentaryStyle (tema aviação).
// Fatos conferidos em 20/11/2026: NTSB (ERA27MA026), FAA via imprensa, WPBF, AeroCorner. Ver FONTES.md.
// A narração (falasLearjet.json) vem do Chatterbox no PC; as marcas de tempo se ajustam sozinhas à duração real.
import type { Bloco, CenaPlano, Plano } from '../doc';
import { TEMAS } from '../doc';
import './animacoes';
import { ACERVO, type ChaveAcervo } from './acervo';
import FALAS from './falasLearjet.json';

const C = TEMAS.aviacao.cor;
const PAUSA = 0.4;
const SOBRA = 0.7;

const AUSTIN: [number, number] = [-97.67, 30.19];
const ELEUTHERA: [number, number] = [-76.68, 25.47];
const QUEDA: [number, number] = [-80.113, 26.633]; // coordenada do caso na NTSB
const COSTA_OESTE: [number, number] = [-82.75, 27.35];
const PBI: [number, number] = [-80.096, 26.683];

type Fala = { cena: number; duracao: number; texto: string };
const fala = (n: number): Fala => {
  const f = (FALAS as Fala[]).find((x) => x.cena === n);
  if (!f) throw new Error(`falta a fala da cena ${n} em falasLearjet.json`);
  return f;
};
const dur = (n: number) => fala(n).duracao;

/** Segundo da cena em que a narração chega na frase (estimado pela posição da palavra). */
const marca = (n: number, frase: string, ajuste = -0.3) => {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  const palavras = norm(fala(n).texto).split(/\s+/).filter(Boolean);
  const alvo = norm(frase).split(/\s+/).filter(Boolean);
  const k = palavras.findIndex((_, j) => alvo.every((a, m) => palavras[j + m] === a));
  if (k < 0) throw new Error(`frase não encontrada na cena ${n}: ${frase}`);
  const peso = (p: string) => 0.6 + p.length / 6;
  const ate = palavras.slice(0, k).reduce((s, p) => s + peso(p), 0);
  const tudo = palavras.reduce((s, p) => s + peso(p), 0);
  return +(PAUSA + (ate / tudo) * dur(n) + ajuste).toFixed(2);
};

const arq = (k: ChaveAcervo, extra: object = {}) => {
  const a = ACERVO[k];
  return {
    src: a.src,
    tipo: /\.(mp4|webm|ogv|mov)$/i.test(a.src) ? ('video' as const) : ('foto' as const),
    pb: a.pb ?? false,
    modo: 'cobrir' as const,
    credito: a.credito,
    legenda: a.legenda,
    inicioSeg: a.inicioSeg ?? 0,
    ...extra,
  };
};
const anim = (nome: string, p: Record<string, unknown> = {}): Bloco => ({ tipo: 'componente', props: { nome, p } });

const trecho = (fim: number, partes: [number, Bloco][]): Bloco[] =>
  partes.map(([ini, b], j) => {
    const prox = j < partes.length - 1 ? partes[j + 1][0] : fim;
    return { ...b, inicio: ini, duracao: +(prox - ini + 0.01).toFixed(2) } as Bloco;
  });

const cena = (n: number, id: string, montar: (fim: number) => Bloco[], sobra = SOBRA): CenaPlano => {
  const fim = +(PAUSA + dur(n) + sobra).toFixed(2);
  return {
    id,
    audio: `learjet/voz/cena${n}.mp3`,
    audioInicio: n === 1 ? 0.1 : PAUSA,
    audioDuracao: dur(n),
    fundo: 'doc',
    duracao: fim,
    blocos: montar(fim),
  };
};

const mapaRota = (extra: { aosAustin: number; aosEleuthera: number }) => ({
  tipo: 'mapa' as const,
  props: {
    camera: [{ t: 0, lon: -88, lat: 28.6, altura: 17 }, { t: 9, lon: -86.5, lat: 28.2, altura: 15 }],
    escurecer: 0.3,
    paises: [{ iso: 'USA', opacidade: 0.18, cor: C.azul, aos: 0 }, { iso: 'BHS', opacidade: 0.5, cor: C.ouro, aos: extra.aosEleuthera }],
    rotas: [
      { pontos: [AUSTIN, COSTA_OESTE, QUEDA, ELEUTHERA], aos: extra.aosAustin + 0.6, dur: 2.2, cor: C.branco, largura: 4, tracejado: true, curva: 0.08 },
      { pontos: [AUSTIN, COSTA_OESTE, QUEDA], aos: extra.aosAustin + 1.2, dur: 4.5, cor: C.ouro, largura: 7, tracejado: false, icone: 'aviao', curva: 0.08 },
    ],
    pinos: [
      { lon: AUSTIN[0], lat: AUSTIN[1], rotulo: 'Austin', sub: 'Texas · decolagem', aos: extra.aosAustin, cor: C.ouro, lado: 'esquerda' as const },
      { lon: ELEUTHERA[0], lat: ELEUTHERA[1], rotulo: 'Eleuthera', sub: 'Bahamas · destino', aos: extra.aosEleuthera, cor: C.azul },
    ],
  },
});

const mapaQueda = (aos: { pino: number; rua?: number; raio?: number }) => ({
  tipo: 'mapa' as const,
  props: {
    camera: [{ t: 0, lon: -80.3, lat: 26.75, altura: 1.6 }, { t: 3.5, lon: -80.12, lat: 26.64, altura: 0.22 }, { t: 9, lon: -80.115, lat: 26.635, altura: 0.16 }],
    escurecer: 0.25,
    pinos: [
      { lon: PBI[0], lat: PBI[1], rotulo: 'West Palm Beach', sub: 'aeroporto', aos: 0.6, cor: C.azul, lado: 'esquerda' as const },
      { lon: QUEDA[0], lat: QUEDA[1], rotulo: 'Greenacres', sub: 'ao lado da avenida Military Trail', aos: aos.pino, cor: C.vermelho, pulso: true },
    ],
    ...(aos.raio !== undefined
      ? {
          circulos: [{ lon: QUEDA[0], lat: QUEDA[1], raioKm: 6, aos: aos.raio, cor: C.ouro }],
          rotulos: [{ lon: -80.113, lat: 26.705, texto: 'Peças do profundor esquerdo', sub: 'de 2 a 6 km da cratera', aos: aos.raio + 0.6, tamanho: 28 }],
        }
      : {}),
  },
});

export const CENAS: CenaPlano[] = [
  // 1 · GANCHO (o número entra no quadro 0, sem silêncio)
  cena(1, 'gancho', (fim) =>
    trecho(fim, [
      [0, { tipo: 'numero', props: { rotulo: 'de queda', numero: 8, prefixo: 'mais de ', sufixo: ' km', sub: 'em pouco mais de um minuto', cor: C.vermelho, contarDe: 0 } }],
      [marca(1, 'Um jato executivo', -0.1), { tipo: 'arquivo', props: arq('c21Voo') }],
      [marca(1, 'entrou numa'), { tipo: 'arquivo', props: arq('tempestade') }],
    ]),
  ),

  // 2 · O MAYDAY
  cena(2, 'mayday', (fim) =>
    trecho(fim, [
      [0, { tipo: 'documento', props: {
        cabecalho: 'Rádio com o controle de tráfego · ~12h48',
        texto: 'A tripulação informa que o avião está [[descendo]] e, segundos depois, declara emergência.',
        carimbo: { texto: 'MAYDAY', aos: Math.max(1.2, marca(2, 'logo depois') + 0.3), cor: C.vermelho },
        credito: 'relato da NTSB e da FAA à imprensa',
      } }],
      [marca(2, 'Instantes depois', -0.2), mapaQueda({ pino: 2.2 })],
      [marca(2, 'O que aconteceu', -0.2), { tipo: 'arquivo', props: arq('ntsbLocal') }],
    ]),
  ),

  // 3 · O VOO
  cena(3, 'voo', (fim) => {
    const a = marca(3, 'decola de Austin');
    const b = marca(3, 'A bordo');
    return trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('c21Decola') }],
      [a - 1.2, mapaRota({ aosAustin: 1.2, aosEleuthera: marca(3, 'rumo à ilha') - a + 1.2 })],
      [b, { tipo: 'numero', props: { rotulo: 'pessoas a bordo', numero: 9, sub: '2 pilotos e 7 passageiros', contarDe: 0 } }],
      [marca(3, 'A copilota', -0.1), { tipo: 'arquivo', props: arq('c21Cabine') }],
    ]);
  }),

  // 4 · ALTITUDE
  cena(4, 'altitude', (fim) =>
    trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('golfo') }],
      [marca(4, 'mais de dez'), { tipo: 'barras', props: {
        titulo: 'Altura acima do mar',
        itens: [
          { rotulo: 'Monte Everest', valor: 8.8, sufixo: ' km', cor: C.azul },
          { rotulo: 'Learjet (35 mil pés)', valor: 10.7, sufixo: ' km', cor: C.ouro },
        ],
        casas: 1,
        maximo: 12,
      } }],
      [marca(4, 'e a temperatura'), { tipo: 'numero', props: { rotulo: 'do lado de fora', numero: 'abaixo de −50 °C', sub: 'valor típico a 35 mil pés', cor: C.azul } }],
    ]),
  ),

  // 5 · TEMPESTADES
  cena(5, 'tempestades', (fim) =>
    trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('goes') }],
      [marca(5, 'São nuvens'), { tipo: 'arquivo', props: arq('nuvemTopo') }],
      [marca(5, 'e gotículas'), { tipo: 'arquivo', props: arq('geloAsa2') }],
    ]),
  ),

  // 6 · GELO CLARO
  cena(6, 'gelo-claro', (fim) =>
    trecho(fim, [
      [0, anim('perfilQueda', { desenharEm: 4, ate: 0.42, aos: { gelo: Math.max(1, marca(6, 'turbulência moderada')) } })],
      [marca(6, 'O gelo claro', -0.1), { tipo: 'arquivo', props: arq('geloAsa') }],
    ]),
  ),

  // 7 · PEDIDO DE SUBIDA
  cena(7, 'subida', (fim) =>
    trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('nuvemDentro') }],
      [marca(7, 'Depois de relatar'), anim('perfilQueda', { desenharEm: 0.1, ate: 0.48, aos: { gelo: 0, subida: marca(7, 'é autorizada') - marca(7, 'Depois de relatar') } })],
    ]),
  ),

  // 8 · MAYDAY E SOBREVELOCIDADE
  cena(8, 'sobrevelocidade', (fim) => {
    const q = marca(8, 'A queda média');
    return trecho(fim, [
      [0, anim('perfilQueda', { desenharEm: marca(8, 'Por volta') * 0.9, ate: 0.86, aos: { gelo: 0, subida: 0, queda: marca(8, 'Em seguida') } })],
      [marca(8, 'Por volta'), { tipo: 'arquivo', props: arq('c21Voo', { inicioSeg: 8 }) }],
      [q, anim('torresEiffel', { aos: 0.2 })],
    ]);
  }),

  // 9 · O IMPACTO
  cena(9, 'impacto', (fim) =>
    trecho(fim, [
      [0, anim('perfilQueda', { desenharEm: 3, ate: 1, aos: { gelo: 0, subida: 0, queda: 0, faa: marca(9, 'em pouco mais'), impacto: marca(9, 'Por volta') } })],
      [marca(9, 'ele atinge'), mapaQueda({ pino: 1.4 })],
      [marca(9, 'Os nove'), { tipo: 'arquivo', props: arq('ntsbLocal2') }],
      [marca(9, 'Cerca de seiscentos'), { tipo: 'numero', props: { rotulo: 'moradores fora de casa', numero: 600, prefixo: '~', sub: '77 casas móveis desocupadas', contarDe: 0 } }],
    ]),
  ),

  // 10 · NTSB + HIPÓTESE 1
  cena(10, 'hipotese-correntes', (fim) => {
    const h = marca(10, 'O primeiro são');
    return trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('ntsbLocal') }],
      [marca(10, 'Os fatos conhecidos'), { tipo: 'conexoes', props: {
        nos: [
          { id: 'q', x: 50, y: 30, titulo: 'Mergulho a 35 mil pés', sub: 'causa ainda não apontada', destaque: true, aos: 0.2 },
          { id: 'a', x: 20, y: 70, titulo: 'Correntes da tempestade', aos: 1.0 },
          { id: 'b', x: 50, y: 74, titulo: 'Gelo na asa e no Pitot', aos: 1.6 },
          { id: 'c', x: 80, y: 70, titulo: 'Desorientação espacial', aos: 2.2 },
        ],
        ligacoes: [{ de: 'a', para: 'q', aos: 1.2 }, { de: 'b', para: 'q', aos: 1.8 }, { de: 'c', para: 'q', aos: 2.4 }],
      } }],
      [h, { tipo: 'arquivo', props: arq('tempestade', { inicioSeg: 6 }) }],
      [marca(10, 'Colunas de ar'), anim('correntes', { aosMargem: marca(10, 'e no ar rarefeito') - marca(10, 'Colunas de ar') })],
    ]);
  }),

  // 11 · HIPÓTESE 2: GELO
  cena(11, 'hipotese-gelo', (fim) =>
    trecho(fim, [
      [0, anim('asaGelo', { aosGelo: 1, aosDescola: Math.max(2.5, marca(11, 'reduz a sustentação') - 0.8) })],
      [marca(11, 'Nos tubos'), { tipo: 'arquivo', props: arq('pitotFoto') }],
      [marca(11, 'o gelo pode'), anim('pitot', { aosGelo: 1.2 })],
      [marca(11, 'Foi o que'), { tipo: 'documento', props: {
        cabecalho: 'Voo Air France 447 · Rio de Janeiro → Paris · 1º jun. 2009',
        texto: 'Cristais de gelo bloqueiam os tubos de Pitot a 35 mil pés. Sem [[velocidade confiável]], a tripulação perde o controle e o avião cai no Atlântico. 228 mortos.',
        credito: 'BEA (França), relatório final, 2012',
      } }],
    ]),
  ),

  // 12 · HIPÓTESE 3: DESORIENTAÇÃO
  cena(12, 'hipotese-desorientacao', (fim) => {
    const d = marca(12, 'e o piloto pode', -0.6);
    return trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('nuvemDentro', { inicioSeg: 6 }) }],
      [marca(12, 'O ouvido interno'), { tipo: 'arquivo', props: arq('c21Cabine', { inicioSeg: 5 }) }],
      [d, anim('desorientacao', { aosSente: 1.6, aosEspiral: marca(12, 'Se ele puxa') - d })],
    ]);
  }),

  // 13 · O BOATO
  cena(13, 'boato', (fim) =>
    trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('ntsbLocal', { inicioSeg: 10 }) }],
      [marca(13, 'o boato'), { tipo: 'documento', props: {
        cabecalho: 'Boato que circulou nas redes · nov. 2026',
        texto: '"O jato foi [[abatido]] por causa da visita presidencial."',
        carimbo: { texto: 'SEM PROVA', aos: Math.max(2, marca(13, 'Nada sustenta') - marca(13, 'o boato')), cor: C.vermelho },
      } }],
      [marca(13, 'Trump havia') + 1.0, { tipo: 'documento', props: {
        cabecalho: '1º de novembro de 2026',
        texto: 'Trump deixa o aeroporto de West Palm Beach [[pouco mais de uma hora antes]] da queda.',
        credito: 'CNN, citada pela imprensa especializada',
      } }],
      [marca(13, 'e a NTSB'), { tipo: 'documento', props: {
        cabecalho: 'NTSB · 3 de novembro de 2026 (resumo)',
        texto: 'Os investigadores não encontraram [[nenhuma ligação]] entre o acidente e o Serviço Secreto.',
        credito: 'declaração à imprensa',
      } }],
    ]),
  ),

  // 14 · A INVESTIGAÇÃO + PERGUNTA
  cena(14, 'investigacao', (fim) =>
    trecho(fim, [
      [0, { tipo: 'arquivo', props: arq('ntsbLocal2', { inicioSeg: 4 }) }],
      [marca(14, 'o profundor'), mapaQueda({ pino: 0.2, raio: 1.4 })],
      [marca(14, 'O gravador'), { tipo: 'arquivo', props: arq('ntsbLab') }],
      [marca(14, 'O relatório preliminar'), { tipo: 'numero', props: { rotulo: 'para o relatório final', numero: '1 a 2 anos', sub: 'o preliminar costuma sair em cerca de um mês' } }],
      [marca(14, 'E você'), { tipo: 'arquivo', props: arq('nuvemTopo') }],
    ], ),
  ),
];

export const PLANO_LEARJET: Plano = {
  tema: 'aviacao',
  som: { trilha: 'auto', ritmo: 'serio' },
  inscreva: {},
  cenas: CENAS,
};
