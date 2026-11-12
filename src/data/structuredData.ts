import { stores } from './stores';

// schema.org description of the app for the two home pages. It is emitted as a
// <script type="application/ld+json"> data block, which browsers never execute,
// so it is compatible with the script-src 'none' CSP.
export const mobileApplication = ({ url, description, image }: { url: string; description: string; image: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'Euskalario',
  description,
  url,
  image,
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EducationalApplication',
  inLanguage: ['eu', 'es'],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  installUrl: stores.map((store) => store.url),
  sameAs: stores.map((store) => store.url),
});

// JSON for a data block: escape "<" so the content can never close the element.
export const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
