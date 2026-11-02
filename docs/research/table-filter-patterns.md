# Filter controls above a data table: what to do when 5–9 filters barely fit

Research note, 2026-10-31. Question: how should a filter row above one models
table be laid out when it holds 5–9 multi-select filters (All models: Category,
Provider, Cloud, Input, Output, Streaming, Tools, Plans; plans pages: 5 filters
plus a "Rate plan" select) and they wrap to two rows at 1100–1440px and scroll
sideways below 40rem?

Current implementation, for reference: `src/components/ModelsComparison.astro`
(each filter is a `<details>` with a checkbox list, all options checked by
default = "All"; a `Reset filters` secondary button; an `aria-live="polite"`
"Showing N of M models" line), `src/styles/select.css` (`.aifs-filter`, height
`--aifs-select-height` = 44px), `src/styles/data-table.css` (sticky filter bar).

Every claim below links to the page it was read on. "Unverified" means the
source could not be read directly (blocked or script-rendered) and the claim
should be checked before it is relied on.

## Summary and recommendations (ranked by impact)

1. **Show 3–4 filters in the row; put the rest behind one "All filters (n)"
   button that opens a panel.** Baymard found horizontal filter toolbars
   become "troublesome if there are more than 6–8 filter types", and that the
   usual fixes are extra rows or hidden filters
   ([Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)).
   Polaris says to promote the most-used filters and "include no more than 2
   or 3 promoted filters"
   ([Polaris IndexFilters source](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx)).
   All models (8) is at the top of Baymard's range; plans pages (5 + Rate plan)
   sit just inside it. The overflow must be a **panel/drawer showing all
   categories at once**, not a dropdown of categories: Carbon says "Multiple
   categories should never be put within a menu or dropdown"
   ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)).
   Give the button a text label and a count, because Baymard saw "All
   Filters" buttons overlooked by some test participants
   ([Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)),
   and Carbon requires the closed state to show "the number of filters
   applied" ([Carbon](https://carbondesignsystem.com/patterns/filtering/)).
2. **Add an applied-filters row under the filter bar: one removable chip per
   narrowed filter, then "Clear all" at the end — and move Reset there.**
   Baymard: applied filters "work well with horizontal filtering toolbars",
   placed below them; 28% of benchmarked sites lack an overview and users were
   slower and disoriented without it
   ([Baymard applied filters](https://baymard.com/research-articles/how-to-design-applied-filters)).
   PatternFly: "The option to clear all filters will be displayed after the
   last filter label"
   ([PatternFly filters](https://www.patternfly.org/patterns/filters/design-guidelines)).
   Carbon asks for one control that clears all categories at once
   ([Carbon](https://carbondesignsystem.com/patterns/filtering/)). Moving Reset
   out of the filter row also frees one slot in the row that is too full, and
   the Reset button only needs to exist when something is filtered.
3. **Below ~48rem, replace the sideways-scrolling row with a single
   "Filters (n)" button that opens a tray/drawer over the table.** NN/g's
   mobile pattern is a panel "overlaid on top of the results screen" with the
   results visible behind it and the total count always visible
   ([NN/g mobile faceted search](https://www.nngroup.com/articles/mobile-faceted-search/)).
   PatternFly: "In responsive views, filters can be hidden within the filter
   icon" ([PatternFly](https://www.patternfly.org/patterns/filters/design-guidelines)).
   Baymard notes hidden toolbar filters are easy to miss
   ([Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)) —
   a sideways-scrolling row hides most of its filters off-screen in the same
   way. Keep the applied-filter chips visible above the table on mobile
   (Baymard allows a horizontally scrolling chip list there,
   [applied filters](https://baymard.com/research-articles/how-to-design-applied-filters)).
4. **Order the visible filters by how often readers use them, most general
   first.** NN/g: "The filter categories placed higher in the list will
   receive more attention", and "Relevance to users is the ultimate
   prioritization criterion"
   ([NN/g filter categories](https://www.nngroup.com/articles/filter-categories-values/)).
   For this table a likely visible set is Category, Provider, Plans (on All
   models) — confirm with analytics or the doc owners; the yes/no-ish facets
   (Streaming, Tools) and Cloud are candidates for the panel. This is a
   judgement call, not a rule from the sources.
5. **Make the fields more compact and let the field value say what is
   selected.** Carbon offers 24/32/40/48px dropdowns, with 40px the default
   and smaller sizes "when space is constricted"; its label-inside ("fluid")
   style is intended for, among others, "components like toolbars"; its
   multiselect shows a tag with "the total number of selected options"
   ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
   So the label-inside design is an accepted toolbar style; the lever is
   height and width, not the label position. Scale's `scale-dropdown-select`
   has no `size` prop
   ([Scale readme](https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/dropdown-select/readme.md)),
   so a smaller filter field needs a new `aifs.select.*` token and a `GAPS.md`
   row. Do not go below the WCAG 2.2 target size minimum (24×24px, SC 2.5.8 —
   not fetched for this note; unverified here).

Accessibility items that apply whichever option is chosen are in §6; the
existing `aria-live` result count already matches WCAG 4.1.3.

## 1. Laying out many filters above a table

- **Horizontal toolbars have a ceiling.** "Horizontal filtering toolbars can be
  troublesome if there are more than 6–8 filter types"; "horizontal filtering
  toolbars can only work with a limited number of filter types"; they "can work
  well when products only need a small number of filter types". When there are
  too many, "sites either have to add more rows to the toolbar or display the
  'hidden' filters" — and "some participants overlooked these 'All Filters'
  buttons completely". Baymard calls sidebar filtering "a proven and familiar
  implementation". Source:
  [Baymard, Horizontal Filtering Toolbars](https://baymard.com/blog/horizontal-filtering-sorting-design).
  (Baymard's context is e-commerce product lists, not data tables.)
- **Second drawback of toolbars**: "the filter options within each filter type
  are not visible by default" — users must open each field to see its scope
  ([Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)).
  The current design partly offsets this with the "All" / "N selected" value
  line.
- **Placement**: Carbon allows category filters "placed vertically on the left
  side of the page or horizontally at the top of the data set"
  ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)).
- **No dropdown of categories**: "Multiple categories should never be put
  within a menu or dropdown"
  ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)). An
  overflow therefore needs a panel/drawer, not a "More" menu.
- **Carbon table toolbar**: the toolbar is "reserved for global table actions
  such as table settings, complex filters, exporting"; "Include up to five
  actions within the table toolbar"; more go into "an overflow menu, combo
  button, or similar components"
  ([Carbon data table usage](https://carbondesignsystem.com/components/data-table/filtering/)
  — the toolbar section on that page).
- **Promoted filters**: Polaris IndexFilters supports filters "pinned, making
  them visible by default"; best practice: "Reduce merchant effort by promoting
  the filtering categories that are most commonly used" and "Include no more
  than 2 or 3 promoted filters"
  ([Polaris IndexFilters source](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx);
  the rendered page at polaris-react.shopify.com could not be loaded).
- **Filter types**: PatternFly lists checkbox select ("for selecting multiple
  values from a predefined list"), attribute-value ("when users have multiple
  attributes to filter on") and filter group ("when you only have a handful of
  attributes that you want to show")
  ([PatternFly filters](https://www.patternfly.org/patterns/filters/design-guidelines)).
  An attribute-value filter (pick the attribute, then the value, in one
  control) is PatternFly's answer to many attributes in a narrow toolbar.
- **SAP Fiori filter bar** — *unverified* (sap.com returned 403): per search
  result summaries of the Fiori filter bar page, an "Adapt Filters" button opens
  a dialog where users choose which filters appear in the bar, the button shows
  the count of active filters, live update is recommended over a Go button
  where possible, and the filter area is collapsed by default on tablet
  ([Fiori filter bar, v1-148](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/filter-bar/usage)).
- **Telekom Scale**: no filter, toolbar or filter-bar guidance found. The data
  grid readme lists sorting and a settings menu but no filtering
  ([Scale data-grid readme](https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/data-grid/readme.md));
  `scale-chip` exists with `type` "dynamic" | "persistent" and `selected`, no
  usage text ([Scale chip readme](https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/chip/readme.md)).
  The Storybook site is script-rendered and could not be read.
- **Not covered**: GOV.UK Design System and USWDS have no filter component;
  the closest UK government source is the MOJ pattern below. Material 3 chip
  guidelines (m3.material.io) are script-rendered and could not be read;
  Atlassian and Adobe Spectrum were not checked.

## 2. Which filters to show by default

- Order by attention and relevance: "The filter categories placed higher in
  the list will receive more attention"; place "the most general, high-level
  filter categories at the top"; "Relevance to users is the ultimate
  prioritization criterion"
  ([NN/g, Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/)).
- Promote the most-used, no more than 2–3
  ([Polaris source](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx)).
- Offer only what is needed: "You should only provide users with filters they
  really need"
  ([MOJ filter component](https://design-patterns.service.justice.gov.uk/components/filter/)).
- Value order inside a filter: numbers low to high; alphabetical only when
  users know the names (e.g. brands — fits Provider)
  ([NN/g](https://www.nngroup.com/articles/filter-categories-values/)).

## 3. Showing applied filters, and where Reset goes

- **Why**: an applied-filter overview gives confirmation, quick removal and
  context; "28% of sites across our UX benchmarks don't display an overview at
  all", while 72% of desktop benchmark sites do
  ([Baymard applied filters](https://baymard.com/research-articles/how-to-design-applied-filters)).
- **Where**: "above the product list, above the filtering sidebar, or below a
  horizontal filtering toolbar"; "Applied filters work well with horizontal
  filtering toolbars"; each with an "x" to remove and a "Clear all" option
  ([Baymard](https://baymard.com/research-articles/how-to-design-applied-filters)).
- **Clear all after the chips**: "The option to clear all filters will be
  displayed after the last filter label"; filter labels "provide feedback to
  the user on what they are filtering on"
  ([PatternFly](https://www.patternfly.org/patterns/filters/design-guidelines)).
- **Clear per category and globally**: "Each category should have a way to
  clear all applied filters at once"; "there should also be a way to dismiss
  all filters across all categories at once"
  ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)).
- **Hidden filters need an indicator**: "there should be an indicator visible
  on the closed filter state"; "At a minimum, the indicator should include the
  number of filters applied"
  ([Carbon](https://carbondesignsystem.com/patterns/filtering/)).
- **Selected-filter tags at the top**: "The selected filters are displayed at
  the top to let users see what they've selected and remove them easily"
  ([MOJ filter](https://design-patterns.service.justice.gov.uk/components/filter/)).
- **Visible filtered state in tables**: "there should be a clear visual
  indication that filters are active"
  ([NN/g Data tables](https://www.nngroup.com/articles/data-tables/)).
- **Chip grouping**: Polaris — "Group tags from the same category together"
  ([Polaris source](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx)).
- **Start state**: "Filters within each category should start either as all
  unselected or all selected"
  ([Carbon](https://carbondesignsystem.com/patterns/filtering/)); "The list
  should first appear unfiltered"
  ([MOJ filter a list](https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/)).
  The current "all checked = All" model complies. Note for chips: with
  all-checked defaults, a chip should describe what is *kept* ("Provider: 2 of
  9") rather than list every unchecked value — this is our inference, not a
  source rule.

## 4. Mobile and narrow widths

- **Tray over the results**: "facet controls appear in a vertical panel
  overlaid on top of the results screen"; "The results are always visible in
  the background"; "The total number of results is always visible"; a separate
  filter screen "forces users to work harder"
  ([NN/g mobile faceted search](https://www.nngroup.com/articles/mobile-faceted-search/)).
  NN/g also prefers a text label over an icon for the trigger (same source).
- **Collapse to one control**: "In responsive views, filters can be hidden
  within the filter icon"; "If there are multiple filter elements, they will be
  collapsed into a single faceted filter"
  ([PatternFly](https://www.patternfly.org/patterns/filters/design-guidelines)).
- **Apply vs instant**: NN/g recommends batch (Apply) on mobile — "This is the
  recommended approach on mobile devices, even with the new tray design
  pattern" — mainly because of slow page loads; and "Use interactive filters if
  your users are exploratory in their search"
  ([NN/g applying filters](https://www.nngroup.com/articles/applying-filters/)).
  Our filtering is client-side and instant, so the load-time argument is weak;
  instant updates with the count visible behind the tray satisfy both.
- **Applied filters on mobile**: "can be placed in a horizontally scrolling
  list above the product list" or stacked in rows
  ([Baymard](https://baymard.com/research-articles/how-to-design-applied-filters)).
  A scrolling list is endorsed for the *chips*, not for the filter controls.
- No source found that recommends a horizontally scrolling row of filter
  *fields* as the primary mobile pattern.

## 5. Size, density and label-inside fields

- Carbon dropdown heights: 24, 32, 40, 48px; small "when space is
  constricted", medium (40) "the default size and the most commonly used size"
  ([Carbon dropdown usage](https://carbondesignsystem.com/components/dropdown/usage/)).
  Our fields are 44px.
- Label inside: Carbon's "fluid" style places "the label … inside of the input
  field", intended for expressive moments, fluid forms "and components like
  toolbars" ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
  So a label-inside filter field is an accepted pattern for a filter toolbar.
- Multiselect summary: "a tag appears to the left of the text in the field
  containing the total number of selected options", which also clears them
  ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
  Our "N selected" value line plays the same role.
- Scale `scale-dropdown-select` has `label` and `hideLabelVisually` but no
  `size` prop
  ([Scale readme](https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/dropdown-select/readme.md)).
  A compact variant would be a deliberate difference from Scale → token +
  `GAPS.md` row.

## 6. Accessibility

- **Result count as a status message** (WCAG 2.1 SC 4.1.3): status messages
  must be programmatically determinable "such that they can be presented to the
  user by assistive technologies without receiving focus"; "18 results
  returned" is given as an example
  ([Understanding 4.1.3](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html)).
  The existing `aria-live="polite"` "Showing N of M models" meets this.
- **Each filter is a disclosure**: role button, `aria-expanded` true/false,
  optional `aria-controls`; Enter and Space toggle
  ([APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)).
  Native `<details>/<summary>` provides this.
- **A filter drawer/tray is a modal dialog**: "When a dialog opens, focus moves
  to an element inside the dialog"; Tab wraps; "Escape: Closes the dialog";
  "When a dialog closes, focus returns to the element that invoked the dialog"
  ([APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)).
- **Sticky filter bar must not hide focus** (WCAG 2.2 SC 2.4.11, AA): "the
  component is not entirely hidden due to author-created content"; sticky
  headers are named, and failure F110 covers a sticky header "completely hiding
  focused elements"
  ([Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
  A taller (two-row) sticky bar makes this more likely; use
  `scroll-padding-top` equal to the bar height.
- **Reflow** (SC 1.4.10): content must work at 320 CSS px without
  two-dimensional scrolling, except "parts of the content which require
  two-dimensional layout"; Note 2 names "data tables" and "interfaces where it
  is necessary to keep toolbars in view while manipulating content"
  ([Understanding 1.4.10](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)).
  The table itself is exempt; a sideways-scrolling filter row is a weaker fit
  for the exception, which is a further reason for the drawer on mobile.
- **Chip sets**: label the set with `aria-label` or `aria-labelledby`; Material
  Web treats chip sets as toolbars
  ([material-web chip docs](https://github.com/material-components/material-web/blob/main/docs/components/chip.md)).
  Removable chips need an accessible name such as "Remove filter: Provider"
  (the MOJ example uses hidden "Remove this filter" text,
  [MOJ filter a list](https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/)).
- **Keyboard cost of apply-at-top**: MOJ notes users "have to navigate to the
  top of the component to apply filters", which "can make the component hard
  to use for a keyboard user"
  ([MOJ filter](https://design-patterns.service.justice.gov.uk/components/filter/)).
  Instant filtering avoids this; a drawer with Apply should put it in a sticky
  footer.

## 7. Recommendations for this table, in detail

| # | Change | Why (source) | Effort / notes |
|---|---|---|---|
| 1 | Keep 3 (All models) or 3–4 (plans pages, after Rate plan) filters in the row; add an "All filters" secondary button with a count badge of narrowed filters, opening a panel (side drawer on desktop, bottom/full tray on mobile) that lists **every** filter as a checkbox group. | 6–8 limit and overlooked "All filters" buttons ([Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)); 2–3 promoted ([Polaris](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx)); no categories in a dropdown, count on closed state ([Carbon](https://carbondesignsystem.com/patterns/filtering/)). | New drawer component → Scale has none for this; GAP note. Dialog focus rules ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). |
| 2 | Add an applied-filters row below the bar: chips per narrowed filter ("Provider: Meta, Mistral" / "Provider: 2 of 9"), each removable, then "Clear all" (replaces Reset). Hide the row when nothing is filtered. | [Baymard applied filters](https://baymard.com/research-articles/how-to-design-applied-filters); [PatternFly](https://www.patternfly.org/patterns/filters/design-guidelines); [NN/g data tables](https://www.nngroup.com/articles/data-tables/). | Use `Tag.astro` or a dismissible chip (Scale `scale-chip` type "dynamic"); EN + DE strings. |
| 3 | Below ~48rem: one "Filters (n)" button + the result count; same drawer as #1; chips row may scroll sideways. Remove the scrolling field row. | [NN/g tray](https://www.nngroup.com/articles/mobile-faceted-search/); [PatternFly](https://www.patternfly.org/patterns/filters/design-guidelines); Reflow note ([1.4.10](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)). | Reuses #1. |
| 4 | Choose and order the visible filters by usage, general first (proposal: Category, Provider, Plans; Input/Output, Cloud, Streaming, Tools in the panel). | [NN/g filter categories](https://www.nngroup.com/articles/filter-categories-values/); [MOJ](https://design-patterns.service.justice.gov.uk/components/filter/). | Needs a product decision. |
| 5 | Compact filter fields (e.g. 40px instead of 44px) while keeping the label-inside design and the "N selected" value. | [Carbon dropdown sizes and fluid style](https://carbondesignsystem.com/components/dropdown/usage/). | New `aifs.select.*` token + GAPS.md row (Scale has no size, [readme](https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/dropdown-select/readme.md)). |
| 6 | Make sure focused rows are not hidden under the sticky bar (`scroll-padding-top` = bar height), especially if it ever wraps to two rows. | [WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html). | Small CSS change. |
| 7 | Keep instant filtering and the live "Showing N of M" line; show it in the drawer too. | [NN/g applying filters](https://www.nngroup.com/articles/applying-filters/); [WCAG 4.1.3](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html); [NN/g tray](https://www.nngroup.com/articles/mobile-faceted-search/). | Already in place on desktop. |

Cheapest partial fix if the drawer is too much for now: do #2 (move Reset into
an applied-filters row) and #5 (compact fields). That removes one item from the
row and narrows the rest, which may keep plans pages on one row at 1100px; All
models (8 filters) will likely still wrap — Baymard's threshold says that page
is the one that needs #1.

## Sources

Read directly for this note:

- Baymard Institute — Horizontal Filtering Toolbars: https://baymard.com/blog/horizontal-filtering-sorting-design
- Baymard Institute — How to design applied filters: https://baymard.com/research-articles/how-to-design-applied-filters
- IBM Carbon — Filtering pattern: https://carbondesignsystem.com/patterns/filtering/
- IBM Carbon — Data table (toolbar section): https://carbondesignsystem.com/components/data-table/filtering/
- IBM Carbon — Dropdown usage: https://carbondesignsystem.com/components/dropdown/usage/
- Shopify Polaris — IndexFilters docs source (GitHub): https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx
- PatternFly — Filters design guidelines: https://www.patternfly.org/patterns/filters/design-guidelines
- MOJ Design System — Filter component: https://design-patterns.service.justice.gov.uk/components/filter/
- MOJ Design System — Filter a list pattern: https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/
- Material Web — Chip docs: https://github.com/material-components/material-web/blob/main/docs/components/chip.md
- Telekom Scale — data-grid readme: https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/data-grid/readme.md
- Telekom Scale — chip readme: https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/chip/readme.md
- Telekom Scale — dropdown-select readme: https://raw.githubusercontent.com/telekom/scale/main/packages/components/src/components/dropdown-select/readme.md
- NN/g — User intent affects filter design: https://www.nngroup.com/articles/applying-filters/
- NN/g — Filter categories and values: https://www.nngroup.com/articles/filter-categories-values/
- NN/g — Mobile faceted search with a tray: https://www.nngroup.com/articles/mobile-faceted-search/
- NN/g — Data tables: four major user tasks: https://www.nngroup.com/articles/data-tables/
- NN/g — Filters vs. facets: https://www.nngroup.com/articles/filters-vs-facets/
- W3C — Understanding SC 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html
- W3C — Understanding SC 2.4.11 Focus Not Obscured (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- W3C — Understanding SC 1.4.10 Reflow: https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
- W3C APG — Disclosure pattern: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- W3C APG — Dialog (Modal) pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

Could not be read (claims marked unverified or omitted):

- SAP Fiori — Filter bar (HTTP 403): https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/filter-bar/usage
- Material Design 3 — Chips guidelines (script-rendered): https://m3.material.io/components/chips/guidelines
- Telekom Scale Storybook (script-rendered): https://telekom.github.io/scale/
- Shopify Polaris rendered docs (connection failed): https://polaris-react.shopify.com/components/selection-and-input/index-filters
- WCAG 2.2 SC 2.5.8 Target Size (Minimum) — not fetched: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
