export const appStoreId = '6749779035';

// The App Store link has no storefront (/us/), so Apple opens the visitor's own store.
export const stores = [
  { name: 'App Store', url: `https://apps.apple.com/app/id${appStoreId}` },
  { name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.overlayon.euskalario' },
] as const;
