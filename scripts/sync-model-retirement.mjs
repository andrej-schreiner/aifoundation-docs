/**
 * Writes src/data/model-retirement.json from the retirement table in
 * src/content/docs/models/scheduled-for-retirement.mdx so the site can import
 * it without reading the filesystem at render time.
 *
 * Models with a retirement date on or before 2026-10-31 are deprecated.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DEPRECATION_ON_OR_BEFORE = '2026-10-31';
const source = new URL('../src/content/docs/models/scheduled-for-retirement.mdx', import.meta.url);
const text = readFileSync(source, 'utf8');
const entries = [];

for (const line of text.split('\n')) {
  const match = line.match(
    /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|$/,
  );
  if (!match) continue;
  const date = match[3];
  const replacement = match[4].trim();
  const status = date <= DEPRECATION_ON_OR_BEFORE ? 'deprecated' : 'retiring';
  for (const displayName of match[2].split('/').map((part) => part.trim()).filter(Boolean)) {
    entries.push({ displayName, date, replacement, status });
  }
}

if (entries.length === 0) {
  throw new Error('No retirement rows parsed from scheduled-for-retirement.mdx');
}

const out = new URL('../src/data/model-retirement.json', import.meta.url);
writeFileSync(out, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${entries.length} retirement entries`);
