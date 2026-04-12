import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projects collection — portfolio items for the Studio kanban and /arcade
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number(),
    stack: z.array(z.string()).optional(),
    summary: z.string(),
    thumb: z.string().optional(),
    video: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    repo: z.string().url().optional(),
    live: z.string().optional(),
    demo: z.string().url().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    // Which world the project belongs to:
    //   "product" → shows in the Studio Kanban on the homepage
    //   "game"    → shows in the Arcade level-select on /arcade
    kind: z.enum(["product", "game"]).default("product"),
    // Kanban column for product projects. Ignored for games.
    status: z.enum(["shipped", "in-flight", "on-deck"]).default("shipped"),
    // Short one-liner shown on the kanban card (falls back to summary).
    tagline: z.string().optional(),
  }),
});

export const collections = { projects };
