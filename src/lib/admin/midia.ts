// Mídias enviadas pelo painel (fotos dos stories, imagens/vídeos/áudios do WhatsApp), guardadas no KV.
// Ficam públicas em /midia/<chave>/ com um nome impossível de adivinhar.
import { env } from 'cloudflare:workers';

export const LIMITE_MB = 20;

export async function guardarMidia(arquivo: File) {
  if (arquivo.size > LIMITE_MB * 1024 * 1024) throw new Error(`O arquivo passa de ${LIMITE_MB} MB.`);
  const chave = crypto.randomUUID().replace(/-/g, '');
  const mime = arquivo.type || 'application/octet-stream';
  await env.MIDIA.put(chave, await arquivo.arrayBuffer(), { metadata: { mime, nome: arquivo.name } });
  return { chave, mime, nome: arquivo.name };
}

export async function apagarMidia(chave: string | null | undefined) {
  if (chave) await env.MIDIA.delete(chave);
}

/** Lê um arquivo gerado no build (ex.: /dados/fotos.json). Em produção vem dos assets; no computador, do servidor de dev. */
export async function lerAsset<T>(base: URL, caminho: string): Promise<T> {
  const url = new URL(caminho, base);
  let r = await env.ASSETS.fetch(url).catch(() => null);
  if ((!r || !r.ok) && import.meta.env.DEV) r = await fetch(url);
  if (!r || !r.ok) throw new Error(`Não encontrei ${caminho} (status ${r?.status}).`);
  return r.json() as Promise<T>;
}
