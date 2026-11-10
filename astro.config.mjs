// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// Project write-ups share one shape: the first `##` section (the overview) is
// always visible, and every later `##` section becomes a collapsible
// <details> block. Applied only to files in src/content/projects.
function foldProjectSections() {
	const el = (tagName, className, children) => ({
		type: 'element',
		tagName,
		properties: className ? { className: [className] } : {},
		children,
	});
	return (tree, file) => {
		if (!String(file?.path ?? '').includes('content/projects')) return;
		const out = [];
		let section = null;
		let seen = 0;
		for (const node of tree.children) {
			if (node.type === 'element' && node.tagName === 'h2') {
				seen += 1;
				section =
					seen === 1
						? el('section', 'overview', [el('p', 'sheet__label', node.children)])
						: el('details', 'fold', [
								el('summary', 'fold__title', node.children),
								el('div', 'fold__body', []),
							]);
				out.push(section);
			} else if (section) {
				(section.tagName === 'details' ? section.children[1] : section).children.push(node);
			} else {
				out.push(node);
			}
		}
		tree.children = out;
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://lufifraca.github.io',
	integrations: [mdx(), sitemap(), react()],
	markdown: { rehypePlugins: [foldProjectSections] },
	// The old studio/arcade split is now one side-quests page.
	redirects: {
		'/studio': '/side-quests',
		'/arcade': '/side-quests',
	},
});
