// Wraps every Markdown table in <div class="aifs-table-scroll">. The table
// then fills the content column (table.css), and a table too wide for it
// scrolls inside the wrapper instead of pushing the page sideways. Tables
// written as HTML in components are not Markdown and keep their own styles.
function textOf(node) {
	if (!node) return '';
	if (node.type === 'text') return node.value || '';
	return (node.children || []).map(textOf).join('');
}

function markDates(node) {
	if (!node || node.type !== 'element') return;
	if (node.tagName === 'td' || node.tagName === 'th') {
		const text = textOf(node).trim();
		if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
			const current = node.properties?.className;
			const list = Array.isArray(current) ? current : current ? [current] : [];
			node.properties = node.properties || {};
			node.properties.className = [...list, 'md-date'];
		}
	}
	(node.children || []).forEach(markDates);
}

function labelCells(table) {
	const head = (table.children || []).find((n) => n.type === 'element' && n.tagName === 'thead');
	const row = head && (head.children || []).find((n) => n.type === 'element' && n.tagName === 'tr');
	const labels = ((row && row.children) || [])
		.filter((n) => n.type === 'element' && (n.tagName === 'th' || n.tagName === 'td'))
		.map((n) => textOf(n).replace(/\s+/g, ' ').trim());
	const walk = (node) => {
		if (!node || node.type !== 'element') return;
		if (node.tagName === 'tr' && node !== row) {
			let i = 0;
			for (const cell of node.children || []) {
				if (cell.type === 'element' && (cell.tagName === 'td' || cell.tagName === 'th')) {
					cell.properties = cell.properties || {};
					if (labels[i]) cell.properties.dataLabel = labels[i];
					i += 1;
				}
			}
		}
		(node.children || []).forEach(walk);
	};
	walk(table);
}

export default function rehypeTableScroll() {
	const wrap = (node) => {
		if (!node.children) return;
		node.children = node.children.map((child) => {
			if (child.type === 'element' && child.tagName === 'table') {
				markDates(child);
				labelCells(child);
				return {
					type: 'element',
					tagName: 'div',
					properties: { className: ['aifs-table-scroll'] },
					children: [child],
				};
			}
			wrap(child);
			return child;
		});
	};
	return (tree) => wrap(tree);
}
