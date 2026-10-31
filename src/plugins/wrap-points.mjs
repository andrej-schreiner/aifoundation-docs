// Where code may wrap: only at spaces or at punctuation boundaries, never
// between two letters or digits. Shared by the Expressive Code plugin (code
// blocks), the rehype plugin (inline code in Markdown) and components that
// print inline code themselves, so the rule lives in one place.
//   - after  / . _ - , : ; = > ) ] }  and after the escapes \n and \t
//   - before < ( [ {
// Not inside operators such as => -> == >=, not before closing punctuation or
// a separator (so `}},` never leaves a lone `,`), and not inside an escape like \( .
export const BREAK_AFTER = /(?:[/._,:;=>)\]}-]|\\[nt])(?=[^\s=>,;:)\]}])/g;
export const BREAK_BEFORE = /(?<=[^\s\\])[<([{]/g;

// Sorted offsets in `text` where a <wbr> goes.
export function wrapOffsets(text) {
	const offsets = new Set();
	for (const match of text.matchAll(BREAK_AFTER)) offsets.add(match.index + match[0].length);
	for (const match of text.matchAll(BREAK_BEFORE)) offsets.add(match.index);
	return [...offsets].sort((a, b) => a - b);
}

function escapeHtml(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// HTML for `text` with <wbr> at each wrap point; the text itself is escaped.
// For components: <code set:html={withWrapPoints(id)} />.
export function withWrapPoints(text) {
	const value = String(text ?? '');
	let html = '';
	let from = 0;
	for (const o of wrapOffsets(value)) {
		html += `${escapeHtml(value.slice(from, o))}<wbr>`;
		from = o;
	}
	return html + escapeHtml(value.slice(from));
}
