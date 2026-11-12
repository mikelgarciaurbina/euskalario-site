import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import config from '../site.json' with { type: 'json' };
import games from '../src/data/games.json' with { type: 'json' };

const root = resolve('dist');
const appStore = 'https://apps.apple.com/app/id6749779035';
const googlePlay = 'https://play.google.com/store/apps/details?id=com.overlayon.euskalario';
const locales = { es: 'es_ES', eu: 'eu_ES' };
const shareImage = { path: '/assets/share-wide.png', width: 1200, height: 630 };
const pages = [
  ['index.html', '/', 'es', '/eu/'],
  ['eu/index.html', '/eu/', 'eu', '/'],
  ['support/index.html', '/support/', 'es', '/support/eu/'],
  ['support/eu/index.html', '/support/eu/', 'eu', '/support/'],
  ['privacy/index.html', '/privacy/', 'es', '/privacy/eu/'],
  ['privacy/eu/index.html', '/privacy/eu/', 'eu', '/privacy/'],
  ['404.html', '/404.html', 'es', '/eu/'],
];
const homeRoutes = new Set(['/', '/eu/']);
const gameByRoute = new Map();
assert.equal(games.length, 11, 'Every mobile game has a landing page');
assert.equal(new Set(games.map((game) => game.slug)).size, games.length, 'Unique game routes');
for (const game of games) {
  const es = `/juegos/${game.slug}/`;
  const eu = `/eu/jokoak/${game.slug}/`;
  pages.push([`juegos/${game.slug}/index.html`, es, 'es', eu]);
  pages.push([`eu/jokoak/${game.slug}/index.html`, eu, 'eu', es]);
  gameByRoute.set(es, game).set(eu, game);
  for (const lang of ['es', 'eu']) {
    assert.equal(game[lang].steps.length, 3, `${game.id}/${lang}: three instructions`);
    assert.equal(game[lang].facts.length, 3, `${game.id}/${lang}: game facts`);
    assert(game[lang].story.length >= 2 && game[lang].lesson && game[lang].tip, `${game.id}/${lang}: story, learning and host`);
    assert(game[lang].title, `${game.id}/${lang}: search title`);
  }
}
// Sarea boards are generated with orthogonal steps only.
const sarea = games.find((game) => game.id === 'sarea');
assert(!/diagonal/i.test(JSON.stringify([sarea.es.facts, sarea.eu.facts])), 'Sarea facts must not promise diagonal words');

const documents = new Map(await Promise.all(pages.map(async ([file]) => [resolve(root, file), await readFile(resolve(root, file), 'utf8')])));
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const headers = await readFile(resolve(root, '_headers'), 'utf8');
assert(headers.includes("script-src 'none'"), 'Keep the script-free CSP');
assert(/Strict-Transport-Security: max-age=(\d+); includeSubDomains/.test(headers) && Number(headers.match(/max-age=(\d+); includeSubDomains/)[1]) >= 31536000, 'HSTS for at least a year');
assert(/\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(headers), 'Hashed /_astro/ assets are cached as immutable');
assert((await readFile(resolve(root, 'robots.txt'), 'utf8')).includes(`${config.origin}/sitemap.xml`));

// Social image: real PNG at the declared size (IHDR width/height at bytes 16-23).
const png = await readFile(resolve(root, `.${shareImage.path}`));
assert.equal(png.readUInt32BE(16), shareImage.width, 'Share image width');
assert.equal(png.readUInt32BE(20), shareImage.height, 'Share image height');

const attr = (html, selector) => html.match(selector)?.[1];
const meta = (html, key) => attr(html, new RegExp(`<meta (?:property|name)="${key.replace(/[.:]/g, '\\$&')}" content="([^"]*)"`));
const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const stylesheets = new Map();
let checkedLinks = 0;
for (const [file, route, lang, translation] of pages) {
  const html = documents.get(resolve(root, file));
  const url = new URL(route, config.origin).href;
  assert(html.includes(`<html lang="${lang}">`), `${route}: language`);
  assert(html.includes('<!--email_off-->') && html.includes('<!--/email_off-->'), `${route}: public support email must not need a decode script`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${route}: single main heading`);
  assert.equal((html.match(/<main[\s>]/g) || []).length, 1, `${route}: single main landmark`);
  // A JSON-LD data block is never executed, so it is the only <script> the CSP allows.
  const dataBlocks = [...html.matchAll(jsonLdPattern)].map((match) => JSON.parse(match[1]));
  const executable = html.replace(jsonLdPattern, '');
  assert(!/<script[\s>]|<style[\s>]|\sstyle=|\son\w+=/i.test(executable), `${route}: no JS or inline styles, compatible with CSP`);
  assert(html.includes(`href="${translation}" lang=`), `${route}: translated page link`);
  assert(!html.includes('apps.apple.com/us/'), `${route}: App Store link without a fixed storefront`);
  assert(!/Consulta en tu tienda la versión|bertsio dagoen eskuragarri/.test(html), `${route}: no "check your store" version caveat`);

  // Metadata.
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const description = meta(html, 'description');
  assert(title && title.includes('Euskalario') && title.length <= 65, `${route}: title "${title}" mentions Euskalario in ≤ 65 characters`);
  assert(description && description.length >= 50 && description.length <= 170, `${route}: description length`);
  assert.equal(meta(html, 'og:title'), title, `${route}: og:title`);
  assert.equal(meta(html, 'og:locale'), locales[lang], `${route}: og:locale`);
  assert.equal(meta(html, 'og:image'), new URL(shareImage.path, config.origin).href, `${route}: og:image`);
  assert.equal(meta(html, 'og:image:width'), String(shareImage.width), `${route}: og:image:width`);
  assert.equal(meta(html, 'og:image:height'), String(shareImage.height), `${route}: og:image:height`);
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image', `${route}: wide social card`);
  assert.equal(meta(html, 'apple-itunes-app'), 'app-id=6749779035', `${route}: Safari app banner`);

  if (file === '404.html') {
    assert(html.includes('name="robots" content="noindex"'));
    assert(/<p[^>]* lang="eu">[^<]+<a href="\/eu\/">/.test(html), '404: Basque line with a link to /eu/');
  } else {
    const spanish = lang === 'es' ? route : translation;
    assert(html.includes(`rel="canonical" href="${url}"`), `${route}: canonical`);
    assert(sitemap.includes(`<loc>${url}</loc>`), `${route}: sitemap`);
    assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${new URL(spanish, config.origin).href}">`), `${route}: x-default points to Spanish`);
    assert.equal(meta(html, 'og:locale:alternate'), locales[lang === 'es' ? 'eu' : 'es'], `${route}: og:locale:alternate`);
  }

  // Structured data only on the home pages.
  if (homeRoutes.has(route)) {
    assert.equal(dataBlocks.length, 1, `${route}: one JSON-LD block`);
    const [app] = dataBlocks;
    assert.equal(app['@context'], 'https://schema.org');
    assert.equal(app['@type'], 'MobileApplication', `${route}: MobileApplication`);
    assert.equal(app.name, 'Euskalario');
    assert(/iOS/.test(app.operatingSystem) && /Android/.test(app.operatingSystem), `${route}: iOS and Android`);
    assert.equal(app.applicationCategory, 'EducationalApplication');
    assert.equal(app.offers?.price, '0', `${route}: free`);
    assert.equal(app.offers?.priceCurrency, 'EUR');
    assert(app.inLanguage?.includes('eu'), `${route}: inLanguage`);
    assert.equal(app.url, url, `${route}: JSON-LD url`);
    for (const store of [appStore, googlePlay]) {
      assert(app.installUrl.includes(store) && app.sameAs.includes(store), `${route}: JSON-LD store ${store}`);
      assert(html.includes(`href="${store}"`), `${route}: store link ${store}`);
    }
    assert((html.match(/<details>/g) || []).length >= 2, `${route}: home FAQ`);
    assert(!/Euskalario 2\.0/.test(html), `${route}: no stale version number in the hero`);
  } else {
    assert.equal(dataBlocks.length, 0, `${route}: JSON-LD is only for the home pages`);
  }

  // Basque phrases inside Spanish pages are marked (WCAG 3.1.2).
  if (lang === 'es') {
    assert(html.includes('<span lang="eu">Euskara, jolasean.</span>'), `${route}: Basque tagline marked`);
    if (route === '/') {
      assert(html.includes('<span lang="eu">Hamaika jolas.</span>') && html.includes('lang="eu">Zure txanda!'), `${route}: Basque headings marked`);
    }
    if (file === '404.html') assert(html.includes('<span lang="eu">Hemen ez dago</span>'), '404: Basque eyebrow marked');
  }

  if (gameByRoute.has(route)) {
    const game = gameByRoute.get(route);
    assert.equal(title, `${game.name}: ${game[lang].title} · Euskalario`, `${route}: search title`);
    assert(html.includes('id="como-jugar"') && html.includes('id="historia"'), `${route}: story and instructions`);
    assert(html.includes('class="game-answer"'), `${route}: native answer reveal`);
    assert(html.includes('Hamaika proba') && html.includes('galtzagorri'), `${route}: mission and mascot`);
    // Daily mission: the streak follows the daily goal; all eleven games earn the txapela.
    assert(lang === 'es'
      ? html.includes('objetivo diario (2 con 3 minutos, 4 con 5 y 6 con 10)') && html.includes('lang="eu">Hamaika proba')
      : html.includes('(3 minutu: 2 joko; 5 minutu: 4; 10 minutu: 6)'), `${route}: mission follows the daily goal`);
  }

  const pageStyles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((match) => match[1]);
  assert(pageStyles.length >= 1 && pageStyles.every((href) => /^\/_astro\/[\w-]+\.[\w-]{8}\.css$/.test(href)), `${route}: hashed stylesheets only`);
  for (const href of pageStyles) if (!stylesheets.has(href)) stylesheets.set(href, await readFile(resolve(root, `.${href}`), 'utf8'));
  const gameStyles = pageStyles.filter((href) => stylesheets.get(href).includes('.game-hitza{'));
  const usesGames = homeRoutes.has(route) || gameByRoute.has(route);
  assert.equal(gameStyles.length, usesGames ? 1 : 0, `${route}: games stylesheet only where it is used`);
  assert(stylesheets.get(pageStyles[0]).includes('@font-face'), `${route}: base stylesheet loads first`);
  const fontPreloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="([^"]+)"/g)];
  assert(fontPreloads.length === 1 && /^\/_astro\/BricolageGrotesque-Bold\.[\w-]{8}\.woff2$/.test(fontPreloads[0][1]) && fontPreloads[0][2] === 'font/woff2', `${route}: preloads the WOFF2 heading font`);

  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) continue;
    const local = new URL(href, `https://local.test${route}`);
    let path = resolve(root, `.${decodeURIComponent(local.pathname)}`);
    assert(path === root || path.startsWith(`${root}/`), `${route}: path within output`);
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    assert((await stat(path)).isFile(), `${route}: missing ${href}`);
    if (local.hash && extname(path) === '.html') {
      const target = documents.get(path) || await readFile(path, 'utf8');
      assert(target.includes(`id="${decodeURIComponent(local.hash.slice(1))}"`), `${route}: missing fragment ${href}`);
    }
    checkedLinks++;
  }
}
for (const [lang, file] of [['es', 'index.html'], ['eu', 'eu/index.html']]) {
  const home = documents.get(resolve(root, file));
  assert.equal((home.match(/class="game game-link /g) || []).length, 11, `Home ${lang}: eleven game links`);
  for (const game of games) assert(home.includes(`href="${lang === 'es' ? `/juegos/${game.slug}/` : `/eu/jokoak/${game.slug}/`}"`));
}

// Every stylesheet in the build: assets it references exist, and fonts are only used in shipped weights.
const astroDir = resolve(root, '_astro');
for (const name of (await readdir(astroDir)).filter((entry) => entry.endsWith('.css'))) {
  const cssFile = resolve(astroDir, name);
  const css = await readFile(cssFile, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^)"']+)/g)) {
    if (match[1].startsWith('data:')) continue;
    const target = match[1].startsWith('/') ? resolve(root, `.${match[1]}`) : resolve(dirname(cssFile), match[1]);
    assert((await stat(target)).isFile(), `Missing CSS asset ${match[1]}`);
  }
  assert(!/font-weight:\s*bold/.test(css), `${name}: use the shipped Bricolage 700 face instead of a synthetic bold`);
  assert(!/font-family:\s*Figtree[^}]*font-weight:\s*(bold|[6-9]00)/.test(css), `${name}: Figtree ships only in 400`);
  for (const face of css.match(/@font-face\{[^}]*\}/g) || []) {
    assert(/\.woff2\)\s*format\(['"]woff2['"]\)/.test(face) && !/\.ttf\b/.test(face), `${name}: fonts ship as WOFF2 (${face.slice(0, 60)}…)`);
  }
}
assert(!(await readdir(astroDir)).some((entry) => entry.endsWith('.ttf')), 'No TTF fonts in the build: WOFF2 only');
for (const font of ['assets/figtree-OFL.txt', 'assets/bricolage-grotesque-OFL.txt']) assert((await stat(resolve(root, font))).isFile(), `Font licence ${font}`);
console.log(`Verified ${pages.length} pages and ${checkedLinks} local links/assets; ES/EU navigation, canonical URLs, metadata, JSON-LD, sitemap, hashed CSS and script-free CSP passed.`);
