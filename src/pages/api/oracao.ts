// Recebe o formulário de pedido de oração do site e grava no banco.
import type { APIRoute } from 'astro';
import { executar, um, normalizarTelefone } from '../../lib/admin/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const f = await request.formData();
  const t = (k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);
  if (t('site')) return new Response(null, { status: 204 }); // campo escondido: robô
  const pedido = t('pedido', 4000);
  if (pedido.length < 3) return Response.json({ erro: 'Escreva o seu pedido.' }, { status: 400 });

  const nome = t('nome', 100), contato = t('contato', 120), quer = f.get('contatar') ? 1 : 0;
  await executar('INSERT INTO pedidos_oracao (nome, contato, motivo, pedido, quer_contato) VALUES (?, ?, ?, ?, ?)', nome, contato, t('motivo', 60), pedido, quer);

  // Quem pediu contato e deixou um telefone entra na lista de contatos
  const tel = contato.includes('@') ? '' : normalizarTelefone(contato);
  if (quer && tel.length >= 12 && !(await um('SELECT id FROM contatos WHERE telefone = ?', tel))) {
    await executar("INSERT INTO contatos (nome, telefone, tags, origem) VALUES (?, ?, 'oração', 'site')", nome || 'Sem nome', tel);
  }
  return Response.json({ ok: true });
};
