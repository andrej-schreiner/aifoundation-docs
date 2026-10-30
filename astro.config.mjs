// @ts-check
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import rehypeTableScroll from './src/plugins/rehype-table-scroll.mjs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import starlightVersions from 'starlight-versions';
import archivedVersions from './src/redirects/archived-versions.json' with { type: 'json' };

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

// https://astro.build/config
export default defineConfig({
	markdown: {
		rehypePlugins: [rehypeTableScroll],
	},
	site: 'https://docs.llmhub.t-systems.net',
	base: '/',
	redirects: {
		...archivedVersions,
		'/Quickstart': '/',
		'/getting-started/quickstart': '/',
		'/de/getting-started/quickstart': '/de/',
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
		// Renamed when the page stopped describing /queue as asynchronous.
		// Archived versions and external links still use the old path.
		'/guides/asynchronous-requests': '/guides/queued-requests',
		'/de/guides/asynchronous-requests': '/de/guides/queued-requests',
		'/plans/basic': '/plans',
		'/de/plans/basic': '/de/plans',
		'/plans/standard-1000': '/plans',
		'/de/plans/standard-1000': '/de/plans',
		'/plans/standard-2000': '/plans',
		'/de/plans/standard-2000': '/de/plans',
		'/plans/standard-3000': '/plans',
		'/de/plans/standard-3000': '/de/plans',
		'/plans/standard-4000': '/plans',
		'/de/plans/standard-4000': '/de/plans',
		'/plans/test': '/models/preview',
		'/de/plans/test': '/de/models/preview',
		'/plans/service-models': '/plans/dedicated',
		'/de/plans/service-models': '/de/plans/dedicated',
		'/models/comparison': '/models',
		'/de/models/comparison': '/de/models',
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
	},
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/v1-2-0'),
		}),
		starlight({
			title: 'AI Foundation Services',
			head: [
				{
					// Puts "On this page" on the same baseline as the page title.
					// The title's height above the fold varies (notice banners, which
					// can be closed; a title over two lines), so CSS can't know the
					// offset. Measures both baselines and sets --aifs-toc-offset on the
					// root; layout.css applies it as a margin on the sticky column.
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
		const panel = document.querySelector('.main-pane .content-panel');
		if (panel) new ResizeObserver(align).observe(panel);
		wide.addEventListener('change', align);
		document.fonts?.ready.then(align);
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
					content: `(function(){function shrink(){if(!matchMedia('(max-width: 40rem)').matches)return;var host=document.getElementById('tsystems-chat-widget');var root=host&&host.shadowRoot;if(!root||root.getElementById('aifs-launcher-size'))return;var style=document.createElement('style');style.id='aifs-launcher-size';style.textContent='.widget-launcher{width:40px!important;height:40px!important}.widget-launcher svg{width:20px!important;height:20px!important}.widget-container.bottom-right{right:8px;bottom:max(8px,env(safe-area-inset-bottom))}';root.appendChild(style);}var n=0;var t=setInterval(function(){shrink();if(++n>20)clearInterval(t);},250);})();`,
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
					// Theme switches happen at once. Without this, every element with a colour
					// transition (buttons, links in components) fades over 200ms while the page
					// background flips, so labels briefly vanish, e.g. black text on the new
					// black page. The observer runs before the next frame is drawn: it marks
					// <html> with data-theme-switching, which redesign.css uses to switch
					// transitions off, and clears the mark once the new colours are painted.
					tag: 'script',
					content: `(function(){var r=document.documentElement;new MutationObserver(function(){r.setAttribute('data-theme-switching','');requestAnimationFrame(function(){requestAnimationFrame(function(){r.removeAttribute('data-theme-switching');});});}).observe(r,{attributes:true,attributeFilter:['data-theme']});})();`,
				},
			],
			components: {
				Banner: './src/components/ArchiveBanner.astro',
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
			routeMiddleware: './src/starlightRouteData.ts',
			customCss: ['./src/styles/custom.css', './src/styles/redesign.css', './src/styles/aside.css', './src/styles/button.css', './src/styles/code-block.css', './src/styles/file-tree.css', './src/styles/icons.css', './src/styles/layout.css', './src/styles/notification.css', './src/styles/select.css', './src/styles/sidebar-nav.css', './src/styles/table.css', './src/styles/tag.css', './src/styles/tabs.css', './src/styles/tokens.css'],
			expressiveCode: {
				themes: ['github-light', 'github-dark'],
			},
			plugins: [
				starlightVersions({
					versions: [{ slug: 'v1-2-0', label: 'v1.2.0 (Archived)' }],
				}),
			],
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
			},
			sidebar: [
				{
					label: 'Get started',
					translations: { de: 'Erste Schritte' },
					items: [
						{ label: 'Quickstart', translations: { de: 'Quickstart' }, slug: 'index' },
						{ label: 'Authentication', translations: { de: 'Authentifizierung' }, slug: 'getting-started/authentication' },
						{
							label: 'Migrate to New API',
							translations: { de: 'Umstieg auf neue API' },
							badge: { text: { en: 'New', de: 'Neu' }, variant: 'tip' },
							items: [
								{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'api-transition' },
								{ label: 'Requests', translations: { de: 'Anfragen' }, slug: 'api-transition/requests' },
								{ label: 'Responses', translations: { de: 'Antworten' }, slug: 'api-transition/responses' },
								{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'api-transition/streaming' },
								{ label: 'Error handling', translations: { de: 'Fehlerbehandlung' }, slug: 'api-transition/errors' },
							],
						},
					],
				},
				{
					label: 'Models',
					translations: { de: 'Modelle' },
					items: [
						{ label: 'Catalog', translations: { de: 'Katalog' }, slug: 'models' },
						{ label: 'Chat & reasoning', translations: { de: 'Chat & Reasoning' }, slug: 'models/llms' },
						{ label: 'Coding', translations: { de: 'Coding' }, slug: 'models/coding' },
						{ label: 'Vision', translations: { de: 'Vision' }, slug: 'models/vision' },
						{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'models/embeddings' },
						{ label: 'Audio', translations: { de: 'Audio' }, slug: 'models/audio' },
						{ label: 'Images', translations: { de: 'Bilder' }, slug: 'models/image-generation' },
						{ label: 'Preview models', translations: { de: 'Vorschau-Modelle' }, slug: 'models/preview' },
						{ label: 'Deprecations', translations: { de: 'Abkündigungen' }, slug: 'models/deprecations' },
					],
				},
				{
					label: 'Guides',
					translations: { de: 'Anleitungen' },
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'guides' },
						{ label: 'Chat completions', translations: { de: 'Chat Completions' }, slug: 'guides/chat-completions' },
						{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'guides/streaming' },
						{ label: 'Function calling', translations: { de: 'Function Calling' }, slug: 'guides/function-calling' },
						{ label: 'Reasoning', translations: { de: 'Reasoning' }, slug: 'guides/reasoning' },
						{ label: 'Vision', translations: { de: 'Vision' }, slug: 'guides/multimodal' },
						{ label: 'OCR', translations: { de: 'OCR' }, slug: 'guides/ocr', badge: { text: { en: 'Preview', de: 'Vorschau' }, variant: 'note' } },
						{ label: 'Visual RAG', translations: { de: 'Visual RAG' }, slug: 'guides/visual-rag' },
						{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'guides/embeddings' },
						{ label: 'Audio', translations: { de: 'Audio' }, slug: 'guides/audio' },
						{ label: 'Image generation', translations: { de: 'Bildgenerierung' }, slug: 'guides/image-generation' },
						{ label: 'Prefix caching', translations: { de: 'Prefix Caching' }, slug: 'guides/prefix-caching' },
						{ label: 'Queued requests', translations: { de: 'Queued Requests' }, slug: 'guides/queued-requests' },
						{ label: 'Decisions', translations: { de: 'Decisions' }, slug: 'guides/decisions', badge: { text: { en: 'Preview', de: 'Vorschau' }, variant: 'note' } },
					],
				},
				{
					label: 'Integrations',
					translations: { de: 'Integrationen' },
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'integrations' },
						{ label: 'LangChain', translations: { de: 'LangChain' }, slug: 'integrations/langchain' },
						{ label: 'LlamaIndex', translations: { de: 'LlamaIndex' }, slug: 'integrations/llama-index' },
						{
							label: 'Coding tools',
							translations: { de: 'Coding-Tools' },
							items: [
								{ label: 'AI Engineer', translations: { de: 'AI Engineer' }, slug: 'aie/overview' },
								{ label: 'Cline', slug: 'plugins/cline' },
								{ label: 'Continue for VS Code', slug: 'plugins/continue-vscode' },
								{ label: 'Continue for JetBrains', slug: 'plugins/continue-jetbrains' },
								{ label: 'OpenCode', slug: 'plugins/opencode' },
								{ label: 'Roo Code', slug: 'plugins/roo-code' },
							],
						},
					],
				},
				{
					label: 'API reference',
					translations: { de: 'API-Referenz' },
					items: [
						{ label: 'Endpoints', translations: { de: 'Endpunkte' }, slug: 'reference/api-endpoints' },
						{ label: 'Error codes', translations: { de: 'Fehlercodes' }, slug: 'reference/error-codes' },
					],
				},
				{
					label: 'Plans & Pricing',
					translations: { de: 'Tarife & Preise' },
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'plans' },
						{ label: 'Essential', translations: { de: 'Essential' }, slug: 'plans/essential' },
						{ label: 'Professional', translations: { de: 'Professional' }, slug: 'plans/professional' },
						{ label: 'Agentic', translations: { de: 'Agentic' }, slug: 'plans/agentic' },
						{ label: 'Rate limits', translations: { de: 'Rate-Limits' }, slug: 'reference/rate-limits' },
						{ label: 'Dedicated', translations: { de: 'Dedicated' }, slug: 'plans/dedicated' },
					],
				},
				{
					label: 'Trust & SLA',
					translations: { de: 'Vertrauen & SLA' },
					items: [
						{ label: 'Enterprise Trust', translations: { de: 'Enterprise Trust' }, slug: 'reference/enterprise-trust' },
						{ label: 'Service levels', translations: { de: 'Service-Level' }, slug: 'reference/service-levels' },
						{ label: 'Service description (PDF)', translations: { de: 'Leistungsbeschreibung (PDF)' }, link: 'https://docs.llmhub.t-systems.net/files/Leistungsbeschreibung_LLM_Serving-Service_EN.pdf', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Service description PDF (opens in new tab)' } },
					],
				},
				{
					label: 'Resources',
					translations: { de: 'Ressourcen' },
					items: [
						{ label: 'Changelog', translations: { de: 'Änderungsprotokoll' }, slug: 'changelog' },
						{ label: 'FAQ', translations: { de: 'FAQ' }, slug: 'faq' },
						{ label: 'Model status', translations: { de: 'Modellstatus' }, link: 'https://uptime.llmhub.t-systems.net/status/health', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Model status (opens in new tab)' } },
						{ label: 'Playground', translations: { de: 'Playground' }, link: 'https://playground.llmhub.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'LLM Playground (opens in new tab)' } },
						{ label: 'SmartChat docs', translations: { de: 'SmartChat-Doku' }, link: 'https://docs.smartchat.ai.t-systems.net', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'SmartChat docs (opens in new tab)' } },
						{ label: 'AI Engineer docs', translations: { de: 'AI-Engineer-Doku' }, link: 'https://docs.ai-engineer.ai.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'AI Engineer docs (opens in new tab)' } },
					],
				},
		],
		}),
	],
});
