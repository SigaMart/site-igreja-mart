// Datas dos cultos e link para salvar no Google Agenda.
// Funciona no servidor (build) e no navegador.
import { SITE, enderecoCompleto } from '../config/site';

export type Culto = (typeof SITE.cultos)[number];

const DIAS_RRULE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Data/hora atual no fuso de Brasília (campos "de parede": ano, mês, dia, hora...) */
export function agoraSP(base = new Date()) {
  return new Date(base.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

const min = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

/**
 * Situação do culto em relação a agora: dias até a próxima vez (0 = hoje),
 * se está acontecendo e minutos até começar (para ordenar).
 */
export function situacao(c: Culto, base = new Date()) {
  const a = agoraSP(base);
  const agoraMin = a.getDay() * 1440 + a.getHours() * 60 + a.getMinutes();
  const ini = c.dia * 1440 + min(c.inicio);
  const fim = c.dia * 1440 + min(c.fim);
  const aoVivo = agoraMin >= ini && agoraMin < fim;
  const falta = aoVivo ? -1 : (ini - agoraMin + 10080) % 10080; // minutos até começar
  const dias = aoVivo ? 0 : Math.floor((a.getHours() * 60 + a.getMinutes() + falta) / 1440);
  return { aoVivo, falta, dias };
}

/** Texto curto: "Acontecendo agora", "Hoje", "Amanhã", "Em 3 dias" */
export function rotuloQuando(s: ReturnType<typeof situacao>) {
  if (s.aoVivo) return 'Acontecendo agora';
  if (s.dias === 0) return 'Hoje';
  if (s.dias === 1) return 'Amanhã';
  if (s.dias >= 7) return 'Semana que vem';
  return `Em ${s.dias} dias`;
}

/** Próxima data do culto como "AAAAMMDD" (horário de Brasília) */
function proximaData(c: Culto, base = new Date()) {
  const a = agoraSP(base);
  const s = situacao(c, base);
  const d = new Date(a.getFullYear(), a.getMonth(), a.getDate() + (s.aoVivo ? 0 : s.dias));
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
const hhmm = (h: string) => h.replace(':', '') + '00';

const detalhes = (c: Culto) => `${c.descricao}\n\nTodos são bem-vindos! Mais informações: ${SITE.url}/cultos/`;

/** Link do Google Agenda com repetição semanal */
export function linkGoogleAgenda(c: Culto, base = new Date()) {
  const dia = proximaData(c, base);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${c.nome} · ${SITE.nome}`,
    dates: `${dia}T${hhmm(c.inicio)}/${dia}T${hhmm(c.fim)}`,
    ctz: 'America/Sao_Paulo',
    details: detalhes(c),
    location: enderecoCompleto,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${DIAS_RRULE[c.dia]}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

