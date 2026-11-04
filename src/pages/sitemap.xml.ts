import type { APIRoute } from 'astro';
import config from '../../site.json';
import { routes } from '../data/navigation';

export const GET: APIRoute = () => {
  const locations = Object.values(routes).flatMap((languages) => Object.values(languages));
  const urls = locations.map((path) => `  <url><loc>${new URL(path, config.origin).href}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
