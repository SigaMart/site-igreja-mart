// Títulos e datas de devocionais e blog no último build (o painel e o agendador usam).
import { getCollection } from 'astro:content';
import { momentoPublicacao } from '../../lib/publicado';

export const GET = async () => {
  const item = (pasta: string) => (e: { id: string; data: { titulo: string; data: Date; rascunho?: boolean } }) => {
    const publicaEm = momentoPublicacao(e.data.data);
    return {
      id: e.id, caminho: `/${pasta}/${e.id}/`, titulo: e.data.titulo, data: e.data.data.toISOString(), rascunho: !!e.data.rascunho,
      publicaEm: new Date(publicaEm).toISOString(), agendado: !e.data.rascunho && publicaEm > Date.now(),
    };
  };
  return Response.json({
    geradoEm: new Date().toISOString(),
    devocionais: (await getCollection('devocionais')).map(item('devocionais')),
    blog: (await getCollection('blog')).map(item('blog')),
  });
};
