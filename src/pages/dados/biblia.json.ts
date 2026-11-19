// Bíblia completa para a busca do site (já com as correções do painel).
import { bibliaCompleta } from '../../lib/biblia';
export const GET = () => new Response(JSON.stringify(bibliaCompleta), { headers: { 'Content-Type': 'application/json' } });
