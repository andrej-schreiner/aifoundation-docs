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
// - Archived pages (v1, v1-1-0, v1-2-0) are frozen: their blocks keep the plain
//   frame when untitled, as before.
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

const ARCHIVED = /[\\/]content[\\/]docs[\\/](?:de[\\/])?v1(?:-1-0|-2-0)?[\\/]/;

export function ecFrameTitles() {
	return {
		name: 'aifs-frame-titles',
		hooks: {
			preprocessCode: ({ codeBlock }) => {
				const { props, language } = codeBlock;
				const frame = props.frame ?? 'auto';
				const archived = ARCHIVED.test(codeBlock.parentDocument?.sourceFilePath ?? '');
				if (archived) {
					if (!props.title && frame === 'auto') props.frame = 'code';
					return;
				}
				if (frame !== 'auto') return;
				const terminalTitle = TERMINAL_TITLES[language];
				if (terminalTitle) {
					props.frame = 'terminal';
					if (!props.title) props.title = terminalTitle;
					return;
				}
				if (!props.title && LANGUAGE_LABELS[language]) props.title = LANGUAGE_LABELS[language];
				props.frame = 'code';
			},
		},
	};
}
