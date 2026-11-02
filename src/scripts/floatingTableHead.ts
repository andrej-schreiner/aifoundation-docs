// The header row of a data table follows the page: a copy sits under the
// sticky filter row while the real header is scrolled away. (A sticky
// <thead> would stick to the table, not under the filter row.)
//
// The copy takes the real column widths, re-copies whenever the real header
// changes (sort arrows), and passes clicks to the real sort buttons. The
// table never scrolls sideways, so the copy does not either. It is hidden
// from screen readers and has no tab stops: they use the real header.
// Styles: src/styles/data-table.css.

interface Options {
	/** The component; it gets --aifs-filterbar-height. */
	root: HTMLElement;
	/** The empty .aifs-head-float container before the table. */
	float: HTMLElement;
	/** The sticky filter row the copy sits under, if any. */
	bar: HTMLElement | null;
	/** The real table. */
	table: HTMLTableElement;
	/** The sort control inside a header cell, to pass clicks to. */
	sortControl: string;
}

export function setupFloatingHead({ root, float, bar, table, sortControl }: Options) {
	const realHead = table.tHead;
	if (!realHead || float.dataset.ready) return;
	float.dataset.ready = '1';

	const clip = document.createElement('div');
	clip.className = 'aifs-head-float__clip';
	const copy = document.createElement('table');
	copy.className = `${table.className} aifs-head-float__table`;
	copy.removeAttribute('id');
	clip.append(copy);
	float.replaceChildren(clip);

	const fill = () => {
		const head = realHead.cloneNode(true) as HTMLElement;
		head.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
		head.querySelectorAll<HTMLElement>('button, a, [tabindex]').forEach((el) => el.setAttribute('tabindex', '-1'));
		copy.replaceChildren(head);
		size();
	};

	const size = () => {
		copy.style.width = `${table.getBoundingClientRect().width}px`;
		const real = realHead.querySelectorAll<HTMLElement>('th');
		copy.querySelectorAll<HTMLElement>('th').forEach((th, i) => {
			th.style.width = `${real[i]?.getBoundingClientRect().width ?? 0}px`;
		});
		place();
	};

	// Down the page: shown while the real header is under the filters and
	// rows are still below.
	const place = () => {
		const line = bar?.getBoundingClientRect().bottom ?? 0;
		const head = realHead.getBoundingClientRect();
		const end = table.getBoundingClientRect().bottom - head.height;
		float.classList.toggle('is-visible', head.top < line && end > line);
	};

	clip.addEventListener('click', (evt) => {
		const th = (evt.target as HTMLElement | null)?.closest<HTMLElement>('th[data-sort]');
		if (!th) return;
		const real = realHead.querySelector<HTMLElement>(`th[data-sort="${th.dataset.sort}"]`);
		(real?.querySelector<HTMLElement>(sortControl) ?? real)?.click();
	});

	new MutationObserver(fill).observe(realHead, {
		subtree: true,
		attributes: true,
		attributeFilter: ['class', 'aria-sort'],
	});
	new ResizeObserver(size).observe(table);
	if (bar) {
		const barHeight = () => {
			root.style.setProperty('--aifs-filterbar-height', `${bar.offsetHeight}px`);
			place();
		};
		barHeight();
		new ResizeObserver(barHeight).observe(bar);
	}
	window.addEventListener('scroll', place, { passive: true });
	fill();
}
