// Post-deploy check of the public site; not part of `npm test` because it uses the network.
// Usage: npm run check:live              (origin from site.json)
//        npm run check:live -- https://<preview>.pages.dev
import config from '../site.json' with { type: 'json' };

const origin = (process.argv[2] ?? config.origin).replace(/\/+$/, '');
const paths = ['/', '/eu/', '/juegos/hitza/'];
const oneYear = 31536000;
const failures = [];

for (const path of paths) {
  const url = new URL(path, origin).href;
  let response;
  try {
    // Cloudflare negotiates HTML transformations using the navigation Accept header.
    response = await fetch(url, { headers: { Accept: 'text/html' }, redirect: 'follow' });
  } catch (error) {
    failures.push(`${url}: request failed (${error.cause?.code ?? error.message})`);
    continue;
  }
  const html = await response.text();
  if (!response.ok) failures.push(`${url}: HTTP ${response.status}`);
  if (!/(?:^|,)\s*no-transform\s*(?:,|$)/i.test(response.headers.get('cache-control') ?? '')) {
    failures.push(`${url}: missing Cache-Control no-transform`);
  }

  const hsts = response.headers.get('strict-transport-security') ?? '';
  if (Number(hsts.match(/max-age=(\d+)/i)?.[1] ?? 0) < oneYear) {
    failures.push(`${url}: Strict-Transport-Security missing or under a year (${hsts || 'absent'})`);
  }
  const csp = response.headers.get('content-security-policy') ?? '';
  if (!csp.includes("script-src 'none'")) {
    failures.push(`${url}: Content-Security-Policy without script-src 'none' (${csp || 'absent'})`);
  }
  // Only JSON-LD data blocks are allowed. Anything else (an injected analytics beacon,
  // Cloudflare's e-mail decoder, Rocket Loader…) would be blocked by the CSP anyway.
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    if (!/\btype\s*=\s*["']?application\/ld\+json["']?/i.test(tag)) {
      failures.push(`${url}: unexpected ${tag.length > 160 ? `${tag.slice(0, 160)}…` : tag}`);
    }
  }
  console.log(`${response.status} ${url}`);
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Live check passed for ${paths.length} pages at ${origin}: HSTS, script-free CSP and no injected scripts.`);
