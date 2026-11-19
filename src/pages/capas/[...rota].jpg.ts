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
  '/biblia/': { tipo: 'livro', eyebrow: '66 livros · Tradução Bíblia Livre', titulo: 'Leia a', destaque: 'Bíblia', subtitulo: 'Leia e pesquise por livro, capítulo ou palavra', trecho: passagem('Salmos 119:105').texto, referencia: 'Salmos 119:105', foto: caminhoImagem('fotos/natureza/paisagem-3.jpg') },
};

// Cada grupo de livros da Bíblia tem a sua paisagem (índices na ordem de livros.json)
const GRUPOS: { ate: number; nome: string; foto: number }[] = [
  { ate: 4, nome: 'Pentateuco', foto: 8 }, // Gênesis a Deuteronômio: criação
  { ate: 16, nome: 'Livros históricos', foto: 5 }, // Josué a Ester: a caminhada do povo
  { ate: 21, nome: 'Livros poéticos', foto: 2 }, // Jó a Cantares
  { ate: 26, nome: 'Profetas maiores', foto: 6 }, // Isaías a Daniel
  { ate: 38, nome: 'Profetas menores', foto: 10 }, // Oseias a Malaquias
  { ate: 42, nome: 'Evangelhos', foto: 4 }, // Mateus a João: o mar da Galileia
  { ate: 43, nome: 'História da Igreja', foto: 1 }, // Atos
  { ate: 56, nome: 'Cartas de Paulo', foto: 9 }, // Romanos a Filemom
  { ate: 64, nome: 'Cartas gerais', foto: 7 }, // Hebreus a Judas
  { ate: 65, nome: 'Profecia', foto: 3 }, // Apocalipse: novo céu e nova terra
];
const grupoDoLivro = (i: number) => {
  const g = GRUPOS.find((x) => i <= x.ate)!;
  return { nome: g.nome, foto: caminhoImagem(`fotos/natureza/paisagem-${g.foto}.jpg`) };
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
  livros.forEach((l, i) => {
    const g = grupoDoLivro(i);
    const testamento = l.testamento === 'AT' ? 'Antigo Testamento' : 'Novo Testamento';
    const eyebrow = `${g.nome} · ${testamento}`;
    capas[`/biblia/${l.slug}/`] = {
      tipo: 'livro', eyebrow, titulo: l.nome, foto: g.foto,
      subtitulo: `${l.caps} ${l.caps > 1 ? 'capítulos' : 'capítulo'}`,
      trecho: capitulo(l.slug, 1)[0], referencia: `${l.nome} 1:1`,
    };
    for (let cap = 1; cap <= l.caps; cap++) {
      const versos = capitulo(l.slug, cap);
      // Começo do capítulo: o 1º versículo (e o 2º, se o 1º for curto)
      let trecho = '', n = 0;
      for (const v of versos) { if (trecho.length > 80) break; trecho += (trecho ? ' ' : '') + v; n++; }
      capas[`/biblia/${l.slug}/${cap}/`] = {
        tipo: 'livro', eyebrow, titulo: l.nome, destaque: String(cap), foto: g.foto,
        subtitulo: `${versos.length} versículos`,
        trecho, referencia: `${l.nome} ${cap}:1${n > 1 ? `-${n}` : ''}`,
      };
    }
  });

  return Object.entries(capas).map(([pagina, capa]) => ({
    params: { rota: `${pagina.slice(1)}capa` },
    props: { capa },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const jpg = await gerarCapa(props.capa as Capa);
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
