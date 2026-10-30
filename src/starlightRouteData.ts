import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

// On this page appears only when it lists at least two entries. Starlight
// always adds "Overview" for the page title, so a page without headings
// would show a list of one. Dropping the table of contents here removes it
// on wide screens and the menu on small ones, and the page loses its
// data-has-toc attribute, so the layout closes the column.
const countEntries = (items: { children: unknown[] }[]): number =>
	items.reduce((total, item) => total + 1 + countEntries(item.children as { children: unknown[] }[]), 0);

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	if (route.toc && countEntries(route.toc.items) < 2) {
		route.toc = undefined;
	}
});
