export type Language = 'es' | 'eu';
export type Page = 'home' | 'support' | 'privacy' | 'notFound' | 'game';
export type Translations = { es: string; eu: string };

export const routes = {
  home: { es: '/', eu: '/eu/' },
  support: { es: '/support/', eu: '/support/eu/' },
  privacy: { es: '/privacy/', eu: '/privacy/eu/' },
} as const;

export const navigation = {
  es: {
    skip: 'Ir al contenido', label: 'Principal', games: 'Los juegos',
    support: 'Soporte', privacy: 'Privacidad', information: 'Información',
    tagline: 'Euskara, jolasean. · Desarrollo independiente',
  },
  eu: {
    skip: 'Edukira joan', label: 'Nabigazioa', games: 'Jokoak',
    support: 'Laguntza', privacy: 'Pribatutasuna', information: 'Informazioa',
    tagline: 'Euskara, jolasean. · Garapen independentea',
  },
} as const;
