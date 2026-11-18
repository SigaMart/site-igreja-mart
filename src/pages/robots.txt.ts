import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

// Libera buscadores e IAs (GEO): quanto mais lerem o site, mais a igreja aparece nas respostas.
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /

# Buscadores de IA são bem-vindos
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
