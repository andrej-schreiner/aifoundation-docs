import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const includeDesignSystem = process.env.AIFS_PREVIEW_DESIGN_SYSTEM === '1';
const baseSchema = docsSchema();

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: (context) => {
			const schema = baseSchema(context);
			if (!includeDesignSystem) return schema;
			return schema.transform((data) => (data.draft ? { ...data, draft: false } : data));
		},
	}),
};
