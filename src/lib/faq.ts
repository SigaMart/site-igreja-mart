// Perguntas frequentes: aparecem no site e viram dados estruturados (FAQPage).
// Respostas diretas ajudam Google e IAs (ChatGPT, Gemini, Perplexity) a citar a igreja.
import { SITE, enderecoCompleto } from '../config/site';

const horarios = SITE.cultos.map((c) => `${c.diaNome.toLowerCase()} das ${c.inicio.replace(':00', 'h').replace(':', 'h')} às ${c.fim.replace(':00', 'h').replace(':', 'h')}`).join('; ');

export const FAQ = [
  {
    p: 'Onde fica a Igreja MART?',
    r: `A Igreja MART (Ministério Apostólico Restauração do Templo) fica na ${enderecoCompleto}, no bairro Fundação, em São Caetano do Sul, no Grande ABC paulista.`,
  },
  {
    p: 'Quais são os horários de culto da Igreja MART?',
    r: `Os cultos acontecem ${horarios}. Todos são abertos ao público e não é preciso se inscrever.`,
  },
  {
    p: 'O que significa MART?',
    r: 'MART é a sigla de Ministério Apostólico Restauração do Templo.',
  },
  {
    p: 'Preciso ser de alguma igreja para participar?',
    r: 'Não. A Igreja MART recebe todo mundo: quem já frequenta uma igreja, quem está afastado há anos e quem só está curioso. Você pode vir aos cultos sem compromisso e participar no seu tempo.',
  },
  {
    p: 'Posso visitar a igreja pela primeira vez? Preciso de algo?',
    r: 'Pode, e será muito bem-vindo. Não é preciso agendar nem usar roupa especial. Basta chegar alguns minutos antes do culto; nossa recepção vai te receber.',
  },
  {
    p: 'Tem atividade para crianças?',
    r: 'Sim. O MART Kids é o ministério infantil da igreja, com ensino bíblico e atividades para as crianças enquanto os pais participam do culto.',
  },
  {
    p: 'Como enviar um pedido de oração?',
    r: `Você pode enviar seu pedido pela página de pedido de oração do site (${SITE.url}/oracao/) ou pelo Instagram ${SITE.instagramUsuario}. A equipe de intercessão ora por todos os pedidos com sigilo.`,
  },
];
