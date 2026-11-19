// Tipos de conteúdo do site editados pelo painel (salvos como Markdown no GitHub).
export type Campo = { k: string; rotulo: string; tipo?: 'texto' | 'area' | 'datahora' | 'check' | 'imagem'; dica?: string; obrigatorio?: boolean; ia?: boolean };
export type TipoConteudo = { pasta: string; nome: string; singular: string; url: string; campos: Campo[]; chamada: string };

export const TIPOS: Record<string, TipoConteudo> = {
  devocionais: {
    pasta: 'src/content/devocionais', nome: 'Devocionais', singular: 'devocional', url: '/devocionais/',
    chamada: '*Leia o devocional completo através do nosso site:*',
    campos: [
      { k: 'titulo', rotulo: 'Título', obrigatorio: true, ia: true },
      { k: 'versiculo', rotulo: 'Versículo', dica: 'Ex.: Salmos 23:1-3. O texto é buscado automaticamente na Bíblia.', obrigatorio: true, ia: true },
      { k: 'descricao', rotulo: 'Resumo', tipo: 'area', dica: 'Uma ou duas frases. Aparece no Google e no WhatsApp.', obrigatorio: true, ia: true },
      { k: 'data', rotulo: 'Publicar em', tipo: 'datahora', dica: 'Data futura: o devocional só aparece no site nesse dia e hora.', obrigatorio: true },
      { k: 'autor', rotulo: 'Autor', dica: 'Em branco: Equipe de Devocionais MART' },
      { k: 'oracao', rotulo: 'Oração', tipo: 'area', obrigatorio: true, ia: true },
      { k: 'pergunta', rotulo: 'Pergunta para refletir', obrigatorio: true, ia: true },
      { k: 'rascunho', rotulo: 'Rascunho (não aparece no site)', tipo: 'check' },
    ],
  },
  blog: {
    pasta: 'src/content/blog', nome: 'Blog', singular: 'texto', url: '/blog/',
    chamada: '*Leia o texto completo através do nosso site:*',
    campos: [
      { k: 'titulo', rotulo: 'Título', obrigatorio: true, ia: true },
      { k: 'categoria', rotulo: 'Categoria', dica: 'Ex.: Primeiros passos, Família, Vida com Deus', obrigatorio: true, ia: true },
      { k: 'descricao', rotulo: 'Resumo', tipo: 'area', dica: 'Uma ou duas frases. Aparece no Google e no WhatsApp.', obrigatorio: true, ia: true },
      { k: 'data', rotulo: 'Publicar em', tipo: 'datahora', dica: 'Data futura: o texto só aparece no site nesse dia e hora.', obrigatorio: true },
      { k: 'autor', rotulo: 'Autor', dica: 'Em branco: Igreja MART' },
      { k: 'imagem', rotulo: 'Imagem de capa', tipo: 'imagem', obrigatorio: true },
      { k: 'imagemAlt', rotulo: 'Descrição da imagem', dica: 'O que aparece na foto (para acessibilidade).', obrigatorio: true },
      { k: 'rascunho', rotulo: 'Rascunho (não aparece no site)', tipo: 'check' },
    ],
  },
};
