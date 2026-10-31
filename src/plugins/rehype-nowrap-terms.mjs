// Terms with a hyphen that must never split at it: "T-Cloud" and the
// certificate number "DS-1221076/1". Wraps each occurrence in prose text in
// <span class="nowrap"> (layout.css). Code, pre, script and style are left
// alone, as are attributes (only text nodes change). Archived pages (paths
// under /v1…) are skipped, so their markup stays as it was.
const TERMS = /T-Cloud|DS-1221076\/1/g;
const SKIP = new Set(['code', 'pre', 'script', 'style', 'kbd', 'samp']);

function isNowrap(node) {
	const className = node.properties?.className;
	const list = Array.isArray(className) ? className : className ? [className] : [];
	return list.includes('nowrap');
}

function split(value) {
	const parts = [];
	let from = 0;
	for (const match of value.matchAll(TERMS)) {
		if (match.index > from) parts.push({ type: 'text', value: value.slice(from, match.index) });
		parts.push({
			type: 'element',
			tagName: 'span',
			properties: { className: ['nowrap'] },
			children: [{ type: 'text', value: match[0] }],
		});
		from = match.index + match[0].length;
	}
	if (parts.length === 0) return null;
	if (from < value.length) parts.push({ type: 'text', value: value.slice(from) });
	return parts;
}

export default function rehypeNowrapTerms() {
	const walk = (node) => {
		const children = node.children;
		if (!children) return;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			if (child.type === 'text') {
				const parts = split(child.value);
				if (parts) {
					children.splice(i, 1, ...parts);
					i += parts.length - 1;
				}
			} else if (child.type === 'element') {
				if (SKIP.has(child.tagName) || isNowrap(child)) continue;
				walk(child);
			} else if (child.children) {
				walk(child);
			}
		}
	};
	return (tree, file) => {
		const path = String(file?.path ?? '').replaceAll('\\', '/');
		if (/\/content\/docs\/(?:de\/)?v1[^/]*\//.test(path)) return;
		walk(tree);
	};
}
