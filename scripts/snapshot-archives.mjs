// Freezes the archived docs versions as static snapshots of production.
//
//   node scripts/snapshot-archives.mjs [--base https://docs.llmhub.t-systems.net]
//       every version in src/archivedVersions.mjs, paths from
//       scripts/prod-sitemap.txt; replaces archive/ completely
//   node scripts/snapshot-archives.mjs --version v1-3-0 [--base <url>]
//       adds (or refreshes) one version: its EN and DE paths from the live
//       sitemap of <base> (sitemap-index.xml), or crawled from /v1-3-0/ and
//       /de/v1-3-0/ when the sitemap lacks them (a crawl finds only pages
//       that another page of the version links to); the other versions stay
//       as they are; missing paths are added to scripts/prod-sitemap.txt
//   node scripts/snapshot-archives.mjs --pagefind-only [--base <url>]
//       refreshes only the archived search index (below); pages stay as they are
//
// (--origin is accepted as another name for --base.)
//
// Fetches each page's HTML from production (GET only, at most 4 requests at a
// time, with retries), collects every same-origin asset the pages use
// (stylesheets, scripts, images, srcset, preloads, icons, manifest, CSS url(...)
// such as fonts, and the chunks the scripts import, transitively) and writes it
// all to archive/. The build copies archive/ verbatim into dist/
// (astro.config.mjs, "archive-snapshots"), after the search index is built.
//
// Search: the archived pages search production's Pagefind index, filtered by
// their version (VersionSearch). That index (pagefind.js, entry, metadata,
// wasm, and every index, filter and fragment file the metadata lists) is
// stored in archive/_archive/pagefind/, so the current site's /pagefind/ (which
// has no archived pages) stays its own. The index is only replaced when the new
// one still has every archived version.
//
// Changes made to the production files, and nothing else:
// - asset URLs point to /_archive/<original path> (stored in archive/_archive/),
//   so they never collide with the current build's /_astro/;
// - the search script's Pagefind bundle path points to /_archive/pagefind/;
// - every page gets <meta name="robots" content="noindex, nofollow"> if it has
//   no robots meta.
//
// Re-running gives the same result for the same production files.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { archivedVersions } from '../src/archivedVersions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'archive');
const sitemapFile = join(root, 'scripts/prod-sitemap.txt');
const args = process.argv.slice(2);
const option = (...names) => {
	const index = args.findIndex((arg) => names.includes(arg));
	return index === -1 ? undefined : args[index + 1];
};
const origin = (option('--base', '--origin') || 'https://docs.llmhub.t-systems.net').replace(/\/$/, '');
const singleVersion = option('--version');
const pagefindOnly = args.includes('--pagefind-only');
if (singleVersion !== undefined && !/^v\d+(?:-\d+)*$/.test(singleVersion)) {
	throw new Error(`--version needs a version slug such as v1-3-0, got "${singleVersion}"`);
}

// The archived version prefixes (src/archivedVersions.mjs, plus --version). A
// path is archived when its first segment (after an optional /de) is one of these.
const ARCHIVED_VERSIONS = [...new Set([...archivedVersions.map(({ slug }) => slug), ...(singleVersion ? [singleVersion] : [])])];
const ARCHIVE_PREFIX = '/_archive';
const PAGEFIND_PATH = `${ARCHIVE_PREFIX}/pagefind/`;
const versionPath = (versions) => new RegExp(`^/(?:de/)?(?:${versions.join('|')})(?:/|$)`);
const archivedPath = versionPath(ARCHIVED_VERSIONS);

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
// The search script's Pagefind bundle path (bundlePath:`${base}/pagefind/`) to
// the archived index.
function rewriteAssetText(text) {
	return text
		.replace(/(?<![\w./-])\/_astro\//g, `${ARCHIVE_PREFIX}/_astro/`)
		.replace(/(bundlePath:`\$\{[^}`]*\})\/pagefind\//g, `$1${PAGEFIND_PATH}`);
}

// Minimal CBOR decoder, enough for Pagefind's metadata and filter files.
function decodeCbor(buffer) {
	let pos = 0;
	const length = (info) => {
		if (info < 24) return info;
		const size = { 24: 1, 25: 2, 26: 4, 27: 8 }[info];
		if (!size) throw new Error(`CBOR: unsupported length ${info}`);
		const value = size === 8 ? Number(buffer.readBigUInt64BE(pos)) : buffer.readUIntBE(pos, size);
		pos += size;
		return value;
	};
	const item = () => {
		const byte = buffer[pos++];
		const major = byte >> 5;
		const info = byte & 31;
		if (major === 7) {
			const simple = { 20: false, 21: true, 22: null, 23: undefined };
			if (info in simple) return simple[info];
			const size = { 25: 2, 26: 4, 27: 8 }[info];
			if (!size) throw new Error(`CBOR: unsupported simple value ${info}`);
			const value = size === 2 ? 0 : size === 4 ? buffer.readFloatBE(pos) : buffer.readDoubleBE(pos);
			pos += size;
			return value;
		}
		if (info === 31) {
			const parts = [];
			if (major === 5) {
				const map = {};
				while (buffer[pos] !== 0xff) map[item()] = item();
				pos++;
				return map;
			}
			while (buffer[pos] !== 0xff) parts.push(item());
			pos++;
			return major === 3 ? parts.join('') : parts;
		}
		const n = length(info);
		if (major === 0) return n;
		if (major === 1) return -1 - n;
		if (major === 2 || major === 3) {
			const bytes = buffer.subarray(pos, pos + n);
			pos += n;
			return major === 3 ? bytes.toString('utf8') : bytes;
		}
		if (major === 4) return Array.from({ length: n }, item);
		if (major === 5) {
			const map = {};
			for (let i = 0; i < n; i++) map[item()] = item();
			return map;
		}
		return item(); // tag: the tagged value
	};
	return item();
}

// A Pagefind file's content: gzip, then the "pagefind_dcd" signature, then CBOR.
function pagefindData(body) {
	const data = gunzipSync(body);
	const signature = 'pagefind_dcd';
	if (data.subarray(0, signature.length).toString('latin1') !== signature) throw new Error('not a Pagefind data file');
	return decodeCbor(data.subarray(signature.length));
}

// Production's Pagefind index, every file pagefind.js loads, into
// archive/_archive/pagefind/. Discovered from pagefind-entry.json (languages,
// their metadata hash and wasm) and each language's metadata (pages, which
// are the fragment hashes; index chunks; filters). Kept only if its version
// filter has every archived version; else the stored index stays.
async function snapshotPagefind() {
	const base = '/pagefind/';
	const files = new Map();
	const fetchFile = async (name, optional = false) => {
		try {
			files.set(name, await get(base + name));
		} catch (error) {
			if (!optional) throw error;
		}
	};
	await fetchFile('pagefind.js');
	await fetchFile('pagefind-entry.json');
	const entry = JSON.parse(files.get('pagefind-entry.json').toString('utf8'));
	const versionsFound = new Set();
	const pagesPerLanguage = {};
	for (const [language, { hash, wasm }] of Object.entries(entry.languages)) {
		await fetchFile(`pagefind.${hash}.pf_meta`);
		if (wasm) await fetchFile(`wasm.${wasm}.pagefind`);
		const [, pages, chunks, filters] = pagefindData(files.get(`pagefind.${hash}.pf_meta`));
		pagesPerLanguage[language] = pages.length;
		const names = [
			...chunks.map(([, , chunk]) => `index/${chunk}.pf_index`),
			...filters.map(([, filter]) => `filter/${filter}.pf_filter`),
			...pages.map(([page]) => `fragment/${page}.pf_fragment`),
		];
		await pool(names, (name) => fetchFile(name));
		for (const [name, filter] of filters) {
			if (name !== 'version') continue;
			// [filter name, [[value, page numbers], …]]
			const [, values] = pagefindData(files.get(`filter/${filter}.pf_filter`));
			for (const [value] of values) versionsFound.add(value);
		}
	}
	await fetchFile('wasm.unknown.pagefind', true);

	const lacking = ARCHIVED_VERSIONS.filter((version) => !versionsFound.has(version));
	const target = join(outDir, PAGEFIND_PATH);
	if (lacking.length) {
		console.log(`Pagefind index NOT updated: production's index has no pages for ${lacking.join(', ')}.`);
		return existsSync(target);
	}
	const temporary = `${target.replace(/\/$/, '')}.new`;
	rmSync(temporary, { recursive: true, force: true });
	let bytes = 0;
	for (const [name, body] of files) {
		const file = join(temporary, name);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, body);
		bytes += body.length;
	}
	rmSync(target, { recursive: true, force: true });
	renameSync(temporary, target);
	const counts = Object.entries(pagesPerLanguage).map(([language, count]) => `${language} ${count}`).join(', ');
	console.log(`Wrote the Pagefind index: ${files.size} files (${(bytes / 1048576).toFixed(1)} MB), pages ${counts}.`);
	return true;
}

// Every <loc> of the live sitemap (sitemap-index.xml and the sitemaps it lists),
// as paths.
async function liveSitemap() {
	const paths = [];
	const read = async (path) => {
		let xml;
		try {
			xml = (await get(path)).toString('utf8');
		} catch {
			return;
		}
		for (const [, loc] of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
			const url = new URL(loc.replace(/&amp;/g, '&'));
			if (url.origin !== origin) continue;
			if (url.pathname.endsWith('.xml')) await read(url.pathname);
			else paths.push(url.pathname);
		}
	};
	await read('/sitemap-index.xml');
	return paths;
}

// The version's pages, crawled from its EN and DE start pages through <a href>.
async function crawl(version) {
	const inVersion = versionPath([version]);
	const seen = new Set();
	let queue = [`/${version}/`, `/de/${version}/`];
	while (queue.length) {
		const batch = queue.filter((path) => !seen.has(path));
		batch.forEach((path) => seen.add(path));
		const found = [];
		await pool(batch, async (path) => {
			let page;
			try {
				page = (await get(path)).toString('utf8');
			} catch {
				seen.delete(path);
				return;
			}
			for (const [, , dq, sq] of page.matchAll(/<a\s[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
				let url;
				try {
					url = new URL((dq ?? sq).replace(/&amp;/g, '&'), origin + path);
				} catch {
					continue;
				}
				if (url.origin === origin && inVersion.test(url.pathname) && isPagePath(url.pathname)) found.push(url.pathname);
			}
		});
		queue = [...new Set(found)].filter((path) => !seen.has(path));
	}
	return [...seen].sort();
}

// The archived pages to fetch.
async function pagesToFetch() {
	const sitemap = readFileSync(sitemapFile, 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	if (!singleVersion) return sitemap.filter((path) => archivedPath.test(path));

	const inVersion = versionPath([singleVersion]);
	let pages = (await liveSitemap()).filter((path) => inVersion.test(path));
	if (pages.length) console.log(`${singleVersion}: ${pages.length} pages in ${origin}/sitemap-index.xml`);
	else {
		pages = await crawl(singleVersion);
		console.log(`${singleVersion}: not in the sitemap, ${pages.length} pages crawled from /${singleVersion}/ and /de/${singleVersion}/`);
	}
	const added = pages.filter((path) => !sitemap.includes(path));
	if (added.length) {
		writeFileSync(sitemapFile, `${[...sitemap, ...added].sort().join('\n')}\n`);
		console.log(`Added ${added.length} paths to scripts/prod-sitemap.txt.`);
	}
	return pages;
}

// Files below a directory, with their total size.
function tally(directory, filter = () => true) {
	let count = 0;
	let bytes = 0;
	const walk = (dir, rel) => {
		if (!existsSync(dir)) return;
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = `${rel}/${entry.name}`;
			if (entry.isDirectory()) walk(join(dir, entry.name), path);
			else if (filter(path)) {
				count++;
				bytes += statSync(join(dir, entry.name)).size;
			}
		}
	};
	walk(directory, '');
	return { count, bytes };
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

// archive/README.md, from what archive/ holds. The fetch dates are kept in
// archive/snapshots.json (per version, and for the search index).
function writeReadme(dates) {
	const pages = ARCHIVED_VERSIONS.reduce(
		(sum, version) => {
			for (const dir of [version, `de/${version}`]) {
				const { count, bytes } = tally(join(outDir, dir), (path) => path.endsWith('/index.html'));
				sum.count += count;
				sum.bytes += bytes;
			}
			return sum;
		},
		{ count: 0, bytes: 0 },
	);
	const assets = tally(join(outDir, ARCHIVE_PREFIX), (path) => !path.startsWith('/pagefind/'));
	const search = tally(join(outDir, PAGEFIND_PATH));
	const fetched = ARCHIVED_VERSIONS.map((slug) => `/${slug}/ ${dates[slug] ?? 'unknown'}`).join(', ');
	writeFileSync(
		join(outDir, 'README.md'),
		`# Archived docs versions (static snapshot)

Frozen copies of the archived versions of the docs, exactly as production
(${origin}) served them. They are not generated from the current
content or components; the build copies this directory verbatim into dist/
(the \`archive-snapshots\` integration in \`astro.config.mjs\`).

- Versions: ${ARCHIVED_VERSIONS.map((slug) => `/${slug}/`).join(', ')} and their /de/ equivalents
- Pages: ${pages.count} (${mb(pages.bytes)}), from \`scripts/prod-sitemap.txt\`
- Assets: ${assets.count} files (${mb(assets.bytes)}) in \`_archive/\`, at their production path under \`/_archive\`
- Search: production's Pagefind index, ${search.count} files (${mb(search.bytes)}) in \`_archive/pagefind/\`, fetched ${dates.pagefind ?? 'unknown'}
- Source: ${origin}, fetched by \`scripts/snapshot-archives.mjs\`: ${fetched}

Changes made to the production files, and nothing else: asset URLs point to
\`/_archive/…\` instead of \`/…\` (so they never collide with the current
build's \`/_astro/\`), the search script loads Pagefind from \`/_archive/pagefind/\`
instead of \`/pagefind/\` (the archived pages search production's index, which
has them, filtered by their version; the current site's \`/pagefind/\` has no
archived pages), and each page has \`<meta name="robots" content="noindex, nofollow">\`.

Do not edit these files by hand. To refresh the snapshot (only while
production still serves the archives as they should be frozen), run:

    node scripts/snapshot-archives.mjs

It replaces this directory completely. To add one version, or to refresh
only the search index, see the usage at the top of the script.
`,
	);
}

async function main() {
	const datesFile = join(outDir, 'snapshots.json');
	const dates = existsSync(datesFile) ? JSON.parse(readFileSync(datesFile, 'utf8')) : {};
	const today = new Date().toISOString().slice(0, 10);

	if (pagefindOnly) {
		if (await snapshotPagefind()) dates.pagefind = today;
		// The search script, already in archive/, gets the archived bundle path.
		const astroDir = join(outDir, ARCHIVE_PREFIX, '_astro');
		for (const name of readdirSync(astroDir).filter((file) => /\.m?js$/.test(file))) {
			const file = join(astroDir, name);
			const text = readFileSync(file, 'utf8');
			const next = rewriteAssetText(text);
			if (next !== text) {
				writeFileSync(file, next);
				console.log(`Pagefind bundle path rewritten in _archive/_astro/${name}.`);
			}
		}
		writeFileSync(datesFile, `${JSON.stringify(dates, null, '\t')}\n`);
		writeReadme(dates);
		return;
	}

	const pages = await pagesToFetch();
	console.log(`Archived pages to fetch: ${pages.length}`);
	for (const version of singleVersion ? [singleVersion] : ARCHIVED_VERSIONS) {
		const en = pages.filter((path) => path.startsWith(`/${version}/`)).length;
		const de = pages.filter((path) => path.startsWith(`/de/${version}/`)).length;
		console.log(`  ${version}: ${en} EN, ${de} DE`);
	}
	if (!pages.length) throw new Error('No pages to fetch.');

	if (singleVersion) {
		rmSync(join(outDir, singleVersion), { recursive: true, force: true });
		rmSync(join(outDir, 'de', singleVersion), { recursive: true, force: true });
	} else {
		rmSync(outDir, { recursive: true, force: true });
	}
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

	for (const version of singleVersion ? [singleVersion] : ARCHIVED_VERSIONS) dates[version] = today;
	if (await snapshotPagefind()) dates.pagefind = today;
	writeFileSync(datesFile, `${JSON.stringify(dates, null, '\t')}\n`);
	writeReadme(dates);

	console.log(`Wrote ${html.size} pages (${mb(pageBytes)}), noindex meta added to ${noindexAdded}.`);
	console.log(`Wrote ${assetCount} assets (${mb(assetBytes)}).`);
	if (missing.length) {
		console.log(`Assets not fetched (${missing.length}):`);
		for (const line of missing) console.log(`  ${line}`);
	}
}

await main();
