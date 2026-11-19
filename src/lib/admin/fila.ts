// Fila de envios do WhatsApp, processada a cada minuto pelo agendador (cron) do Worker.
// Envia devagar (intervalo entre mensagens) para reduzir o risco de bloqueio do número.
import { SITE } from '../../config/site';
import { banco, lerConfig, executar, todos, um } from './db';
import { enviar, type Canal, type Midia } from './whatsapp';

const POR_RODADA = 10; // máximo de mensagens por envio a cada minuto
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Troca {nome} pelo primeiro nome do contato (em grupos e números avulsos, some). */
export function personalizar(corpo: string, nome: string | null, destino: string) {
  const ehPessoa = nome && nome !== destino && !destino.includes('@g.us');
  const primeiro = ehPessoa ? nome!.trim().split(/\s+/)[0] : '';
  // Sem nome: "Olá, {nome}!" vira "Olá!"
  if (!primeiro) return corpo.replace(/[ \t]*,?[ \t]*\{nome\}/g, '').replace(/ {2,}/g, ' ');
  return corpo.replace(/\{nome\}/g, primeiro);
}

type Envio = {
  id: number; canal_id: number; corpo: string | null; midia_chave: string | null; midia_tipo: Midia['tipo'] | null;
  midia_nome: string | null; midia_mime: string | null; intervalo: number; status: string;
};

export async function urlPublica() {
  return (await lerConfig('url_publica', SITE.urlPublica)).replace(/\/+$/, '');
}

export async function processarFila(_env?: Env) {
  const db = await banco();
  const agora = new Date().toISOString();

  // Trava simples para duas rodadas não enviarem a mesma coisa ao mesmo tempo
  const trava = await lerConfig('fila_trava');
  if (trava && Date.now() - Number(trava) < 90_000) return;
  await executar("INSERT INTO config (chave, valor) VALUES ('fila_trava', ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor", String(Date.now()));

  try {
    const envios = await todos<Envio>(
      "SELECT * FROM envios WHERE status IN ('agendado', 'enviando') AND agendado_para <= ? ORDER BY agendado_para LIMIT 3", agora);
    const base = await urlPublica();

    for (const e of envios) {
      const canal = await um<Canal>('SELECT * FROM canais WHERE id = ?', e.canal_id);
      if (!canal) { await executar("UPDATE envios SET status = 'erro' WHERE id = ?", e.id); continue; }
      if (e.status === 'agendado') await executar("UPDATE envios SET status = 'enviando' WHERE id = ?", e.id);

      const intervalo = Math.max(3, e.intervalo || 8);
      const limite = Math.max(1, Math.min(POR_RODADA, Math.floor(50 / intervalo)));
      const pendentes = await todos<{ id: number; destino: string; nome: string | null }>(
        "SELECT id, destino, nome FROM envio_destinos WHERE envio_id = ? AND status = 'pendente' ORDER BY id LIMIT ?", e.id, limite);
      const midia: Midia | null = e.midia_chave
        ? { tipo: e.midia_tipo!, url: `${base}/midia/${e.midia_chave}/`, mime: e.midia_mime ?? 'application/octet-stream', nome: e.midia_nome ?? 'arquivo' }
        : null;

      for (const [k, d] of pendentes.entries()) {
        if (k > 0) await esperar(intervalo * 1000);
        try {
          await enviar(canal, d.destino, personalizar(e.corpo ?? '', d.nome, d.destino), midia);
          await db.batch([
            db.prepare("UPDATE envio_destinos SET status = 'enviado', enviado_em = datetime('now') WHERE id = ?").bind(d.id),
            db.prepare("UPDATE envios SET enviados = enviados + 1, ultimo_envio = datetime('now') WHERE id = ?").bind(e.id),
          ]);
        } catch (err) {
          await db.batch([
            db.prepare("UPDATE envio_destinos SET status = 'erro', erro = ? WHERE id = ?").bind(String(err).slice(0, 300), d.id),
            db.prepare('UPDATE envios SET erros = erros + 1 WHERE id = ?').bind(e.id),
          ]);
        }
      }

      const resta = await um<{ n: number }>("SELECT COUNT(*) AS n FROM envio_destinos WHERE envio_id = ? AND status = 'pendente'", e.id);
      if (!resta?.n) {
        await executar("UPDATE envios SET status = CASE WHEN enviados = 0 AND erros > 0 THEN 'erro' ELSE 'enviado' END WHERE id = ?", e.id);
      }
    }
  } finally {
    await executar("DELETE FROM config WHERE chave = 'fila_trava'");
  }
}
