// Devocionais e textos do blog só aparecem no site depois da data/hora marcada (e se não forem rascunho).
// O agendador gera o site de novo na hora da publicação (src/lib/admin/publicacoes.ts).

/** Momento em que o conteúdo vai ao ar. Data sem hora (ex.: 2026-11-21) vale a partir das 06:20 de Brasília. */
export function momentoPublicacao(data: Date) {
  const t = data.getTime();
  const soData = data.getUTCHours() === 0 && data.getUTCMinutes() === 0 && data.getUTCSeconds() === 0;
  return soData ? t + (9 * 60 + 20) * 60_000 : t; // 06:20 BRT = 09:20 UTC
}

export const publicado = (e: { data: { rascunho?: boolean; data: Date } }) =>
  !e.data.rascunho && momentoPublicacao(e.data.data) <= Date.now();
