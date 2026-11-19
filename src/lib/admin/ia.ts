// Assistente de IA do painel (por enquanto só OpenAI). Chave e modelo ficam em Configurações.
import { lerConfig, gravarConfig } from './db';

const API = 'https://api.openai.com/v1';

async function chave() {
  const k = await lerConfig('ia_openai_chave');
  if (!k) throw new Error('Configure a chave da OpenAI em Configurações → Inteligência artificial.');
  return k;
}

/** Busca na OpenAI os modelos disponíveis para a chave e guarda a lista. */
export async function atualizarModelos(apikey?: string) {
  const r = await fetch(`${API}/models`, { headers: { Authorization: `Bearer ${apikey ?? (await chave())}` } });
  const j = (await r.json().catch(() => ({}))) as { data?: { id: string; created: number }[]; error?: { message: string } };
  if (!r.ok) throw new Error(`OpenAI: ${j.error?.message ?? r.status}`);
  // Só modelos de texto (conversa)
  const fora = /embedding|whisper|tts|dall-e|image|audio|realtime|transcribe|moderation|search|davinci|babbage|instruct|computer-use|sora|codex/i;
  const lista = (j.data ?? []).filter((m) => /^(gpt|o\d|chatgpt)/i.test(m.id) && !fora.test(m.id))
    .sort((a, b) => b.created - a.created).map((m) => m.id);
  await gravarConfig('ia_modelos', JSON.stringify(lista));
  return lista;
}

export async function modelosSalvos(): Promise<string[]> {
  try { return JSON.parse(await lerConfig('ia_modelos', '[]')); } catch { return []; }
}

/** Pergunta à IA e devolve um objeto JSON. */
export async function perguntarJson<T>(sistema: string, usuario: string): Promise<T> {
  const modelo = await lerConfig('ia_openai_modelo', 'gpt-4o-mini');
  const r = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await chave()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const j = (await r.json().catch(() => ({}))) as { choices?: { message: { content: string } }[]; error?: { message: string } };
  if (!r.ok) throw new Error(`OpenAI: ${j.error?.message ?? r.status}`);
  const texto = j.choices?.[0]?.message?.content ?? '{}';
  try { return JSON.parse(texto) as T; } catch { throw new Error('A IA respondeu num formato inesperado. Tente de novo.'); }
}

// ---------- Assistente de conteúdo (devocionais e blog)

const ESTILO = `Você ajuda a equipe da Igreja MART (Ministério Apostólico Restauração do Templo), em São Caetano do Sul.
Escreva em português do Brasil, com tom acolhedor, simples e próximo, como uma conversa. Nada de jargão "evangeliquês",
nada de exageros, emojis ou frases de efeito vazias. Não invente fatos, histórias ou citações que não estejam no texto.
Versículos: use a referência no formato "Livro capítulo:versículo" (ex.: "Salmos 23:1-3").`;

export type CamposConteudo = {
  tipo: 'devocionais' | 'blog';
  texto?: string; titulo?: string; descricao?: string; versiculo?: string; oracao?: string; pergunta?: string; categoria?: string;
};

const INSTRUCOES: Record<string, string> = {
  texto: `"texto": o texto principal reorganizado e formatado em Markdown. Corrija ortografia, pontuação e quebras de linha,
divida em parágrafos curtos, use **negrito** com moderação para as ideias principais e subtítulos "## " só se o texto for longo.
Mantenha a voz, o conteúdo e o tamanho do autor: não resuma, não acrescente ideias novas. Não repita o título nem o versículo no começo.
O texto pode chegar em HTML (vindo do editor visual). Responda em Markdown, mas mantenha imagens e vídeos
(<img>, <figure class="video">…</figure>, <div data-youtube-video>…</div>) exatamente como estão, em HTML, no mesmo lugar, cada um em uma linha própria.`,
  titulo: `"titulo": um título curto (até 60 caracteres), convidativo, sem ponto final.`,
  descricao: `"descricao": um resumo de 1 a 2 frases (até 160 caracteres) para o Google e o WhatsApp.`,
  versiculo: `"versiculo": a referência bíblica central do texto (ex.: "Mateus 7:24-25"). Se o texto já cita uma, use ela.`,
  oracao: `"oracao": uma oração curta (3 a 5 frases) em primeira pessoa, ligada ao tema, terminando com "Amém."`,
  pergunta: `"pergunta": uma pergunta pessoal para reflexão, ligada ao tema.`,
  categoria: `"categoria": uma categoria curta para o blog (ex.: Primeiros passos, Família, Vida com Deus).`,
};

/** Gera um campo (ou todos) a partir do texto e dos campos já preenchidos. */
export async function assistenteConteudo(campos: CamposConteudo, alvo: string) {
  const tipoNome = campos.tipo === 'devocionais' ? 'devocional' : 'texto de blog';
  const todos = campos.tipo === 'devocionais' ? ['texto', 'titulo', 'descricao', 'versiculo', 'oracao', 'pergunta'] : ['texto', 'titulo', 'descricao', 'categoria'];
  const pedir = alvo === 'tudo' ? todos : [alvo];
  const atual = Object.entries(campos).filter(([k, v]) => k !== 'tipo' && v?.trim()).map(([k, v]) => `### ${k}\n${v}`).join('\n\n');
  const sistema = `${ESTILO}

Você está editando um ${tipoNome}. Responda SOMENTE com um objeto JSON com as chaves pedidas:
${pedir.map((k) => INSTRUCOES[k]).join('\n')}

Os campos que o autor já preencheu são a intenção dele: respeite-os e mantenha tudo coerente entre si.
${alvo === 'tudo' ? 'Campos já preenchidos (exceto o texto) devem ser mantidos, só com correções de ortografia e pontuação.' : 'Se o campo pedido já tiver conteúdo, melhore-o mantendo a ideia.'}`;
  return perguntarJson<Record<string, string>>(sistema, atual || '(vazio)');
}

/** Sugere a mensagem de WhatsApp para divulgar um conteúdo. */
export async function sugerirMensagem(campos: CamposConteudo & { corpo?: string }) {
  const sistema = `${ESTILO}

Escreva uma mensagem curta de WhatsApp (até 600 caracteres) convidando o grupo da igreja a ler o ${campos.tipo === 'devocionais' ? 'devocional do dia' : 'novo texto do blog'}.
Use a formatação do WhatsApp: *negrito* (um asterisco) e _itálico_. Pode usar 1 ou 2 emojis discretos.
Comece com uma saudação curta, traga a ideia central em 2 ou 3 frases e, se houver versículo, cite-o em itálico com a referência.
NÃO inclua link nem convite final para "ler no site": isso é acrescentado automaticamente.
${campos.corpo?.trim() ? 'Já existe um rascunho da mensagem: melhore-o mantendo a ideia.' : ''}
Responda SOMENTE com JSON: {"mensagem": "..."}`;
  const dados = Object.entries(campos).filter(([k, v]) => k !== 'tipo' && typeof v === 'string' && v.trim()).map(([k, v]) => `### ${k}\n${v}`).join('\n\n');
  return (await perguntarJson<{ mensagem: string }>(sistema, dados)).mensagem;
}
