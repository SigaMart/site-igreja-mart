// Títulos e datas de devocionais e blog no último build (o painel usa para listar).
import { getCollection } from 'astro:content';

export const GET = async () => {
  const item = (e: { id: string; data: { titulo: string; data: Date; rascunho?: boolean } }) => ({ id: e.id, titulo: e.data.titulo, data: e.data.data.toISOString().slice(0, 10), rascunho: !!e.data.rascunho });
  return Response.json({
    devocionais: (await getCollection('devocionais')).map(item),
    blog: (await getCollection('blog')).map(item),
  });
};
