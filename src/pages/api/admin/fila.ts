// Processa a fila de envios na hora (além do agendador automático de cada minuto).
import type { APIRoute } from 'astro';
import { processarFila } from '../../../lib/admin/fila';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  await processarFila();
  const volta = new URL(request.headers.get('referer') ?? '/admin/whatsapp/');
  return Response.redirect(new URL(volta.pathname + volta.search, request.url).href, 303);
};
