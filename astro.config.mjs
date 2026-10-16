// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://workrate-report.pages.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
