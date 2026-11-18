# Euskalario · sitio web

Sitio de presentación, soporte y privacidad en español y euskera, construido con **Astro** y salida estática. El diseño, las rutas, las imágenes y las fuentes se conservan de la web original. Las páginas publicadas no necesitan JavaScript, cuentas ni servidor de aplicación.

Repositorio: `git@github.com:mikelgarciaurbina/euskalario-site.git`.
La app móvil vive en el repositorio independiente `euskalario-app`, carpeta hermana `../app`.

## Desarrollo

Desde `Euskalario/site`:

```sh
nvm use
npm ci
npm run dev
```

La vista previa de desarrollo está en `http://127.0.0.1:8096/`.
La versión de Node validada se fija en `.nvmrc`; Astro se fija en `package.json` y sus dependencias en `package-lock.json`.

```sh
npm test            # compila y verifica rutas, enlaces, idiomas, SEO y CSP
npm run build       # genera dist/
npm run preview     # sirve la compilación terminada en el puerto 8096
npm run check:live  # tras desplegar: comprueba la web pública (usa la red)
```

GitHub Actions (`.github/workflows/test.yml`) ejecuta `npm ci` y `npm test` con la versión de `.nvmrc` en cada push y pull request.

## Estructura

```text
src/pages/             Portadas ES/EU, 22 fichas de juegos, soporte, privacidad, 404, robots y sitemap
src/layouts/           HTML y metadatos comunes (Open Graph, hreflang, banner de Safari, JSON-LD)
src/components/        Cabecera, navegación de idiomas y pie compartidos
src/styles/            site.css, games.css y fuentes; Astro los publica en /_astro/ con huella
src/data/navigation.ts Rutas y textos de navegación ES/EU
src/data/games.json    Contenido editorial de los once juegos, ES/EU, y el título de búsqueda de cada ficha
src/data/stores.ts     Enlaces de las tiendas e id del App Store
src/data/structuredData.ts JSON-LD MobileApplication de las portadas
public/assets/games/   Iconos de la app y capturas reales optimizadas
public/assets/         Imágenes, imagen social 1200 × 630 y licencias OFL de las fuentes
public/_headers        Cabeceras de Cloudflare
site.json              Origen público utilizado al compilar
scripts/check-build.mjs Comprobación de la salida estática
scripts/check-live.mjs Comprobación posdespliegue de la web pública
```

`dist/`, `.astro/` y `node_modules/` son generados y están excluidos de Git. Edita las páginas en `src/` y los recursos estáticos en `public/`.

Las hojas de estilo se importan desde los componentes: `site.css` en `BaseLayout.astro` (primera importación, para que cargue antes) y `games.css` solo en la portada y las fichas. `build.inlineStylesheets: 'never'` evita `<style>` en línea, que la CSP no permite. Las fuentes se publican en WOFF2 (`src/styles/fonts`, convertidas desde los TTF originales con fontTools sin recortar glifos; `check-build.mjs` falla si vuelve a aparecer un TTF). Los textos en negrita usan Bricolage 700, la única negrita incluida; Figtree solo se publica en 400.

## Cloudflare Pages

Conecta **`mikelgarciaurbina/euskalario-site`** y usa:

| Campo | Valor |
| --- | --- |
| Framework preset | Astro |
| Root directory | Vacío (raíz del repositorio) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Variable de build | `NODE_VERSION=24.22.1` |

**Retira `SKIP_DEPENDENCY_INSTALL=1`** si habías configurado la web anterior: Astro necesita que Cloudflare instale sus dependencias. Sustituye el antiguo comando `exit 0` por `npm run build`. La salida sigue siendo `dist`.

El sitio usa `output: 'static'`; no requiere el adaptador de Cloudflare ni un Worker. Las reglas de `public/_headers` se copian a `dist/_headers` y se aplican en Pages: HSTS, CSP sin scripts, una hora de caché para `/assets/*` y caché inmutable de un año para `/_astro/*`, cuyos nombres cambian con el contenido. La vista previa local no aplica estas cabeceras.

Después de cada despliegue, `npm run check:live` descarga la portada ES/EU y una ficha desde el origen de `site.json` (o el que se pase como argumento, por ejemplo una vista previa `*.pages.dev`) y falla si faltan HSTS o la CSP, o si el HTML servido contiene un `<script>` que no sea JSON-LD, como la baliza de Web Analytics que Cloudflare puede inyectar.

[Guía oficial de Astro para Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) · [Configuración de builds en Pages](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Dominio y enlaces de las tiendas

Origen propuesto: **`https://euskalario.overlayon.com`**. Asociar el dominio en Cloudflare y configurar DNS es un paso separado del commit o push del código.

- Web: `/` y `/eu/`
- Soporte: `/support/` y `/support/eu/`
- Privacidad: `/privacy/` y `/privacy/eu/`

Los enlaces canónicos, Open Graph, robots y sitemap se generan con el origen de `site.json`. Para cambiarlo:

```sh
python3 configure.py --origin https://tu-subdominio.example.com
npm run build
```

El script valida el origen y actualiza la configuración; no publica archivos ni modifica DNS. Revisa las páginas y las URLs HTTPS después del despliegue. Contacto: `info@overlayon.com`.

Los enlaces de descarga están centralizados en `src/data/stores.ts` y se muestran mediante `StoreLinks.astro` en ambas portadas y en las 22 fichas de juegos:

- App Store: https://apps.apple.com/app/id6749779035 (sin escaparate fijo; Apple abre la tienda del visitante)
- Google Play: https://play.google.com/store/apps/details?id=com.overlayon.euskalario

Los botones enlazan directamente a las tiendas, sin JavaScript ni seguimiento. Todas las páginas llevan `<meta name="apple-itunes-app">` para el banner nativo de Safari en iPhone, y las portadas incluyen un bloque JSON-LD `MobileApplication` (un bloque de datos que el navegador no ejecuta, compatible con `script-src 'none'`).

## Direct Upload

Tras `npm run build`, puedes arrastrar `dist/` a un proyecto Direct Upload. Para preparar un ZIP nuevo con los archivos en la raíz:

```sh
python3 -c 'from pathlib import Path; from zipfile import ZipFile, ZIP_DEFLATED; root=Path("dist"); archive=ZipFile("cloudflare-upload.zip", "w", ZIP_DEFLATED); [archive.write(p, p.relative_to(root)) for p in root.rglob("*") if p.is_file()]; archive.close()'
```

El ZIP, las vistas previas JPG y `QA.txt` quedan fuera de la carpeta publicada. El ZIP es generado y no se versiona. Para despliegue automático desde Git utiliza la integración Git de Pages.

## Páginas de juegos

Cada juego tiene una ficha ES en `/juegos/<slug>/` y EU en
`/eu/jokoak/<slug>/`. Las once tarjetas de la portada enlazan con ellas.
`Hitzez hitz` utiliza el slug `hitzez-hitz`. El selector de idioma conserva
la ficha, y cada página tiene canonical, hreflang y entrada de sitemap.

Los textos viven en `src/data/games.json`: título de búsqueda (`title`, que
forma «<Juego>: <title> · Euskalario»), inspiración, reglas, ejemplo,
objetivo de aprendizaje y consejo del galtzagorri. `promptLang`/`answerLang`
marcan con `lang="eu"` los ejemplos en euskera de las fichas en castellano. La historia cultural se
distingue de la interpretación del juego y enlaza a fuentes consultadas
cuando corresponde. Al cambiar reglas en la app, revisar también estos textos.

Las capturas de `public/assets/games/` proceden de las capturas Android
reales del kit móvil, escaladas a 660 px y convertidas a WebP. Los SVG
reutilizan el sistema de iconos de la app. Ningún build necesita acceder al
repositorio móvil: el contenido y los recursos están dentro de este repo.

Los ejemplos se despliegan con HTML nativo y se pueden abrir con el teclado. Las transiciones respetan `prefers-reduced-motion`. Los comentarios `email_off`
del layout evitan que Cloudflare transforme los correos públicos en enlaces
que necesitan JavaScript para descifrarlos; se mantiene la CSP sin scripts.

`npm test` comprueba las 29 páginas y sus enlaces, rutas de idiomas,
fragmentos, sitemap y recursos; además, títulos y descripciones, `og:locale`,
`x-default`, la imagen social de 1200 × 630, el banner de Safari, el JSON-LD de
las portadas, el nombre del sitio (`WebSite`), las rutas de las fichas (`BreadcrumbList`), las frases en euskera marcadas con `lang="eu"` en las páginas en
castellano, la regla de la misión diaria, HSTS y la caché de `/_astro/`, que las
hojas de estilo tengan huella y que `games.css` solo cargue donde se usa.
La revisión móvil está en `qa/`.
