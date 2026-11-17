// Plano de demonstração do DocumentaryStyle (história de Fornovo). Imagens de pessoas/cena são placeholders.
import { COR } from './tema';
import type { Plano } from './DocVideo';

const RIO: [number, number] = [-43.2, -22.9];
const NAPOLES: [number, number] = [14.27, 40.85];
const PARMA: [number, number] = [10.33, 44.8];
const COLLECCHIO: [number, number] = [10.216, 44.752];
const FORNOVO: [number, number] = [10.1, 44.69];

export const PLANO_DEMO: Plano = {
  fusao: 0.4,
  cenas: [
    {
      id: 'globo',
      duracao: 6,
      blocos: [
        {
          tipo: 'globo',
          props: {
            camera: [
              { t: 0, lon: -48, lat: -12, raio: 360 },
              { t: 4.2, lon: 10, lat: 38, raio: 470 },
              { t: 6.4, lon: 11, lat: 42, raio: 900 },
            ],
            paises: [
              { iso: 'BRA', cor: COR.verde, aos: 0.3 },
              { iso: 'ITA', cor: COR.ouro, aos: 3.2 },
            ],
            pinos: [
              { lon: RIO[0], lat: RIO[1], rotulo: 'Rio de Janeiro', aos: 0.6 },
              { lon: NAPOLES[0], lat: NAPOLES[1], rotulo: 'Nápoles', sub: 'julho de 1944', aos: 3.6 },
            ],
            arcos: [{ de: RIO, para: NAPOLES, aos: 1.0, dur: 2.6 }],
          },
        },
      ],
    },
    {
      id: 'mapa',
      duracao: 9,
      blocos: [
        {
          tipo: 'mapa',
          props: {
            camera: [
              { t: 0, lon: 11.5, lat: 42.6, altura: 13 },
              { t: 3.2, lon: 10.4, lat: 44.6, altura: 3.2 },
              { t: 9.4, lon: 10.25, lat: 44.72, altura: 2.4 },
            ],
            textura: 'doc/mapa/terra-hd.jpg', // zoom de vale: use a textura HD (baixar-mapas --hd)
            escurecer: 0.12,
            rios: { aos: 2.5 },
            paises: [{ iso: 'ITA', cor: COR.ouro, opacidade: 0.18, aos: 0 }],
            pinos: [
              { lon: PARMA[0], lat: PARMA[1], rotulo: 'Parma', aos: 3.3, cor: COR.verde, lado: 'direita' },
              { lon: COLLECCHIO[0], lat: COLLECCHIO[1], rotulo: 'Collecchio', sub: '26 de abril', aos: 4.0, cor: COR.verde, lado: 'cima' },
              { lon: FORNOVO[0], lat: FORNOVO[1], rotulo: 'Fornovo di Taro', sub: '29 de abril de 1945', aos: 5.2, lado: 'esquerda' },
            ],
            rotas: [{ pontos: [PARMA, COLLECCHIO], aos: 3.8, dur: 1.4, cor: COR.verde, icone: 'tanque', tracejado: true }],
            setas: [{ de: [9.75, 44.42], para: [10.05, 44.66], aos: 5.6, dur: 1.2, cor: COR.vermelho, curva: -0.12 }],
            circulos: [{ lon: FORNOVO[0], lat: FORNOVO[1], raioKm: 7, aos: 7.0, cor: COR.ouro }],
            rotulos: [{ lon: 9.95, lat: 44.52, texto: 'Vale do Taro', aos: 6.0, tamanho: 28 }],
          },
        },
      ],
    },
    {
      id: 'documento',
      duracao: 6,
      blocos: [
        {
          tipo: 'documento',
          props: {
            cabecalho: 'Informativo da AMAN · abril de 2025',
            texto: 'A capitulação da 148ª Divisão de Infantaria alemã somou [[14.779 prisioneiros de guerra]].',
            credito: 'Academia Militar das Agulhas Negras',
            carimbo: { texto: 'Divisão inteira', aos: 3.6 },
          },
        },
      ],
    },
    {
      id: 'numero',
      duracao: 5,
      blocos: [
        {
          tipo: 'numero',
          props: { rotulo: 'Prisioneiros em Fornovo', numero: 14779, sub: 'Fonte: AMAN (2025). Outras fontes falam em cerca de 15 mil.' },
        },
      ],
    },
    {
      id: 'barras',
      duracao: 5,
      blocos: [
        {
          tipo: 'barras',
          props: {
            titulo: 'Mortos e feridos, Collecchio e Fornovo',
            itens: [
              { rotulo: 'Brasileiros', valor: 45, cor: COR.verde },
              { rotulo: 'Eixo', valor: 500, cor: COR.vermelho, prefixo: '~' },
            ],
            fonte: 'Números aproximados, segundo os registros da batalha',
          },
        },
      ],
    },
    {
      id: 'arquivo',
      duracao: 5,
      blocos: [
        {
          tipo: 'arquivo',
          props: {
            src: 'doc/demo/cena.svg',
            tipo: 'foto',
            pb: true,
            legenda: { local: 'Fornovo di Taro, Itália', data: '29 de abril de 1945' },
            credito: 'Imagem de exemplo',
          },
        },
        { tipo: 'linhaTempo', inicio: 0.2, props: { de: 1944, para: 1945, modo: 'selo', local: 'Itália', dur: 0.8 } },
      ],
    },
    {
      id: 'retrato',
      duracao: 4,
      blocos: [{ tipo: 'foto', props: { src: 'doc/demo/retrato.svg', legenda: 'Otto Fretter-Pico', sub: 'comandante da 148ª Divisão', largura: 520, credito: 'retrato de exemplo' } }],
    },
    {
      id: 'conexoes',
      duracao: 8,
      blocos: [
        {
          tipo: 'conexoes',
          props: {
            nos: [
              { id: 'feb', x: 22, y: 30, titulo: 'FEB', sub: 'Mascarenhas de Moraes', aos: 0.2, rotacao: -2 },
              { id: 'fornovo', x: 50, y: 55, titulo: 'Fornovo di Taro', sub: '29 de abril de 1945', aos: 0.8, destaque: true },
              { id: 'div148', x: 78, y: 28, titulo: '148ª Divisão', sub: 'Otto Fretter-Pico', foto: 'doc/demo/retrato.svg', aos: 1.4, rotacao: 2 },
              { id: 'italia', x: 80, y: 78, titulo: 'Bersaglieri Itália', sub: 'Mario Carloni', aos: 2.0, rotacao: -1 },
              { id: 'berlim', x: 20, y: 78, titulo: 'Berlim cercada', sub: '25 de abril de 1945', aos: 2.6, rotacao: 1 },
            ],
            ligacoes: [
              { de: 'feb', para: 'fornovo', rotulo: 'cercou', aos: 3.0, cor: COR.verde },
              { de: 'div148', para: 'fornovo', rotulo: 'rendeu-se', aos: 3.8 },
              { de: 'italia', para: 'fornovo', rotulo: 'rendeu-se', aos: 4.5 },
              { de: 'berlim', para: 'fornovo', rotulo: 'sem reforços', aos: 5.2, cor: COR.ouro },
            ],
            foco: [
              { id: 'fornovo', aos: 6.0, zoom: 1.35 },
            ],
          },
        },
      ],
    },
  ],
};
