// Galeria de fotos do site (otimizadas no build) para escolher no painel (stories).
import { getImage } from 'astro:assets';

const arquivos = import.meta.glob<{ default: ImageMetadata }>('../../assets/fotos/**/*.{jpg,jpeg,png,webp}', { eager: true });

export const GET = async () => {
  const fotos = await Promise.all(Object.entries(arquivos).map(async ([caminho, m]) => ({
    nome: caminho.split('/fotos/')[1],
    foto: (await getImage({ src: m.default, width: 1080, format: 'webp', quality: 78 })).src,
    mini: (await getImage({ src: m.default, width: 200, height: 200, fit: 'cover', format: 'webp' })).src,
  })));
  return Response.json(fotos);
};
