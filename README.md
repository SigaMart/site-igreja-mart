# Site da Igreja MART

Site institucional da **Igreja MART (Ministério Apostólico Restauração do Templo)**, em São Caetano do Sul.
Feito com [Astro](https://astro.build) e preparado para publicar na **Cloudflare**.

## Como rodar no computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install      # só na primeira vez (ou quando mudar de computador)
npm run dev      # abre o site em http://localhost:4321
```

Para gerar a versão final (pasta `dist/`): `npm run build`.

## Onde editar cada coisa

| O que | Onde |
|---|---|
| Nome, endereço, redes sociais, **horários dos cultos**, WhatsApp | `src/config/site.ts` |
| Perguntas frequentes (aparecem no site, no Google e para as IAs) | `src/lib/faq.ts` |
| Lista de versículos da **Palavra do dia** | `src/lib/palavra.ts` |
| **Devocionais** (um arquivo por devocional) | `src/content/devocionais/` |
| **Blog** (um arquivo por texto) | `src/content/blog/` |
| **Ministérios** (um arquivo por ministério) | `src/content/ministerios/` |
| Fotos | `src/assets/fotos/` |
| Cores e fontes | `src/styles/global.css` |

### Criar um devocional novo

Copie um arquivo de `src/content/devocionais/`, renomeie (o nome do arquivo vira o endereço da página)
e troque o texto. O versículo é buscado automaticamente na Bíblia pelo campo `versiculo`
(ex.: `Salmos 23:1-3`). Use `rascunho: true` para esconder enquanto escreve.

## Bíblia

O texto é da **Bíblia Livre** (atualização da tradução de João Ferreira de Almeida),
licença Creative Commons BY 4.0 (exige os créditos, que aparecem nas páginas da Bíblia).
Arquivo original em `dados/biblia-livre.txt`; para regenerar: `npm run biblia`.
Correções feitas pelo painel ficam em `src/data/biblia-correcoes.json` e valem para o site inteiro.

## Publicação

- Código no GitHub (conta **SigaMart**).
- Site na **Cloudflare Workers** (conta da igreja). Configuração em `wrangler.jsonc`.
- A cada envio (`git push`) para o GitHub, a Cloudflare gera o site (`npm run build`) e publica sozinha.

## Painel administrativo (/admin)

Em `/admin/` a equipe gerencia o site sem mexer em código:

| Área | O que faz | Onde fica salvo |
|---|---|---|
| Calendário | Vários calendários de conteúdo (WhatsApp, Instagram, Dia a Dia…) e lembretes por WhatsApp | Banco D1 |
| WhatsApp | Mensagens para grupos ou contatos (texto formatado, imagem, vídeo, áudio, arquivo), agora ou agendadas | Banco D1 + mídias no KV |
| Contatos | Pessoas, etiquetas e importação em lote | Banco D1 |
| Pedidos de oração | Pedidos enviados pelo site | Banco D1 |
| Stories | Web Stories do site (aparecem na hora) | Banco D1 |
| Devocionais e Blog | Textos do site | GitHub (o site atualiza em ~2 min) |
| Bíblia | Correção de versículos | `src/data/biblia-correcoes.json` no GitHub |
| Configurações | Números de WhatsApp (Evolution API ou GoWA), token do GitHub, usuários | Banco D1 |

**Primeiro acesso:** na Cloudflare, em Workers → igreja-mart → Settings → Variables and Secrets,
crie o segredo `ADMIN_CODIGO` com um código qualquer. Ele é pedido só para criar o primeiro usuário.

**Envios de WhatsApp:** o agendador roda a cada minuto e envia aos poucos, com intervalo entre
as mensagens, para proteger o número contra bloqueio. As integrações ficam em `src/lib/admin/whatsapp.ts`.

**No computador:** crie um arquivo `.dev.vars` com `ADMIN_CODIGO=um-codigo` e rode `npm run dev`.
As tabelas do banco são criadas sozinhas no primeiro acesso (`src/lib/admin/db.ts`).

## SEO e IAs (GEO)

- Dados estruturados (Schema.org): igreja, horários, eventos, perguntas, artigos e navegação
- `sitemap-index.xml`, `robots.txt` (libera buscadores e IAs), `rss.xml`
- `llms.txt`: resumo em texto para assistentes de IA
- Uma página para cada capítulo da Bíblia (1.189 páginas)

## Próximos passos

- [x] GitHub e publicação na Cloudflare
- [ ] Apontar o domínio igrejamart.com.br
- [x] Pedido de oração gravado no banco
- [x] Painel administrativo
