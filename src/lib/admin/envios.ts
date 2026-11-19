// Cria envios de WhatsApp a partir do formulário (componente Compositor).
import { banco, brParaUtc, normalizarTelefone, todos } from './db';
import { contatosPorEtiquetas } from './contatos';
import { guardarMidia } from './midia';
import { tipoDaMidia } from './whatsapp';

export const STATUS_ENVIO: Record<string, [string, string]> = {
  agendado: ['Agendado', 'bg-blue-50 text-blue-700'],
  enviando: ['Enviando', 'bg-amber-50 text-amber-700'],
  enviado: ['Enviado', 'bg-green-50 text-green-700'],
  erro: ['Erro', 'bg-red-50 text-red-700'],
  cancelado: ['Cancelado', 'bg-tinta/5 text-tinta-suave'],
};

export async function criarEnvio(f: FormData, eventoId: number | null = null) {
  const t = (k: string) => String(f.get(k) ?? '').trim();
  const canalId = Number(t('canal_id'));
  if (!canalId) throw new Error('Escolha o canal (número) que vai enviar.');
  const corpo = t('corpo');

  // Destinos: grupos do WhatsApp + contatos por etiqueta + contatos escolhidos + números avulsos
  const destinos = new Map<string, string>();
  for (const g of f.getAll('grupos')) {
    const [id, ...nome] = String(g).split('|');
    destinos.set(id, nome.join('|') || id);
  }
  const modo = t('contatos_modo'); // '', 'todos', 'etiquetas'
  if (modo) {
    const etiquetas = modo === 'todos' ? [] : f.getAll('etiquetas').map(String);
    if (modo === 'todos' || etiquetas.length) for (const c of await contatosPorEtiquetas(etiquetas)) destinos.set(c.telefone, c.nome);
  }
  const ids = f.getAll('contatos').map(Number).filter(Boolean);
  if (ids.length) {
    const escolhidos = await todos<{ nome: string; telefone: string }>(
      `SELECT nome, telefone FROM contatos WHERE id IN (${ids.map(() => '?').join(',')}) AND telefone != ''`, ...ids);
    for (const c of escolhidos) destinos.set(c.telefone, c.nome);
  }
  for (const n of t('numeros').split(/[\n,;]/)) {
    const tel = normalizarTelefone(n);
    if (tel.length >= 12) destinos.set(tel, tel);
  }
  if (!destinos.size) throw new Error('Escolha pelo menos um grupo ou contato.');

  const arquivo = f.get('midia');
  const midia = arquivo instanceof File && arquivo.size > 0 ? await guardarMidia(arquivo) : null;
  if (!corpo && !midia) throw new Error('Escreva a mensagem ou anexe uma mídia.');

  const quando = t('quando') === 'agendar' && t('agendado_para') ? brParaUtc(t('agendado_para')) : new Date().toISOString();
  const intervalo = Math.min(120, Math.max(3, Number(t('intervalo')) || 8));

  const db = await banco();
  const r = await db.prepare(
    `INSERT INTO envios (titulo, canal_id, corpo, midia_chave, midia_tipo, midia_nome, midia_mime, agendado_para, intervalo, evento_id, total)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(t('titulo') || corpo.slice(0, 60) || midia?.nome || 'Envio', canalId, corpo, midia?.chave ?? null, midia ? tipoDaMidia(midia.mime) : null,
    midia?.nome ?? null, midia?.mime ?? null, quando, intervalo, eventoId, destinos.size).run();
  const envioId = Number(r.meta.last_row_id);
  const linhas = [...destinos].map(([d, nome]) => db.prepare('INSERT INTO envio_destinos (envio_id, destino, nome) VALUES (?,?,?)').bind(envioId, d, nome));
  for (let i = 0; i < linhas.length; i += 50) await db.batch(linhas.slice(i, i + 50));
  return { id: envioId, total: destinos.size, quando };
}
