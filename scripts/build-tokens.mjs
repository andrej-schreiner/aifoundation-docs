#!/usr/bin/env node
// Builds src/styles/tokens.css from the design tokens in tokens/. Run with
// `bun run tokens` after changing a token file; the generated CSS is committed.
//
// The tokens are DTCG 2025.10 files, resolved the way tokens/aifs.resolver.json
// describes: its sets and modifier contexts are merged in resolutionOrder, once
// per theme, and every alias is followed to its value.
//
// Output, per theme (Starlight's data-theme attribute on <html>):
// - every docs token (aifs.*) as --aifs-<path>, e.g. aifs.color.link.standard
//   becomes --aifs-color-link-standard. Typography tokens become one variable
//   per property: --aifs-text-h2-font-size, -font-weight, -line-height.
// - every Starlight variable a docs token names in
//   $extensions["net.t-systems.aifs"].css, set to var(--aifs-…).
//
// The file is loaded after custom.css and redesign.css, so its Starlight
// variables win over the hand-set ones there.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokensDir = resolve(root, 'tokens');
const outFile = resolve(root, 'src/styles/tokens.css');
const VENDOR = 'net.t-systems.aifs';
const ALIAS = /^\{([^{}]+)\}$/;

const readJson = async (file) => JSON.parse(await readFile(resolve(tokensDir, file), 'utf8'));
const resolver = await readJson('aifs.resolver.json');

// Flattens a token file into { 'a.b.c': { type, value, css, property } },
// with group $type inherited by the tokens inside.
function flatten(group, path = [], inheritedType, out = {}) {
	const type = group.$type ?? inheritedType;
	for (const [key, node] of Object.entries(group)) {
		if (key.startsWith('$') || typeof node !== 'object') continue;
		if ('$value' in node) {
			const ext = node.$extensions?.[VENDOR] ?? {};
			out[[...path, key].join('.')] = {
				type: node.$type ?? type,
				value: node.$value,
				css: ext.css ?? [],
				property: ext.property,
			};
		} else {
			flatten(node, [...path, key], type, out);
		}
	}
	return out;
}

async function tokensFor(theme) {
	const tokens = {};
	for (const { $ref } of resolver.resolutionOrder) {
		const [, kind, name] = $ref.split('/');
		const sources = kind === 'sets' ? resolver.sets[name].sources : resolver.modifiers[name].contexts[theme];
		for (const source of sources) Object.assign(tokens, flatten(await readJson(source.$ref)));
	}
	const resolveValue = (value, seen = []) => {
		const alias = typeof value === 'string' && value.match(ALIAS);
		if (alias) {
			const name = alias[1];
			if (seen.includes(name)) throw new Error(`Circular alias: ${[...seen, name].join(' → ')}`);
			if (!tokens[name]) throw new Error(`Unknown token {${name}}`);
			return resolveValue(tokens[name].value, [...seen, name]);
		}
		if (value && typeof value === 'object' && !Array.isArray(value) && !('colorSpace' in value)) {
			return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(v, seen)]));
		}
		return value;
	};
	return { tokens, resolveValue };
}

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function css(type, value) {
	switch (type) {
		case 'color': {
			if (value.alpha === undefined || value.alpha === 1) return value.hex;
			const [r, g, b] = value.components.map((c) => Math.round(c * 255));
			return `rgb(${r} ${g} ${b} / ${value.alpha})`;
		}
		case 'dimension':
		case 'duration':
			return `${value.value}${value.unit}`;
		case 'cubicBezier':
			return `cubic-bezier(${value.join(', ')})`;
		case 'fontFamily':
			return [value]
				.flat()
				.map((f) => (/^[\w-]+$/.test(f) ? f : `'${f}'`))
				.join(', ');
		default:
			return String(value);
	}
}

// One variable per token, or one per property for typography composites.
function declarations(name, token, resolveValue) {
	const base = `--${name.replaceAll('.', '-')}`;
	const value = resolveValue(token.value);
	if (token.type === 'typography') {
		const types = { fontFamily: 'fontFamily', fontSize: 'dimension', fontWeight: 'fontWeight', letterSpacing: 'dimension', lineHeight: 'number' };
		const vars = Object.entries(value).map(([prop, v]) => [`${base}-${kebab(prop)}`, css(types[prop], v)]);
		const starlight = token.css.map((v) => [v, `var(${base}-${kebab(token.property)})`]);
		return { vars, starlight };
	}
	return { vars: [[base, css(token.type, value)]], starlight: token.css.map((v) => [v, `var(${base})`]) };
}

const block = (selector, lines) => `${selector} {\n${lines.map(([k, v]) => `\t${k}: ${v};`).join('\n')}\n}`;

const themes = Object.keys(resolver.modifiers.theme.contexts);
const sections = [];
for (const theme of themes) {
	const { tokens, resolveValue } = await tokensFor(theme);
	const vars = [];
	const starlight = [];
	for (const [name, token] of Object.entries(tokens)) {
		if (!name.startsWith('aifs.')) continue;
		const d = declarations(name, token, resolveValue);
		vars.push(...d.vars);
		starlight.push(...d.starlight);
	}
	sections.push(`/* ${theme} */\n${block(`:root[data-theme='${theme}']`, [...vars, ...starlight])}`);
}

const header = `/* Generated by scripts/build-tokens.mjs from tokens/. Do not edit: change the
   token files and run \`bun run tokens\`. */`;
await writeFile(outFile, `${header}\n\n${sections.join('\n\n')}\n`);
console.log(`Wrote ${outFile.replace(`${root}/`, '')} (${themes.join(', ')})`);
