# Docs changelog — 31 October 2026

What changed in the docs site today, as it stands at the end of the day.
Iterations and reverted attempts are left out. Nothing here is committed yet.

## Page layout

- **One layout for every page.** "On this page" sits beside a 720px text column
  on every current page; the separate wide "table" template is gone
  (`tableOfContents: false` removed from 26 model and plan pages, EN and DE).
- **Full-width sheet.** The white content sheet runs from the navigation to the
  window's edge, without border or rounded corners.
- **Notice band.** Site notices sit in a full-width band on the subtle
  background above the sheet. Its height is a whole number of navigation rows
  (2 rows for one notice, 3 for two, 4 for three or more), the notices are
  centred in it, and the sheet scrolls up over it.
- **Footer behind the sheet.** The footer sits on the subtle background, fixed
  behind the sheet, and is revealed at the end of the page.
- **Breakout band.** Wide elements leave the text column into a band on the
  subtle background (`.aifs-breakout`): from the sheet's start edge to the
  window's edge. The models table uses it on every page that shows it. On
  these pages "On this page" scrolls away with the page instead of staying
  in view, so the band never covers it.
- **Vertical rhythm.** Fixed gaps from tokens: 12px after a heading, 16px
  between paragraphs, 32px around blocks, 32/48/72px before h4/h3/h2, 96px
  before previous/next. Grids use a 16px gap, 24px above a button under a grid.
- **Previous/next cards:** two equal columns, 96px above them, centred at the
  content width.
- **Sidebar:** every group starts collapsed; the group with the current page
  opens.
- **Header selects** (version, theme, language) share one 144px width. From
  800 to 1152px they and the search move into one **Menu** button (DE: Menü)
  that opens a panel, so the site name keeps its room; ⌘K still opens the
  search. Escape or a click outside closes the panel. Phones keep their own
  menu and the search icon.
- **Code blocks** always use the terminal frame; asides take the full column.

## The models table

- **One table for every list of models** (`ModelsComparison`), with three
  column presets: `catalog` (Models page), `useCase` ("For …" pages) and `plan`
  (plans pages and Preview models). The separate plans table (`ModelsTable`)
  is deleted.
- **Columns:** Model (with a Premium tag), Category, Provider, Cloud,
  Location (new everywhere), Input, Streaming, Tools, Context, Reasoning,
  Reasoning tokens, Input / Output / Cached input price, Requests and Tokens
  per minute (plan preset), Plans, Links to terms of use and data protection
  (plan preset). Each preset shows the columns that fit its page.
- **Headers:** label with its sort arrow, unit in small text below. Cells hold
  plain numbers in tabular figures. Rows without a value (unpublished price,
  dynamic limit) always sort last.
- **Look:** white table with a rounded outline on the tinted band, 32px
  rounded-square provider logos, 16px before and 24px after each cell's text.
- **Sticky parts:** the model column, the filter row (16px vertical padding)
  and a copy of the header row stay in view while scrolling.
- **Filters:** three in the row (most general first), then **All filters (n)**:
  a side panel (a modal dialog) with every filter, each in its own card, and
  **Show N models** / **Clear all**. Applied filters show as removable chips
  under the row. On phones, one **Filters (n)** button opens the same panel.
  Tick and cross options read "✓ Supported" / "✗ Not supported".
- **Plans pages:** a plan field switches the rows on the plans overview; each
  filter offers only that plan's values. An archived plan with no models in
  the current catalog shows a message instead of a table.
- **Phones:** rows become cards with details behind a toggle; no empty strip
  above the first row.

## Pages and content

- **Models page merged.** The Models overview and All models are one page:
  intro, Model use cases, Hosting & Compliance, then All models (the table) as
  the last section. `/models/catalog` redirects to `/models/#all-models`
  (DE: `#alle-modelle`); ten links were updated. The Featured models cards
  left this page (the home page keeps them).
- **Models sidebar:** Overview, Model use cases ("For chat & reasoning", "For
  coding", "For vision", "For embeddings", "For audio", "For images"), Preview
  models, Models API, Deprecations.
- **Rate plan cards:** neutral cards with the plan tag, price, a four-step
  throughput meter and a **View plan** button (Enterprise: **Contact us**).
- **Heading:** "Service note on … RPM and TPM values" is now
  **"Rate limits are ceilings, not guarantees"** (DE: "Rate-Limits sind
  Obergrenzen, keine Garantie") on Plans & Pricing, the plan pages and Rate
  limits.

## Fixes from the audits

- **FAQ:** GPT-OSS 120B limits corrected to the plan data (Essential 100 RPM /
  400,000 input TPM, Agentic 300 RPM); model count "more than 30" instead of
  "over 40"; the first answer no longer says every model runs on T-Cloud.
- **Rate limits:** TPM is described as separate input and output limits,
  matching the tables (the contradicting bullet is gone).
- **Cloud tooltips:** Azure and Google Cloud no longer claim "EU regions"; they
  point to the Location column.
- **Examples:** the Models API metadata example uses GPT-OSS 120B instead of
  the retired Llama 3.3 70B. (The Quickstart keeps GLM 5.3: it launches with
  this release.)
- **Notices:** Escape dismisses a notice only while focus is inside it, so
  closing the filter panel or search no longer dismisses a notice.
- **Polish:** applied-filter chips no longer have overlapping tap areas; the
  live counts use equal-width digits; in Windows high-contrast mode focus
  rings and the masked icons stay visible; the notice bar and the phone list
  use tokens (new `notice` and `models-list` groups), and the phone list's
  meta line and details panel line up under the model name; the leftover
  54rem wrappers on the plan and preview pages are gone.
- **German:** the Preview models intro uses "Sie" throughout; screen-reader
  labels in the table and the screenshot lightbox are in German on German
  pages.

## Components

- **Model cards** (`AvailableModels`) in the ai.t-systems.net layout, with small
  tags and a 16px grid; **recommended models** (`ModelPick`) as model cards
  with the model ID.
- **Button** has a success state and a success tooltip ("Copied: …") for copy
  buttons.
- **Tooltip** styled after Scale's tooltip.
- **Logo** is the one creator logo on the site: a white rounded square in
  three sizes (20, 32, 40px), with Google's mark zoomed to fill it. The
  models table, model cards, recommended models and Choosing a model use it
  instead of their own markup (tokens `aifs.logo.*`; the old per-component
  logo tokens are gone).
- **PlanTag** is the one plan tag: the plans table, the rate plan cards and
  the models table's Plans column use it. Test reads "Preview" ("Vorschau"),
  and a retired plan shows its name in grey.
- Every component has a frontmatter comment saying what it is for.
- **Dead code removed:** the unused `HeaderApiKeyLink` and `MobileApiKeyLink`
  components, and about 100 unused rules from `custom.css` and
  `redesign.css` (spacing utilities, hover cards, old dialog, tooltip and
  filter-panel styles, the commitment note, header-title sizing Starlight no
  longer renders).

## Design system and tokens

- New tokens: `layout` (measure, grid gaps, wide width), `rhythm`, `card`,
  `model-card`, `table` (outline, logos, data-table padding), `tooltip`,
  `button.success`, `select.header-width`, `radius.indicator`,
  `filter-panel`, `notice`, `models-list`, `logo`.
- **AGENTS.md** (rules for coding agents): closed component list, site parts
  not for reuse, tokens only, the one page layout and breakout band, data
  tables and filters, words on screen, checks before commit (227 pages).
- **GAPS.md:** 16 known differences from Scale, each marked on purpose, not
  adopted yet or token gap.
- **Design system page:** entries for Card, Model card, Model comparison (with
  the presets and filters), Tooltip, Button success, and the page layout.
- **Notes:** `docs/research/table-filter-patterns.md` (filter best practice,
  with sources) and three audits in `docs/audit/`.

## Open

- The audits' remaining findings: sentence case (about 65 headings and
  labels), the API-key button's several names, and the undefined Enterprise plan.
- The deprecation dates were left as they are; they need a product check.
  "Recommendations as of 2 November 2026" is correct: GLM 5.3 and this
  release go live that day.
