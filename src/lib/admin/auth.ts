// Senhas do painel: PBKDF2-SHA256 (WebCrypto), guardadas como "iteracoes:sal:hash" em base64.
const ITERACOES = 100_000;
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derivar(senha: string, sal: Uint8Array, iteracoes: number) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, 256);
}

export async function gerarHash(senha: string) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `${ITERACOES}:${b64(sal)}:${b64(await derivar(senha, sal, ITERACOES))}`;
}

export async function conferirSenha(senha: string, guardado: string) {
  const [it, sal, hash] = guardado.split(':');
  const calc = b64(await derivar(senha, deB64(sal), Number(it)));
  // comparação em tempo constante
  if (calc.length !== hash.length) return false;
  let dif = 0;
  for (let i = 0; i < calc.length; i++) dif |= calc.charCodeAt(i) ^ hash.charCodeAt(i);
  return dif === 0;
}

export type UsuarioSessao = { id: number; nome: string; email: string };
