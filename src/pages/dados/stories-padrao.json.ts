// Stories padrão (gerados no build), usados pelo painel para importar.
import { storiesPadrao } from '../../lib/stories-padrao';
export const GET = async () => Response.json(await storiesPadrao());
