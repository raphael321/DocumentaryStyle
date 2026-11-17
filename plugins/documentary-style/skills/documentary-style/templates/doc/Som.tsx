// DocumentaryStyle: trilha por tema (sempre abaixo da locução) e efeitos sonoros automáticos.
// Os arquivos vêm de scripts/gerar-sons.py (public/doc/sons) ou da música do canal (`som.trilha.src`).
import React from 'react';
import { Audio, Sequence, interpolate, useVideoConfig } from 'remotion';
import { arquivo } from './base';
import type { Plano } from './DocVideo';
import { Ritmo, resolverTema } from './tema';
import { TEMPOS_INSCREVA, momentosInscreva } from './Inscreva';

export type NomeEfeito = 'sopro' | 'ping' | 'tique' | 'tecla' | 'carimbo' | 'clique' | 'impacto' | 'pop' | 'sino';
export type EventoSom = { nome: NomeEfeito; t: number; vol: number };

/** Volumes de referência (multiplicam o arquivo, que sai do gerar-sons.py com pico em -1 dBFS). */
export const NIVEIS: Record<Ritmo, { trilhaSemFala: number; trilhaComFala: number; efeito: Record<NomeEfeito, number> }> = {
  // sério: trilha bem baixa e efeitos quase subliminares
  serio: {
    trilhaSemFala: 0.22,
    trilhaComFala: 0.07,
    efeito: { sopro: 0.07, ping: 0.07, tique: 0.03, tecla: 0.03, carimbo: 0.22, clique: 0.08, impacto: 0.14, pop: 0.04, sino: 0.06 },
  },
  // dinâmico: um pouco mais presente, mas a voz continua na frente
  dinamico: {
    trilhaSemFala: 0.3,
    trilhaComFala: 0.1,
    efeito: { sopro: 0.18, ping: 0.12, tique: 0.07, tecla: 0.07, carimbo: 0.35, clique: 0.16, impacto: 0.3, pop: 0.12, sino: 0.12 },
  },
};

/** Intervalos (em segundos do vídeo) em que há locução. */
export const intervalosDeFala = (plano: Plano) => {
  const out: [number, number][] = [];
  let ini = 0;
  for (const c of plano.cenas) {
    if (c.audio) {
      const a = ini + (c.audioInicio ?? 0);
      out.push([a, a + (c.audioDuracao ?? c.duracao - (c.audioInicio ?? 0))]);
    }
    ini += c.duracao;
  }
  return out;
};

/** Lista os efeitos que o plano pede, pelo tipo de bloco, pelo tema e pelo ritmo. */
export const eventosDeSom = (plano: Plano): EventoSom[] => {
  const ritmo: Ritmo = plano.som?.ritmo ?? 'serio';
  const din = ritmo === 'dinamico';
  const N = NIVEIS[ritmo].efeito;
  const ev: EventoSom[] = [];
  const add = (nome: NomeEfeito, t: number, fator = 1) => ev.push({ nome, t: Math.max(0, t), vol: N[nome] * fator });
  let ini = 0;
  let graficas = 0;
  plano.cenas.forEach((c, i) => {
    const grafica = (c.fundo ?? 'doc') === 'doc';
    const tema = resolverTema(c.tema ?? plano.tema, grafica ? graficas++ : 0);
    if (i > 0) add('sopro', ini - 0.25);
    if (grafica && tema.fundo === 'sonar') add('ping', ini + 0.15);
    for (const b of c.blocos) {
      const t0 = ini + (b.inicio ?? 0);
      const p = b.props as Record<string, any>;
      if (b.tipo === 'documento') {
        if (p.carimbo) add('carimbo', t0 + p.carimbo.aos);
        if (din) {
          const dur = Math.max(0.8, String(p.texto ?? '').length / 70);
          for (let k = 0; k < dur / 0.11; k++) add('tecla', t0 + 0.35 + k * 0.11, 0.7 + 0.3 * ((k * 7) % 3) / 2);
        }
      }
      if (b.tipo === 'numero') {
        add('impacto', t0 + 0.3);
        if (din) for (let k = 0; k < 18; k++) add('tique', t0 + 0.4 + k * 0.075);
      }
      if (b.tipo === 'arquivo' && p.modo === 'painel') add('clique', t0);
      if (b.tipo === 'arquivo' && b.inicio && p.modo !== 'painel') add('sopro', t0 - 0.2, 0.7);
      if (b.tipo === 'foto') add('clique', t0 + (p.aos ?? 0.05));
      if (b.tipo === 'mapa' && din) {
        for (const pin of p.pinos ?? []) add('pop', t0 + (pin.aos ?? 0));
        for (const s of p.setas ?? []) add('sopro', t0 + (s.aos ?? 0), 0.6);
      }
      if (b.tipo === 'conexoes' && din) for (const n of p.nos ?? []) add('pop', t0 + (n.aos ?? 0));
    }
    ini += c.duracao;
  });
  // chamada de inscrição: clique no curtir, no inscrever e sininho
  for (const m of momentosInscreva(plano.cenas.map((c) => c.duracao), plano.inscreva)) {
    add('clique', m + TEMPOS_INSCREVA.curtir, 0.8);
    add('clique', m + TEMPOS_INSCREVA.inscrever, 0.8);
    add('sino', m + TEMPOS_INSCREVA.sino);
  }
  const fator = plano.som?.volumeEfeitos ?? 1;
  return ev.map((e) => ({ ...e, vol: e.vol * fator }));
};

/** Trilha em loop com ducking: abaixa sozinha enquanto a locução fala e sobe um pouco nas pausas. */
export const TrilhaComDucking: React.FC<{ plano: Plano; src: string; volume?: number; total: number }> = ({ plano, src, volume = 1, total }) => {
  const { fps } = useVideoConfig();
  const ritmo: Ritmo = plano.som?.ritmo ?? 'serio';
  const { trilhaSemFala, trilhaComFala } = NIVEIS[ritmo];
  const falas = intervalosDeFala(plano);
  const rampa = 0.45;
  return (
    <Audio
      src={arquivo(src)}
      loop
      volume={(f) => {
        const t = f / fps;
        // quanto de "fala" há perto deste instante (0 = silêncio, 1 = falando)
        let fala = 0;
        for (const [a, b] of falas) {
          const k = interpolate(t, [a - rampa, a, b, b + rampa * 1.6], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          fala = Math.max(fala, k);
        }
        const nivel = trilhaSemFala + (trilhaComFala - trilhaSemFala) * fala;
        const entra = interpolate(t, [0, 2.5], [0, 1], { extrapolateRight: 'clamp' });
        const sai = interpolate(t, [total - 3, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return nivel * volume * entra * sai;
      }}
    />
  );
};

export const EfeitosSom: React.FC<{ plano: Plano }> = ({ plano }) => {
  const { fps } = useVideoConfig();
  const ritmo: Ritmo = plano.som?.ritmo ?? 'serio';
  const pasta = plano.som?.pasta ?? 'doc/sons';
  return (
    <>
      {eventosDeSom(plano).map((e, i) => (
        <Sequence key={i} from={Math.round(e.t * fps)} durationInFrames={Math.round(2 * fps)} name={`som ${e.nome}`}>
          <Audio src={arquivo(`${pasta}/efeitos/${ritmo}/${e.nome}.wav`)} volume={e.vol} />
        </Sequence>
      ))}
    </>
  );
};

/** Trilha + efeitos do plano. O DocVideo já usa sozinho quando o plano tem `som`. */
export const SomDoPlano: React.FC<{ plano: Plano; total: number }> = ({ plano, total }) => {
  const som = plano.som;
  if (!som) return null;
  const ritmo: Ritmo = som.ritmo ?? 'serio';
  const pasta = som.pasta ?? 'doc/sons';
  const tema = resolverTema(plano.tema);
  let trilha: { src: string; volume?: number } | null = null;
  if (som.trilha === 'auto' || som.trilha === undefined) trilha = { src: `${pasta}/trilhas/${tema.trilha}-${ritmo}.${som.extensao ?? 'mp3'}`, volume: som.volumeTrilha };
  else if (som.trilha) trilha = { ...som.trilha, volume: (som.trilha.volume ?? 1) * (som.volumeTrilha ?? 1) };
  return (
    <>
      {trilha && <TrilhaComDucking plano={plano} src={trilha.src} volume={trilha.volume ?? 1} total={total} />}
      {som.efeitos !== false && <EfeitosSom plano={plano} />}
    </>
  );
};

/**
 * Confere a intercalação. `fotosVideos` = % do tempo com arquivo/foto real; `real` soma o mapa de satélite.
 * Meta: fotos e vídeos em 40 a 60% do tempo e nenhum trecho seguido só de gráficos acima de ~12 s.
 */
export const conferirPlano = (plano: Plano) => {
  const passo = 0.1;
  let total = 0;
  const marcas: ('arquivo' | 'mapa' | 'grafico')[] = [];
  for (const c of plano.cenas) {
    for (let t = 0; t < c.duracao; t += passo) {
      const ativo = (tipos: string[]) =>
        c.blocos.some((b) => {
          if (!tipos.includes(b.tipo)) return false;
          const a = b.inicio ?? 0;
          const fim = b.duracao ? a + b.duracao : c.duracao;
          return t >= a && t < fim;
        });
      marcas.push(ativo(['arquivo', 'foto']) ? 'arquivo' : ativo(['mapa', 'globo']) ? 'mapa' : 'grafico');
    }
    total += c.duracao;
  }
  const n = Math.max(1, marcas.length);
  const fotosVideos = marcas.filter((m) => m === 'arquivo').length / n;
  const real = marcas.filter((m) => m !== 'grafico').length / n;
  let maior = 0, atual = 0;
  for (const m of marcas) {
    atual = m === 'arquivo' ? 0 : atual + passo;
    maior = Math.max(maior, atual);
  }
  const avisos: string[] = [];
  if (fotosVideos < 0.4) avisos.push(`fotos e vídeos reais em só ${Math.round(fotosVideos * 100)}% do tempo (meta: 40 a 60%)`);
  if (maior > 12) avisos.push(`${maior.toFixed(1)} s seguidos sem foto ou vídeo real: intercale material de arquivo`);
  return { duracao: +total.toFixed(1), fotosVideos: Math.round(fotosVideos * 100), real: Math.round(real * 100), maiorTrechoSemArquivo: +maior.toFixed(1), avisos };
};
