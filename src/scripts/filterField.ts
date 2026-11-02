// The value line of a filter field (select.css, .aifs-filter): what is
// chosen, in words. All options: "All". One: its label. None: "None".
// Otherwise how many. The summary's accessible name says the same, so screen
// readers hear "Cloud filter, 2 of 3 selected" rather than "Cloud, 2, 3".

export function showFilterValue(details: HTMLElement, isDE: boolean) {
	// Options in a hidden label (not offered for what is shown) do not count.
	const all = [...details.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].filter(
		(input) => !input.closest('label')?.hidden,
	);
	const checked = all.filter((input) => input.checked);
	const isAll = all.length === 0 || checked.length === all.length;
	const value = details.querySelector<HTMLElement>('.aifs-filter__value');
	const label = (details.querySelector('.aifs-filter__label')?.textContent || '').trim();
	const optionText = (input: HTMLInputElement) =>
		(input.closest('label')?.textContent || input.value).trim();

	let text: string;
	if (isAll) text = isDE ? 'Alle' : 'All';
	else if (checked.length === 0) text = isDE ? 'Keine' : 'None';
	else if (checked.length === 1) text = optionText(checked[0]);
	else text = isDE ? `${checked.length} ausgewählt` : `${checked.length} selected`;
	if (value) value.textContent = text;

	details.classList.toggle('aifs-filter--active', !isAll);
	details.querySelector('summary')?.setAttribute(
		'aria-label',
		isAll
			? label
			: isDE
				? `Filter ${label}, ${checked.length} von ${all.length} ausgewählt`
				: `${label} filter, ${checked.length} of ${all.length} selected`,
	);
}
