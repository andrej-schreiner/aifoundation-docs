// @ts-check
import rehypeTableScroll from './src/plugins/rehype-table-scroll.mjs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightVersions from 'starlight-versions';

// https://astro.build/config
export default defineConfig({
	markdown: {
		rehypePlugins: [rehypeTableScroll],
	},
	site: 'https://docs.llmhub.t-systems.net',
	base: '/',
	redirects: {
		'/Quickstart': '/getting-started/quickstart',
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
	},
	integrations: [
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
				Footer: './src/components/Footer.astro',
				Header: './src/components/SiteHeader.astro',
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
					versions: [
						{ slug: 'v1', label: 'v1.0.0' },
						{ slug: 'v1-1-0', label: 'v1.1.0' },
						{ slug: 'v1-2-0', label: 'v1.2.0' },
					],
				}),
			],
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
			},
			sidebar: [
				{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'index' },
				{
					label: 'Getting Started',
					translations: { de: 'Erste Schritte' },
					items: [
						{ label: 'Quickstart', translations: { de: 'Quickstart' }, slug: 'getting-started/quickstart' },
						{ label: 'Authentication', translations: { de: 'Authentifizierung' }, slug: 'getting-started/authentication' },
					],
				},
				{
					label: 'Guides',
					translations: { de: 'Anleitungen' },
					items: [
						{ label: 'Chat Completions', translations: { de: 'Chat Completions' }, slug: 'guides/chat-completions' },
						{ label: 'Prefix Caching', translations: { de: 'Prefix Caching' }, slug: 'guides/prefix-caching' },
						{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'guides/streaming' },
						{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'guides/embeddings' },
						{ label: 'Multimodal', translations: { de: 'Multimodal' }, slug: 'guides/multimodal' },
						{ label: 'OCR', translations: { de: 'OCR' }, slug: 'guides/ocr' },
						{ label: 'Audio', translations: { de: 'Audio' }, slug: 'guides/audio' },
						{ label: 'Function Calling', translations: { de: 'Function Calling' }, slug: 'guides/function-calling' },
						{ label: 'Decisions', translations: { de: 'Decisions' }, slug: 'guides/decisions' },
						{ label: 'Image Generation', translations: { de: 'Image Generation' }, slug: 'guides/image-generation' },
						{ label: 'Reasoning', translations: { de: 'Reasoning' }, slug: 'guides/reasoning' },
						{ label: 'Visual RAG', translations: { de: 'Visual RAG' }, slug: 'guides/visual-rag' },
						{ label: 'Queued Requests', translations: { de: 'Queued Requests' }, slug: 'guides/queued-requests' },
					],
				},
				{
					label: 'Integrations',
					translations: { de: 'Integrationen' },
					items: [
						{ label: 'LangChain', translations: { de: 'LangChain' }, slug: 'integrations/langchain' },
						{ label: 'Llama Index', translations: { de: 'Llama Index' }, slug: 'integrations/llama-index' },
					],
				},
				{ label: 'AI Engineer', translations: { de: 'AI Engineer' }, slug: 'aie/overview' },
				{
					label: 'Models',
					translations: { de: 'Modelle' },
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'models' },
						{ label: 'Comparison', translations: { de: 'Vergleich' }, slug: 'models/comparison' },
						{
							label: 'Active Models',
							translations: { de: 'Aktive Modelle' },
							items: [
								{ label: 'Chat & Reasoning (LLMs)', translations: { de: 'Chat & Reasoning (LLMs)' }, slug: 'models/llms' },
								{ label: 'Coding', translations: { de: 'Coding' }, slug: 'models/coding' },
								{ label: 'Vision', translations: { de: 'Vision' }, slug: 'models/vision' },
								{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'models/embeddings' },
								{ label: 'Audio (Speech-to-Text)', translations: { de: 'Audio (Sprache-zu-Text)' }, slug: 'models/audio' },
								{ label: 'Image Generation', translations: { de: 'Bildgenerierung' }, slug: 'models/image-generation' },
							],
						},
						{ label: 'Scheduled for Retirement', translations: { de: 'Zur Stilllegung vorgesehen' }, slug: 'models/scheduled-for-retirement' },
						{ label: 'Retired Models', translations: { de: 'Stillgelegte Modelle' }, slug: 'models/retired' },
					],
				},
				{
					label: 'Reference',
					translations: { de: 'Referenz' },
					items: [
						{ label: 'API Endpoints', translations: { de: 'API-Endpunkte' }, slug: 'reference/api-endpoints' },
						{ label: 'Error Codes', translations: { de: 'Fehlercodes' }, slug: 'reference/error-codes' },
						{ label: 'Rate Limits', translations: { de: 'Rate-Limits' }, slug: 'reference/rate-limits' },
						{ label: 'Service Levels', translations: { de: 'Service-Level' }, slug: 'reference/service-levels' },
						{ label: 'Enterprise Trust', translations: { de: 'Enterprise Trust' }, slug: 'reference/enterprise-trust' },
					],
				},
				{
					label: 'API Transition',
					translations: { de: 'API-Umstellung' },
					items: [
						{ label: 'Overview', translations: { de: 'Überblick' }, slug: 'api-transition' },
						{ label: 'Requests', translations: { de: 'Anfragen' }, slug: 'api-transition/requests' },
						{ label: 'Responses', translations: { de: 'Antworten' }, slug: 'api-transition/responses' },
						{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'api-transition/streaming' },
						{ label: 'Error Handling', translations: { de: 'Fehlerbehandlung' }, slug: 'api-transition/errors' },
					],
				},
				{ label: 'SmartChat', translations: { de: 'SmartChat' }, slug: 'smartchat/overview' },
				{
					label: 'Plans & Pricing',
					translations: { de: 'Tarife & Preise' },
					items: [
						{ label: 'Plans Overview', translations: { de: 'Tarifübersicht' }, slug: 'plans' },
						{ label: 'Shared vs Dedicated LLM Serving', translations: { de: 'Shared vs. Dedicated LLM Serving' }, slug: 'plans/service-models' },
						{ label: 'Dedicated LLM Serving', translations: { de: 'Dedicated LLM Serving' }, slug: 'plans/dedicated' },
						{ label: 'Essential', translations: { de: 'Essential' }, slug: 'plans/essential' },
						{ label: 'Professional', translations: { de: 'Professional' }, slug: 'plans/professional' },
						{ label: 'Agentic', translations: { de: 'Agentic' }, slug: 'plans/agentic' },
						{ label: 'Test / Preview', translations: { de: 'Test / Vorschau' }, slug: 'plans/test' },
						// { label: 'Basic', translations: { de: 'Basic' }, slug: 'plans/basic' },
						// { label: 'Standard 1000', translations: { de: 'Standard 1000' }, slug: 'plans/standard-1000' },
						// { label: 'Standard 2000', translations: { de: 'Standard 2000' }, slug: 'plans/standard-2000' },
						// { label: 'Standard 3000', translations: { de: 'Standard 3000' }, slug: 'plans/standard-3000' },
						// { label: 'Standard 4000', translations: { de: 'Standard 4000' }, slug: 'plans/standard-4000' },
					],
				},
				{ label: 'Changelog', translations: { de: 'Änderungsprotokoll' }, slug: 'changelog' },
				{ label: 'FAQ', translations: { de: 'FAQ' }, slug: 'faq' },
				{
					label: 'Links',
					translations: { de: 'Links' },
					items: [
						// These open another site. src/styles/icons.css adds Telekom's external-link
						// icon after the label; it is decoration, so `aria-label` carries the name
						// AND the "(opens in new tab)" hint. `rel="noopener noreferrer"` is the
						// security-required pairing for `target="_blank"`.
						{ label: 'Try SmartChat', translations: { de: 'SmartChat testen' }, link: 'https://public.oweb-chat.llmhub.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Try SmartChat (opens in new tab)' } },
						{ label: 'LLM Playground', translations: { de: 'LLM Playground' }, link: 'https://playground.llmhub.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'LLM Playground (opens in new tab)' } },
						{ label: 'Model Status', translations: { de: 'Model Status' }, link: 'https://uptime.llmhub.t-systems.net/status/health', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Model Status (opens in new tab)' } },
						{ label: 'Service Description (PDF)', translations: { de: 'Leistungsbeschreibung (PDF)' }, link: 'https://docs.llmhub.t-systems.net/files/Leistungsbeschreibung_LLM_Serving-Service_EN.pdf', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Service Description PDF (opens in new tab)' } },
					],
				},
			],
		}),
	],
});
