import type { APIRoute } from 'astro';
import config from '../../site.json';

export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', config.origin).href}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
