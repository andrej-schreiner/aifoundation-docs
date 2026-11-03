// Freezes the archived docs versions as static snapshots of production.
//
//   node scripts/snapshot-archives.mjs [--origin https://docs.llmhub.t-systems.net]
//
// Reads every archived path (EN and DE) from scripts/prod-sitemap.txt, fetches
// each page's HTML from production (GET only, at most 4 requests at a time,
// with retries), collects every same-origin asset the pages use (stylesheets,
// scripts, images, srcset, preloads, icons, manifest, CSS url(...) such as fonts,
// and the chunks the scripts import, transitively) and writes it all to
// archive/. The build copies archive/ verbatim into dist/ (astro.config.mjs,
// "archive-snapshots"), after the search index is built.
//
// Changes made to the production files, and nothing else:
// - asset URLs point to /_archive/<original path> (stored in archive/_archive/),
//   so they never collide with the current build's /_astro/;
// - every page gets <meta name="robots" content="noindex, nofollow"> if it has
//   no robots meta.
//
// Re-running replaces the snapshot completely (idempotent).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archivedVersions } from '../src/archivedVersions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'archive');
const args = process.argv.slice(2);
const originArg = args.includes('--origin') ? args[args.indexOf('--origin') + 1] : undefined;
const origin = (originArg || 'https://docs.llmhub.t-systems.net').replace(/\/$/, '');

// The archived version prefixes (src/archivedVersions.mjs). A path is archived
// when its first segment (after an optional /de) is one of these.
const ARCHIVED_VERSIONS = archivedVersions.map(({ slug }) => slug);
const ARCHIVE_PREFIX = '/_archive';
const archivedPath = new RegExp(`^/(?:de/)?(?:${ARCHIVED_VERSIONS.join('|')})(?:/|$)`);

const CONCURRENCY = 4;
const RETRIES = 4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path) {
	const url = origin + path;
	let lastError;
	for (let attempt = 0; attempt <= RETRIES; attempt++) {
		try {
			const response = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'aifs-docs-archive-snapshot' } });
			if (response.status === 200) return Buffer.from(await response.arrayBuffer());
			if (response.status === 404 || (response.status >= 300 && response.status < 400)) {
				throw Object.assign(new Error(`${response.status} ${url}`), { fatal: true });
			}
			lastError = new Error(`${response.status} ${url}`);
		} catch (error) {
			if (error.fatal) throw error;
			lastError = error;
		}
		await sleep(500 * 2 ** attempt);
	}
	throw lastError;
}

async function pool(items, worker) {
	let next = 0;
	const run = async () => {
		while (next < items.length) {
			const item = items[next++];
			await worker(item);
		}
	};
	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
}

// A same-origin, root-relative asset path, without query or hash, or null.
function assetPath(raw, basePath) {
	if (!raw) return null;
	const value = raw.trim().replace(/&amp;/g, '&');
	if (!value || /^(data|blob|javascript|mailto|tel):/i.test(value) || value.startsWith('#')) return null;
	let url;
	try {
		url = new URL(value, origin + basePath);
	} catch {
		return null;
	}
	if (url.origin !== origin) return null;
	if (url.pathname.startsWith(ARCHIVE_PREFIX + '/')) return null;
	return decodeURIComponent(url.pathname);
}

const isPagePath = (path) => path.endsWith('/') || !/\.[a-z0-9]+$/i.test(path);

// Attributes of these tags load something the page needs; <a href> does not.
const URL_ATTRS = /\s(src|href|srcset|imagesrcset|poster|data-src|content)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const ASSET_TAGS = /<(link|script|img|source|video|audio|track|image|use|input|embed|object|iframe|meta)\b[^>]*>/gi;

function tagAssets(tag, tagName) {
	const found = [];
	const lower = tag.toLowerCase();
	for (const match of tag.matchAll(URL_ATTRS)) {
		const attr = match[1].toLowerCase();
		const value = match[3] ?? match[4] ?? '';
		if (tagName === 'link') {
			const rel = (lower.match(/\srel\s*=\s*["']?([^"'>]+)/) || [])[1] || '';
			if (!/stylesheet|icon|preload|modulepreload|manifest|apple-touch|mask-icon|prefetch/.test(rel)) continue;
		}
		if (tagName === 'meta') {
			// og:image and similar; a meta with a page URL is left alone.
			if (attr !== 'content' || !/(image|icon)/.test(lower)) continue;
		} else if (attr === 'content') continue;
		if (attr.endsWith('srcset')) {
			for (const part of value.split(',')) found.push({ attr, value: part.trim().split(/\s+/)[0] });
		} else found.push({ attr, value });
	}
	return found;
}

// Paths referenced as strings in CSS or JS.
function cssRefs(text) {
	const refs = [];
	for (const match of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) refs.push(match[2]);
	for (const match of text.matchAll(/@import\s+(['"])([^'"]+)\1/g)) refs.push(match[2]);
	return refs;
}

function jsRefs(text) {
	const refs = [];
	for (const match of text.matchAll(/["'`](\/_astro\/[^"'`\s)]+)["'`]/g)) refs.push(match[1]);
	for (const match of text.matchAll(/["'`](\.{1,2}\/[^"'`\s]+\.(?:m?js|css|wasm|json|svg|png|webp|avif|jpe?g|gif|woff2?|ttf))["'`]/g)) refs.push(match[1]);
	return refs;
}

// Rewrites root-relative asset paths in a CSS or JS file to the archive prefix.
function rewriteAssetText(text) {
	return text.replace(/(?<![\w./-])\/_astro\//g, `${ARCHIVE_PREFIX}/_astro/`);
}

async function main() {
	const sitemap = readFileSync(join(root, 'scripts/prod-sitemap.txt'), 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const pages = sitemap.filter((path) => archivedPath.test(path));
	console.log(`Archived pages in the production sitemap: ${pages.length}`);
	for (const version of ARCHIVED_VERSIONS) {
		const en = pages.filter((path) => path.startsWith(`/${version}/`)).length;
		const de = pages.filter((path) => path.startsWith(`/de/${version}/`)).length;
		console.log(`  ${version}: ${en} EN, ${de} DE`);
	}

	rmSync(outDir, { recursive: true, force: true });
	mkdirSync(outDir, { recursive: true });

	const html = new Map();
	await pool(pages, async (path) => {
		html.set(path, (await get(path)).toString('utf8'));
	});
	console.log(`Fetched ${html.size} pages.`);

	// Assets: start from the pages, then follow CSS and JS references.
	const assets = new Map();
	const queue = new Set();
	const enqueue = (path) => {
		if (path && !assets.has(path) && !isPagePath(path)) queue.add(path);
	};
	for (const [pagePath, page] of html) {
		for (const tag of page.matchAll(ASSET_TAGS)) {
			for (const ref of tagAssets(tag[0], tag[1].toLowerCase())) enqueue(assetPath(ref.value, pagePath));
		}
		for (const ref of cssRefs(page)) enqueue(assetPath(ref, pagePath));
		for (const ref of jsRefs(page)) enqueue(assetPath(ref, pagePath));
	}
	const missing = [];
	while (queue.size) {
		const batch = [...queue];
		queue.clear();
		await pool(batch, async (path) => {
			if (assets.has(path)) return;
			let body;
			try {
				body = await get(path);
			} catch (error) {
				missing.push(`${path} (${error.message})`);
				assets.set(path, null);
				return;
			}
			assets.set(path, body);
			if (/\.css$/i.test(path)) for (const ref of cssRefs(body.toString('utf8'))) enqueue(assetPath(ref, path));
			if (/\.m?js$/i.test(path)) for (const ref of jsRefs(body.toString('utf8'))) enqueue(assetPath(ref, path));
		});
	}

	let assetBytes = 0;
	let assetCount = 0;
	for (const [path, body] of assets) {
		if (!body) continue;
		const out = /\.(css|m?js)$/i.test(path) ? Buffer.from(rewriteAssetText(body.toString('utf8'))) : body;
		const file = join(outDir, ARCHIVE_PREFIX, path);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, out);
		assetBytes += out.length;
		assetCount++;
	}

	// Pages: asset URLs to the archive prefix, noindex meta.
	const fetched = new Set([...assets].filter(([, body]) => body).map(([path]) => path));
	const toArchive = (value, pagePath) => {
		const path = assetPath(value, pagePath);
		if (!path || !fetched.has(path)) return value;
		const url = new URL(value.replace(/&amp;/g, '&'), origin + pagePath);
		return ARCHIVE_PREFIX + url.pathname + url.search + url.hash;
	};
	let pageBytes = 0;
	let noindexAdded = 0;
	for (const [pagePath, page] of html) {
		let next = page.replace(ASSET_TAGS, (tag, name) =>
			tag.replace(URL_ATTRS, (whole, attr, quoted, dq, sq) => {
				const value = dq ?? sq ?? '';
				if (!tagAssets(tag, name.toLowerCase()).some((ref) => ref.attr === attr.toLowerCase())) return whole;
				const quote = dq !== undefined ? '"' : "'";
				const rewritten = attr.toLowerCase().endsWith('srcset')
					? value
							.split(',')
							.map((part) => {
								const [url, ...rest] = part.trim().split(/\s+/);
								return [toArchive(url, pagePath), ...rest].join(' ');
							})
							.join(', ')
					: toArchive(value, pagePath);
				return ` ${attr}=${quote}${rewritten}${quote}`;
			}),
		);
		next = next.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, quote, value) => {
			const rewritten = toArchive(value, pagePath);
			return rewritten === value ? whole : `url(${quote}${rewritten}${quote})`;
		});
		next = rewriteAssetText(next);
		if (!/<meta\s[^>]*name=["']robots["']/i.test(next)) {
			next = next.replace(/<head([^>]*)>/i, `<head$1><meta name="robots" content="noindex, nofollow">`);
			noindexAdded++;
		}
		const file = join(outDir, pagePath.endsWith('/') ? `${pagePath}index.html` : `${pagePath}/index.html`);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, next);
		pageBytes += Buffer.byteLength(next);
	}

	const date = new Date().toISOString().slice(0, 10);
	writeFileSync(
		join(outDir, 'README.md'),
		`# Archived docs versions (static snapshot)

Frozen copies of the archived versions of the docs, exactly as production
(${origin}) served them on ${date}. They are not generated from the current
content or components; the build copies this directory verbatim into dist/
(the \`archive-snapshots\` integration in \`astro.config.mjs\`).

- Versions: ${ARCHIVED_VERSIONS.map((slug) => `/${slug}/`).join(', ')} and their /de/ equivalents
- Pages: ${html.size} (${(pageBytes / 1048576).toFixed(1)} MB), from \`scripts/prod-sitemap.txt\`
- Assets: ${assetCount} files (${(assetBytes / 1048576).toFixed(1)} MB) in \`_archive/\`, at their production path under \`/_archive\`
- Source: ${origin}, fetched ${date} by \`scripts/snapshot-archives.mjs\`

Changes made to the production files, and nothing else: asset URLs point to
\`/_archive/…\` instead of \`/…\` (so they never collide with the current
build's \`/_astro/\`), and each page has \`<meta name="robots" content="noindex, nofollow">\`.

Do not edit these files by hand. To refresh the snapshot (only while
production still serves the archives as they should be frozen), run:

    node scripts/snapshot-archives.mjs

It replaces this directory completely.
`,
	);

	console.log(`Wrote ${html.size} pages (${(pageBytes / 1048576).toFixed(1)} MB), noindex meta added to ${noindexAdded}.`);
	console.log(`Wrote ${assetCount} assets (${(assetBytes / 1048576).toFixed(1)} MB).`);
	if (missing.length) {
		console.log(`Assets not fetched (${missing.length}):`);
		for (const line of missing) console.log(`  ${line}`);
	}
}

await main();
