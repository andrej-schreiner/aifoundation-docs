// Expressive Code plugin: an untitled shell block (bash, sh, powershell …)
// gets the plain code frame instead of a terminal window, so it has no empty
// header bar with three dots (about 30px each). Titled blocks keep their
// header. Runs after plugin-frames' preprocessCode, which may still take a
// title from a file-name comment; an explicit frame="terminal" is kept.
export function ecUntitledFrame() {
	return {
		name: 'aifs-untitled-frame',
		hooks: {
			preprocessCode: ({ codeBlock }) => {
				const { props } = codeBlock;
				if (!props.title && (props.frame ?? 'auto') === 'auto') props.frame = 'code';
			},
		},
	};
}
