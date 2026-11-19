// Um livro da Bíblia por arquivo (usado pelo painel para editar versículos).
import type { GetStaticPaths } from 'astro';
import { bibliaCompleta, ORIGINAIS } from '../../../lib/biblia';

export const getStaticPaths = (() => bibliaCompleta.map((l) => ({ params: { livro: l.slug }, props: { l } }))) satisfies GetStaticPaths;

export const GET = ({ props }: { props: { l: (typeof bibliaCompleta)[number] } }) => {
  const originais = Object.fromEntries(Object.entries(ORIGINAIS).filter(([k]) => k.startsWith(props.l.slug + '/')).map(([k, v]) => [k.slice(props.l.slug.length + 1), v]));
  return Response.json({ slug: props.l.slug, nome: props.l.nome, capitulos: props.l.capitulos, originais });
};
