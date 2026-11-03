// The archived versions (starlight-versions slugs). Their pages are noindex,
// left out of the Pagefind index and filtered out of the sitemap.
export const archivedVersionSlugs = ['v1', 'v1-1-0', 'v1-2-0'];

const archivedSegment = new RegExp(`(^|/)(${archivedVersionSlugs.join('|')})(/|$)`);

// True for an entry id (v1/faq, de/v1-1-0/faq), a path or a full URL in an archive.
export const isArchived = (idOrPath) => archivedSegment.test(idOrPath);
