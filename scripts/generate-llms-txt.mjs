/**
 * Regenerates public/llms.txt from the current sidebar and page descriptions.
 * Archived versions, removed fine-tuning, and the old SmartChat API reference
 * are not part of the current sidebar, so they are not emitted.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { availableModelCount } from '../src/data/catalog.mjs';

const SITE = 'https://docs.llmhub.t-systems.net';
const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
const sidebarStart = config.indexOf('sidebar: [');
const sidebar = config.slice(sidebarStart);

const pages = [];
for (const line of sidebar.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) continue;
  const match = line.match(/label: '([^']+)'.*slug: '([^']+)'/);
  if (!match) continue;
  pages.push({ label: match[1], slug: match[2] });
}

function pageFile(slug) {
  const candidates = slug === 'index'
    ? [new URL('../src/content/docs/index.mdx', import.meta.url)]
    : [
        new URL(`../src/content/docs/${slug}.mdx`, import.meta.url),
        new URL(`../src/content/docs/${slug}/index.mdx`, import.meta.url),
      ];
  const found = candidates.find((url) => existsSync(url));
  if (!found) throw new Error(`No content file for sidebar slug ${slug}`);
  return found;
}

function descriptionFor(slug) {
  const text = readFileSync(pageFile(slug), 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return '';
  const line = frontmatter[1].match(/^description:\s*(.+)$/m);
  if (!line) return '';
  let value = line[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

const lines = [
  '# AI Foundation Services',
  '',
  `> Sovereign, GDPR-compliant LLM inference API by T-Systems. OpenAI-compatible. ${availableModelCount} models on a single endpoint (count excludes models deprecated for retirement on 2026-10-31).`,
  '',
  '## Docs',
  '',
];

for (const page of pages) {
  const path = page.slug === 'index' ? '/' : `/${page.slug}`;
  const description = descriptionFor(page.slug);
  const suffix = description ? `: ${description}` : '';
  lines.push(`- [${page.label}](${SITE}${path})${suffix}`);
}

lines.push(
  '',
  '## Optional',
  '',
  `- [German docs](${SITE}/de/): Full documentation in German.`,
  '',
);

writeFileSync(new URL('../public/llms.txt', import.meta.url), lines.join('\n'));
console.log(`Wrote public/llms.txt (${pages.length} pages, ${availableModelCount} models)`);
