// Gera a capa de compartilhamento de cada página em /capas/<caminho da página>/capa.jpg ([...rota] = "<caminho>/capa").
// O Base.astro aponta o og:image para cá automaticamente.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, fmtHora } from '../../config/site';
import { livros } from '../../lib/referencia';
import { capitulo, passagem } from '../../lib/biblia';
import { gerarCapa, caminhoImagem, type Capa } from '../../lib/capas';

const horarios = SITE.cultos.map((c) => `${c.diaNome.split('-')[0]} ${fmtHora(c.inicio)}`).join(' · ');

const PAGINAS: Record<string, Capa> = {
  '/': { tipo: 'pagina', eyebrow: 'Bem-vindo à MART', titulo: 'Uma casa para você recomeçar com Deus.', texto: horarios, foto: caminhoImagem('fotos/mart/adoracao.jpg') },
  '/sobre/': { tipo: 'pagina', eyebrow: 'Nossa história', titulo: 'Conheça a Igreja MART', texto: 'Ministério Apostólico Restauração do Templo', foto: caminhoImagem('fotos/mart/pregacao.jpg') },
  '/cultos/': { tipo: 'pagina', eyebrow: 'Cultos', titulo: 'Horários dos cultos', texto: horarios, foto: caminhoImagem('fotos/mart/congregacao.jpg') },
  '/ministerios/': { tipo: 'pagina', eyebrow: 'Ministérios', titulo: 'Tem um lugar para você servir', foto: caminhoImagem('fotos/mart/danca.jpg') },
  '/devocionais/': { tipo: 'pagina', eyebrow: 'Devocionais', titulo: 'Um tempo com Deus todos os dias', foto: caminhoImagem('fotos/mart/louvor.jpg') },
  '/blog/': { tipo: 'pagina', eyebrow: 'Blog', titulo: 'Textos para a sua caminhada', foto: caminhoImagem('fotos/mart/culto-atual.jpg') },
  '/oracao/': { tipo: 'pagina', eyebrow: 'Pedido de oração', titulo: 'A gente ora por você', texto: 'Conte o que está no seu coração.', foto: caminhoImagem('fotos/mart/reunidos.jpg') },
  '/contato/': { tipo: 'pagina', eyebrow: 'Contato', titulo: 'Fale com a gente', texto: `${SITE.endereco.rua}, ${SITE.endereco.bairro}`, foto: caminhoImagem('fotos/mart/adoracao2.jpg') },
  '/biblia/': { tipo: 'livro', eyebrow: 'Bíblia online', titulo: 'Bíblia online', subtitulo: 'Leia e pesquise por livro, capítulo ou palavra', trecho: passagem('Salmos 119:105').texto },
};

export const getStaticPaths = (async () => {
  const capas: Record<string, Capa> = { ...PAGINAS };

  for (const d of await getCollection('devocionais', (d) => !d.data.rascunho)) {
    const v = passagem(d.data.versiculo);
    capas[`/devocionais/${d.id}/`] = { tipo: 'verso', eyebrow: 'Devocional', texto: v.texto, referencia: v.referencia };
  }
  for (const p of await getCollection('blog', (p) => !p.data.rascunho)) {
    capas[`/blog/${p.id}/`] = { tipo: 'pagina', eyebrow: p.data.categoria ?? 'Blog', titulo: p.data.titulo, foto: p.data.imagem ? caminhoImagem(p.data.imagem) : caminhoImagem('fotos/mart/culto-atual.jpg') };
  }
  for (const m of await getCollection('ministerios')) {
    capas[`/ministerios/${m.id}/`] = { tipo: 'pagina', eyebrow: 'Ministério', titulo: m.data.nome, foto: caminhoImagem(m.data.imagem) };
  }
  for (const l of livros) {
    const testamento = l.testamento === 'AT' ? 'Antigo Testamento' : 'Novo Testamento';
    capas[`/biblia/${l.slug}/`] = { tipo: 'livro', eyebrow: 'Bíblia online', titulo: l.nome, subtitulo: `${l.caps} ${l.caps > 1 ? 'capítulos' : 'capítulo'} · ${testamento}`, trecho: capitulo(l.slug, 1)[0] };
    for (let cap = 1; cap <= l.caps; cap++) {
      const versos = capitulo(l.slug, cap);
      let trecho = '';
      for (const v of versos) { if (trecho.length > 120) break; trecho += (trecho ? ' ' : '') + v; }
      capas[`/biblia/${l.slug}/${cap}/`] = { tipo: 'livro', eyebrow: 'Bíblia online', titulo: `${l.nome} ${cap}`, subtitulo: `${versos.length} versículos · ${testamento}`, trecho };
    }
  }

  return Object.entries(capas).map(([pagina, capa]) => ({
    params: { rota: `${pagina.slice(1)}capa` },
    props: { capa },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const jpg = await gerarCapa(props.capa as Capa);
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
