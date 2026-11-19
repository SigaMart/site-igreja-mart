// Banco de dados do painel (Cloudflare D1). As tabelas são criadas sozinhas no primeiro acesso:
// para mudar a estrutura, acrescente um item no fim de MIGRACOES (nunca altere os que já existem).
import { env } from 'cloudflare:workers';

const MIGRACOES: string[] = [
  `CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, criado_em TEXT DEFAULT (datetime('now')));
   CREATE TABLE config (chave TEXT PRIMARY KEY, valor TEXT);
   CREATE TABLE canais (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, provedor TEXT NOT NULL, url TEXT NOT NULL, apikey TEXT, instancia TEXT, usuario TEXT, senha TEXT, criado_em TEXT DEFAULT (datetime('now')));
   CREATE TABLE contatos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, telefone TEXT, email TEXT, tags TEXT DEFAULT '', observacao TEXT, aceita_whatsapp INTEGER DEFAULT 1, origem TEXT DEFAULT 'painel', criado_em TEXT DEFAULT (datetime('now')));
   CREATE INDEX contatos_tel ON contatos(telefone);
   CREATE TABLE pedidos_oracao (id INTEGER PRIMARY KEY, nome TEXT, contato TEXT, motivo TEXT, pedido TEXT NOT NULL, quer_contato INTEGER DEFAULT 0, status TEXT DEFAULT 'novo', anotacao TEXT, criado_em TEXT DEFAULT (datetime('now')));
   CREATE TABLE calendarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cor TEXT DEFAULT '#f97316', ordem INTEGER DEFAULT 0);
   CREATE TABLE eventos (id INTEGER PRIMARY KEY, calendario_id INTEGER NOT NULL, titulo TEXT NOT NULL, descricao TEXT, inicio TEXT NOT NULL, fim TEXT, status TEXT DEFAULT 'planejado', criado_em TEXT DEFAULT (datetime('now')));
   CREATE INDEX eventos_inicio ON eventos(inicio);
   CREATE TABLE envios (id INTEGER PRIMARY KEY, titulo TEXT, canal_id INTEGER NOT NULL, corpo TEXT, midia_chave TEXT, midia_tipo TEXT, midia_nome TEXT, midia_mime TEXT, agendado_para TEXT NOT NULL, intervalo INTEGER DEFAULT 8, status TEXT DEFAULT 'agendado', evento_id INTEGER, total INTEGER DEFAULT 0, enviados INTEGER DEFAULT 0, erros INTEGER DEFAULT 0, ultimo_envio TEXT, criado_em TEXT DEFAULT (datetime('now')));
   CREATE INDEX envios_fila ON envios(status, agendado_para);
   CREATE TABLE envio_destinos (id INTEGER PRIMARY KEY, envio_id INTEGER NOT NULL, destino TEXT NOT NULL, nome TEXT, status TEXT DEFAULT 'pendente', erro TEXT, enviado_em TEXT);
   CREATE INDEX destinos_envio ON envio_destinos(envio_id, status);
   CREATE TABLE stories (id INTEGER PRIMARY KEY, chave TEXT NOT NULL UNIQUE, titulo TEXT NOT NULL, capa TEXT, slides TEXT NOT NULL DEFAULT '[]', ativo INTEGER DEFAULT 1, ordem INTEGER DEFAULT 0, atualizado_em TEXT DEFAULT (datetime('now')));
   INSERT INTO calendarios (nome, cor, ordem) VALUES ('WhatsApp', '#16a34a', 1), ('Instagram', '#db2777', 2), ('Dia a Dia', '#f97316', 3);`,
  // 2: publicações agendadas, stories por página e estatísticas de visitas
  `CREATE TABLE publicacoes (id INTEGER PRIMARY KEY, caminho TEXT NOT NULL UNIQUE, quando TEXT NOT NULL, feito INTEGER DEFAULT 0);
   ALTER TABLE stories ADD COLUMN paginas TEXT DEFAULT '';
   CREATE TABLE visitas (id INTEGER PRIMARY KEY, criado_em TEXT DEFAULT (datetime('now')), dia TEXT NOT NULL, caminho TEXT NOT NULL, tipo TEXT DEFAULT 'pagina', visitante TEXT, novo INTEGER DEFAULT 0, origem TEXT, referencia TEXT, pais TEXT, cidade TEXT, dispositivo TEXT);
   CREATE INDEX visitas_dia ON visitas(dia);
   CREATE INDEX visitas_caminho ON visitas(caminho, dia);`,
];

let pronto: Promise<void> | null = null;

async function migrar() {
  const db = env.DB;
  await db.prepare('CREATE TABLE IF NOT EXISTS _migracoes (n INTEGER PRIMARY KEY, em TEXT)').run();
  const feitas = await db.prepare('SELECT COALESCE(MAX(n), 0) AS n FROM _migracoes').first<{ n: number }>();
  for (let i = feitas?.n ?? 0; i < MIGRACOES.length; i++) {
    const comandos = MIGRACOES[i].split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    await db.batch([...comandos.map((c) => db.prepare(c)), db.prepare("INSERT INTO _migracoes VALUES (?, datetime('now'))").bind(i + 1)]);
  }
}

/** Banco pronto para uso (cria/atualiza as tabelas na primeira chamada). */
export async function banco() {
  pronto ??= migrar().catch((e) => { pronto = null; throw e; });
  await pronto;
  return env.DB;
}

export async function todos<T>(sql: string, ...params: unknown[]) {
  const db = await banco();
  return (await db.prepare(sql).bind(...params).all<T>()).results;
}
export async function um<T>(sql: string, ...params: unknown[]) {
  const db = await banco();
  return db.prepare(sql).bind(...params).first<T>();
}
export async function executar(sql: string, ...params: unknown[]) {
  const db = await banco();
  return db.prepare(sql).bind(...params).run();
}

// ---------- Configurações (chave/valor)
export async function lerConfig(chave: string, padrao = '') {
  return (await um<{ valor: string }>('SELECT valor FROM config WHERE chave = ?', chave))?.valor ?? padrao;
}
export async function gravarConfig(chave: string, valor: string) {
  await executar('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor', chave, valor);
}

// ---------- Datas: o painel trabalha no horário de Brasília (UTC-3, sem horário de verão).
/** "2026-11-20T19:30" (Brasília, de um <input type=datetime-local>) -> ISO UTC */
export const brParaUtc = (local: string) => new Date(`${local}:00-03:00`).toISOString();
/** ISO UTC -> "2026-11-20T19:30" (Brasília) */
export const utcParaBr = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 16);
/** ISO UTC -> "20/11/2026 19:30" */
export const fmtDataHora = (iso: string) => {
  const [d, h] = utcParaBr(iso).split('T');
  return `${d.split('-').reverse().join('/')} ${h}`;
};
/** Datas gravadas pelo SQLite (datetime('now') = UTC, sem fuso) */
export const fmtSqlite = (s: string) => fmtDataHora(s.replace(' ', 'T') + 'Z');

/** Telefone só com dígitos, com DDI 55 quando faltar. */
export function normalizarTelefone(t: string) {
  const d = (t || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length <= 11) return '55' + d.replace(/^0+/, '');
  return d;
}
