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
	// A URL scheme stays whole: no break inside `://` (never `https:/` + `/host`).
	for (const match of text.matchAll(/:\/\//g)) {
		offsets.delete(match.index + 1);
		offsets.delete(match.index + 2);
	}
	// In a URL the host breaks only after a dot between labels (never inside
	// `t-systems`), and the path only before a `/`, so
	// `https://llm-server.ai.t-systems.net/v1` wraps as `https://` /
	// `llm-server.ai.` / `t-systems.net` / `/v1`.
	for (const match of text.matchAll(/:\/\/([^/\s"'`<>]+)(\/[^\s"'`<>?#]*)?/g)) {
		const hostStart = match.index + 3;
		const hostEnd = hostStart + match[1].length;
		for (let o = hostStart + 1; o < hostEnd; o++) {
			if (offsets.has(o) && text[o - 1] !== '.') offsets.delete(o);
		}
		const pathEnd = hostEnd + (match[2]?.length ?? 0);
		for (let o = hostEnd; o < pathEnd; o++) {
			if (text[o] === '/') {
				offsets.delete(o + 1);
				offsets.add(o);
			}
		}
	}
	for (const [start, end] of noBreakRanges(text)) {
		for (let o = start + 1; o < end; o++) offsets.delete(o);
	}
	// A leading slash stays with its segment (`/audio/`, never a lone `/`).
	for (const match of text.matchAll(/(?:^|\s)\//g)) offsets.delete(match.index + match[0].length);
	return [...offsets].sort((a, b) => a - b);
}

// Browsers also break after a hyphen on their own. In a hostname a label
// with a hyphen (`t-systems`, `llm-server`) must stay whole, so these are the
// [start, end) ranges the plugins wrap in <span class="nowrap"> (layout.css).
// Hostnames are found with or without a scheme (`llm-server.ai.t-systems.net`).
const HOSTNAME = /(?<![\w.-])(?:[a-z0-9-]+\.)+(?:net|com|de|org|io|dev|eu|ai)(?![\w-])/gi;

export function noBreakRanges(text) {
	const ranges = [];
	for (const match of text.matchAll(HOSTNAME)) {
		let at = match.index;
		for (const label of match[0].split('.')) {
			if (label.includes('-')) ranges.push([at, at + label.length]);
			at += label.length + 1;
		}
	}
	return ranges;
}

// Splits `value` (which starts at offset `start` of the whole text) into
// segments, marking those that cover a no-break range completely.
export function splitNoBreak(value, start, ranges) {
	const out = [];
	let from = 0;
	for (const [s, e] of ranges) {
		const a = s - start;
		const b = e - start;
		if (a < from || b > value.length) continue;
		if (a > from) out.push({ text: value.slice(from, a), nowrap: false });
		out.push({ text: value.slice(a, b), nowrap: true });
		from = b;
	}
	if (from < value.length || out.length === 0) out.push({ text: value.slice(from), nowrap: false });
	return out;
}

function escapeHtml(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// HTML for `text` with <wbr> at each wrap point; the text itself is escaped.
// For components: <code set:html={withWrapPoints(id)} />.
export function withWrapPoints(text) {
	const value = String(text ?? '');
	const ranges = noBreakRanges(value);
	const piece = (from, to) =>
		splitNoBreak(value.slice(from, to), from, ranges)
			.map((seg) => (seg.nowrap ? `<span class="nowrap">${escapeHtml(seg.text)}</span>` : escapeHtml(seg.text)))
			.join('');
	let html = '';
	let from = 0;
	for (const o of wrapOffsets(value)) {
		html += `${piece(from, o)}<wbr>`;
		from = o;
	}
	return html + piece(from, value.length);
}
