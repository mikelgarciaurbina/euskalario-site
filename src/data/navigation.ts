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
    skip: 'Saltar al contenido principal', label: 'Principal', games: 'Juegos',
    home: 'Euskalario, inicio', languages: 'Idioma',
    support: 'Soporte', privacy: 'Privacidad', information: 'Información',
    tagline: 'Desarrollo independiente',
  },
  eu: {
    skip: 'Joan eduki nagusira', label: 'Nabigazio nagusia', games: 'Jokoak',
    home: 'Euskalario, hasiera', languages: 'Hizkuntza',
    support: 'Laguntza', privacy: 'Pribatutasuna', information: 'Informazioa',
    tagline: 'Garapen independentea',
  },
} as const;
