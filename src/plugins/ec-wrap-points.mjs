// Expressive Code plugin: a wrapped code line may break only at spaces or at
// punctuation boundaries, never between two letters or digits (code-block.css
// no longer breaks inside tokens). It puts an empty <wbr> at each break point
// that has a non-space character on both sides (rules in wrap-points.mjs).
// So `api_key_here` can wrap as `api_` / `key_` / `here`, and
// `{"location":"Hamburg"}` as `{"location":` / `"Hamburg"}`. The copy button
// is unaffected: plugin-frames copies codeBlock.code (the source text), not
// the rendered DOM.
import { wrapOffsets } from './wrap-points.mjs';

function wbr() {
	return { type: 'element', tagName: 'wbr', properties: {}, children: [] };
}

// Wrap a line's leading spaces in <span class="ec-lead"> so code-block.css can
// narrow deep indentation on phones (the spaces stay in the DOM and in copies).
function markLeadingIndent(lineAst) {
	let node = lineAst;
	while (node?.children?.length) {
		const first = node.children[0];
		if (first.type === 'text') {
			const lead = first.value.match(/^ {2,}/)?.[0];
			if (!lead) return;
			const rest = first.value.slice(lead.length);
			const span = { type: 'element', tagName: 'span', properties: { className: ['ec-lead'] }, children: [{ type: 'text', value: lead }] };
			node.children.splice(0, 1, span, ...(rest ? [{ type: 'text', value: rest }] : []));
			return;
		}
		if (first.type !== 'element') return;
		const cls = first.properties?.className;
		if (Array.isArray(cls) && cls.includes('gutter')) node = node.children[1];
		else node = first;
	}
}

// Text nodes of a line in order, skipping gutters (line numbers, diff markers).
function textNodes(node, out = []) {
	const className = node.properties?.className;
	if (Array.isArray(className) && className.includes('gutter')) return out;
	for (const child of node.children ?? []) {
		if (child.type === 'text') out.push({ parent: node, node: child });
		else textNodes(child, out);
	}
	return out;
}

// Break points are found on the whole line's text, so a boundary between two
// syntax-highlighting spans (e.g. `)` + `\]`) counts like any other.
function addWrapPoints(lineAst) {
	const nodes = textNodes(lineAst);
	const text = nodes.map((n) => n.node.value).join('');
	const sorted = wrapOffsets(text);
	if (sorted.length === 0) return;
	let base = 0;
	for (const { parent, node } of nodes) {
		const value = node.value;
		const inside = sorted.filter((o) => o > base && o < base + value.length).map((o) => o - base);
		// A break at a node's start goes before the node.
		const atStart = sorted.includes(base) && base > 0;
		const parts = [];
		if (atStart) parts.push(wbr());
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

export function ecWrapPoints() {
	return {
		name: 'aifs-wrap-points',
		hooks: {
			postprocessRenderedLine: ({ renderData }) => {
				markLeadingIndent(renderData.lineAst);
				addWrapPoints(renderData.lineAst);
			},
		},
	};
}
