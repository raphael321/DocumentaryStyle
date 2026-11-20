// Arquivo real do Learjet. SÓ domínio público (governo dos EUA: NTSB, NOAA, NASA, Força Aérea/DVIDS, FAA).
// Cada item traz a legenda que descreve a IMAGEM real (o que ela mostra, onde e quando), nunca o lugar da narração.
// Na nuvem ficam espaços reservados; no PC, src/credito/legenda vêm de public/learjet/acervo/creditos.json.
export type ItemAcervo = { src: string; credito: string; pb?: boolean; legenda: { local: string; data?: string }; inicioSeg?: number };

/** O que cada espaço pede (para quem for buscar). Se não achar em domínio público, deixe o reservado: o plano troca por gráfico. */
export const PEDIDO = {
  ntsbLocal: 'NTSB no local do acidente ERA27MA026 (Greenacres, FL, nov/2026): investigadores, destroços, escavação. Fonte: Flickr oficial da NTSB (flickr.com/photos/ntsb) ou ntsb.gov',
  ntsbLocal2: 'segunda foto/vídeo diferente da NTSB do mesmo local (ERA27MA026)',
  ntsbLab: 'Laboratório de gravadores de voo (Vehicle Recorders Lab) da NTSB em Washington, foto de arquivo da NTSB',
  c21Voo: 'C-21A (versão militar do Learjet 35) em voo, vídeo do DVIDS (dvidshub.net) ou foto da Força Aérea dos EUA',
  c21Decola: 'decolagem de um C-21A / Learjet, vídeo do DVIDS',
  c21Cabine: 'pilotos na cabine de um C-21A em voo, vídeo/foto do DVIDS',
  nuvemTopo: 'cumulonimbus / tempestade vista de avião ou do alto (NOAA Photo Library, NSSL ou NASA)',
  tempestade: 'tempestade com raios, de preferência na Flórida (NOAA / NWS / NSSL)',
  goes: 'imagem do satélite GOES-19 (NOAA) do sul da Flórida em 1º/nov/2026 entre 17:30 e 17:55 UTC (12:30-12:55 hora local), de preferência animação. Ex.: bucket público noaa-goes19 (ABI) ou arquivo de imagens da NOAA',
  geloAsa: 'gelo em perfil de asa no túnel de gelo da NASA Glenn (Icing Research Tunnel), foto ou vídeo',
  geloAsa2: 'gelo acumulado no bordo de ataque de avião em voo de pesquisa da NASA (ex.: Twin Otter de pesquisa de gelo)',
  pitotFoto: 'tubo de Pitot no nariz de um avião (NASA, Força Aérea ou FAA)',
  nuvemDentro: 'voo dentro de nuvem, visto da cabine, sem horizonte (NASA ou DVIDS)',
  golfo: 'Golfo do México ou Flórida vistos da Estação Espacial (NASA, Gateway to Astronaut Photography)',
} as const;
export type ChaveAcervo = keyof typeof PEDIDO;

const reservado = (local: string, data?: string): ItemAcervo => ({
  src: 'doc/demo/cena.svg',
  credito: 'espaço reservado: arquivo real',
  legenda: { local, data },
});

export const ACERVO: Record<ChaveAcervo, ItemAcervo> = {
  ntsbLocal: reservado('NTSB no local da queda', 'Greenacres, nov. 2026'),
  ntsbLocal2: reservado('Investigação da NTSB', 'Greenacres, nov. 2026'),
  ntsbLab: reservado('Laboratório de gravadores da NTSB', 'Washington (arquivo)'),
  c21Voo: reservado('C-21A, versão militar do Learjet 35', 'Força Aérea dos EUA'),
  c21Decola: reservado('Decolagem de um C-21A (Learjet 35)', 'Força Aérea dos EUA'),
  c21Cabine: reservado('Cabine de um C-21A (Learjet 35)', 'Força Aérea dos EUA'),
  nuvemTopo: reservado('Nuvem de tempestade', 'NOAA'),
  tempestade: reservado('Tempestade', 'NOAA'),
  goes: reservado('Sul da Flórida, satélite GOES-19', '1º nov. 2026'),
  geloAsa: reservado('Gelo em perfil de asa, túnel da NASA', 'arquivo'),
  geloAsa2: reservado('Gelo no bordo de ataque, voo de pesquisa', 'NASA'),
  pitotFoto: reservado('Tubo de Pitot', 'arquivo'),
  nuvemDentro: reservado('Voo dentro da nuvem', 'arquivo'),
  golfo: reservado('Golfo do México visto do espaço', 'NASA'),
};
