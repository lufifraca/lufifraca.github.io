import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number(),
    stack: z.array(z.string()),
    role: z.array(z.string()),
    repo: z.string().url().optional(),
    live: z.string().optional(),
    summary: z.string(),
    thumb: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0)
  })
});

export const collections = { projects };
