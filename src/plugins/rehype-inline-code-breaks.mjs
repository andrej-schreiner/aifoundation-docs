// Inline code (a <code> outside <pre>) may wrap only at spaces or at
// punctuation boundaries, never between two letters or digits. Puts an empty
// <wbr> at each wrap point (rules in wrap-points.mjs), so `/models/{model_id}`
// can wrap as `/models/` / `{model_id}` while `400` stays whole. With
// overflow-wrap: break-word (table.css, redesign.css) a token's min-content
// width is its longest piece between wrap points, so table columns size to it.
// Code blocks are left to the Expressive Code plugin (ec-wrap-points.mjs).
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
	const walk = (node) => {
		for (const child of node.children ?? []) {
			if (child.type !== 'element' || child.tagName === 'pre') continue;
			if (child.tagName === 'code') addWrapPoints(child);
			else walk(child);
		}
	};
	return (tree) => walk(tree);
}
