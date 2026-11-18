import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

// Feed RSS com devocionais e blog (útil para agregadores e automações de WhatsApp/e-mail no futuro)
export const GET: APIRoute = async () => {
  const dev = (await getCollection('devocionais', (d) => !d.data.rascunho)).map((d) => ({ t: d.data.titulo, d: d.data.descricao, dt: d.data.data, url: `/devocionais/${d.id}/`, cat: 'Devocional' }));
  const blog = (await getCollection('blog', (p) => !p.data.rascunho)).map((p) => ({ t: p.data.titulo, d: p.data.descricao, dt: p.data.data, url: `/blog/${p.id}/`, cat: p.data.categoria }));
  const itens = [...dev, ...blog].sort((a, b) => +b.dt - +a.dt);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITE.nome)} · Devocionais e Blog</title>
<link>${SITE.url}/</link>
<description>${esc(SITE.descricao)}</description>
<language>pt-BR</language>
${itens.map((i) => `<item><title>${esc(i.t)}</title><link>${SITE.url}${i.url}</link><guid>${SITE.url}${i.url}</guid><pubDate>${i.dt.toUTCString()}</pubDate><category>${esc(i.cat)}</category><description>${esc(i.d)}</description></item>`).join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
