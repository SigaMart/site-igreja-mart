// Assistente de IA do painel: formata textos, sugere campos e mensagens de WhatsApp.
import type { APIRoute } from 'astro';
import { assistenteConteudo, sugerirMensagem, atualizarModelos } from '../../../lib/admin/ia';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { acao, campos, alvo, apikey } = (await request.json()) as { acao: string; campos?: any; alvo?: string; apikey?: string };
    if (acao === 'modelos') return Response.json({ modelos: await atualizarModelos(apikey || undefined) });
    if (acao === 'mensagem') return Response.json({ mensagem: await sugerirMensagem(campos) });
    return Response.json(await assistenteConteudo(campos, alvo ?? 'tudo'));
  } catch (e) {
    return Response.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
};
