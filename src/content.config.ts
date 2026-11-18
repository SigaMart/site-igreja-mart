import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Devocionais: textos curtos para ler e compartilhar no WhatsApp
const devocionais = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/devocionais' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      descricao: z.string(),
      data: z.coerce.date(),
      versiculo: z.string(), // ex.: "Lamentações 3:22-23"
      autor: z.string().default('Equipe de Devocionais MART'),
      oracao: z.string(),
      pergunta: z.string(),
      imagem: image().optional(),
      rascunho: z.boolean().default(false),
    }),
});

// Blog: assuntos do cotidiano à luz da fé
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      descricao: z.string(),
      data: z.coerce.date(),
      autor: z.string().default('Igreja MART'),
      categoria: z.string(),
      imagem: image(),
      imagemAlt: z.string(),
      rascunho: z.boolean().default(false),
    }),
});

// Ministérios: uma página para cada
const ministerios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ministerios' }),
  schema: ({ image }) =>
    z.object({
      nome: z.string(),
      chamada: z.string(), // frase curta
      descricao: z.string(), // para SEO e cards
      publico: z.string(),
      versiculo: z.string(),
      atividades: z.array(z.string()),
      imagem: image(),
      imagemAlt: z.string(),
      ordem: z.number(),
    }),
});

export const collections = { devocionais, blog, ministerios };
