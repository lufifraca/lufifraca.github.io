import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});

// collections export moved to include projects below
// Add a projects collection for portfolio items
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
    order: z.number().default(0),
  }),
});

export const collections = { blog, projects };
