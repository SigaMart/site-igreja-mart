// Upload de foto/arquivo pelo painel (ex.: fotos dos stories). Devolve o endereço público.
import type { APIRoute } from 'astro';
import { guardarMidia } from '../../../lib/admin/midia';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const arquivo = (await request.formData()).get('arquivo');
  if (!(arquivo instanceof File) || !arquivo.size) return Response.json({ erro: 'Nenhum arquivo.' }, { status: 400 });
  try {
    const m = await guardarMidia(arquivo);
    return Response.json({ url: `/midia/${m.chave}/` });
  } catch (e) {
    return Response.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
};
