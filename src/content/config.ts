import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number(),
    stack: z.array(z.string()).optional(),
    summary: z.string(),
    thumb: z.string().optional(),
    repo: z.string().url().optional(),
    live: z.string().optional(),
    order: z.number().default(0)
  })
});

export const collections = { projects };


