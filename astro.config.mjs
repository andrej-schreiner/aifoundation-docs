// @ts-check
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import rehypeTableScroll from './src/plugins/rehype-table-scroll.mjs';
import rehypeInlineCodeBreaks from './src/plugins/rehype-inline-code-breaks.mjs';
import rehypeNowrapTerms from './src/plugins/rehype-nowrap-terms.mjs';
import { ecWrapPoints } from './src/plugins/ec-wrap-points.mjs';
import { ecFrameTitles } from './src/plugins/ec-frame-titles.mjs';
import { archivedVersions } from './src/archivedVersions.mjs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';

// The design-system page is a draft unless AIFS_PREVIEW_DESIGN_SYSTEM=1.
// The content store caches that draft flag, so drop the store when the flag changes.
const designSystemFlag = process.env.AIFS_PREVIEW_DESIGN_SYSTEM === '1' ? '1' : '0';
mkdirSync('.astro', { recursive: true });
const designSystemStamp = '.astro/aifs-design-system-flag';
const previousDesignSystemFlag = existsSync(designSystemStamp) ? readFileSync(designSystemStamp, 'utf8').trim() : '';
if (previousDesignSystemFlag !== designSystemFlag) {
	rmSync('node_modules/.astro/data-store.json', { force: true });
	rmSync('.astro/data-store.json', { force: true });
	rmSync('.astro/collections', { recursive: true, force: true });
	writeFileSync(designSystemStamp, designSystemFlag);
}

/** Wrap markdown tables so the border tracks the column and wide tables scroll. */
function rehypeMarkdownTables() {
	return (tree) => {
		visitNode(tree, null, null);
	};

	function textOf(node) {
		if (!node) return '';
		if (node.type === 'text') return node.value || '';
		return (node.children || []).map(textOf).join('');
	}

	function countCols(table) {
		const sections = (table.children || []).filter((child) => child.tagName === 'thead' || child.tagName === 'tbody');
		const row = sections.flatMap((section) => section.children || []).find((child) => child.tagName === 'tr');
		if (!row) return 0;
		return (row.children || []).filter((cell) => cell.tagName === 'th' || cell.tagName === 'td').length;
	}

	function markDates(node) {
		if (!node || node.type !== 'element') return;
		if (node.tagName === 'td' || node.tagName === 'th') {
			const text = textOf(node).trim();
			if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
				const current = node.properties?.className;
				const list = Array.isArray(current) ? current : current ? [current] : [];
				node.properties = node.properties || {};
				node.properties.className = [...list, 'md-date'];
			}
		}
		(node.children || []).forEach(markDates);
	}

	function visitNode(node, parent, index) {
		if (!node) return;
		if (node.type === 'element' && node.tagName === 'table' && parent && typeof index === 'number') {
			const parentClass = parent.properties?.className;
			const parentClasses = Array.isArray(parentClass) ? parentClass : parentClass ? [parentClass] : [];
			if (!parentClasses.includes('md-table-wrap')) {
				markDates(node);
				node.properties = node.properties || {};
				const current = node.properties.className;
				const list = Array.isArray(current) ? [...current] : current ? [current] : [];
				if (countCols(node) >= 3) list.push('md-table-scroll');
				node.properties.className = list;
				parent.children[index] = {
					type: 'element',
					tagName: 'div',
					properties: { className: ['md-table-wrap'] },
					children: [node],
				};
				return;
			}
		}
		if (node.children) {
			for (let i = 0; i < node.children.length; i++) visitNode(node.children[i], node, i);
		}
	}
}

/**
 * The archived versions (/v1/, /v1-1-0/, /v1-2-0/ and /de/…) are static
 * snapshots of production in archive/ (scripts/snapshot-archives.mjs,
 * archive/README.md), not built from the content. After the build, and after
 * Starlight's search index (so the archives stay out of the current search),
 * archive/ is copied verbatim into dist/ (except README.md and snapshots.json).
 * A file Astro already wrote at a snapshot path fails the build. `astro dev`
 * serves the snapshot files too, for the versions in src/archivedVersions.mjs.
 */
function archiveSnapshots() {
	const source = fileURLToPath(new URL('./archive/', import.meta.url));
	const snapshotPath = new RegExp(`^/(?:(?:de/)?(?:${archivedVersions.map(({ slug }) => slug).join('|')})|_archive)/`);
	const files = (directory, prefix = '') =>
		readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? files(join(directory, entry.name), `${prefix}${entry.name}/`)
				: ['README.md', 'snapshots.json'].includes(entry.name) && !prefix
					? []
					: [`${prefix}${entry.name}`],
		);
	return {
		name: 'archive-snapshots',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use((req, res, next) => {
					const path = decodeURIComponent((req.url ?? '').split(/[?#]/)[0]);
					if (!snapshotPath.test(path) || path.includes('..')) return next();
					const file = join(source, path.endsWith('/') ? `${path}index.html` : path);
					if (!existsSync(file) || !statSync(file).isFile()) return next();
					const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' };
					const type = types[(file.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase()];
					if (type) res.setHeader('Content-Type', type);
					res.end(readFileSync(file));
				});
			},
			'astro:build:done': ({ dir, logger }) => {
				if (!existsSync(source)) throw new Error('archive/ is missing: run node scripts/snapshot-archives.mjs');
				const target = fileURLToPath(dir);
				const list = files(source);
				const collisions = list.filter((file) => existsSync(join(target, file)));
				if (collisions.length) {
					throw new Error(`The build wrote files at archive snapshot paths: ${collisions.slice(0, 10).join(', ')}`);
				}
				for (const file of list) cpSync(join(source, file), join(target, file));
				logger.info(`Copied ${list.length} archive snapshot files.`);
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	markdown: {
		rehypePlugins: [rehypeTableScroll, rehypeInlineCodeBreaks, rehypeNowrapTerms],
	},
	site: 'https://docs.llmhub.t-systems.net',
	base: '/',
	redirects: {
		'/Quickstart': '/getting-started/quickstart',
		// The catalog is a section of the Models page.
		'/models/catalog': '/models/#catalog',
		'/de/models/catalog': '/de/models/#katalog',
		'/Introduction': '/',
		'/Model Serving/langchain': '/integrations/langchain',
		'/Services and Pricing': '/plans',
		'/guides/fine-tuning': '/plans/dedicated#optional-services',
		'/de/guides/fine-tuning': '/de/plans/dedicated#optionale-leistungen',
		// The Service Description (§ 2.2) sends customers to
		// /category/model-serving for the API documentation. That path never
		// existed on this site, so it is redirected to the guides index.
		'/category/model-serving': '/guides',
		'/de/category/model-serving': '/de/guides',
		'/getting-started/models': '/models',
		'/de/getting-started/models': '/de/models',
		// Basic and Standard 1000–4000 are retired plans. Only the v1.0.0 archive
		// still lists their models and prices.
		'/plans/basic': '/v1/plans/basic',
		'/de/plans/basic': '/de/v1/plans/basic',
		'/plans/standard-1000': '/v1/plans/standard-1000',
		'/de/plans/standard-1000': '/de/v1/plans/standard-1000',
		'/plans/standard-2000': '/v1/plans/standard-2000',
		'/de/plans/standard-2000': '/de/v1/plans/standard-2000',
		'/plans/standard-3000': '/v1/plans/standard-3000',
		'/de/plans/standard-3000': '/de/v1/plans/standard-3000',
		'/plans/standard-4000': '/v1/plans/standard-4000',
		'/de/plans/standard-4000': '/de/v1/plans/standard-4000',
		'/plans/test': '/models/preview',
		'/de/plans/test': '/de/models/preview',
		'/plans/service-models': '/plans/dedicated#comparison',
		'/de/plans/service-models': '/de/plans/dedicated#comparison',
		'/models/comparison': '/models/#catalog',
		'/de/models/comparison': '/de/models/#katalog',
		'/models/scheduled-for-retirement': '/models/deprecations#upcoming',
		'/de/models/scheduled-for-retirement': '/de/models/deprecations#upcoming',
		'/models/retired': '/models/deprecations#retired',
		'/de/models/retired': '/de/models/deprecations#retired',
		'/smartchat/overview': 'https://docs.smartchat.ai.t-systems.net',
		'/de/smartchat/overview': 'https://docs.smartchat.ai.t-systems.net',
		'/smartchat/api-reference': 'https://docs.smartchat.ai.t-systems.net',
		'/de/smartchat/api-reference': 'https://docs.smartchat.ai.t-systems.net',
		'/smartchat/local-chat': 'https://docs.smartchat.ai.t-systems.net',
		'/de/smartchat/local-chat': 'https://docs.smartchat.ai.t-systems.net',
		'/smartchat/global-chat': 'https://docs.smartchat.ai.t-systems.net',
		'/de/smartchat/global-chat': 'https://docs.smartchat.ai.t-systems.net',
		'/plugins/roo-code': '/plugins/cline',
		'/de/plugins/roo-code': '/de/plugins/cline',
		'/plans/essential': '/plans#essential',
		'/de/plans/essential': '/de/plans#essential',
		'/plans/professional': '/plans#professional',
		'/de/plans/professional': '/de/plans#professional',
		'/plans/agentic': '/plans#agentic',
		'/de/plans/agentic': '/de/plans#agentic',
		'/getting-started/shared-vs-dedicated': '/plans#shared-or-dedicated',
		'/de/getting-started/shared-vs-dedicated': '/de/plans#shared-or-dedicated',
		'/guides/modalities': '/guides/multimodal',
		'/de/guides/modalities': '/de/guides/multimodal',
		'/guides/queued-requests': '/guides/reliability#queued-requests',
		'/de/guides/queued-requests': '/de/guides/reliability#queued-requests',
		// Renamed when the page stopped describing /queue as asynchronous.
		// Archived versions and external links still use the old path.
		'/guides/asynchronous-requests': '/guides/reliability#queued-requests',
		'/de/guides/asynchronous-requests': '/de/guides/reliability#queued-requests',
		'/guides/rag': '/guides/embeddings#rag',
		'/de/guides/rag': '/de/guides/embeddings#rag',
		'/guides/visual-rag': '/models/deprecations#visual-rag',
		'/de/guides/visual-rag': '/de/models/deprecations#visual-rag',
		'/api-transition/requests': '/api-transition#requests',
		'/de/api-transition/requests': '/de/api-transition#anfragen',
		'/api-transition/responses': '/api-transition#responses',
		'/de/api-transition/responses': '/de/api-transition#antworten',
		'/api-transition/streaming': '/api-transition#streaming',
		'/de/api-transition/streaming': '/de/api-transition#streaming',
		'/api-transition/errors': '/api-transition#error-handling',
		'/de/api-transition/errors': '/de/api-transition#fehlerbehandlung',
	},
	integrations: [
		{
			name: 'strip-andrej-todos',
			hooks: {
				'astro:build:done': ({ dir }) => {
					const root = fileURLToPath(dir);
					const visit = (directory) => {
						for (const name of readdirSync(directory)) {
							const path = join(directory, name);
							if (statSync(path).isDirectory()) {
								visit(path);
								continue;
							}
							if (!name.endsWith('.html')) continue;
							const html = readFileSync(path, 'utf8');
							const next = html
								.replace(/<div>\s*<!--\s*TODO\(andrej\)[\s\S]*?-->\s*<\/div>/g, '')
								.replace(/<!--\s*TODO\(andrej\)[\s\S]*?-->/g, '');
							if (next !== html) writeFileSync(path, next);
						}
					};
					visit(root);
				},
			},
		},
		sitemap(),
		starlight({
			title: 'AI Foundation Services',
			head: [
				{
					// Puts "On this page" on the same baseline as the page title.
					// The title's height above the fold varies (the announcement
					// banners above it, which can be closed; a title over two lines),
					// so CSS can't know the offset. Measures both baselines and sets
					// --aifs-toc-offset on the root; layout.css applies it as a margin
					// on the sticky column. Re-measures when the title panel or the
					// column (main, which holds the banners) changes size, and on the
					// aifs:banner-dismissed event from PreviewModelsBanner: closing a
					// banner moves the title panel without resizing it.
					tag: 'script',
					content: `(() => {
	const wide = matchMedia('(min-width: 72rem)');
	const baseline = (el) => {
		const probe = document.createElement('span');
		probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
		el.prepend(probe);
		const y = probe.getBoundingClientRect().bottom;
		probe.remove();
		return y;
	};
	const align = () => {
		const root = document.documentElement;
		const title = document.querySelector('.main-pane .content-panel h1');
		const label = document.querySelector('.right-sidebar-panel starlight-toc h2');
		const sheet = document.querySelector('.main-pane > main');
		const column = document.querySelector('.right-sidebar');
		if (!wide.matches || !title || !label || !sheet || !column) {
			root.style.removeProperty('--aifs-toc-offset');
			return;
		}
		// Each baseline from the top of its own column, so scrolling (which
		// moves the sticky column) doesn't change the result.
		const offset = Math.round(
			baseline(title) - sheet.getBoundingClientRect().top -
				(baseline(label) - column.getBoundingClientRect().top),
		);
		root.style.setProperty('--aifs-toc-offset', Math.max(0, offset) + 'px');
	};
	const start = () => {
		align();
		const observer = new ResizeObserver(align);
		const panel = document.querySelector('.main-pane .content-panel');
		const sheet = document.querySelector('.main-pane > main');
		if (panel) observer.observe(panel, { box: 'border-box' });
		if (sheet) observer.observe(sheet);
		document.addEventListener('aifs:banner-dismissed', align);
		wide.addEventListener('change', align);
		document.fonts?.ready.then(align);
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();`,
				},
				{
					// Below 72rem On this page is a bar under the header; a long
					// current heading wraps, so the bar can grow. Its real height
					// goes to --aifs-mobile-toc-actual, and the scroll padding
					// (custom.css) uses it, so a jump to a heading lands below the
					// bar however many lines it has.
					tag: 'script',
					content: `(() => {
	const start = () => {
		const bar = document.querySelector('mobile-starlight-toc nav');
		if (!bar) return;
		const root = document.documentElement;
		new ResizeObserver(() => {
			const h = bar.getBoundingClientRect().height;
			if (h > 0) root.style.setProperty('--aifs-mobile-toc-actual', Math.ceil(h) + 'px');
			else root.style.removeProperty('--aifs-mobile-toc-actual');
		}).observe(bar);
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();`,
				},
				{
					// Embedded T-Systems chat widget, loaded site-wide. The deferred
					// IIFE injects the async widget.js from chat.ai.t-systems.net; the
					// widget renders its own launcher in the bottom-right corner. The
					// GlmBanner corner toast is raised (see GlmBanner.astro) so the two
					// don't overlap in that corner.
					tag: 'script',
					content: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].q=[];var f=d.getElementsByTagName(s)[0];var j=d.createElement(s);j.async=true;j.src='https://chat.ai.t-systems.net/widget.js';j.setAttribute('data-chatbot-id','5004f2f1-b699-42d9-b170-b937c3ec924e');j.setAttribute('data-api-url','https://chat.ai.t-systems.net');j.setAttribute('data-position','bottom-right');j.setAttribute('data-theme','dark');j.setAttribute('data-primary-color','#E20074');f.parentNode.insertBefore(j,f);})(window,document,'script','TSWidget','ts');`,
				},
				{
					// The launcher lives in the widget's shadow root, so page CSS cannot
					// reach it. On a phone it covers Details and copy buttons; shrink it.
					tag: 'script',
					content: `(function(){function shrink(){if(!matchMedia('(max-width: 40rem)').matches)return;var host=document.getElementById('tsystems-chat-widget');var root=host&&host.shadowRoot;if(!root||root.getElementById('aifs-launcher-size'))return;var style=document.createElement('style');style.id='aifs-launcher-size';style.textContent='.widget-launcher{width:44px!important;height:44px!important}.widget-launcher svg{width:22px!important;height:22px!important}.widget-container.bottom-right{right:12px;bottom:max(12px,env(safe-area-inset-bottom))}';root.appendChild(style);}var n=0;var t=setInterval(function(){shrink();if(++n>20)clearInterval(t);},250);})();`,
				},
				{
					// Language-aware Service Description PDF link, normalized at runtime.
					// The sidebar "Links" entry is authored as an ABSOLUTE production URL
					// in the config on purpose: Starlight localizes root-relative sidebar
					// links (…/files → /de/files, a 404), and the link-checker skips
					// external URLs. At runtime this script rewrites absolute Service
					// Description links to a host-relative /files/… path, so they resolve
					// against the current origin — working in local dev and on any
					// deployed host. Every Service Description link resolves to the one
					// current document in the page's language: the German edition on
					// German pages (including fallback pages under /de/), the English
					// edition everywhere else. Runs on first load and on Starlight
					// view-transition navigations.
					tag: 'script',
					content: `(function(){function fix(){var file=document.documentElement.lang==='de'?'Leistungsbeschreibung-LLM-Serving-Service.pdf':'Leistungsbeschreibung_LLM_Serving-Service_EN.pdf';document.querySelectorAll('a[href*="Leistungsbeschreibung-LLM-Serving-Service"],a[href*="Leistungsbeschreibung_LLM_Serving-Service"]').forEach(function(a){a.setAttribute('href','/files/'+file);});}document.addEventListener('astro:page-load',fix);if(document.readyState!=='loading'){fix();}else{document.addEventListener('DOMContentLoaded',fix);}})();`,
				},
				{
					// Hide a dismissed notice before first paint so the bars
					// do not pop in and push the page down.
					tag: 'script',
					content: `(function(){try{var keys=['apiTransitionBannerDismissed','glm53DeepseekV41Dismissed'];var nav=performance.getEntriesByType('navigation')[0];if(nav&&nav.type==='reload'){keys.forEach(function(k){sessionStorage.removeItem(k);});}keys.forEach(function(k){if(sessionStorage.getItem(k)==='1')document.documentElement.classList.add('qp-off-'+k);});}catch(e){}})();`,
				},
				{
					// Theme switches happen at once. Without this, every element with a colour
					// transition (buttons, links in components) fades over 200ms while the page
					// background flips, so labels briefly vanish, e.g. black text on the new
					// black page. The observer runs before the next frame is drawn: it marks
					// <html> with data-theme-switching, which redesign.css uses to switch
					// transitions off, and clears the mark once the new colours are painted.
					tag: 'script',
					content: `(function(){var r=document.documentElement;new MutationObserver(function(){r.setAttribute('data-theme-switching','');requestAnimationFrame(function(){requestAnimationFrame(function(){r.removeAttribute('data-theme-switching');});});}).observe(r,{attributes:true,attributeFilter:['data-theme']});})();`,
				},
				{
					// Every page starts with the sidebar groups closed, except the one
					// that holds it. Starlight keeps the open groups in sessionStorage
					// ('sl-sidebar-state') and would restore them on the next page, so
					// the list would grow as a visitor moves around; the state is dropped
					// on every page load. Runs in <head>, before the sidebar restores.
					tag: 'script',
					content: `(function(){try{sessionStorage.removeItem('sl-sidebar-state');}catch(e){}})();`,
				},
				{
					// Sidebar groups are collapsible (Starlight's <details>). The group
					// holding the current page is open. From 50rem, when the current
					// page's entry is below the sidebar's visible part, the sidebar
					// scrolls it into view (Starlight's scroll restore is off, above).
					tag: 'script',
					content: `(function(){function openCurrent(){document.querySelectorAll('.sidebar-content details').forEach(function(d){if(d.querySelector('a[aria-current="page"]'))d.open=true;});var pane=document.getElementById('starlight__sidebar');var a=pane&&pane.querySelector('a[aria-current="page"]');if(a&&matchMedia('(min-width: 50em)').matches){var pr=pane.getBoundingClientRect(),ar=a.getBoundingClientRect();if(ar.bottom>pr.bottom)pane.scrollTop+=ar.bottom-pr.top-pr.height/2;}}document.addEventListener('astro:page-load',openCurrent);if(document.readyState!=='loading')openCurrent();else document.addEventListener('DOMContentLoaded',openCurrent);})();`,
				},
			],
			components: {
				Banner: './src/components/Banner.astro',
				Footer: './src/components/Footer.astro',
				Header: './src/components/SiteHeader.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
			},
			logo: {
				src: './src/assets/favicon_180x180.png',
				alt: 'AI Foundation Services LLM serving',
			},
			favicon: '/img/favicon_180x180.png',
			// tokens.css is generated from tokens/ (bun run tokens) and loaded last, so the
			// Starlight variables it sets win over the hand-set ones in the other two.
			customCss: ['./src/styles/custom.css', './src/styles/redesign.css', './src/styles/aside.css', './src/styles/button.css', './src/styles/code-block.css', './src/styles/file-tree.css', './src/styles/icons.css', './src/styles/layout.css', './src/styles/notification.css', './src/styles/select.css', './src/styles/sidebar-nav.css', './src/styles/table.css', './src/styles/tag.css', './src/styles/tabs.css', './src/styles/data-table.css', './src/styles/tooltip.css', './src/styles/tokens.css', './src/styles/rhythm.css'],
			expressiveCode: {
				themes: ['github-light', 'github-dark'],
				defaultProps: {
					wrap: true,
					preserveIndent: true,
					hangingIndent: 2,
				},
				// Wrapped lines break only at spaces or at punctuation boundaries,
				// never between two letters or digits (adds <wbr>). Shell blocks
				// get the terminal frame, other blocks their language as the
				// title unless the page gives a real file name (ec-frame-titles.mjs).
				plugins: [ecWrapPoints(), ecFrameTitles()],
			},
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
			},
			sidebar: [
				// Every group starts closed (`collapsed: true`), except the one that
				// holds the current page, which Starlight opens. The chevrons open
				// and close them. See the sidebar-state script in `head`.
				{
					label: 'Get started',
					translations: { de: 'Erste Schritte' },
					collapsed: true,
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'index' },
						{ label: 'Quickstart', translations: { de: 'Quickstart' }, slug: 'getting-started/quickstart' },
						{ label: 'Coding agent setup', translations: { de: 'Coding-Agenten einrichten' }, slug: 'getting-started/coding-agents' },
						{ label: 'Recommended models', translations: { de: 'Empfohlene Modelle' }, slug: 'getting-started/choosing-a-model' },
						{ label: 'Migrate from OpenAI', translations: { de: 'Umstieg von OpenAI' }, slug: 'guides/migrate-from-openai' },
						{ label: 'Migrate to the new API', translations: { de: 'Umstieg auf die neue API' }, slug: 'api-transition', badge: { text: { en: 'New', de: 'Neu' }, variant: 'tip' } },
					],
				},
				{
					label: 'Models',
					translations: { de: 'Modelle' },
					collapsed: true,
					items: [
						{ label: 'All models', translations: { de: 'Alle Modelle' }, slug: 'models' },
						{ label: 'Chat & reasoning', translations: { de: 'Chat & Reasoning' }, slug: 'models/llms' },
						{ label: 'Coding', translations: { de: 'Coding' }, slug: 'models/coding' },
						{ label: 'Vision', translations: { de: 'Vision' }, slug: 'models/vision' },
						{ label: 'OCR', translations: { de: 'OCR' }, slug: 'models/ocr' },
						{ label: 'Decisions', translations: { de: 'Decisions' }, slug: 'models/decisions' },
						{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'models/embeddings' },
						{ label: 'Speech-to-text', translations: { de: 'Spracherkennung' }, slug: 'models/audio' },
						{ label: 'Image generation', translations: { de: 'Bildgenerierung' }, slug: 'models/image-generation' },
						{ label: 'Preview models', translations: { de: 'Vorschau-Modelle' }, slug: 'models/preview' },
					],
				},
				{
					label: 'API usage',
					translations: { de: 'API-Nutzung' },
					collapsed: true,
					items: [
						{ label: 'Authentication', translations: { de: 'Authentifizierung' }, slug: 'getting-started/authentication' },
						{ label: 'Chat', translations: { de: 'Chat' }, slug: 'guides/chat-completions' },
						{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'guides/streaming' },
						{ label: 'Function calling', translations: { de: 'Function Calling' }, slug: 'guides/function-calling' },
						{ label: 'Structured outputs', translations: { de: 'Strukturierte Ausgaben' }, slug: 'guides/structured-outputs' },
						{ label: 'Reasoning', translations: { de: 'Reasoning' }, slug: 'guides/reasoning' },
						{ label: 'Image input', translations: { de: 'Bildeingabe' }, slug: 'guides/multimodal' },
						{ label: 'OCR', translations: { de: 'OCR' }, slug: 'guides/ocr' },
						{ label: 'Embeddings & RAG', translations: { de: 'Embeddings & RAG' }, slug: 'guides/embeddings' },
						{ label: 'Reranking', translations: { de: 'Reranking' }, slug: 'guides/reranking' },
						{ label: 'Decisions', translations: { de: 'Decisions' }, slug: 'guides/decisions', badge: { text: { en: 'Preview', de: 'Vorschau' }, variant: 'note' } },
						{ label: 'Prefix caching', translations: { de: 'Prefix Caching' }, slug: 'guides/prefix-caching' },
						{ label: 'Errors & reliability', translations: { de: 'Fehler & Zuverlässigkeit' }, slug: 'guides/reliability' },
						{ label: 'API reference', translations: { de: 'API-Referenz' }, slug: 'reference/api-endpoints' },
					],
				},
				{
					label: 'Integrations',
					translations: { de: 'Integrationen' },
					collapsed: true,
					items: [
						{ label: 'LangChain', translations: { de: 'LangChain' }, slug: 'integrations/langchain' },
						{ label: 'LlamaIndex', translations: { de: 'LlamaIndex' }, slug: 'integrations/llama-index' },
						{ label: 'AI Engineer', translations: { de: 'AI Engineer' }, slug: 'aie/overview' },
					],
				},
				{
					label: 'Trust & compliance',
					translations: { de: 'Vertrauen & Compliance' },
					collapsed: true,
					items: [
						{ label: 'Enterprise Trust & certifications', translations: { de: 'Enterprise Trust & Zertifizierungen' }, slug: 'reference/enterprise-trust' },
						{ label: 'Service levels', translations: { de: 'Service-Level' }, slug: 'reference/service-levels' },
					],
				},
				{
					label: 'Plans & pricing',
					translations: { de: 'Tarife & Preise' },
					collapsed: true,
					items: [
						{ label: 'Plans', translations: { de: 'Tarife' }, slug: 'plans' },
						{ label: 'Dedicated serving', translations: { de: 'Dedicated Serving' }, slug: 'plans/dedicated' },
						{ label: 'Rate limits', translations: { de: 'Rate-Limits' }, slug: 'reference/rate-limits' },
					],
				},
				{
					label: 'Resources',
					translations: { de: 'Ressourcen' },
					collapsed: true,
					items: [
						{ label: 'Changelog', translations: { de: 'Änderungsprotokoll' }, slug: 'changelog' },
						{ label: 'Deprecations', translations: { de: 'Abkündigungen' }, slug: 'models/deprecations' },
						{ label: 'FAQ', translations: { de: 'FAQ' }, slug: 'faq' },
						{ label: 'Glossary', translations: { de: 'Glossar' }, slug: 'getting-started/concepts' },
					],
				},
		],
		}),
		archiveSnapshots(),
	],
});
