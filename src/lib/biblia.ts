// Acesso ao texto completo da Bíblia. Use SOMENTE em páginas (build), nunca em scripts do navegador.
import biblia from '../data/biblia.json';
import correcoes from '../data/biblia-correcoes.json';
import { interpretarReferencia, formatarReferencia, urlCapitulo, type Referencia } from './referencia';

type LivroCompleto = { slug: string; nome: string; abrev: string; testamento: string; capitulos: string[][] };

/** Correções de versículos feitas pelo painel (/admin/biblia/): { "joao/3/16": "texto corrigido" } */
export const CORRECOES = correcoes as Record<string, string>;
/** Texto original (antes da correção) de cada versículo corrigido */
export const ORIGINAIS: Record<string, string> = {};

export const bibliaCompleta = (biblia as LivroCompleto[]).map((l) => ({
  ...l,
  capitulos: l.capitulos.map((c, ci) => c.map((v, vi) => {
    const k = `${l.slug}/${ci + 1}/${vi + 1}`;
    if (!(k in CORRECOES)) return v;
    ORIGINAIS[k] = v;
    return CORRECOES[k];
  })),
}));

export function capitulo(slug: string, cap: number) {
  return bibliaCompleta.find((l) => l.slug === slug)?.capitulos[cap - 1] ?? [];
}

export type Passagem = { referencia: string; url: string; texto: string; versos: { n: number; t: string }[] };

export function passagem(ref: string | Referencia): Passagem {
  const r = typeof ref === 'string' ? interpretarReferencia(ref) : ref;
  if (!r) throw new Error(`Referência bíblica inválida: ${ref}`);
  const versos = capitulo(r.livro.slug, r.cap);
  const ini = r.vIni ?? 1;
  const fim = r.vFim ?? (r.vIni ? r.vIni : versos.length);
  const sel = versos.slice(ini - 1, fim).map((t, i) => ({ n: ini + i, t }));
  if (!sel.length) throw new Error(`Versículos não encontrados: ${ref}`);
  return {
    referencia: formatarReferencia(r),
    url: urlCapitulo(r.livro.slug, r.cap) + (r.vIni ? `#v${r.vIni}` : ''),
    texto: sel.map((v) => v.t).join(' '),
    versos: sel,
  };
}
