// Ações de um canal de WhatsApp: status, conectar (QR code), grupos e desconectar.
import type { APIRoute } from 'astro';
import { um } from '../../../lib/admin/db';
import { status, conectar, grupos, desconectar, type Canal } from '../../../lib/admin/whatsapp';

export const prerender = false;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ url }) => {
  const canal = await um<Canal>('SELECT * FROM canais WHERE id = ?', Number(url.searchParams.get('id')));
  if (!canal) return json({ erro: 'Canal não encontrado' }, 404);
  try {
    switch (url.searchParams.get('acao')) {
      case 'conectar': return json(await conectar(canal));
      case 'grupos': return json(await grupos(canal));
      default: return json(await status(canal));
    }
  } catch (e) {
    return json({ erro: String(e instanceof Error ? e.message : e) }, 502);
  }
};

export const POST: APIRoute = async ({ url }) => {
  const canal = await um<Canal>('SELECT * FROM canais WHERE id = ?', Number(url.searchParams.get('id')));
  if (!canal) return json({ erro: 'Canal não encontrado' }, 404);
  try {
    await desconectar(canal);
    return json({ ok: true });
  } catch (e) {
    return json({ erro: String(e instanceof Error ? e.message : e) }, 502);
  }
};
