// Recebe as visitas do site (src/scripts/estatisticas.ts) e grava no banco.
import type { APIRoute } from 'astro';
import { executar, utcParaBr } from '../../lib/admin/db';

export const prerender = false;

const ROBO = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios/i;

/** De onde veio a visita: utm, navegador dentro de app ou site que mandou o link. */
export function origemDaVisita(utm: string, referencia: string, ua: string, host: string) {
  const u = utm.toLowerCase().trim();
  if (u) {
    if (/whats|wa\b|zap/.test(u)) return 'WhatsApp';
    if (/insta|ig\b/.test(u)) return 'Instagram';
    if (/face|fb\b/.test(u)) return 'Facebook';
    if (/google/.test(u)) return 'Google';
    if (/you/.test(u)) return 'YouTube';
    return u.slice(0, 30);
  }
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (!referencia) return 'Direto';
  let h = '';
  try { h = new URL(referencia).hostname.replace(/^www\./, ''); } catch { return 'Direto'; }
  if (h === host) return 'Interno';
  if (/google\./.test(h)) return 'Google';
  if (/bing\.|duckduckgo|yahoo|ecosia|brave/.test(h)) return 'Outros buscadores';
  if (/instagram/.test(h)) return 'Instagram';
  if (/facebook|fb\.com|fb\.me/.test(h)) return 'Facebook';
  if (/whatsapp|wa\.me|wl\.co/.test(h)) return 'WhatsApp';
  if (/youtube|youtu\.be/.test(h)) return 'YouTube';
  if (/t\.co|twitter|x\.com/.test(h)) return 'X (Twitter)';
  if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(h)) return 'IAs (ChatGPT etc.)';
  return h.slice(0, 40);
}

export const POST: APIRoute = async ({ request, url }) => {
  const ua = request.headers.get('user-agent') ?? '';
  if (ROBO.test(ua)) return new Response(null, { status: 204 });
  let d: { t?: string; c?: string; v?: string; n?: number; r?: string; u?: string };
  try { d = JSON.parse(await request.text()); } catch { return new Response(null, { status: 400 }); }
  const caminho = String(d.c ?? '').slice(0, 200);
  if (!caminho || caminho.startsWith('/admin') || caminho.startsWith('/api')) return new Response(null, { status: 204 });

  const tipo = d.t === 'story' ? 'story' : 'pagina';
  const visitante = /^[0-9a-f-]{36}$/i.test(d.v ?? '') ? d.v! : null;
  const cf = (request as Request & { cf?: { country?: string; city?: string } }).cf;
  const dispositivo = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Celular' : 'Computador';
  const origem = tipo === 'story' ? null : origemDaVisita(String(d.u ?? ''), String(d.r ?? ''), ua, url.hostname);

  await executar(
    'INSERT INTO visitas (dia, caminho, tipo, visitante, novo, origem, referencia, pais, cidade, dispositivo) VALUES (?,?,?,?,?,?,?,?,?,?)',
    utcParaBr(new Date().toISOString()).slice(0, 10), caminho, tipo, visitante, d.n ? 1 : 0, origem,
    String(d.r ?? '').slice(0, 200) || null, cf?.country ?? null, cf?.city ?? null, dispositivo,
  );
  return new Response(null, { status: 204 });
};
