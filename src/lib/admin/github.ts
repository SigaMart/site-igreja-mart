// Salva arquivos do site no GitHub (devocionais, blog, correções da Bíblia).
// Cada gravação vira um commit, e a Cloudflare publica o site de novo sozinha (~2 min).
import { lerConfig } from './db';

const API = 'https://api.github.com';

async function cfg() {
  const token = await lerConfig('github_token');
  if (!token) throw new Error('Configure o token do GitHub em Configurações → Publicação do site.');
  return { token, repo: await lerConfig('github_repo', 'SigaMart/site-igreja-mart'), branch: await lerConfig('github_branch', 'main') };
}

async function gh(metodo: string, caminho: string, corpo?: unknown) {
  const { token, repo } = await cfg();
  const r = await fetch(`${API}/repos/${repo}/contents/${caminho.split('/').map(encodeURIComponent).join('/')}${metodo === 'GET' ? `?ref=${encodeURIComponent((await cfg()).branch)}` : ''}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'painel-igreja',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.status === 404 && metodo === 'GET') return null;
  const json = await r.json().catch(() => ({})) as { message?: string };
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${json.message ?? 'erro'}`);
  return json as any;
}

// base64 <-> bytes/texto (UTF-8)
export function bytesParaB64(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
const b64ParaTexto = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));

export async function listar(pasta: string): Promise<{ name: string; path: string; sha: string }[]> {
  const r = await gh('GET', pasta);
  return Array.isArray(r) ? r.filter((x: { type: string }) => x.type === 'file') : [];
}

export async function ler(caminho: string): Promise<{ texto: string; sha: string } | null> {
  const r = await gh('GET', caminho);
  return r ? { texto: b64ParaTexto(r.content), sha: r.sha } : null;
}

export async function gravar(caminho: string, conteudo: string | Uint8Array, mensagem: string, sha?: string) {
  const { branch } = await cfg();
  const bytes = typeof conteudo === 'string' ? new TextEncoder().encode(conteudo) : conteudo;
  if (!sha) sha = (await gh('GET', caminho))?.sha;
  return gh('PUT', caminho, { message: mensagem, content: bytesParaB64(bytes), branch, ...(sha ? { sha } : {}) });
}

export async function apagar(caminho: string, mensagem: string) {
  const { branch } = await cfg();
  const atual = await gh('GET', caminho);
  if (atual) await gh('DELETE', caminho, { message: mensagem, sha: atual.sha, branch });
}

// ---------- Markdown com front matter simples (chave: valor)
export function lerMarkdown(texto: string) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const dados: Record<string, string> = {};
  if (!m) return { dados, corpo: texto };
  for (const linha of m[1].split(/\r?\n/)) {
    const i = linha.indexOf(':');
    if (i < 1) continue;
    let v = linha.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
    else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1).replace(/''/g, "'");
    dados[linha.slice(0, i).trim()] = v;
  }
  return { dados, corpo: m[2].replace(/^\r?\n/, '') };
}

export function montarMarkdown(dados: Record<string, string | boolean | undefined>, corpo: string) {
  const linhas = Object.entries(dados)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'boolean' || /^\d{4}-\d{2}-\d{2}$/.test(v as string) || (k === 'imagem') ? v : JSON.stringify(v)}`);
  return `---\n${linhas.join('\n')}\n---\n\n${corpo.trim()}\n`;
}

/** "Fé no meio da tempestade!" -> "fe-no-meio-da-tempestade" */
export const slugificar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
