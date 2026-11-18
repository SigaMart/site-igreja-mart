// Converte dados/biblia-livre.txt (Bíblia Livre, CC BY 4.0, eBible.org)
// em JSON usado pelo site. Rode com: npm run biblia
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const LIVROS = [
  ['GEN', 'genesis', 'Gênesis', 'Gn'], ['EXO', 'exodo', 'Êxodo', 'Êx'], ['LEV', 'levitico', 'Levítico', 'Lv'],
  ['NUM', 'numeros', 'Números', 'Nm'], ['DEU', 'deuteronomio', 'Deuteronômio', 'Dt'], ['JOS', 'josue', 'Josué', 'Js'],
  ['JDG', 'juizes', 'Juízes', 'Jz'], ['RUT', 'rute', 'Rute', 'Rt'], ['1SA', '1-samuel', '1 Samuel', '1Sm'],
  ['2SA', '2-samuel', '2 Samuel', '2Sm'], ['1KI', '1-reis', '1 Reis', '1Rs'], ['2KI', '2-reis', '2 Reis', '2Rs'],
  ['1CH', '1-cronicas', '1 Crônicas', '1Cr'], ['2CH', '2-cronicas', '2 Crônicas', '2Cr'], ['EZR', 'esdras', 'Esdras', 'Ed'],
  ['NEH', 'neemias', 'Neemias', 'Ne'], ['EST', 'ester', 'Ester', 'Et'], ['JOB', 'jo', 'Jó', 'Jó'],
  ['PSA', 'salmos', 'Salmos', 'Sl'], ['PRO', 'proverbios', 'Provérbios', 'Pv'], ['ECC', 'eclesiastes', 'Eclesiastes', 'Ec'],
  ['SOL', 'cantares', 'Cantares', 'Ct'], ['ISA', 'isaias', 'Isaías', 'Is'], ['JER', 'jeremias', 'Jeremias', 'Jr'],
  ['LAM', 'lamentacoes', 'Lamentações', 'Lm'], ['EZE', 'ezequiel', 'Ezequiel', 'Ez'], ['DAN', 'daniel', 'Daniel', 'Dn'],
  ['HOS', 'oseias', 'Oseias', 'Os'], ['JOE', 'joel', 'Joel', 'Jl'], ['AMO', 'amos', 'Amós', 'Am'],
  ['OBA', 'obadias', 'Obadias', 'Ob'], ['JON', 'jonas', 'Jonas', 'Jn'], ['MIC', 'miqueias', 'Miqueias', 'Mq'],
  ['NAH', 'naum', 'Naum', 'Na'], ['HAB', 'habacuque', 'Habacuque', 'Hc'], ['ZEP', 'sofonias', 'Sofonias', 'Sf'],
  ['HAG', 'ageu', 'Ageu', 'Ag'], ['ZEC', 'zacarias', 'Zacarias', 'Zc'], ['MAL', 'malaquias', 'Malaquias', 'Ml'],
  ['MAT', 'mateus', 'Mateus', 'Mt'], ['MAR', 'marcos', 'Marcos', 'Mc'], ['LUK', 'lucas', 'Lucas', 'Lc'],
  ['JOH', 'joao', 'João', 'Jo'], ['ACT', 'atos', 'Atos', 'At'], ['ROM', 'romanos', 'Romanos', 'Rm'],
  ['1CO', '1-corintios', '1 Coríntios', '1Co'], ['2CO', '2-corintios', '2 Coríntios', '2Co'], ['GAL', 'galatas', 'Gálatas', 'Gl'],
  ['EPH', 'efesios', 'Efésios', 'Ef'], ['PHI', 'filipenses', 'Filipenses', 'Fp'], ['COL', 'colossenses', 'Colossenses', 'Cl'],
  ['1TH', '1-tessalonicenses', '1 Tessalonicenses', '1Ts'], ['2TH', '2-tessalonicenses', '2 Tessalonicenses', '2Ts'],
  ['1TI', '1-timoteo', '1 Timóteo', '1Tm'], ['2TI', '2-timoteo', '2 Timóteo', '2Tm'], ['TIT', 'tito', 'Tito', 'Tt'],
  ['PHM', 'filemom', 'Filemom', 'Fm'], ['HEB', 'hebreus', 'Hebreus', 'Hb'], ['JAM', 'tiago', 'Tiago', 'Tg'],
  ['1PE', '1-pedro', '1 Pedro', '1Pe'], ['2PE', '2-pedro', '2 Pedro', '2Pe'], ['1JO', '1-joao', '1 João', '1Jo'],
  ['2JO', '2-joao', '2 João', '2Jo'], ['3JO', '3-joao', '3 João', '3Jo'], ['JUD', 'judas', 'Judas', 'Jd'],
  ['REV', 'apocalipse', 'Apocalipse', 'Ap'],
];

const livros = LIVROS.map(([codigo, slug, nome, abrev], i) => ({
  slug, nome, abrev, testamento: i < 39 ? 'AT' : 'NT', capitulos: [],
}));
const porCodigo = Object.fromEntries(LIVROS.map(([c], i) => [c, livros[i]]));

const linhas = readFileSync(new URL('../dados/biblia-livre.txt', import.meta.url), 'utf8')
  .replace(/^﻿/, '').split(/\r?\n/);
for (const linha of linhas) {
  const m = linha.match(/^(\S+) (\d+):(\d+) (.*)$/);
  if (!m) continue;
  const livro = porCodigo[m[1]];
  if (!livro) throw new Error('Livro desconhecido: ' + m[1]);
  const cap = Number(m[2]) - 1, vers = Number(m[3]) - 1;
  (livro.capitulos[cap] ??= [])[vers] = m[4].trim();
}
for (const l of livros) l.capitulos = l.capitulos.map((c) => c.map((v) => v ?? ''));

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
mkdirSync(new URL('../public/dados/', import.meta.url), { recursive: true });
const json = JSON.stringify(livros);
writeFileSync(new URL('../src/data/biblia.json', import.meta.url), json);
writeFileSync(new URL('../public/dados/biblia.json', import.meta.url), json);
// Índice leve (sem texto) para uso no navegador
const indice = livros.map(({ slug, nome, abrev, testamento, capitulos }) => ({
  slug, nome, abrev, testamento, caps: capitulos.length,
}));
writeFileSync(new URL('../src/data/livros.json', import.meta.url), JSON.stringify(indice, null, 1));
const total = livros.reduce((s, l) => s + l.capitulos.reduce((a, c) => a + c.length, 0), 0);
console.log(`Bíblia gerada: ${livros.length} livros, ${total} versículos.`);
