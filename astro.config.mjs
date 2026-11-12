import { defineConfig } from 'astro/config';
import config from './site.json' with { type: 'json' };

export default defineConfig({
  site: config.origin,
  output: 'static',
  trailingSlash: 'always',
  // External, hashed stylesheets only: the CSP forbids inline <style>.
  build: { format: 'directory', inlineStylesheets: 'never' },
});
