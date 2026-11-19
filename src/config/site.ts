// Informações centrais da igreja. Altere aqui e o site inteiro é atualizado
// (páginas, rodapé, dados para Google/IA, llms.txt).

export const SITE = {
  nome: 'Igreja MART',
  nomeCompleto: 'Ministério Apostólico Restauração do Templo',
  sigla: 'MART',
  url: 'https://igrejamart.com.br',
  // Endereço onde o site está no ar de verdade (usado nas imagens de compartilhamento do WhatsApp).
  // Quando o domínio igrejamart.com.br estiver apontado para a Cloudflare, troque para 'https://igrejamart.com.br'.
  urlPublica: 'https://site-igreja-mart.sigamart-contato.workers.dev',
  descricao:
    'Igreja MART (Ministério Apostólico Restauração do Templo), no bairro Fundação, em São Caetano do Sul (SP). Um lugar de acolhimento para quem quer conhecer a Deus, fazer amigos e recomeçar. Cultos aos domingos, terças e quartas.',
  tipo: 'Igreja cristã',
  idioma: 'pt-BR',

  endereco: {
    rua: 'Av. Conde Francisco Matarazzo, 557',
    bairro: 'Fundação',
    cidade: 'São Caetano do Sul',
    uf: 'SP',
    cep: '09520-120',
    pais: 'BR',
  },

  redes: {
    instagram: 'https://www.instagram.com/sigamart/',
    facebook: 'https://www.facebook.com/sigamart/',
    youtube: '',
    // Preencha com o número no formato 5511999999999 para ativar o botão de WhatsApp.
    whatsapp: '',
  },
  instagramUsuario: '@sigamart',

  // Horários de culto (dia: 0 = domingo ... 6 = sábado)
  cultos: [
    { dia: 0, diaNome: 'Domingo', inicio: '18:00', fim: '20:30', nome: 'Culto da Família', descricao: 'Nosso culto principal da semana: louvor, palavra e comunhão para toda a família.' },
    { dia: 2, diaNome: 'Terça-feira', inicio: '20:00', fim: '21:30', nome: 'Culto de Terça', descricao: 'Um tempo no meio da semana para renovar as forças, orar e ouvir a Palavra.' },
    { dia: 3, diaNome: 'Quarta-feira', inicio: '15:30', fim: '17:00', nome: 'Culto da Tarde', descricao: 'Culto à tarde, ideal para quem tem a agenda livre durante o dia.' },
  ],
} as const;

/** "18:00" -> "18h", "20:30" -> "20h30" */
export const fmtHora = (h: string) => h.replace(':00', 'h').replace(':', 'h');

export const enderecoCompleto = `${SITE.endereco.rua} - ${SITE.endereco.bairro}, ${SITE.endereco.cidade} - ${SITE.endereco.uf}, ${SITE.endereco.cep}`;
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;
export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`;

export const NAV = [
  { href: '/sobre/', label: 'Sobre' },
  { href: '/cultos/', label: 'Cultos' },
  { href: '/ministerios/', label: 'Ministérios' },
  { href: '/devocionais/', label: 'Devocionais' },
  { href: '/blog/', label: 'Blog' },
  { href: '/biblia/', label: 'Bíblia' },
  { href: '/contato/', label: 'Contato' },
];

export const CREDITO_BIBLIA =
  'Textos bíblicos da Bíblia Livre (BLIVRE), atualizada a partir da tradução de João Ferreira de Almeida. Copyright © Diego Santos, Mario Sérgio e Marco Teles. Licença Creative Commons Atribuição 4.0 Brasil.';
