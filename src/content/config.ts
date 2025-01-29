import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = {
  'docs': docs,
};
