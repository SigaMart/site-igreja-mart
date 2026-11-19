import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

// Libera buscadores e IAs (GEO): quanto mais lerem o site, mais a igreja aparece nas respostas.
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Buscadores de IA são bem-vindos
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: ChatGPT-User
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: Claude-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: PerplexityBot
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: Google-Extended
Allow: /
Disallow: /admin/
Disallow: /api/
User-agent: Applebot-Extended
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${SITE.url}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
