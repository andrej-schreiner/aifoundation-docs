// Inline code (a <code> outside <pre>) may wrap only at spaces or at
// punctuation boundaries, never between two letters or digits. Puts an empty
// <wbr> at each wrap point (rules in wrap-points.mjs), so `/models/{model_id}`
// can wrap as `/models/` / `{model_id}` while `400` stays whole. With
// overflow-wrap: break-word (table.css, redesign.css) a token's min-content
// width is its longest piece between wrap points, so table columns size to it.
// Code blocks are left to the Expressive Code plugin (ec-wrap-points.mjs).
import { wrapOffsets } from './wrap-points.mjs';

function wbr() {
	return { type: 'element', tagName: 'wbr', properties: {}, children: [] };
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
	const sorted = wrapOffsets(nodes.map((n) => n.node.value).join(''));
	if (sorted.length === 0) return;
	let base = 0;
	for (const { parent, node } of nodes) {
		const value = node.value;
		const inside = sorted.filter((o) => o > base && o < base + value.length).map((o) => o - base);
		// A break at a node's start goes before the node.
		const parts = sorted.includes(base) && base > 0 ? [wbr()] : [];
		let from = 0;
		for (const o of inside) {
			parts.push({ type: 'text', value: value.slice(from, o) }, wbr());
			from = o;
		}
		parts.push({ type: 'text', value: value.slice(from) });
		if (parts.length > 1) parent.children.splice(parent.children.indexOf(node), 1, ...parts);
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
