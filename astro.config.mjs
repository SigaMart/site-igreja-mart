// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://igrejamart.com.br',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Capítulos da Bíblia ficam em um sitemap próprio, gerado automaticamente.
      changefreq: 'weekly',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
