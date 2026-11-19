// Serve as mídias do painel guardadas no KV.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const r = await env.MIDIA.getWithMetadata<{ mime: string; nome: string }>(params.chave!, 'stream');
  if (!r.value) return new Response('Não encontrado', { status: 404 });
  return new Response(r.value, {
    headers: {
      'Content-Type': r.metadata?.mime ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(r.metadata?.nome ?? 'arquivo')}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
