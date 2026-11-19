// Estatísticas de visitas (sem cookies): conta páginas vistas, visitantes únicos e origem da visita.
// O visitante é um número aleatório guardado só neste navegador (não identifica a pessoa).

function visitante() {
  try {
    let id = localStorage.getItem('mart_vid');
    const novo = !id;
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('mart_vid', id); }
    return { id, novo };
  } catch {
    return { id: '', novo: false };
  }
}

export function registrar(tipo: 'pagina' | 'story' = 'pagina', caminho = location.pathname) {
  if (location.pathname.startsWith('/admin') || location.hostname === 'localhost' && !location.search.includes('estatisticas')) return;
  const v = visitante();
  const p = new URLSearchParams(location.search);
  const dados = JSON.stringify({
    t: tipo, c: caminho, v: v.id, n: v.novo ? 1 : 0,
    r: tipo === 'pagina' ? document.referrer : '',
    u: p.get('utm_source') ?? p.get('ref') ?? '',
  });
  try {
    if (!navigator.sendBeacon?.('/api/v/', dados)) fetch('/api/v/', { method: 'POST', body: dados, keepalive: true });
  } catch { /* sem estatística, tudo bem */ }
}
