// Publicação agendada: o site é estático, então na hora marcada o agendador pede um novo build
// (grava src/data/publicacao.json no GitHub, e a Cloudflare publica o site de novo em ~2 min).
import { executar, todos } from './db';
import { gravar } from './github';

export async function agendarPublicacao(caminho: string, quandoIso: string) {
  if (new Date(quandoIso).getTime() <= Date.now()) {
    await executar('DELETE FROM publicacoes WHERE caminho = ?', caminho);
    return;
  }
  await executar('INSERT INTO publicacoes (caminho, quando, feito) VALUES (?, ?, 0) ON CONFLICT(caminho) DO UPDATE SET quando = excluded.quando, feito = 0', caminho, quandoIso);
}

export async function cancelarPublicacao(caminho: string) {
  await executar('DELETE FROM publicacoes WHERE caminho = ?', caminho);
}

/** Chamado pelo agendador: se alguma publicação chegou na hora, dispara o build. */
export async function publicarAgendados() {
  const agora = new Date().toISOString();
  const prontos = await todos<{ id: number; caminho: string }>('SELECT id, caminho FROM publicacoes WHERE feito = 0 AND quando <= ?', agora);
  if (!prontos.length) return;
  await gravar('src/data/publicacao.json', JSON.stringify({ atualizado_em: agora, publicados: prontos.map((p) => p.caminho) }, null, 2) + '\n',
    `Publicação agendada: ${prontos.map((p) => p.caminho).join(', ')}`);
  await executar(`UPDATE publicacoes SET feito = 1 WHERE id IN (${prontos.map(() => '?').join(',')})`, ...prontos.map((p) => p.id));
}
