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
npm test          # compila y verifica rutas, enlaces, idiomas, SEO y CSP
npm run build     # genera dist/
npm run preview   # sirve la compilación terminada en el puerto 8096
```

## Estructura

```text
src/pages/             Portadas ES/EU, 22 fichas de juegos, soporte, privacidad, 404, robots y sitemap
src/layouts/           HTML y metadatos comunes
src/components/        Cabecera, navegación de idiomas y pie compartidos
src/data/navigation.ts Rutas y textos de navegación ES/EU
src/data/games.json    Contenido editorial de los once juegos, ES/EU
public/assets/games/   Iconos de la app y capturas reales optimizadas
public/assets/         CSS, imágenes, fuentes locales y sus licencias
public/_headers        Cabeceras de Cloudflare
site.json              Origen público utilizado al compilar
scripts/check-build.mjs Comprobación de la salida estática
```

`dist/`, `.astro/` y `node_modules/` son generados y están excluidos de Git. Edita las páginas en `src/` y los recursos estáticos en `public/`.

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

El sitio usa `output: 'static'`; no requiere el adaptador de Cloudflare ni un Worker. Las reglas de `public/_headers` se copian a `dist/_headers` y se aplican en Pages. La vista previa local no aplica estas cabeceras.

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

- App Store: https://apps.apple.com/us/app/euskalario/id6749779035
- Google Play: https://play.google.com/store/apps/details?id=com.overlayon.euskalario

Los botones enlazan directamente a las tiendas, sin JavaScript ni seguimiento. La disponibilidad de una actualización depende de su publicación en cada tienda.

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

Los textos viven en `src/data/games.json`: inspiración, reglas, ejemplo,
objetivo de aprendizaje y consejo del galtzagorri. La historia cultural se
distingue de la interpretación del juego y enlaza a fuentes consultadas
cuando corresponde. Al cambiar reglas en la app, revisar también estos textos.

Las capturas de `public/assets/games/` proceden de las capturas Android
reales del kit móvil, escaladas a 660 px y convertidas a WebP. Los SVG
reutilizan el sistema de iconos de la app. Ningún build necesita acceder al
repositorio móvil: el contenido y los recursos están dentro de este repo.

Los ejemplos se despliegan con HTML nativo, sin JavaScript. La animación
del galtzagorri respeta `prefers-reduced-motion`. Los comentarios `email_off`
del layout evitan que Cloudflare transforme los correos públicos en enlaces
que necesitan JavaScript para descifrarlos; se mantiene la CSP sin scripts.

`npm test` comprueba las 29 páginas y sus enlaces, rutas de idiomas,
fragmentos, sitemap y recursos. La revisión móvil está en `qa/`.
