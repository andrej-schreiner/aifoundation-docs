#!/usr/bin/env node
// Checks that every URL of the production docs still leads somewhere useful.
// Run with `bun run check:urls` against a running build (`bun run build`, then
// `bun run preview`).
//
// Usage: bun run scripts/check-prod-urls.mjs [base] [--sitemap <url|file>]
//   base       site to test, default http://127.0.0.1:4379
//   --sitemap  a sitemap XML URL (or sitemap index), or a text file with one
//              path or URL per line; default scripts/prod-sitemap.txt, the
//              production sitemap as paths
//
// Every path is requested from the base. HTTP redirects and the meta-refresh
// pages Astro builds for `redirects` in astro.config.mjs are followed; when the
// final URL has an anchor, the final HTML must contain that id.
//
// Result per path:
//   OK-200              the page itself exists
//   OK-redirect         redirects to an existing page (and anchor, if any),
//                       or to another site
//   WARN-general        redirects to /, /models/, /plans/ or their German
//                       pages without an anchor; check for a more specific target
//   BAD-404             the path, or a page it redirects to, does not exist
//   BAD-anchor-missing  the target page exists but has no element with the id
// Exits with 1 when any path is BAD.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let sitemapSource = resolve(root, 'scripts/prod-sitemap.txt');
let base = 'http://127.0.0.1:4379';
for (let i = 0; i < args.length; i++) {
	if (args[i] === '--sitemap') sitemapSource = args[++i];
	else base = args[i];
}
base = base.replace(/\/$/, '');
const baseOrigin = new URL(base).origin;

const GENERAL = new Set(['/', '/models/', '/plans/', '/de/', '/de/models/', '/de/plans/']);
const MAX_HOPS = 10;

/** Path (with query) of a sitemap entry, which may be a full URL or a path. */
function toPath(entry) {
	const value = entry.trim();
	if (!value) return '';
	if (/^https?:\/\//.test(value)) {
		const url = new URL(value);
		return url.pathname + url.search;
	}
	return value.startsWith('/') ? value : '/' + value;
}

async function readSitemap(source) {
	if (/^https?:\/\//.test(source)) {
		const xml = await (await fetch(source)).text();
		const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
		if (/<sitemapindex/.test(xml)) {
			const nested = await Promise.all(locs.map(readSitemap));
			return nested.flat();
		}
		return locs.map(toPath);
	}
	const text = await readFile(source, 'utf8');
	return text.split('\n').map(toPath).filter(Boolean);
}

function idsOf(html) {
	return new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]));
}

function metaRefresh(html) {
	const tag = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/i);
	if (!tag) return null;
	const target = tag[0].match(/content=["']?\s*\d+\s*;\s*url=([^"'>]+)/i);
	return target ? target[1].replace(/&amp;/g, '&') : null;
}

async function check(path) {
	let url = new URL(path, base);
	const hops = [];
	for (let i = 0; i <= MAX_HOPS; i++) {
		if (url.origin !== baseOrigin) {
			return { path, result: 'OK-redirect', status: 'external', target: url.href, hops };
		}
		let response;
		try {
			response = await fetch(url, { redirect: 'manual' });
		} catch (error) {
			return { path, result: 'BAD-404', status: 'error', target: url.pathname, hops, note: String(error.message || error) };
		}
		const location = response.headers.get('location');
		if (response.status >= 300 && response.status < 400 && location) {
			const next = new URL(location, url);
			// Keep the anchor across an HTTP redirect, as browsers do.
			if (!next.hash && url.hash) next.hash = url.hash;
			url = next;
			hops.push(url.origin === baseOrigin ? url.pathname + url.hash : url.href);
			continue;
		}
		const html = response.status === 200 ? await response.text() : '';
		const refresh = response.status === 200 ? metaRefresh(html) : null;
		if (refresh) {
			url = new URL(refresh, url);
			hops.push((url.origin === baseOrigin ? url.pathname + url.hash : url.href) + ' (meta)');
			continue;
		}
		const target = url.pathname + url.hash;
		if (response.status !== 200) return { path, result: 'BAD-404', status: response.status, target, hops };
		if (url.hash && !idsOf(html).has(decodeURIComponent(url.hash.slice(1)))) {
			return { path, result: 'BAD-anchor-missing', status: 200, target, hops };
		}
		if (hops.length === 0) return { path, result: 'OK-200', status: 200, target, hops };
		const general = !url.hash && GENERAL.has(url.pathname.replace(/\/?$/, '/'));
		return { path, result: general ? 'WARN-general' : 'OK-redirect', status: 200, target, hops };
	}
	return { path, result: 'BAD-404', status: 'loop', target: url.pathname + url.hash, hops, note: `more than ${MAX_HOPS} hops` };
}

const paths = [...new Set(await readSitemap(sitemapSource))];
const results = new Array(paths.length);
let next = 0;
await Promise.all(
	Array.from({ length: 8 }, async () => {
		while (next < paths.length) {
			const index = next++;
			results[index] = await check(paths[index]);
		}
	}),
);

const order = ['BAD-404', 'BAD-anchor-missing', 'WARN-general', 'OK-redirect', 'OK-200'];
results.sort((a, b) => order.indexOf(a.result) - order.indexOf(b.result) || a.path.localeCompare(b.path));
for (const r of results) {
	const via = r.hops.length ? ` -> ${r.hops.join(' -> ')}` : '';
	const note = r.note ? ` (${r.note})` : '';
	console.log(`${r.result.padEnd(18)} ${r.path}${via} [${r.status}] hops=${r.hops.length}${note}`);
}
const counts = Object.fromEntries(order.map((name) => [name, results.filter((r) => r.result === name).length]));
console.log(`\n${paths.length} URLs from ${sitemapSource}, base ${base}`);
console.log(order.map((name) => `${name} ${counts[name]}`).join(' · '));
process.exit(counts['BAD-404'] + counts['BAD-anchor-missing'] > 0 ? 1 : 0);
