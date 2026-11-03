# AGENTS.md — rules for every coding agent in this repo

The AI Foundation Services docs: Astro + Starlight, run with Bun. The UI is
built from our own components and design tokens, aligned with Telekom's
**Scale** design system (https://telekom.github.io/scale/?path=/docs/scale-design-system--page).

Read this file before any UI change. It is short on purpose: the rules are
lookups, not judgement. Where a script checks a rule, it says so; everything
marked *guidance only* is checked in review.

## Before you build

1. **Read the design system page** — `src/content/docs/design-system.mdx`
   (run `bun run dev`, open `/design-system/`; it is a draft page, not in the
   production build). It shows every component with its props, tokens and
   where it is used.
2. **Read `GAPS.md`**: the known, deliberate differences from Scale. Anything
   that differs and is not listed there is a bug.
3. **Read the component** you will use or change: its frontmatter comment says
   what it is for, its `Props` interface lists every prop and value.
4. Read only what the task needs.

## While you build

### Components — the list is closed

Use these, with the props and values they already have. If a prop, value or
component is not listed here (or in the component's `Props`), it does not
exist. Do not invent one.

| Need | Use | Key props |
|---|---|---|
| Button, link button, icon button | `src/components/Button.astro` | `variant` primary · secondary · ghost; `size` large · small; `iconOnly` + `ariaLabel`; `href`; `disabled`; `successTooltip`, `tooltipPlacement` top · top-end; `success` slot |
| Tag / label | `Tag.astro` | `color` standard · cyan · yellow · green · orange · red · violet · brown · olive · teal · magenta; `size` default · small; `href` |
| Plan tag (every one on the site) | `PlanTag.astro` | `plan` (the plan's name); `size` default · small; `href` |
| Icon (Telekom set only) | `Icon.astro` | `name` (category-name, see the Icon gallery); `size`; `selected`; `label` |
| Country flag | `Flag.astro` | `code` (ISO or `eu`, `globe`); `size`; `decorative` |
| Creator logo (every one on the site) | `Logo.astro` | `name`; `size` small · default · large; `decorative` |
| Select (single choice) | `Selector.astro` | `id`, `label` (always); `variant` standard · ghost; `icon`; `helperText`; `invalid`; `disabled` |
| Text field | `TextField.astro` | `id`, `label`, `placeholder` (a format hint, not the label) |
| Tooltip | `Tooltip.astro` | `text`; `position` top · bottom · right-center; `maxWidth`; `focusable` |
| Inline notification | `InlineNotification.astro` | `variant` informational · success · warning · danger; `heading` |
| Model card / grid | `AvailableModels.astro` | `showHeading`; `limit` |
| Recommended models | `ModelPick.astro` | `useCase` |
| Models table (the only one: Models page, use cases, plans) | `ModelsComparison.astro` | `columns` catalog · useCase · plan; `category`; `capabilityFilter`; `plans`, `plan`, `planLocked` (plan preset) |
| Plans page (rate plans + its models table) | `PlansPage.astro` (renders `ModelsComparison` with the plan preset) | `selectedPlanId` |
| Aside, card, link card, card grid, tabs, steps, file tree | Starlight's own (`:::note`, `<Card>`, `<LinkCard>`, `<CardGrid>`, `<Tabs>`, `<Steps>`, `<FileTree>`) | restyled to our tokens; use them as Starlight documents them |
| Code block | fenced Markdown code | long lines wrap; `title="file.py"` gives a header bar with the file name, untitled blocks have none |

Site parts, not for reuse (Starlight slots and single-page tables):
`SiteHeader`, `Footer`, `ArchiveBanner`, `PageTitle`, `MobileMenuFooter`,
`PreviewModelsBanner`, `ChoosingModels`, `ReasoningTable`. Design-system page helpers
(`src/components/design/*`) are for that page only.

### Tokens only — never raw values

- Colours, spacing, radii, type, motion: **`--aifs-*` CSS variables only**.
  They are the role tier, defined in `tokens/aifs.docs.tokens.json` (DTCG
  format) as aliases of Telekom's tokens (`tokens/telekom.*.json`, the base
  tier). Components never use the base tier or raw values.
- **No** hex/rgb colours, **no** raw `px`/`rem` for spacing or size, **no**
  library palette classes, **no** copied Figma values.
- `src/styles/tokens.css` is **generated**: edit the JSON, then run
  `bun run tokens`. Never edit `tokens.css` by hand.
  *Checked by script*: `bun run tokens` fails on any alias that does not
  resolve.
- A value that has no token: **make it a token first** (in
  `aifs.docs.tokens.json`, aliasing a Telekom token), then use it. If Telekom
  has no fitting token, leave `/* TODO(token-gap): <what is missing> */` at
  the call site and add a row to `GAPS.md`. *Guidance only.*

### Layout and rhythm — use what is there

- **One page layout.** Every page: On this page beside a **fluid content
  column** (`src/styles/layout.css`). The column fills the rest of the row
  at every window width, with no maximum width (`--sl-content-width` is
  100%, in `layout.css`; only its running text stops at the measure); its side padding is `aifs.layout.sheet-padding`, from 120rem
  `aifs.layout.sheet-padding-wide`, and from 80rem it keeps the chat
  launcher's clearance at its end edge. A wide element (the models table)
  fits the column and never scrolls sideways: it shows more columns as the
  column grows (main columns, a details row, cards below 36rem). There is
  no breakout band. Do not set `tableOfContents: false` to make room, and
  do not give the column or a page a max-width of its own.
- **Vertical rhythm** (`aifs.rhythm.*`): 12 after a heading · 16 between
  paragraphs · 32 around blocks and components · 32/48/72 before h4/h3/h2 ·
  96 before previous/next. Do not set margins between content blocks
  yourself; `src/styles/layout.css` does.
- **Grids**: `aifs.layout.grid-gap` (16px) across and down;
  `aifs.layout.grid-action-gap` (24px) above a button under a grid. Card
  grids fit as many columns of at least `aifs.layout.card-min-width` as the
  column has room for (`auto-fit`), so they use a wide window.
- **Text width**: running text (paragraphs, lists, headings, quotes, asides)
  stops at the measure, `aifs.layout.measure` (45rem, about 79ch), at the
  column's start edge; never centre it. Tables, code, figures, cards, tabs,
  steps' code, the banners and the components keep the full column. The
  rule is in `layout.css`; do not cap text yourself.
- **Announcements** (`PreviewModelsBanner`): one banner each, at the top of
  the content column with its edges, no backdrop behind them; each has its
  own close button and session memory. Current pages only: archived
  pages have the archive bar (`ArchiveBanner`) instead, with the same edges.
- **Site navigation**: every sidebar group starts open (no `collapsed` in
  `astro.config.mjs`); a visitor can close groups with the chevrons.
- **One models table**: every list of models is `ModelsComparison` with a
  column preset. Need a column or filter it does not have? Add it there, to
  the preset that needs it; never build a second table.
- **Data tables**: a table of models gets `.aifs-data-table`, its component a
  `datatable` size container, and `src/scripts/floatingTableHead.ts`
  (`src/styles/data-table.css` has the full contract). Filters are
  `.aifs-filter` fields (`src/styles/select.css`) with
  `src/scripts/filterField.ts`.
- **Creator logos** sit in a rounded square, never a circle; flags are round.

### Building something new

Custom UI is allowed — built **on** the system:

1. **Compose** from existing components and tokens first. A new page is a new
   arrangement, not new parts.
2. **A new component** follows Scale: check Scale's component of the same kind
   (Storybook link above) and mirror its API (prop names, variants, sizes) and
   look, using our tokens. Put it in `src/components/`, give it a frontmatter
   comment (what it is for, what differs from Scale), its styles in a
   stylesheet or the component, tokens in a new `aifs.<component>.*` group.
3. **Document it** on the design system page: a `ComponentCard` in the right
   section (Base elements / Composite components) with a `Showcase`, its
   tokens, a props table and "Used in". New and unrefined → "Not yet sorted".
4. **Every state**: default, hover, active, focus-visible, disabled, loading —
   and error where it applies. Light and dark mode both.
5. **Accessibility is part of done** (WCAG 2.1 AA): contrast 4.5:1 for text,
   3:1 for borders, icons and focus; full keyboard use; a visible focus ring;
   a label or `aria-label` on every control; no information by colour alone;
   `prefers-reduced-motion` respected.

### If nothing fits: write a GAP, do not invent

Stop and write `GAP: <what is missing, and where>`, name the closest existing
component or token, and ask. A GAP note is a good result, not a failure.

### Words on screen

- **English and German together**: every UI string exists in both; change
  both in the same change. German uses **Sie**, written as native German, not
  translated word for word.
- **Sentence case** for labels, headings and buttons ("All models", "Reset
  filters"). Verb + noun on buttons. Plain words, no jargon the reader would
  not use.
- If a model writes text that people read, its prompt names the language
  **and** the register.

## Before you commit

1. `bun run tokens` — if you touched tokens (fails on broken aliases).
2. `bun run build` — must complete (currently 373 pages).
   If you moved, renamed or removed a page: `bun run check:urls <preview URL>`
   must report no BAD URL (add a redirect in `astro.config.mjs`).
3. Look at what you changed in the browser (`bun run dev`, port 4321;
   or `bun run dev --port 4322` in a worktree): light **and** dark mode,
   **375px and 1440px**, English **and** German. No page may scroll sideways.
4. A deliberate difference from Scale or from this file gets a row in
   `GAPS.md`. An unlisted difference is a bug.

There is no lint script yet: raw values, invented props and contrast are
*guidance only* and checked in review. Do not switch a check off to make it
pass; fix the code, or say in the change why the check is wrong.

## Where things are

| What | Where |
|---|---|
| Docs pages (EN / DE) | `src/content/docs/`, `src/content/docs/de/` |
| Archived v1.0.0, v1.1.0, v1.2.0 pages (frozen, do not restyle) | `src/content/docs/v1/`, `src/content/docs/v1-1-0/`, `src/content/docs/v1-2-0/` |
| Components | `src/components/` |
| Tokens (source / generated) | `tokens/*.json` → `src/styles/tokens.css` |
| Styles per component | `src/styles/*.css` (registered in `astro.config.mjs` → `customCss`) |
| Sidebar | `astro.config.mjs` → `sidebar` |
| Design system documentation | `src/content/docs/design-system.mdx` |
| Known differences | `GAPS.md` |
