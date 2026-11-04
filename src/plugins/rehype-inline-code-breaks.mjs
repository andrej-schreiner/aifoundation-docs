// Inline code (a <code> outside <pre>) may wrap only at spaces or at
// punctuation boundaries, never between two letters or digits. Puts an empty
// <wbr> at each wrap point (rules in wrap-points.mjs), so `/models/{model_id}`
// can wrap as `/models/` / `{model_id}` while `400` stays whole. With
// overflow-wrap: break-word (table.css, redesign.css) a token's min-content
// width is its longest piece between wrap points, so table columns size to it.
// Code blocks are left to the Expressive Code plugin (ec-wrap-points.mjs).
//
// Inline code or link text that is just a URL or hostname gets no wrap points
// and the class aifs-url instead (redesign.css): it stays on one line, and
// breaks only when it is wider than the column. Table cells keep the wrap
// points: a column sizes to its longest piece, and two URLs side by side may
// not fit the fluid column on a narrow window, so there a URL breaks only
// after a dot between host labels or before a `/`.
import { noBreakRanges, splitNoBreak, wrapOffsets } from './wrap-points.mjs';

function wbr() {
	return { type: 'element', tagName: 'wbr', properties: {}, children: [] };
}

// Text for one piece; a hyphenated URL host label goes in a nowrap span.
function pieces(value, start, ranges) {
	return splitNoBreak(value, start, ranges).map((seg) =>
		seg.nowrap
			? { type: 'element', tagName: 'span', properties: { className: ['nowrap'] }, children: [{ type: 'text', value: seg.text }] }
			: { type: 'text', value: seg.text },
	);
}

// `https://llm-server.llmhub.t-systems.net/v2`, `llm-server.ai.t-systems.net`.
// A bare host in code needs a known top-level domain (so `main.py` is not
// one); link text may end in any (`paddlepaddle.org.cn`).
const URL_TEXT = /^[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+$/i;
const CODE_HOST = /^(?:[a-z0-9-]+\.)+(?:net|com|de|org|io|dev|eu|ai)(?::\d+)?(?:\/[^\s<>"'`]*)?$/i;
const LINK_HOST = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s<>"'`]*)?$/i;

function textOf(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textOf).join('');
}

function markUrl(node, host) {
	const text = textOf(node).trim();
	if (!URL_TEXT.test(text) && !host.test(text)) return false;
	const current = node.properties?.className;
	const list = Array.isArray(current) ? current : current ? [current] : [];
	node.properties = { ...node.properties, className: [...list, 'aifs-url'] };
	return true;
}

function textNodes(node, out = []) {
	for (const child of node.children ?? []) {
		if (child.type === 'text') out.push({ parent: node, node: child });
		else if (child.type === 'element') textNodes(child, out);
	}
	return out;
}

// Wrap points are found on the code element's whole text, so a boundary
// between two child nodes counts like any other.
function addWrapPoints(code) {
	const nodes = textNodes(code);
	const text = nodes.map((n) => n.node.value).join('');
	// An ellipsis (`/v1/...`) stays whole: no break between two dots.
	const sorted = wrapOffsets(text).filter((o) => !(text[o - 1] === '.' && text[o] === '.'));
	const ranges = noBreakRanges(text);
	if (sorted.length === 0 && ranges.length === 0) return;
	let base = 0;
	for (const { parent, node } of nodes) {
		const value = node.value;
		const inside = sorted.filter((o) => o > base && o < base + value.length).map((o) => o - base);
		// A break at a node's start goes before the node.
		const parts = sorted.includes(base) && base > 0 ? [wbr()] : [];
		let from = 0;
		for (const o of inside) {
			parts.push(...pieces(value.slice(from, o), base + from, ranges), wbr());
			from = o;
		}
		parts.push(...pieces(value.slice(from), base + from, ranges));
		if (parts.length > 1 || parts[0].type !== 'text') parent.children.splice(parent.children.indexOf(node), 1, ...parts);
		base += value.length;
	}
}

export default function rehypeInlineCodeBreaks() {
	const walk = (node, inCell) => {
		for (const child of node.children ?? []) {
			if (child.type !== 'element' || child.tagName === 'pre') continue;
			if (child.tagName === 'code') {
				if (inCell || !markUrl(child, CODE_HOST)) addWrapPoints(child);
			} else {
				if (child.tagName === 'a' && !inCell) markUrl(child, LINK_HOST);
				walk(child, inCell || child.tagName === 'td' || child.tagName === 'th');
			}
		}
	};
	return (tree) => {
		walk(tree, false);
	};
}
