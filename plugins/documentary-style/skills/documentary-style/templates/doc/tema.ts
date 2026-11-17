// DocumentaryStyle: paleta, fontes e medidas do estilo "documentário de arquivo".
export const COR = {
  fundo: '#0c1420',
  fundoClaro: '#18243a',
  papel: '#f3ecdc',
  papelBorda: '#cbb98d',
  tinta: '#1d1a16',
  tintaSuave: '#6a6052',
  ouro: '#d9a93a',
  vermelho: '#c8372d',
  azul: '#2f6fd6',
  verde: '#2e9e5b',
  branco: '#f6f2e9',
  marcaTexto: 'rgba(244, 196, 48, 0.55)',
  sombra: 'rgba(0, 0, 0, 0.55)',
} as const;

export const FONTE = {
  serif: "'EB Garamond', Georgia, 'Times New Roman', serif",
  sans: "'Fira Sans', 'Segoe UI', Arial, sans-serif",
} as const;

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fira+Sans:wght@400;500;700;800&display=block';

// Sombra de texto usada em tudo que fica por cima de vídeo ou mapa.
export const SOMBRA_TEXTO = '0 2px 6px rgba(0,0,0,0.85), 0 0 18px rgba(0,0,0,0.45)';
