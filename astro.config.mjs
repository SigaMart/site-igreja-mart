// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://igrejamart.com.br',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // O site público continua estático (gerado no build). Só o painel (/admin) e a API (/api)
  // rodam no servidor da Cloudflare, com banco D1 e o agendador de envios.
  adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'compile' }),
  integrations: [
    sitemap({
      // Capítulos da Bíblia ficam em um sitemap próprio, gerado automaticamente.
      changefreq: 'weekly',
      // O painel administrativo fica fora do Google
      filter: (pagina) => !pagina.includes('/admin/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
