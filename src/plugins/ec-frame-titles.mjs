// Expressive Code plugin: every code block says what it is, so code stands
// apart from the content cards around it. Runs after plugin-frames'
// preprocessCode, which may already have taken a title from a file-name
// comment. An explicit title= (a real file name from the page's text, or
// "Command Prompt" on a CMD tab) and an explicit frame= are kept.
//
// - Shell languages: the terminal frame, titled "Terminal", "PowerShell" or
//   "Command Prompt".
// - Other languages with a label below: the code frame, the language as the
//   title. A file name is never made up: a block only gets one through title=
//   where the text names the file.
// - text, plain fences and unknown languages: the plain code frame, no header.
// - Inside a Starlight <TabItem>, an automatic title that only repeats the
//   tab's label (case-insensitive: tab "Python" over a Python block) is left
//   out; the frame stays. Explicit titles are kept.
const TERMINAL_TITLES = {
	bash: 'Terminal',
	sh: 'Terminal',
	shell: 'Terminal',
	shellscript: 'Terminal',
	shellsession: 'Terminal',
	console: 'Terminal',
	zsh: 'Terminal',
	powershell: 'PowerShell',
	ps: 'PowerShell',
	ps1: 'PowerShell',
	cmd: 'Command Prompt',
	bat: 'Command Prompt',
	batch: 'Command Prompt',
};

const LANGUAGE_LABELS = {
	python: 'Python',
	py: 'Python',
	javascript: 'JavaScript',
	js: 'JavaScript',
	mjs: 'JavaScript',
	typescript: 'TypeScript',
	ts: 'TypeScript',
	json: 'JSON',
	jsonc: 'JSON',
	yaml: 'YAML',
	yml: 'YAML',
	toml: 'TOML',
	markdown: 'Markdown',
	md: 'Markdown',
	html: 'HTML',
	css: 'CSS',
	xml: 'XML',
	sql: 'SQL',
	http: 'HTTP',
	diff: 'Diff',
};

// Tab label of each code block in a document, in the order rehype-expressive-
// code numbers them (groupIndex). Read once per document, before the first
// block is rendered and replaced in the tree.
const tabLabelsByRoot = new WeakMap();

function isCodeBlock(node) {
	const code = node.children?.[0];
	return (
		node.tagName === 'pre' &&
		node.children.length === 1 &&
		code.type === 'element' &&
		code.tagName === 'code' &&
		code.children?.[0]?.type === 'text'
	);
}

function tabLabels(root) {
	const labels = [];
	const walk = (node, label) => {
		if (node.type === 'element' && isCodeBlock(node)) labels.push(label);
		if (
			(node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
			node.name === 'TabItem'
		) {
			const attr = node.attributes?.find((a) => a.name === 'label');
			label = typeof attr?.value === 'string' ? attr.value : null;
		}
		for (const child of node.children ?? []) walk(child, label);
	};
	walk(root, null);
	return labels;
}

function tabLabelOf(codeBlock) {
	const doc = codeBlock.parentDocument;
	if (!doc?.documentRoot || !doc.positionInDocument) return null;
	let labels = tabLabelsByRoot.get(doc.documentRoot);
	if (!labels) {
		labels = tabLabels(doc.documentRoot);
		tabLabelsByRoot.set(doc.documentRoot, labels);
	}
	return labels[doc.positionInDocument.groupIndex] ?? null;
}

const repeatsTab = (title, tabLabel) =>
	tabLabel != null && title.trim().toLowerCase() === tabLabel.trim().toLowerCase();

export function ecFrameTitles() {
	return {
		name: 'aifs-frame-titles',
		hooks: {
			preprocessCode: ({ codeBlock }) => {
				const { props, language } = codeBlock;
				const frame = props.frame ?? 'auto';
				if (frame !== 'auto') return;
				const tabLabel = tabLabelOf(codeBlock);
				const terminalTitle = TERMINAL_TITLES[language];
				if (terminalTitle) {
					props.frame = 'terminal';
					if (!props.title && !repeatsTab(terminalTitle, tabLabel)) props.title = terminalTitle;
					return;
				}
				const label = LANGUAGE_LABELS[language];
				if (!props.title && label && !repeatsTab(label, tabLabel)) props.title = label;
				props.frame = 'code';
			},
		},
	};
}
