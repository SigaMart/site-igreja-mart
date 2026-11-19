// Stories padrão do site (usados quando o painel ainda não tem stories cadastrados).
import { getImage } from 'astro:assets';
import { SITE, fmtHora, mapsLink } from '../config/site';
import { passagem } from './biblia';
import type { Story } from '../scripts/stories/tipos';

import adoracao from '../assets/fotos/mart/adoracao.jpg';
import reunidos from '../assets/fotos/mart/reunidos.jpg';
import congregacao from '../assets/fotos/mart/congregacao.jpg';
import louvor from '../assets/fotos/mart/louvor.jpg';
import cultoAtual from '../assets/fotos/mart/culto-atual.jpg';
import pregacao from '../assets/fotos/mart/pregacao.jpg';
import adoracao2 from '../assets/fotos/mart/adoracao2.jpg';
import natureza1 from '../assets/fotos/natureza/paisagem-1.jpg';
import natureza4 from '../assets/fotos/natureza/paisagem-4.jpg';
import natureza7 from '../assets/fotos/natureza/paisagem-7.jpg';

const foto = async (src: ImageMetadata) => (await getImage({ src, width: 1080, format: 'webp', quality: 78 })).src;
const capa = async (src: ImageMetadata) => (await getImage({ src, width: 200, height: 200, fit: 'cover', format: 'webp' })).src;

const verso = (ref: string, limpar?: RegExp) => {
  const p = passagem(ref);
  return { texto: limpar ? p.texto.replace(limpar, '') : p.texto, referencia: p.referencia };
};

const fotosCultos = [congregacao, louvor, cultoAtual];

let memoria: Promise<Story[]> | undefined;
export const storiesPadrao = () => (memoria ??= montar());

async function montar(): Promise<Story[]> {
  return [
  {
    id: 'boas-vindas',
    titulo: 'Boas-vindas',
    capa: await capa(adoracao),
    slides: [
      { foto: await foto(adoracao), eyebrow: 'Igreja MART', titulo: 'Que bom ter você aqui.', texto: 'Aqui ninguém precisa chegar pronto.' },
      { foto: await foto(reunidos), titulo: 'Você vai ser recebido pelo nome.', texto: 'Na porta sempre tem alguém esperando para te dar boas-vindas.' },
      {
        fundo: 'linear-gradient(160deg, #fff6ea 0%, #ffe2bd 100%)', cor: '#2a1d16', vpos: 'center',
        eyebrow: 'Neste domingo', titulo: 'Vem com a gente?', texto: `Culto da Família, às ${fmtHora(SITE.cultos[0].inicio)}. Pode chegar do jeito que você está.`,
        botao: { rotulo: 'Ver horários', href: '/cultos/' },
      },
    ],
  },
  {
    id: 'cultos',
    titulo: 'Nossos cultos',
    capa: await capa(congregacao),
    slides: [
      ...(await Promise.all(SITE.cultos.map(async (c, i) => ({
        foto: await foto(fotosCultos[i % fotosCultos.length]),
        escurecer: 45,
        eyebrow: c.diaNome,
        titulo: `${fmtHora(c.inicio)} às ${fmtHora(c.fim)}`,
        texto: `${c.nome}. ${c.descricao}`,
      })))),
      {
        fundo: 'linear-gradient(160deg, #ffb347 0%, #fb8300 55%, #c25a00 100%)', cor: '#2a1d16', vpos: 'center',
        eyebrow: 'Onde estamos', titulo: 'Bairro Fundação, São Caetano do Sul', texto: SITE.endereco.rua,
        botao: { rotulo: 'Como chegar', href: mapsLink },
      },
    ],
  },
  {
    id: 'palavra',
    titulo: 'Palavra',
    capa: await capa(natureza4),
    slides: [
      { foto: await foto(natureza1), escurecer: 40, vpos: 'center', alinhar: 'center', eyebrow: 'Ide e pregai', verso: verso('Marcos 16:15', /^E disse-lhes:\s*/), duracao: 8 },
      { foto: await foto(natureza4), escurecer: 40, vpos: 'center', alinhar: 'center', eyebrow: 'Promessa', verso: verso('2 Coríntios 1:20'), duracao: 8 },
      {
        foto: await foto(natureza7), escurecer: 40, vpos: 'center', alinhar: 'center', eyebrow: 'Em Cristo', verso: verso('João 15:5'), duracao: 8,
        botao: { rotulo: 'Ler os devocionais', href: '/devocionais/' },
      },
    ],
  },
  {
    id: 'oracao',
    titulo: 'Oração',
    capa: await capa(adoracao2),
    slides: [
      { foto: await foto(pregacao), escurecer: 45, titulo: 'Está passando por algo difícil?', texto: 'Você não precisa carregar isso sozinho.' },
      {
        foto: await foto(adoracao2), escurecer: 50, eyebrow: 'Pedido de oração', titulo: 'A gente ora por você.',
        texto: 'Conte o que está no seu coração. Ninguém vai te julgar.',
        botao: { rotulo: 'Pedir oração', href: '/oracao/' },
      },
    ],
  },
];
}
