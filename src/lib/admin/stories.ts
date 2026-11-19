/** Apaga o cache de /api/stories/ para as mudanças aparecerem na hora. */
export async function limparCacheStories(url: URL) {
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  await cache?.delete(new Request(new URL('/api/stories/', url).href));
}
