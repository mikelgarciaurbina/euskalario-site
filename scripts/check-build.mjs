import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import config from '../site.json' with { type: 'json' };
import games from '../src/data/games.json' with { type: 'json' };

const root = resolve('dist');
const pages = [
  ['index.html', '/', 'es', '/eu/'],
  ['eu/index.html', '/eu/', 'eu', '/'],
  ['support/index.html', '/support/', 'es', '/support/eu/'],
  ['support/eu/index.html', '/support/eu/', 'eu', '/support/'],
  ['privacy/index.html', '/privacy/', 'es', '/privacy/eu/'],
  ['privacy/eu/index.html', '/privacy/eu/', 'eu', '/privacy/'],
  ['404.html', '/404.html', 'es', '/eu/'],
];
assert.equal(games.length, 11, 'Every mobile game has a landing page');
assert.equal(new Set(games.map((game) => game.slug)).size, games.length, 'Unique game routes');
for (const game of games) {
  const es = `/juegos/${game.slug}/`;
  const eu = `/eu/jokoak/${game.slug}/`;
  pages.push([`juegos/${game.slug}/index.html`, es, 'es', eu]);
  pages.push([`eu/jokoak/${game.slug}/index.html`, eu, 'eu', es]);
  for (const lang of ['es', 'eu']) {
    assert.equal(game[lang].steps.length, 3, `${game.id}/${lang}: three instructions`);
    assert.equal(game[lang].facts.length, 3, `${game.id}/${lang}: game facts`);
    assert(game[lang].story.length >= 2 && game[lang].lesson && game[lang].tip, `${game.id}/${lang}: story, learning and host`);
  }
}
const documents = new Map(await Promise.all(pages.map(async ([file]) => [resolve(root, file), await readFile(resolve(root, file), 'utf8')])));
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const headers = await readFile(resolve(root, '_headers'), 'utf8');
assert(headers.includes("script-src 'none'"), 'Keep the script-free CSP');
assert((await readFile(resolve(root, 'robots.txt'), 'utf8')).includes(`${config.origin}/sitemap.xml`));
let checkedLinks = 0;
for (const [file, route, lang, translation] of pages) {
  const html = documents.get(resolve(root, file));
  assert(html.includes(`<html lang="${lang}">`), `${route}: language`);
  assert(html.includes('<!--email_off-->') && html.includes('<!--/email_off-->'), `${route}: public support email must not need a decode script`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${route}: single main heading`);
  assert.equal((html.match(/<main[\s>]/g) || []).length, 1, `${route}: single main landmark`);
  assert(!/<script[\s>]|<style[\s>]|\sstyle=|\son\w+=/i.test(html), `${route}: no JS or inline styles, compatible with CSP`);
  assert(html.includes(`href="${translation}" lang=`), `${route}: translated page link`);
  if (file === '404.html') assert(html.includes('name="robots" content="noindex"'));
  else {
    assert(html.includes(`rel="canonical" href="${new URL(route, config.origin).href}"`), `${route}: canonical`);
    assert(sitemap.includes(`<loc>${new URL(route, config.origin).href}</loc>`), `${route}: sitemap`);
  }
  if (route.startsWith('/juegos/') || route.startsWith('/eu/jokoak/')) {
    assert(html.includes('id="como-jugar"') && html.includes('id="historia"'), `${route}: story and instructions`);
    assert(html.includes('class="game-answer"'), `${route}: native answer reveal`);
    assert(html.includes('Hamaika proba') && html.includes('galtzagorri'), `${route}: mission and mascot`);
  }
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) continue;
    const url = new URL(href, `https://local.test${route}`);
    let path = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert(path === root || path.startsWith(`${root}/`), `${route}: path within output`);
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    assert((await stat(path)).isFile(), `${route}: missing ${href}`);
    if (url.hash && extname(path) === '.html') {
      const target = documents.get(path) || await readFile(path, 'utf8');
      assert(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${route}: missing fragment ${href}`);
    }
    checkedLinks++;
  }
}
for (const [lang, file] of [['es', 'index.html'], ['eu', 'eu/index.html']]) {
  const home = documents.get(resolve(root, file));
  assert.equal((home.match(/class="game game-link /g) || []).length, 11, `Home ${lang}: eleven game links`);
  for (const game of games) assert(home.includes(`href="${lang === 'es' ? `/juegos/${game.slug}/` : `/eu/jokoak/${game.slug}/`}"`));
}
const cssFile = resolve(root, 'assets/site.css');
for (const match of (await readFile(cssFile, 'utf8')).matchAll(/url\(["']?([^\)"']+)/g)) {
  assert((await stat(resolve(dirname(cssFile), match[1]))).isFile(), `Missing CSS asset ${match[1]}`);
}
console.log(`Verified ${pages.length} pages and ${checkedLinks} local links/assets; ES/EU navigation, canonical URLs, sitemap and script-free CSP passed.`);
