import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { isArchived } from './archives.mjs';

// On this page appears on every page, even one without headings (it then
// lists only "Overview"), so every page has the same sheet: table of
// contents and content side by side.
export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const id = route.entry?.id ?? '';
	const path = context.url.pathname;
	if (isArchived(id) || isArchived(path)) {
		route.entry.data.pagefind = false;
		route.head.push({
			tag: 'meta',
			attrs: { name: 'robots', content: 'noindex' },
		});
	}
});
