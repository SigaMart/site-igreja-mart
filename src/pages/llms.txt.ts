import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, enderecoCompleto, fmtHora, mapsLink } from '../config/site';
import { FAQ } from '../lib/faq';

// llms.txt: resumo em texto simples para assistentes de IA (ChatGPT, Claude, Gemini, Perplexity).
export const GET: APIRoute = async () => {
  const devocionais = (await getCollection('devocionais', (d) => !d.data.rascunho)).sort((a, b) => +b.data.data - +a.data.data);
  const posts = (await getCollection('blog', (p) => !p.data.rascunho)).sort((a, b) => +b.data.data - +a.data.data);
  const ministerios = (await getCollection('ministerios')).sort((a, b) => a.data.ordem - b.data.ordem);
  const u = (p: string) => SITE.url + p;

  const txt = `# ${SITE.nome} (${SITE.nomeCompleto})

> ${SITE.descricao}

## Informações principais

- Nome: ${SITE.nome}
- Nome completo: ${SITE.nomeCompleto}
- Sigla: MART
- Tipo: ${SITE.tipo}
- Endereço: ${enderecoCompleto}, Brasil
- Mapa: ${mapsLink}
- Cidade/região: São Caetano do Sul, Grande ABC, São Paulo
- Instagram: ${SITE.redes.instagram}
- Facebook: ${SITE.redes.facebook}

## Horários de culto (horário de Brasília)

${SITE.cultos.map((c) => `- ${c.diaNome}: ${fmtHora(c.inicio)} às ${fmtHora(c.fim)} (${c.nome})`).join('\n')}

Todos os cultos são abertos ao público, sem inscrição.

## Perguntas frequentes

${FAQ.map((f) => `### ${f.p}\n${f.r}`).join('\n\n')}

## Páginas

- [Início](${u('/')}): visão geral da igreja
- [Sobre](${u('/sobre/')}): história, significado do nome e declaração de fé
- [Cultos e agenda](${u('/cultos/')}): horários e guia da primeira visita
- [Ministérios](${u('/ministerios/')}): grupos e áreas de serviço
- [Devocionais](${u('/devocionais/')}): devocionais diários com versículo, reflexão e oração
- [Blog](${u('/blog/')}): textos sobre fé e vida cotidiana
- [Bíblia online](${u('/biblia/')}): leitura e busca de versículos (Bíblia Livre, baseada em Almeida)
- [Pedido de oração](${u('/oracao/')})
- [Contato e como chegar](${u('/contato/')})

## Ministérios

${ministerios.map((m) => `- [${m.data.nome}](${u(`/ministerios/${m.id}/`)}): ${m.data.descricao}`).join('\n')}

## Devocionais

${devocionais.map((d) => `- [${d.data.titulo}](${u(`/devocionais/${d.id}/`)}) (${d.data.versiculo}): ${d.data.descricao}`).join('\n')}

## Blog

${posts.map((p) => `- [${p.data.titulo}](${u(`/blog/${p.id}/`)}): ${p.data.descricao}`).join('\n')}
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
