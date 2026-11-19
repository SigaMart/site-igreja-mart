// Conexão com o WhatsApp por Evolution API (v2) ou GoWA (go-whatsapp-web-multidevice).
// Cada canal guarda: provedor, url do servidor, apikey (Evolution) ou usuário/senha (GoWA) e a instância.
//
// Evolution API v2 (cabeçalho apikey)
//   POST   /instance/create                      cria a instância (canal)
//   GET    /instance/connect/{instancia}         QR code (base64) e código de pareamento
//   GET    /instance/connectionState/{instancia} status: open | connecting | close
//   DELETE /instance/logout/{instancia}          desconecta o número
//   GET    /group/fetchAllGroups/{instancia}     grupos do número
//   POST   /message/sendText/{instancia}         texto
//   POST   /message/sendMedia/{instancia}        imagem, vídeo e documento (URL)
//   POST   /message/sendWhatsAppAudio/{instancia} áudio de voz (URL)
//
// GoWA (autenticação básica; com vários números, cabeçalho X-Device-Id = instância)
//   GET  /app/login        QR code (qr_link)
//   GET  /app/devices      números conectados
//   GET  /app/logout       desconecta
//   GET  /user/my/groups   grupos
//   POST /send/message     texto
//   POST /send/image | /send/video | /send/audio | /send/file   mídia (URL)

export type Canal = {
  id: number; nome: string; provedor: 'evolution' | 'gowa'; url: string;
  apikey: string | null; instancia: string | null; usuario: string | null; senha: string | null;
};
export type Midia = { tipo: 'imagem' | 'video' | 'audio' | 'documento'; url: string; mime: string; nome: string };
export type Status = { conectado: boolean; estado: string; detalhe?: string };

const base = (c: Canal) => c.url.replace(/\/+$/, '');
const TEMPO = 25_000;

async function chamar(c: Canal, metodo: string, caminho: string, corpo?: unknown) {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) h['Content-Type'] = 'application/json';
  if (c.provedor === 'evolution') h.apikey = c.apikey ?? '';
  else {
    if (c.usuario) h.Authorization = 'Basic ' + btoa(`${c.usuario}:${c.senha ?? ''}`);
    if (c.instancia) h['X-Device-Id'] = c.instancia;
  }
  const r = await fetch(base(c) + caminho, {
    method: metodo, headers: h, body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(TEMPO),
  });
  const texto = await r.text();
  let json: any = null;
  try { json = JSON.parse(texto); } catch { /* resposta sem JSON */ }
  if (!r.ok) {
    const msg = json?.response?.message ?? json?.message ?? json?.error ?? texto.slice(0, 200);
    throw new Error(`${r.status}: ${Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
  return json;
}

const inst = (c: Canal) => encodeURIComponent(c.instancia ?? '');

/** Número no formato do provedor (grupos já vêm com @g.us). */
function destino(c: Canal, d: string) {
  if (d.includes('@')) return d;
  return c.provedor === 'gowa' ? `${d}@s.whatsapp.net` : d;
}

export async function criarInstancia(c: Canal) {
  if (c.provedor !== 'evolution') return;
  try {
    await chamar(c, 'POST', '/instance/create', { instanceName: c.instancia, qrcode: true, integration: 'WHATSAPP-BAILEYS' });
  } catch (e) {
    // Já existe: tudo bem
    if (!/already|in use|existe|403|409/i.test(String(e))) throw e;
  }
}

export async function status(c: Canal): Promise<Status> {
  if (c.provedor === 'evolution') {
    const r = await chamar(c, 'GET', `/instance/connectionState/${inst(c)}`);
    const estado = r?.instance?.state ?? r?.state ?? 'desconhecido';
    return { conectado: estado === 'open', estado };
  }
  const r = await chamar(c, 'GET', '/app/devices');
  const lista = r?.results ?? [];
  const conectado = Array.isArray(lista) && lista.length > 0;
  return { conectado, estado: conectado ? 'open' : 'close', detalhe: conectado ? lista.map((d: any) => d.device ?? d.name).join(', ') : undefined };
}

/** QR code para conectar: devolve uma imagem (data URL ou link) e, se houver, o código de pareamento. */
export async function conectar(c: Canal): Promise<{ qr?: string; codigo?: string; mensagem?: string }> {
  if (c.provedor === 'evolution') {
    await criarInstancia(c);
    const r = await chamar(c, 'GET', `/instance/connect/${inst(c)}`);
    if (r?.instance?.state === 'open') return { mensagem: 'Este número já está conectado.' };
    const qr = r?.base64 ?? r?.qrcode?.base64;
    return { qr, codigo: r?.pairingCode ?? undefined };
  }
  const r = await chamar(c, 'GET', '/app/login');
  const link: string | undefined = r?.results?.qr_link;
  if (!link) return { mensagem: r?.message ?? 'Sem QR code (o número pode já estar conectado).' };
  // O link do QR aponta para o servidor da GoWA, que pode exigir login: baixa e devolve como imagem.
  try {
    const h: Record<string, string> = {};
    if (c.usuario) h.Authorization = 'Basic ' + btoa(`${c.usuario}:${c.senha ?? ''}`);
    const img = await fetch(link, { headers: h, signal: AbortSignal.timeout(TEMPO) });
    const buf = new Uint8Array(await img.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { qr: `data:${img.headers.get('content-type') ?? 'image/png'};base64,${btoa(bin)}` };
  } catch {
    return { qr: link };
  }
}

export async function desconectar(c: Canal) {
  if (c.provedor === 'evolution') await chamar(c, 'DELETE', `/instance/logout/${inst(c)}`);
  else await chamar(c, 'GET', '/app/logout');
}

export async function grupos(c: Canal): Promise<{ id: string; nome: string }[]> {
  if (c.provedor === 'evolution') {
    const r = await chamar(c, 'GET', `/group/fetchAllGroups/${inst(c)}?getParticipants=false`);
    return (Array.isArray(r) ? r : []).map((g: any) => ({ id: g.id, nome: g.subject ?? g.id }));
  }
  const r = await chamar(c, 'GET', '/user/my/groups');
  const lista = r?.results?.data ?? r?.results ?? [];
  return (Array.isArray(lista) ? lista : []).map((g: any) => ({ id: g.JID ?? g.jid ?? g.id, nome: g.Name ?? g.name ?? g.JID }));
}

/** Envia uma mensagem (texto e/ou uma mídia) para um número ou grupo. */
export async function enviar(c: Canal, para: string, texto: string, midia?: Midia | null) {
  const d = destino(c, para);
  if (c.provedor === 'evolution') {
    const i = inst(c);
    if (!midia) return chamar(c, 'POST', `/message/sendText/${i}`, { number: d, text: texto });
    if (midia.tipo === 'audio') {
      await chamar(c, 'POST', `/message/sendWhatsAppAudio/${i}`, { number: d, audio: midia.url });
      // Áudio não tem legenda: o texto vai em seguida
      if (texto.trim()) await chamar(c, 'POST', `/message/sendText/${i}`, { number: d, text: texto });
      return;
    }
    const mediatype = midia.tipo === 'imagem' ? 'image' : midia.tipo === 'video' ? 'video' : 'document';
    return chamar(c, 'POST', `/message/sendMedia/${i}`, { number: d, mediatype, mimetype: midia.mime, caption: texto, media: midia.url, fileName: midia.nome });
  }
  // GoWA
  if (!midia) return chamar(c, 'POST', '/send/message', { phone: d, message: texto });
  const rota = { imagem: 'image', video: 'video', audio: 'audio', documento: 'file' }[midia.tipo];
  const campo = { imagem: 'image_url', video: 'video_url', audio: 'audio_url', documento: 'file_url' }[midia.tipo];
  await chamar(c, 'POST', `/send/${rota}`, { phone: d, caption: texto, [campo]: midia.url });
  if (midia.tipo === 'audio' && texto.trim()) await chamar(c, 'POST', '/send/message', { phone: d, message: texto });
}

/** Tipo de mídia a partir do mime. */
export function tipoDaMidia(mime: string): Midia['tipo'] {
  if (mime.startsWith('image/')) return 'imagem';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'documento';
}
