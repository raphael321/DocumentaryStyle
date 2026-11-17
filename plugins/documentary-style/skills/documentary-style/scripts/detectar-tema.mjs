#!/usr/bin/env node
// DocumentaryStyle: descobre o TEMA visual de um roteiro (guerra, realeza, ditadura, mar, antiguidade, investigação).
// uso: node detectar-tema.mjs ROTEIRO.md [BRIEFING.md ...] [--cenas] [--json]
//   --cenas  também sugere o tema de cada cena (seções "### Cena ..." ou "## ...")
//   --json   saída em JSON (para outro script ler)
// O resultado vai no Plano: `tema: 'guerra'` (puro) ou `tema: MISTURAS.guerra` (variado). Para trocar só uma cena: `tema` dentro da cena.
import fs from 'node:fs';
import path from 'node:path';

// Palavras por tema. 'x*' = começa com x; sem '*' = palavra inteira. Peso padrão 1; [palavra, peso].
// Tudo sem acento e em minúsculas (o texto é normalizado igual).
const PALAVRAS = {
  guerra: [
    ['guerra*', 2], ['segunda guerra', 3], ['primeira guerra', 3], ['guerra mundial', 3], 'batalha*', 'soldad*', 'tropa*',
    'exercito*', 'divisao', 'divisoes', 'front', 'frente de batalha', 'trincheira*', 'tanque*', 'blindad*', 'artilharia',
    'infantaria', 'bombarde*', 'bombardei*', 'ofensiva*', 'invasao', 'invadi*', 'rendica*', 'rendeu', 'renderam', 'prisioneiro*',
    'eixo', 'aliados', 'nazista*', 'wehrmacht', 'regimento*', 'batalhao', 'combate*', 'municao', 'fuzil*',
    'metralhador*', 'granada*', 'canhao', 'canhoes', 'feb', 'pracinha*', 'cerco', 'desembarque', 'emboscada*', 'armisticio',
    'militar*', 'u-boat', 'torpede*', 'torpedo*', 'submarino alemao', 'declaracao de guerra', 'garand', 'mauser', 'kar98k',
    'vietna', 'coreia do norte', 'stalingrado', 'normandia', 'dia d',
  ],
  realeza: [
    'rei', 'reis', 'rainha*', ['realeza', 2], 'princes*', 'principe*', 'coroa', 'coroacao', 'coroad*', 'trono', ['monarquia*', 2],
    'monarca*', 'imperador*', 'imperatriz', 'dinastia*', 'palacio*', 'nobre', 'nobreza', 'duque*', 'duquesa*', 'conde', 'condessa',
    'herdeir*', 'sucessao', 'majestade', 'reinado*', 'reino', ['familia real', 3], ['casa real', 3], 'czar*', 'sultao', 'imperio do brasil',
    'dom pedro', 'd. pedro', 'princesa isabel', 'elizabeth', 'vitoria', 'luis xvi', 'maria antonieta', 'windsor', 'habsburgo',
    'bourbon', 'tudor', 'romanov', 'abdica*', 'regente', 'corte portuguesa',
  ],
  ditadura: [
    ['ditador*', 3], ['ditadura*', 3], 'regime', 'totalitar*', 'autoritar*', 'golpe*', 'junta militar', 'tortur*', 'censura*',
    'propaganda', 'repressao', 'reprimi*', 'expurgo*', 'gulag', 'culto a personalidade', 'tirano*', 'tirania', 'fascis*',
    'partido unico', 'policia secreta', 'desaparecido*', 'perseguic*', 'hitler', 'stalin', 'mussolini', 'pinochet', 'kim jong',
    'saddam', 'mao tse', 'idi amin', 'pol pot', 'ceausescu', 'kadafi', 'gaddafi', 'franco', 'salazar', 'ai-5', 'anos de chumbo',
    'dops', 'doi-codi', 'estado novo', 'getulio', 'exilio', 'exilad*', 'presos politicos', 'opositor*',
  ],
  mar: [
    'navio*', ['naufragi*', 2], 'naufrag*', 'mar', 'mares', 'oceano*', 'submarino*', 'porto*', 'marinha', 'marinheiro*', 'tripulac*',
    'tripulante*', 'frota*', 'capitao', 'conves', 'casco', 'afund*', 'costa', 'litoral', 'ilha*', 'transatlantic*', 'titanic',
    'pirata*', 'corsario*', 'caravela*', 'almirante', 'encouracado*', 'porta-avioes', 'baleia*', 'onda*', 'tempestade', 'farol',
    'barco*', 'navegac*', 'naveg*', 'mergulh*', 'oceanic*',
  ],
  antiguidade: [
    'imperio romano', 'roma', 'romano*', 'cesar', 'legiao', 'legioes', 'gladiador*', 'egito', 'egipci*', 'farao*', 'piramide*',
    'grecia', 'grego*', 'esparta*', 'atenas', 'troia', 'babilonia', 'persa*', 'macedoni*', 'alexandre o grande', 'mesopotamia',
    ['antiguidade', 3], 'a.c.', 'antes de cristo', 'senado romano', 'cartago', 'anibal', 'cleopatra', 'tutancamon', 'pompeia',
    'coliseu', 'templo*', 'mitologia', 'deuses', 'faraonic*', 'hieroglif*', 'sumeri*', 'asteca*', 'maia*', 'inca*', 'viking*',
    'medieval', 'idade media', 'cruzada*', 'cavaleiro*', 'castelo*',
  ],
  // estilo "Investigação visual": acidentes, aviação, crimes, mistérios, desastres, perícia
  investigacao: [
    'aviao', 'avioes', 'aeronave*', 'voo', 'voos', 'piloto*', 'copiloto*', 'cabine', 'cockpit', 'decol*', 'aterriss*', 'pouso',
    'pista', 'aeroporto*', 'jato*', 'learjet', 'boeing', 'airbus', 'embraer', 'helicoptero*', 'turbina*', 'altitude', 'altimetro',
    ['caixa preta', 3], 'controle de trafego', 'torre de controle', 'pitot', 'estol', 'mayday', 'ntsb', 'cenipa', 'fuselagem',
    ['acidente*', 2], 'queda', 'caiu', 'desastre*', 'tragedia*', 'explosao', 'colapso', 'desabamento', 'incendio*',
    'crime*', 'assassin*', 'homicidio*', 'serial killer', 'policia*', 'investigac*', ['investiga*', 2], 'detetive*', 'suspeit*',
    'vitima*', 'cadaver', 'sequestr*', 'mafia*', 'cartel*', 'trafic*', 'gangue*', 'roubo*', 'assalto*', 'fraude*', 'golpista*',
    'julgamento', 'tribunal', 'fbi', ['misterio*', 2], 'misterios*', 'desaparec*', 'pericia', 'perito*', 'legista', 'condenad*',
    'evidencia*', 'prova*', 'testemunha*', 'relatorio final', 'segundos antes', 'o que aconteceu',
  ],
};

// RITMO: sinais de vídeo dinâmico (lista, curiosidade, ação rápida). Sem eles o vídeo é 'serio'.
const DINAMICO = [
  ['top', 3], 'curiosidade*', 'incrivel', 'incriveis', 'insano*', 'bizarr*', 'voce sabia', 'ranking', ['maiores', 2], ['mais rapido*', 2],
  'recorde*', 'impressionante*', 'surpreendente*', 'louco', 'loucura', 'epico*', 'perseguicao', 'corrida', 'velocidade',
  'explosao', 'explosoes', 'em segundos', 'ninguem acreditou', 'virou', 'viral', 'segredo*', 'numero 1', 'numero um',
];
// Temas que pedem trilha e efeitos discretos mesmo com sinais de ação
const SERIOS = ['ditadura', 'investigacao'];

const NOMES = {
  guerra: 'Guerra · estilo Sonar',
  realeza: 'Realeza',
  ditadura: 'Ditadura',
  mar: 'Mar',
  antiguidade: 'Antiguidade',
  investigacao: 'Investigação visual',
};

const normalizar = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REGRAS = Object.entries(PALAVRAS).map(([tema, lista]) => ({
  tema,
  regras: lista.map((item) => {
    const [p, peso] = Array.isArray(item) ? item : [item, 1];
    const prefixo = p.endsWith('*');
    const base = escapar(prefixo ? p.slice(0, -1) : p);
    return { p, peso, re: new RegExp(`(?<![a-z0-9])${base}${prefixo ? '[a-z0-9-]*' : '(?![a-z0-9])'}`, 'g') };
  }),
}));

/** Pontua um texto. Linhas de título (#) e "Título:" contam em dobro. */
export function pontuar(texto) {
  const linhas = normalizar(texto).split('\n');
  const pontos = Object.fromEntries(REGRAS.map((r) => [r.tema, 0]));
  const achados = Object.fromEntries(REGRAS.map((r) => [r.tema, {}]));
  for (const linha of linhas) {
    const mult = /^\s*#|titulo|projeto:/.test(linha) ? 2 : 1;
    for (const { tema, regras } of REGRAS) {
      for (const { p, peso, re } of regras) {
        const n = (linha.match(re) ?? []).length;
        if (!n) continue;
        pontos[tema] += n * peso * mult;
        achados[tema][p.replace('*', '')] = (achados[tema][p.replace('*', '')] ?? 0) + n;
      }
    }
  }
  return { pontos, achados };
}

const REGRAS_DIN = DINAMICO.map((item) => {
  const [p, peso] = Array.isArray(item) ? item : [item, 1];
  const prefixo = p.endsWith('*');
  const base = escapar(prefixo ? p.slice(0, -1) : p);
  return { peso, re: new RegExp(`(?<![a-z0-9])${base}${prefixo ? '[a-z0-9-]*' : '(?![a-z0-9])'}`, 'g') };
});

/**
 * Ritmo do vídeo: 'dinamico' quando o texto tem cara de lista/curiosidade/ação (palavras, exclamações, frases curtas),
 * senão 'serio'. Mortes, ditadura e investigação puxam para o sério.
 */
export function escolherRitmo(texto, tema) {
  const n = normalizar(texto);
  let pts = 0;
  for (const { peso, re } of REGRAS_DIN) pts += (n.match(re) ?? []).length * peso;
  pts += (texto.match(/!/g) ?? []).length * 0.5;
  const frases = texto.split(/[.!?]+/).map((f) => f.trim().split(/\s+/).length).filter((k) => k > 2);
  const media = frases.reduce((s, k) => s + k, 0) / Math.max(1, frases.length);
  if (media < 9) pts += 3;
  const pesado = (n.match(/(?<![a-z])(morte|mortos|morreram|vitimas|tragedia|massacre|genocidio|tortura)/g) ?? []).length;
  pts -= pesado * 0.8;
  if (SERIOS.includes(tema)) pts -= 3;
  return { ritmo: pts >= 6 ? 'dinamico' : 'serio', pontosDinamico: +pts.toFixed(1) };
}

/** Escolhe o tema. Sem sinal claro, cai em 'investigacao' (o visual neutro de "explicar o que aconteceu"). */
export function escolherTema(texto) {
  const { pontos, achados } = pontuar(texto);
  const ordem = Object.entries(pontos).sort((a, b) => b[1] - a[1]);
  const [[primeiro, p1], [segundo, p2]] = ordem;
  const total = ordem.reduce((s, [, v]) => s + v, 0) || 1;
  const fraco = p1 < 6;
  const tema = fraco ? 'investigacao' : primeiro;
  const confianca = fraco ? 'baixa' : p1 >= p2 * 1.8 ? 'alta' : p1 >= p2 * 1.25 ? 'media' : 'baixa';
  const top = (t) =>
    Object.entries(achados[t])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([w, n]) => `${w} (${n})`);
  return {
    tema,
    confianca,
    secundario: p2 > 0 && p2 >= p1 * 0.5 ? segundo : null,
    pontos: Object.fromEntries(ordem),
    participacao: Object.fromEntries(ordem.map(([t, v]) => [t, Math.round((v / total) * 100)])),
    pistas: top(tema === primeiro ? primeiro : tema),
  };
}

/** Divide o roteiro em cenas pelos títulos "### Cena" (ou "## " se não houver). */
export function dividirCenas(texto) {
  const marca = /^###\s+/m.test(texto) ? /^###\s+(.*)$/gm : /^##\s+(.*)$/gm;
  const cenas = [];
  let m, ultimo = null;
  while ((m = marca.exec(texto))) {
    if (ultimo) cenas.push({ titulo: ultimo.titulo, texto: texto.slice(ultimo.fim, m.index) });
    ultimo = { titulo: m[1].trim(), fim: m.index + m[0].length };
  }
  if (ultimo) cenas.push({ titulo: ultimo.titulo, texto: texto.slice(ultimo.fim) });
  return cenas;
}

// ---------- linha de comando ----------
const ehPrincipal = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (ehPrincipal) {
  const args = process.argv.slice(2);
  const arquivos = args.filter((a) => !a.startsWith('--'));
  if (!arquivos.length) {
    console.error('uso: node detectar-tema.mjs ROTEIRO.md [BRIEFING.md ...] [--cenas] [--json]');
    process.exit(1);
  }
  const textos = arquivos.map((f) => fs.readFileSync(f, 'utf8'));
  const geral = escolherTema(textos.join('\n'));
  Object.assign(geral, escolherRitmo(textos[0], geral.tema));
  let cenas = [];
  if (args.includes('--cenas')) {
    cenas = dividirCenas(textos[0]).map((c) => {
      const r = escolherTema(c.texto);
      const { pontos } = pontuar(c.texto);
      // só sugere trocar o tema da cena quando ela fala claramente de outra coisa
      const forte = Object.entries(pontos).sort((a, b) => b[1] - a[1])[0];
      const troca = forte[0] !== geral.tema && forte[1] >= 6 && forte[1] >= (pontos[geral.tema] ?? 0) * 2 ? forte[0] : null;
      return { cena: c.titulo, tema: troca ?? geral.tema, trocar: !!troca, pontos: r.pontos };
    });
  }
  if (args.includes('--json')) {
    console.log(JSON.stringify({ ...geral, cenas }, null, 2));
  } else {
    console.log(`Tema: ${geral.tema} (${NOMES[geral.tema]}) · confiança ${geral.confianca}`);
    console.log(`Ritmo: ${geral.ritmo} (${geral.ritmo === 'serio' ? 'trilha e efeitos discretos, movimento lento' : 'efeitos mais vivos, fusões curtas'})`);
    if (geral.secundario) console.log(`Segundo tema forte: ${geral.secundario} (${NOMES[geral.secundario]})`);
    console.log(`Pistas: ${geral.pistas.join(', ') || '-'}`);
    console.log(`Pontos: ${Object.entries(geral.pontos).map(([t, v]) => `${t} ${v}`).join(' · ')}`);
    for (const c of cenas.filter((c) => c.trocar)) console.log(`  cena "${c.cena}": sugere tema '${c.tema}'`);
    console.log(`\nNo plano (tema puro):  tema: '${geral.tema}'`);
    console.log(`No plano (misturado, varia o fundo entre as cenas gráficas):  import { MISTURAS } from '../doc';  tema: MISTURAS.${geral.tema}`);
    console.log(`Som (trilha do tema sempre abaixo da voz):  som: { trilha: 'auto', ritmo: '${geral.ritmo}' }`);
  }
}
