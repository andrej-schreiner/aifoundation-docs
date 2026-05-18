// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightVersions from 'starlight-versions';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.llmhub.t-systems.net',
	base: '/',
	redirects: {
		'/Quickstart': '/getting-started/quickstart',
		'/Introduction': '/',
		'/Model Serving/langchain': '/integrations/langchain',
		'/Services and Pricing': '/plans',
		'/guides/fine-tuning': '/changelog',
		'/de/guides/fine-tuning': '/de/changelog',
		'/getting-started/models': '/models',
		'/de/getting-started/models': '/de/models',
	},
	integrations: [
		starlight({
			title: 'AI Foundation Services',
			components: {
				Footer: './src/components/Footer.astro',
			},
			logo: {
				src: './src/assets/favicon_180x180.png',
				alt: 'AI Foundation Services LLM serving',
			},
			favicon: '/img/favicon_180x180.png',
			customCss: ['./src/styles/custom.css'],
			expressiveCode: {
				themes: ['dracula'],
			},
			plugins: [
				starlightVersions({
					versions: [
						{ slug: 'v1', label: 'v1.0.0' },
						{ slug: 'v1-1-0', label: 'v1.1.0' },
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
						{ label: 'Streaming', translations: { de: 'Streaming' }, slug: 'guides/streaming' },
						{ label: 'Embeddings', translations: { de: 'Embeddings' }, slug: 'guides/embeddings' },
						{ label: 'Multimodal', translations: { de: 'Multimodal' }, slug: 'guides/multimodal' },
						{ label: 'Audio', translations: { de: 'Audio' }, slug: 'guides/audio' },
						{ label: 'Function Calling', translations: { de: 'Function Calling' }, slug: 'guides/function-calling' },
						{ label: 'Image Generation', translations: { de: 'Image Generation' }, slug: 'guides/image-generation' },
						{ label: 'Reasoning', translations: { de: 'Reasoning' }, slug: 'guides/reasoning' },
						{ label: 'Visual RAG', translations: { de: 'Visual RAG' }, slug: 'guides/visual-rag' },
						{ label: 'Asynchronous Requests', translations: { de: 'Asynchronous Requests' }, slug: 'guides/asynchronous-requests' },
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
				{
					label: 'Plugins',
					translations: { de: 'Plugins' },
					items: [
						{ label: 'Cline', translations: { de: 'Cline' }, slug: 'plugins/cline' },
						{ label: 'Continue for VS Code', translations: { de: 'Continue für VS Code' }, slug: 'plugins/continue-vscode' },
						{ label: 'Continue for JetBrains', translations: { de: 'Continue für JetBrains' }, slug: 'plugins/continue-jetbrains' },
						{ label: 'OpenCode', translations: { de: 'OpenCode' }, slug: 'plugins/opencode' },
						{ label: 'Roo Code', translations: { de: 'Roo Code' }, slug: 'plugins/roo-code' },
					],
				},
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
					label: 'SmartChat',
					translations: { de: 'SmartChat' },
					items: [
						{ label: 'SmartChat Overview', translations: { de: 'SmartChat Overview' }, slug: 'smartchat/overview' },
						{ label: 'RAG API Reference', translations: { de: 'RAG API Reference' }, slug: 'smartchat/api-reference' },
						{ label: 'Local Chat', translations: { de: 'Local Chat' }, slug: 'smartchat/local-chat' },
						{ label: 'Global Chat', translations: { de: 'Global Chat' }, slug: 'smartchat/global-chat' },
					],
				},
				{
					label: 'Plans & Pricing',
					translations: { de: 'Tarife & Preise' },
					items: [
						{ label: 'Plans Overview', translations: { de: 'Tarifübersicht' }, slug: 'plans' },
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
						// The visible "↗" glyph signals an external link sighted users, but is
						// not announced meaningfully by screen readers (and would read as "north-east arrow").
						// `aria-label` overrides the visible text for AT, so it must include the link's
						// name AND the "(opens in new tab)" hint. `rel="noopener noreferrer"` is
						// the security-required pairing for `target="_blank"`.
						{ label: 'SmartChat ↗', translations: { de: 'SmartChat ↗' }, link: 'https://public.oweb-chat.llmhub.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'SmartChat (opens in new tab)' } },
						{ label: 'LLM Playground ↗', translations: { de: 'LLM Playground ↗' }, link: 'https://playground.llmhub.t-systems.net/', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'LLM Playground (opens in new tab)' } },
						{ label: 'Model Status ↗', translations: { de: 'Model Status ↗' }, link: 'https://uptime.llmhub.t-systems.net/status/health', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Model Status (opens in new tab)' } },
						{ label: 'Service Description (PDF) ↗', translations: { de: 'Leistungsbeschreibung (PDF) ↗' }, link: 'https://docs.llmhub.t-systems.net/files/Leistungsbeschreibung-LLM-Serving-Service.pdf', attrs: { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Service Description PDF (opens in new tab)' } },
					],
				},
			],
		}),
	],
});
