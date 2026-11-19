// Ponto de entrada do Worker: o site (Astro) e o agendador de mensagens do WhatsApp.
import { handle } from '@astrojs/cloudflare/handler';
import { processarFila } from './lib/admin/fila';

export default {
  fetch: handle,
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil(processarFila(env));
  },
} satisfies ExportedHandler<Env>;
