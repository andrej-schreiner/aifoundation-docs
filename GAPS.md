# GAPS.md — known differences

Every difference between this site and Telekom's Scale design system, or a
value that has no token yet. One row each, with one mark:

- **on purpose** — a deliberate deviation, kept.
- **not adopted yet** — Scale or Telekom has it; we have not taken it over.
- **token gap** — a value without a Telekom token; marked
  `TODO(token-gap)` in the code.
- **not decided** — open question.

A difference that is not in this list is a bug. Add a row when you add a
difference; close a row (with the date) when it goes away. Never delete one.

| # | What | Where | Mark | Why / what closes it |
|---|---|---|---|---|
| 1 | Primary button background is `aifs.color.action.background`, not Scale's primary | `tokens/aifs.docs.tokens.json` → `aifs.button.primary` | on purpose | White text passes AA in dark mode too. |
| 2 | Tables have a subtle outline with rounded corners | `src/styles/table.css`, `aifs.table.outline` | on purpose | Holds a table together on the white sheet, like the frame of code blocks and cards. Scale has no outer frame. |
| 3 | Table cell text wraps | `src/styles/table.css` | on purpose | Docs tables hold descriptions; Scale's cells do not wrap. |
| 4 | Data tables: sticky filter row, floating header row | `src/styles/data-table.css`, `src/scripts/floatingTableHead.ts` | on purpose | Long model tables scroll down; Scale's table has no sticky parts. The sticky first column closed 2026-11-02: the models table fits the column and no longer scrolls sideways. |
| 5 | Multi-select filters drawn as select fields (`<details>` with checkboxes) | `src/styles/select.css` → `.aifs-filter` | on purpose | Scale's dropdown select is single choice; the filters need several. Same look as the select. |
| 6 | Button success state (`success` slot, `successTooltip`) | `src/components/Button.astro`, `src/styles/button.css` | on purpose | Confirms copy actions in place. Not part of Scale's button. |
| 7 | Tag colour `magenta` (filled) and plan tag colours | `src/styles/tag.css` | on purpose | Marks T-Cloud and the plans. Scale's tag has ten subtle colours only. |
| 8 | Tooltip distance 8px (Scale: 10px) | `aifs.tooltip.distance` | on purpose | 10px is not on Telekom's spacing scale. |
| 9 | Tooltip z-index is a raw number | `src/styles/tooltip.css`, `data-table.css` | token gap | No z-index tokens converted yet (Scale: `--scl-z-index-70`). |
| 10 | Shadows are raw `box-shadow` values (menus, dialogs, tooltips) | `select.css`, `SiteHeader.astro` (Settings panel) | token gap | Telekom shadow tokens are not converted yet. |
| 11 | Container and media query breakpoints are rem values (e.g. 22rem, 26rem, 34rem, 36rem, 40rem, 48rem, 51rem, 52rem, 58rem, 64rem, 72rem, 80rem, 82rem, 120rem) | e.g. `AvailableModels.astro`, `ModelPick.astro` (52rem), `data-table.css`, `ModelsComparison.astro` (36, 51, 64, 82rem), `PlansPage.astro` (34, 58rem), `PreviewModelsBanner.astro` (40rem), `code-block.css` (48rem), `custom.css` (22rem, 72rem), `layout.css` (26rem, 72rem, 80rem, 120rem) | on purpose | Container and media queries cannot read custom properties. |
| 12 | Body font falls back to the system font | `aifs.font.body` | not adopted yet | TeleNeoWeb is not loaded (no licensed web font in the repo). Closes when the font is added. |
| 13 | Header selects (version, theme, language) share one 144px width | `aifs.select.header-width` | on purpose | A native select is as wide as its longest option; one width keeps the header calm. |
| 14 | No lint or contrast script | — | not adopted yet | Raw values, invented props and contrast are checked in review. Closes with a `check` script run before commit. |
| 15 | Lightbox backdrop is a raw `rgb(0 0 0 / 0.72)` | `src/components/Footer.astro` (`#plugin-lightbox::backdrop`) | token gap | No overlay/scrim token converted yet. |
| 16 | The filter panel is a modal dialog at the window's end edge | `ModelsComparison.astro` (`.mc-panel`), `aifs.filter-panel` | on purpose | Scale's modal is centred; a side panel keeps the table in view beside it (docs/research/table-filter-patterns.md). |
| 17 | The models table hides columns into a per-row details row, shows more of them as the fluid content column widens, and is a list of cards below 36rem | `ModelsComparison.astro` | on purpose | Scale's table has neither; the column does not hold all columns without scrolling sideways below about 2000px, which the docs do not allow. (The breakout band went 2026-11-02, row 18.) |
| 18 | The breakout band is on the subtle backdrop and runs to the window's edge | `layout.css` (`.aifs-breakout`) | on purpose | Scale has no breakout; the band gives the models table room beside On this page without widening the page. **Closed 2026-11-02:** the content column is fluid, so the table fits it and the band is gone. |
| 19 | Several announcements share one box with one close control | `PreviewModelsBanner.astro`, `aifs.notice` | on purpose | Scale's notification banner carries one message; one box keeps the space above the sheet small and is closed in one step. **Closed 2026-11-02:** one banner per announcement again, each with its own close (see row 20). |
| 20 | Announcement banners are a light tint with a 4px accent line at the start (New: magenta, `aifs.notice.new-*`; Notice: informational blue, `aifs.notice.info-*`), compact (tag, text, link, close in one row), at the top of the content column | `PreviewModelsBanner.astro`, `layout.css` (`.qp-stack`), `aifs.notice` | on purpose | Scale's notification banner is a full-colour strip with an icon; the light, compact form sits on the sheet with the column's edges without outweighing the page title. Telekom has no subtle magenta step: the New tint mixes brand magenta into the sheet (`aifs.notice.new-tint-strength`, 6%). |
| 21 | The content column is fluid: no maximum width and no line measure for running text | `layout.css` (`--sl-content-width: 100%`), `aifs.layout.sheet-padding-wide`, `aifs.layout.card-min-width` | on purpose | The owner asked for content and text that adapt to the window width (2026-11-02). Very long lines on very wide windows are accepted; padding grows from 40 to 64px at 120rem. Replaces the 720px measure. |
| 22 | Sidebar groups start open on every page; a session state stored before that is dropped once per session (`aifsSidebarDefaultOpen1`) | `astro.config.mjs` (sidebar, `head`) | on purpose | The owner asked for the navigation open by default (2026-11-02). The chevrons still close a group; Starlight keeps that for the session. |
