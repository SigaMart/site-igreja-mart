// Protege o painel: tudo em /admin (menos a tela de entrar) e /api/admin exige login.
import { defineMiddleware } from 'astro:middleware';
import type { UsuarioSessao } from './lib/admin/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();
  const p = ctx.url.pathname;
  const protegido = (p.startsWith('/admin') && !p.startsWith('/admin/entrar')) || p.startsWith('/api/admin');
  if (!protegido) return next();

  const usuario = await ctx.session?.get('usuario') as UsuarioSessao | undefined;
  if (!usuario) {
    if (p.startsWith('/api/')) return new Response('Não autorizado', { status: 401 });
    return ctx.redirect(`/admin/entrar/?volta=${encodeURIComponent(p)}`);
  }
  ctx.locals.usuario = usuario;
  const resp = await next();
  // Alguns Responses (ex.: redirect) têm cabeçalhos imutáveis: copia antes de mexer
  const r = new Response(resp.body, resp);
  r.headers.set('Cache-Control', 'no-store');
  r.headers.set('X-Robots-Tag', 'noindex');
  return r;
});
