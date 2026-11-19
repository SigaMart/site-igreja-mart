// Ponto de entrada do Worker: o site (Astro) e o agendador (mensagens do WhatsApp e publicações agendadas).
import { handle } from '@astrojs/cloudflare/handler';
import { processarFila } from './lib/admin/fila';
import { publicarAgendados } from './lib/admin/publicacoes';

export default {
  fetch: handle,
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil(processarFila(env));
    ctx.waitUntil(publicarAgendados().catch((e) => console.error('publicação agendada', e)));
  },
} satisfies ExportedHandler<Env>;
