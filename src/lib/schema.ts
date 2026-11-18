// Dados estruturados (Schema.org / JSON-LD) para Google, Bing e IAs.
import { SITE, enderecoCompleto, mapsLink } from '../config/site';

const DIAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ID_IGREJA = `${SITE.url}/#igreja`;

export function schemaIgreja(logoUrl: string, imagemUrl: string) {
  const redes = Object.entries(SITE.redes)
    .filter(([k, v]) => v && k !== 'whatsapp')
    .map(([, v]) => v);
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': ID_IGREJA,
    name: SITE.nome,
    alternateName: [SITE.nomeCompleto, SITE.sigla, 'MART São Caetano do Sul'],
    description: SITE.descricao,
    url: SITE.url + '/',
    logo: logoUrl,
    image: imagemUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.endereco.rua,
      addressLocality: SITE.endereco.cidade,
      addressRegion: SITE.endereco.uf,
      postalCode: SITE.endereco.cep,
      addressCountry: SITE.endereco.pais,
    },
    hasMap: mapsLink,
    areaServed: ['São Caetano do Sul', 'Santo André', 'São Bernardo do Campo', 'São Paulo', 'Grande ABC'],
    sameAs: redes,
    openingHoursSpecification: SITE.cultos.map((c) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DIAS[c.dia]}`,
      opens: c.inicio,
      closes: c.fim,
      description: c.nome,
    })),
    event: SITE.cultos.map((c) => ({
      '@type': 'Event',
      name: `${c.nome} – ${SITE.nome}`,
      description: c.descricao,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@id': ID_IGREJA },
      organizer: { '@id': ID_IGREJA },
      isAccessibleForFree: true,
      eventSchedule: {
        '@type': 'Schedule',
        repeatFrequency: 'P1W',
        byDay: `https://schema.org/${DIAS[c.dia]}`,
        startTime: c.inicio,
        endTime: c.fim,
        scheduleTimezone: 'America/Sao_Paulo',
      },
    })),
    knowsLanguage: 'pt-BR',
  };
}

export function schemaSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#site`,
    name: SITE.nome,
    url: SITE.url + '/',
    inLanguage: 'pt-BR',
    publisher: { '@id': ID_IGREJA },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/biblia/?q={termo}` },
      'query-input': 'required name=termo',
    },
  };
}

export function schemaMigalhas(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ nome: 'Início', url: '/' }, ...itens].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: SITE.url + it.url,
    })),
  };
}

export function schemaFaq(perguntas: { p: string; r: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map(({ p, r }) => ({
      '@type': 'Question',
      name: p,
      acceptedAnswer: { '@type': 'Answer', text: r },
    })),
  };
}

export function schemaArtigo(a: { titulo: string; descricao: string; url: string; data: Date; autor: string; imagem?: string; tipo?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': a.tipo ?? 'BlogPosting',
    headline: a.titulo,
    description: a.descricao,
    url: SITE.url + a.url,
    mainEntityOfPage: SITE.url + a.url,
    datePublished: a.data.toISOString(),
    dateModified: a.data.toISOString(),
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: a.autor, url: SITE.url + '/' },
    publisher: { '@id': ID_IGREJA },
    ...(a.imagem ? { image: a.imagem } : {}),
  };
}

export { enderecoCompleto };
