// Stories ativos cadastrados no painel (o site busca daqui; guardado em cache por 1 minuto).
import type { APIRoute } from 'astro';
import { todos } from '../../lib/admin/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  const chave = new Request(new URL('/api/stories/', request.url).href);
  const salvo = await cache?.match(chave);
  if (salvo) return salvo;

  const linhas = await todos<{ chave: string; titulo: string; capa: string; slides: string }>(
    'SELECT chave, titulo, capa, slides FROM stories WHERE ativo = 1 ORDER BY ordem, id');
  const stories = linhas.map((s) => ({ id: s.chave, titulo: s.titulo, capa: s.capa, slides: JSON.parse(s.slides) }))
    .filter((s) => s.slides.length);
  const resp = Response.json(stories, { headers: { 'Cache-Control': 'public, max-age=60' } });
  await cache?.put(chave, resp.clone());
  return resp;
};
