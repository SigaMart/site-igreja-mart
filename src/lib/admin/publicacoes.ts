// Publicação agendada: o site é estático, então na hora marcada o agendador pede um novo build
// (grava src/data/publicacao.json no GitHub, e a Cloudflare publica o site de novo em ~2 min).
import { env } from 'cloudflare:workers';
import { executar, todos, lerConfig, gravarConfig } from './db';
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

type Publicado = { caminho: string; agendado: boolean; publicaEm: string };

/** Itens que o último build deixou escondidos (data futura) e cuja hora já chegou. */
async function vencidosNoSite(): Promise<{ caminhos: string[]; marca: string }> {
  const nada = { caminhos: [], marca: '' };
  try {
    const r = await env.ASSETS.fetch('https://site/dados/conteudo.json');
    if (!r.ok) return nada;
    const d = (await r.json()) as { geradoEm?: string; devocionais?: Publicado[]; blog?: Publicado[] };
    const agora = Date.now();
    const vencidos = [...(d.devocionais ?? []), ...(d.blog ?? [])].filter((i) => i.agendado && Date.parse(i.publicaEm) <= agora).map((i) => i.caminho);
    if (!vencidos.length) return nada;
    // Só dispara uma vez por build (o próximo build tira esses itens da lista de agendados)
    const marca = `${d.geradoEm}:${vencidos.join(',')}`;
    if ((await lerConfig('publicacao_disparada')) === marca) return nada;
    return { caminhos: vencidos, marca };
  } catch {
    return nada;
  }
}

/** Chamado pelo agendador a cada minuto: se alguma publicação chegou na hora, dispara o build. */
export async function publicarAgendados() {
  const agora = new Date().toISOString();
  const prontos = await todos<{ id: number; caminho: string }>('SELECT id, caminho FROM publicacoes WHERE feito = 0 AND quando <= ?', agora);
  const doSite = await vencidosNoSite();
  const caminhos = [...new Set([...prontos.map((p) => p.caminho), ...doSite.caminhos])];
  if (!caminhos.length) return;
  await gravar('src/data/publicacao.json', JSON.stringify({ atualizado_em: agora, publicados: caminhos }, null, 2) + '\n',
    `Publicação agendada: ${caminhos.join(', ')}`);
  if (doSite.marca) await gravarConfig('publicacao_disparada', doSite.marca);
  if (prontos.length) await executar(`UPDATE publicacoes SET feito = 1 WHERE id IN (${prontos.map(() => '?').join(',')})`, ...prontos.map((p) => p.id));
}
