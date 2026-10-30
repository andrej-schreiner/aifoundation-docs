// Wraps every Markdown table in <div class="aifs-table-scroll">. The table
// then fills the content column (table.css), and a table too wide for it
// scrolls inside the wrapper instead of pushing the page sideways. Tables
// written as HTML in components are not Markdown and keep their own styles.
export default function rehypeTableScroll() {
	const wrap = (node) => {
		if (!node.children) return;
		node.children = node.children.map((child) => {
			if (child.type === 'element' && child.tagName === 'table') {
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
