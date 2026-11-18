// Funções leves (sem o texto da Bíblia) usadas no servidor e no navegador.
import livros from '../data/livros.json';

export type Livro = (typeof livros)[number];
export { livros };

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Apelidos comuns além do nome e da abreviação
const APELIDOS: Record<string, string> = {
  gen: 'genesis', ex: 'exodo', exo: 'exodo', sal: 'salmos', salmo: 'salmos', sl: 'salmos', ps: 'salmos',
  prov: 'proverbios', pv: 'proverbios', ecl: 'eclesiastes', cant: 'cantares', 'cantico dos canticos': 'cantares',
  'canticos': 'cantares', is: 'isaias', jer: 'jeremias', mt: 'mateus', mat: 'mateus', mc: 'marcos', mar: 'marcos',
  lc: 'lucas', luc: 'lucas', jo: 'joao', joa: 'joao', at: 'atos', rm: 'romanos', rom: 'romanos', hb: 'hebreus',
  heb: 'hebreus', tg: 'tiago', ap: 'apocalipse', apoc: 'apocalipse', fp: 'filipenses', fil: 'filipenses',
  ef: 'efesios', gl: 'galatas', cl: 'colossenses', job: 'jo',
};

const indicePorNome = new Map<string, Livro>();
for (const l of livros) {
  for (const k of [l.slug, l.nome, l.abrev, l.slug.replace(/-/g, ' '), l.nome.replace(/\s/g, ''), l.abrev.replace(/\s/g, '')]) {
    indicePorNome.set(normalizar(k), l);
  }
}
for (const [k, slug] of Object.entries(APELIDOS)) {
  if (!indicePorNome.has(k)) indicePorNome.set(k, livros.find((l) => l.slug === slug)!);
}
// "Jó" e "João" colidem em "jo" sem acento: "jo" é João (abreviação oficial) e "jó" (com acento) é Jó.
const JO = livros.find((l) => l.slug === 'jo')!;
indicePorNome.set('jo', livros.find((l) => l.slug === 'joao')!);

export function encontrarLivro(nome: string): Livro | undefined {
  const bruto = nome.trim().toLowerCase().replace(/\.$/, '');
  if (bruto === 'jó') return JO;
  const n = normalizar(bruto);
  return indicePorNome.get(n) ?? indicePorNome.get(n.replace(/\s/g, ''));
}

export type Referencia = { livro: Livro; cap: number; vIni?: number; vFim?: number };

/** Interpreta textos como "João 3:16", "jo 3.16-18", "Salmos 23", "1 Co 13:4" */
export function interpretarReferencia(texto: string): Referencia | null {
  const m = texto.trim().match(/^(\d?\s*[\p{L}][\p{L}\s.]*?)\s*(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/u);
  if (!m) return null;
  const livro = encontrarLivro(m[1]);
  if (!livro) return null;
  const cap = Number(m[2]);
  if (cap < 1 || cap > livro.caps) return null;
  const vIni = m[3] ? Number(m[3]) : undefined;
  const vFim = m[4] ? Number(m[4]) : vIni;
  return { livro, cap, vIni, vFim };
}

export const urlCapitulo = (slug: string, cap: number) => `/biblia/${slug}/${cap}/`;

export function formatarReferencia(r: Referencia) {
  let s = `${r.livro.nome} ${r.cap}`;
  if (r.vIni) s += `:${r.vIni}${r.vFim && r.vFim !== r.vIni ? `-${r.vFim}` : ''}`;
  return s;
}
