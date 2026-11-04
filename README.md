# Web de Euskalario

Web estática de presentación, soporte y privacidad. Su repositorio independiente es `git@github.com:mikelgarciaurbina/euskalario-site.git`, ubicado localmente en `Euskalario/site`. La carpeta publicable es **`dist/`**, relativa a la raíz de este repositorio. Incluye HTML, CSS, imágenes y fuentes locales. No requiere servidor de aplicación, SDK, claves ni compilación. La cuenta de Cloudflare se utiliza únicamente para alojarla.

## Conectar a Cloudflare Pages

En **Workers & Pages → Create application → Pages**, conecta el repositorio **`mikelgarciaurbina/euskalario-site`** de GitHub y utiliza estos valores:

| Campo | Valor |
| --- | --- |
| Framework preset | `None` |
| Root directory | Vacío (raíz del repositorio) |
| Build command | `exit 0` |
| Build output directory | `dist` |
| Variable de build | `SKIP_DEPENDENCY_INSTALL=1` |
| Production branch | `main` |

La variable omite la instalación automática de dependencias; esta web no necesita ninguna. La salida es `dist` porque la web tiene su propio repositorio. No hay que añadir `site/` ni `app/site/` a los campos de Cloudflare. [Configuración oficial](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) · [Omitir instalación de dependencias](https://developers.cloudflare.com/pages/configuration/build-image/#skip-dependency-install).

Conserva `dist/` en este repositorio. Solo esa carpeta se publica: este README, las vistas previas y el informe QA quedan fuera. La app móvil y sus materiales de tiendas están en el repositorio hermano `euskalario-app`.

Como alternativa, puedes crear un proyecto **Direct Upload** y arrastrar `dist` al panel de Pages. Si quieres despliegues automáticos desde Git, elige la integración Git desde el principio: un proyecto Direct Upload no puede convertirse posteriormente a Git. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Subdominio y URLs para las tiendas

Propuesta: **`euskalario.overlayon.com`**. Todavía no se ha configurado ni publicado.

En el proyecto Pages, abre **Custom domains → Set up a domain**, añade el subdominio y sigue la configuración DNS indicada. Si debes crear el registro manualmente, será un CNAME al dominio `…pages.dev` que Cloudflare asigne al proyecto. Primero asocia el dominio en Pages. [Dominios personalizados](https://developers.cloudflare.com/pages/configuration/custom-domains/).

Una vez que respondan públicamente por HTTPS:

- Web: `https://euskalario.overlayon.com/`
- Soporte: `https://euskalario.overlayon.com/support/`
- Privacidad: `https://euskalario.overlayon.com/privacy/`
- Euskera: `/eu/`, `/support/eu/` y `/privacy/eu/` en ese mismo dominio.

Si eliges otro dominio, actualiza los metadatos, `robots.txt` y `sitemap.xml` desde `Euskalario/site/`:

```sh
python3 configure.py --origin https://tu-subdominio.example.com
```

El script utiliza solo Python estándar y no publica nada. Los enlaces internos y los recursos siguen funcionando en el nuevo dominio. Añade los enlaces reales de App Store y Google Play cuando estén disponibles; por ahora la portada indica «Próximamente».

## Comprobar y mantener

Desde `Euskalario/site/`, puedes ver la web localmente:

```sh
python3 -m http.server 8096 --bind 127.0.0.1 --directory dist
```

Abre `http://127.0.0.1:8096/`. Este servidor permite revisar páginas y recursos, pero no aplica las reglas específicas de Cloudflare de `_headers`.

Las reglas de `_headers` se aplican en Pages; el archivo de configuración no se sirve como una página. Al cambiar imágenes con nombres estables, conserva una caché moderada o cambia el nombre del archivo. [Cabeceras en Pages](https://developers.cloudflare.com/pages/configuration/headers/).

Antes de usar la URL de privacidad en las tiendas, revisa que el nombre del responsable y la descripción del buzón de soporte coincidan con tu operativa. El correo confirmado es `info@overlayon.com`. Comprueba las rutas, idiomas y enlaces tras el primer despliegue. La publicación del repositorio en GitHub no configura Cloudflare ni modifica DNS.

Workers Static Assets también admite esta carpeta; para esta web sin lógica de servidor, Pages permite conectar el repositorio sin añadir un Worker. [Alternativa oficial](https://developers.cloudflare.com/workers/static-assets/get-started/).

## Paquete listo para arrastrar

`cloudflare-upload.zip` contiene únicamente los archivos de `dist`, con
`index.html` en la raíz. Sirve para Direct Upload. Si eliges conexión Git,
usa la configuración de arriba y conserva `dist` en el repositorio. El ZIP es
un archivo generado local y está excluido de Git. Para regenerarlo después
de cambiar la web, desde este repositorio:

```sh
(cd dist && zip -r ../cloudflare-upload.zip .)
```

Para Direct Upload, también puedes arrastrar directamente la carpeta `dist/`.

`preview-desktop.jpg`, `preview-mobile.jpg` y `QA.txt` son material local de
revisión y no se publican, porque están fuera de `dist`.
