// Devocionais e textos do blog só aparecem no site depois da data/hora marcada (e se não forem rascunho).
// O painel agenda um novo build do site para a hora da publicação (src/lib/admin/publicacoes.ts).
export const publicado = (e: { data: { rascunho?: boolean; data: Date } }) =>
  !e.data.rascunho && e.data.data.getTime() <= Date.now();
