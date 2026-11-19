import { todos } from './db';

/** "Jovens, louvor ,  " -> "jovens,louvor" */
export const limparEtiquetas = (s: string) =>
  [...new Set(s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))].join(',');

/** Todas as etiquetas usadas, com quantas pessoas têm cada uma. */
export async function listaEtiquetas() {
  const linhas = await todos<{ tags: string }>("SELECT tags FROM contatos WHERE tags != ''");
  const conta = new Map<string, number>();
  for (const l of linhas) for (const t of l.tags.split(',')) if (t) conta.set(t, (conta.get(t) ?? 0) + 1);
  return [...conta].map(([nome, n]) => ({ nome, n })).sort((a, b) => a.nome.localeCompare(b.nome));
}

/** Contatos que aceitam mensagens, filtrados por etiquetas (vazio = todos). */
export async function contatosPorEtiquetas(etiquetas: string[]) {
  const todosC = await todos<{ id: number; nome: string; telefone: string; tags: string }>(
    "SELECT id, nome, telefone, tags FROM contatos WHERE aceita_whatsapp = 1 AND telefone != ''");
  if (!etiquetas.length) return todosC;
  return todosC.filter((c) => c.tags.split(',').some((t) => etiquetas.includes(t)));
}
