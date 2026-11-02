# Design system audit — 2026-10-31

Mode: **audit** (product-cookbook). Read only: nothing was edited except this file. Nothing committed.

**Basis.** The design system is this project's own, aligned with Telekom Scale. Rules: `AGENTS.md` (as read at 15:16 on 2026-10-31; it changed during the session, see Denominator); deviations: `GAPS.md` (a listed row is not a finding); docs: `src/content/docs/design-system.mdx`; tokens: `tokens/aifs.docs.tokens.json` → `src/styles/tokens.css`. There is no Figma file, no `product.md`, no `docs/component-catalog.md`, no `DEVIATIONS.md` and no record of real use. Scale was used from memory of its component set, **not read** this session. Rule references: **AGENTS §** = a section of AGENTS.md; **gates** = product-cookbook `references/gates.md`; **dq** = `references/design-quality.md`; **sdp** = `references/screen-design-process.md`.

Runtime checks were made against the worktree's dev server (port 4322) by fetching HTML. No screenshots, no viewport, no dark mode, no contrast measurement.

---

## Foundation

**Point of view.** The docs are the product's manual and its shop window at once: for a **developer**, the shortest path from "is this OpenAI-compatible and EU-hosted?" to a working request; for a **buyer**, a trustworthy comparison of models and plans that ends in ordering. The site is read, not operated: its only state is filters, sorting, copy buttons and dismissible notices.

**Decisions, in the order they come on a visit.**

| # | Reader | Decision | Where |
|---|---|---|---|
| D1 | Developer | Can I use this (compatible, sovereign)? | Home intro, hero badges |
| D2 | Developer | How do I get a key and make a first request? | Home = Quickstart, Authentication |
| D3 | Both | Which model for my task? | Choosing a model, Models page, "For …" pages, home model grid |
| D4 | Buyer | Which plan, at what cost and throughput? | Plans & Pricing, plan pages, Rate limits |
| D5 | Buyer | How do I order? | Plans overview intro (mailto), Contact us on Enterprise tile |

**Flows, with Today.**

- **F1 First request** (D1, D2). Home → badges → "Get Free API Key" card (external portal) → Quickstart steps 1–4 → "Try a capability" → Next steps. *Today:* works end to end. Gaps: the base URL in step 3 (`llm-server.llmhub.t-systems.net/v2`) is the endpoint the API transition will switch format and then discontinue; the only hand-over is the dismissible notice bar. The key is named and linked inconsistently (see UX fit).
- **F2 Choose a model by task** (D3). Choosing a model (one table of recommendations) → "For …" page (Recommended cards, then the full table filtered to the category) → copy model ID. *Today:* works; recommendations and table share one data source. Gaps: on a "For …" page the full table has no heading of its own; page names differ between sidebar, cards and h1.
- **F3 Compare all models** (D3). Models page → "All models" section → filter, sort. *Today:* works. Gap: an empty filter result says what happened but not what to do.
- **F4 Choose a plan** (D4). Plans & Pricing → plan tiles (price, throughput meter, three checks, View plan) → plan page (sentence with the minimum, models table with this plan's prices, rate-limit notes). *Today:* comparison works on the overview. Gap: the plan page drops the tile's summary and has no order action.
- **F5 Order** (D5). *Today:* a `mailto:` in the overview's intro paragraph and a Contact us button on the Enterprise tile only. No order action on Essential/Professional/Agentic pages.

---

## Wrong

Defects: a gate or AGENTS rule broken, a state missing, behaviour on an element that cannot carry it.

**W1. The plan pages lost their empty state when `ModelsTable` was deleted, and the archive now renders the current catalogue.**
`src/components/PlansPage.astro:39–210` still defines `emptyCatalogNote`, `emptyCatalogLink`, `emptyCatalogHref`, `noModels` and about 75 other strings (`thRPMLimit`, `labelResetFilters`, `placeholderSearch`, `labelSortCatalog` …) that nothing reads any more; the deleted `ModelsTable.astro` (HEAD, lines 225–226) rendered "This plan has no models in the current catalog. See Plans & Pricing". `ModelsComparison` has only the filter message (`ModelsComparison.astro:589`, `:1313–1315`). The archived v1.2.0 plan pages pass ids that no current plan has (`src/content/docs/v1-2-0/plans/basic.mdx:10` `selectedPlanId="Tarif Basic Template"`), and `legacy` is never passed anywhere (`PlansPage.astro:30,32`), so the dev server's `/v1-2-0/plans/basic/` serves the 2026 catalogue with `"plan": null` under "Our Models" (seen in fetched HTML; not looked at in a browser). Rule: dq "States beyond the interactive set" (empty); AGENTS "Where things are" (archive is frozen). Fix: restore an empty state in the `plan` preset; pass `legacy` (or retire the archive plan pages to static content); delete the dead strings.

**W2. Creator logos: the listed `Logo` component is used on no product page; four hand-rolled versions do its job.**
`Logo.astro` is imported only by `design-system.mdx`. Logos are raw `<img>` in a hand-styled mark in `ModelsComparison.astro:1125–1128, 1207` (`.creator-brand--tile`, plus a `background-image` variant for Google), `AvailableModels.astro:192–193, 342–368`, `ModelPick.astro:89–90, 203`, `ChoosingModels.astro:100–101, 130–131, 234–252`. `Logo.astro` itself renders a bare `<img>` (line 23ff.) with no rounded square, so it cannot meet AGENTS' "Creator logos sit in a rounded square". Rule: gates "Component reuse gate"; AGENTS §Components ("the list is closed") and §Layout ("Creator logos"). Fix: give `Logo` the square, the size steps (20/32/40) and the zoom case; replace the four marks.

**W3. Plan tags: `PlanTag` is used nowhere; server-rendered markup hand-rolls it.**
`PlansPage.astro:531` (`<span class="plans-tag tag-plan-…">` as the tile heading), `ModelsComparison.astro:1195, 1295` (`<a class="plans-tag …">`). `tag.css:7–12` justifies the class aliases with "the tables, which build their rows in scripts", but these rows are Astro-rendered. Rule: gates "Component reuse gate"; AGENTS §Components. Fix: `<PlanTag plan=… size="small" href=…>`.

**W4. A tag that is a toggle button.**
`ModelsComparison.astro:1134–1140`: the Cloud cell is `<button class="plans-tag …">` that toggles a filter. Scale's tag is a label or a link; a tag-styled toggle is in neither AGENTS nor GAPS. Rule: AGENTS §Building something new 2 ("follows Scale"), §Before you commit 4 (unlisted difference is a bug). Fix: a link `Tag`, or list it in GAPS with its states.

**W5. English-only accessible names on German pages.**
`ModelsComparison.astro:1138` (`Toggle ${cloud} cloud in the filter — …`), `:1167` (`No reasoning_effort values published`), `:1182` (`Not documented`) override visible German text; `Footer.astro:93` (`aria-label="Close"` on the lightbox). Rule: AGENTS §Words on screen ("every UI string exists in both"). Fix: move into the `t` objects.

**W6. Title Case in component copy and page headings.**
Components: `PlansPage.astro:40` "Our Rate Plans" (h2 on Plans & Pricing), `:75` "Our Models" (h2 on every plan page), `:44–172` table labels; `AvailableModels.astro:25–30` "Cloud Provider", "Show More ({count} more)", "Show Less", "Available Models" (h2 on home); `ModelsComparison.astro:551` "Models Comparison" (accessible name), `:660` "Image Generation"; `src/content/docs/models/preview.mdx` `modelsSectionTitle="Our Models"`. Pages: about 65 Title Case h2/h3 in current EN pages, e.g. `models/index.mdx:26` "Hosting & Compliance", `plans/dedicated.mdx:60,89,99,121`, `getting-started/authentication.mdx:14,22,27`, `api-transition/index.mdx:17,45,50,78`, `models/api.mdx:44`; page titles "Coding Models", "Vision Models", "Embedding Models", "Image Generation", "Chat & Reasoning (LLMs)"; home card "Get Free API Key" (`index.mdx:21`). Rule: AGENTS §Words on screen ("Sentence case"). Fix: one pass over components, one over pages (EN only; German nouns are capitalised anyway).

**W7. Raw values in the newest component code, not covered by GAPS.**
- `ModelsComparison.astro` mobile card and panel, 2402–2547: `font-size: 12px` (2219, 2547), `16px` (2466), `1.05rem` (2197), `0.85rem` (2268), `0.875rem` (2115), `margin: 2px 0 0 26px` (2496), `8px 0 0 22px` + `padding: 8px 10px` (2516–2517), `gap: 6px` (2458), `min-height: 32px` (2460), `padding: 1.25rem !important` and `color: var(--sl-color-gray-3)` (2255–2256); `menu.style.maxWidth = 'calc(100vw - 16px)'` in script (1898).
- `PlansPage.astro:827–1041`: `max-width: 54rem` (828, 892), `margin 8px`, `right: 1.5rem` (882), `font-size: 0.875rem/0.85rem/1rem` (903, 941, 945), media queries in px (1035 `1200px`, 1041 `900px`).
- `ChoosingModels.astro:173–302`: `min-width: 48rem` (190), logo `20px` (240–242), `padding: 10px 12px` (275), `font-size: 0.75rem` (298), fallback `#fff` (252).
- `PreviewModelsBanner.astro:92–176`, `SiteHeader.astro:77` (`1.125rem`), `MobileMenuFooter.astro:18–39`.
- Tooltip widths passed as raw props: `ModelsComparison.astro:1066, 1125, 1133` (`22rem`, `24rem`), `PlansPage.astro:495` (`26rem`), although `--aifs-tooltip-max-width` exists.
Values off Telekom's 4/8 spacing scale (6, 10, 22, 26px) and off the type scale (12/16px literals, 1.05rem, 0.85rem) are the clearest. Rule: AGENTS §Tokens only; gates "Token gate". GAPS #9/#10/#11/#15 cover none of these (row 11 covers container queries in AvailableModels, ModelPick and data-table.css only).

**W8. Quickstart steps are sibling h2s, not Steps.**
`src/content/docs/index.mdx:25, 29, 46, 50, 73`: "Quickstart" and "1. Install…", "2. Get an API key"… are all h2, so the steps are not inside Quickstart in the outline or On this page, and the numbering is typed by hand. Starlight `<Steps>` is on the closed list. Rule: AGENTS §Components (Steps); dq "Hierarchy" (reading order). Judged against F1.

**W9. The full models table on each "For …" page has no heading.**
Rendered `/models/coding/`: h1 "Coding Models", h2 "Recommended", h3 per pick, then the whole table with no heading: it sits inside "Recommended" for readers and On this page (`ModelsComparison` emits only `aria-label`, `:946`). Same on llms, vision, embeddings, audio, image-generation. Rule: dq "Hierarchy"; judged against F2. Fix: an h2 ("All coding models") on the page before `<ModelsComparison>`.

**W10. Notice bar region is named after its close button.**
`PreviewModelsBanner.astro:72`: `role="region" aria-label={close}` → screen readers hear a region called "Dismiss announcement". Rule: AGENTS §Building something new 5 (a label on every control; WCAG 2.1 AA 4.1.2). Fix: name it by its badge ("Notice", "New").

**W11. Off-system focus rings and missing reduced motion.**
`Footer.astro:172` outline uses `--sl-color-accent` with offset 3px; `MobileApiKeyLink.astro:52`, `HeaderApiKeyLink.astro:51` use `--sl-color-accent-high`; everywhere else uses `--aifs-color-focus` (`redesign.css:113`, `PreviewModelsBanner.astro:162`). `ModelsComparison.astro:2479` (chevron rotation, 160ms) has no `prefers-reduced-motion` rule, and no global one covers it (`redesign.css:356` lists link cards and pagination only). Rule: AGENTS §Tokens only ("Components never use the base tier"), §Building something new 5.

**W12. Filter empty state names no next step.**
`ModelsComparison.astro:589`: "No models match the current filters." Clear all exists in the chips row but the message does not point to it. Rule: dq "States" (empty: how to start); user's UX-writing rule (what happened, what to do next). Judged against F3.

---

## Drifting

Correct, or harmless, today; unmaintainable tomorrow.

**D1. `custom.css` is mostly dead legacy CSS, and it carries most of GAPS row 10.**
Zero uses in `src/` (all pages, including the archive) for `.my-*` utilities (`custom.css:55–121`, ~60 rules of raw px), `.font-size-32/24` (124–125), `.font-weight-600`, `.hover-card*` (30–52), `.filter-border`, `.pricing-tooltip`, `.plans-dialog`, `.extended-filter-overlay/panel`, `.available-models-card`, `.copy-icon`, `.commitment-note` (only also in `redesign.css`). Five of GAPS row 10's six raw shadows and z-index 100/200/201 are in these dead rules. `--sl-border-*` raw radii (3–6) are live. Rule: gates "Token gate"; conformance-audit §3 (inventory and dead code). Fix: delete the dead selectors; GAPS row 10 then shrinks to `select.css:334`.

**D2. Plans pages still carry the removed wide "table template".**
`<div style="max-width: 54rem;">` wrappers in `plans/index.mdx:9,20,30`, `plans/essential.mdx:10,20`, `professional.mdx:10,20`, `agentic.mdx:10,20`, `models/preview.mdx:8,35` and the same six DE files; `custom.css:13–14` (`46rem` on plans link cards), `redesign.css:163`, `PlansPage.astro:828, 892` (`54rem`). The content column is now 45rem (`tokens.css:95`) and AGENTS §Layout says one page layout, so the wrappers do nothing (or would widen text past the measure if the column grew). Inline style is also a raw value. The token `aifs.layout.content-width-wide` still describes "the table template … such as plans" (`aifs.docs.tokens.json`). Rule: AGENTS §Layout ("One page layout", "Text width"), §Tokens only.

**D3. Listed components with no product use, built off-system.**
`TextField.astro`: 0 uses since `ModelsTable` went; uses `--sl-color-*` 9×, `color-mix`, `border-radius: 6px`, `height: 44px`, `font-size: 0.625rem`, a raw focus `box-shadow` (78), and a duplicated 900px media block (112–132). `InlineNotification`: 0 uses (Starlight asides do the job). `PlanTag`, `Logo`: 0 (W2, W3). `HeaderApiKeyLink.astro`, `MobileApiKeyLink.astro`: marked "Not used" in AGENTS but still in the tree with 22 raw values and hand-rolled pill buttons. Rule: conformance-audit §3 (zero uses is a signal); gates "Token gate". Record as cleared or remove.

**D4. Two "single-page tables" of models against the "one models table" rule.**
`ChoosingModels.astro:77–118` and `ReasoningTable.astro:55` are hand-built `<table>`s of models; AGENTS lists them as site parts, while AGENTS §Layout says "every list of models is `ModelsComparison` … never build a second table". The rule and its exception disagree. Rule: AGENTS §Layout vs §Components. Fix: narrow the rule ("every filterable list of models") or say these are recommendation tables.

**D5. Duplicated logic between page components.**
`place()` (location translation) is copied in `ModelPick.astro:66` and `ChoosingModels.astro:36`; logo-mark styling four times (W2). `ModelsComparison.astro` is 2,557 lines carrying three presets, all styles and all scripts. Rule: conformance-audit §4 (custom components that duplicate each other).

**D6. Raw dimensions in the role-token file.**
`aifs.header.search-width` (28rem), `aifs.layout.sidebar-width` (17.5rem), `aifs.layout.toc-width` (14rem), `aifs.layout.measure` (45rem), `aifs.layout.content-width-wide` (85rem) are literals, not aliases of Telekom tokens, and are not in GAPS. (`aifs.tabs.line-width-selected`, `aifs.tag.padding-x-small`, `aifs.button.line-height-small` are literals too but say why: Scale sets them literally.) Rule: AGENTS §Tokens only ("aliases of Telekom's tokens"); §Before you commit 4.

**D7. GAPS row 11 under-covers rem breakpoints.**
Row 11 names `AvailableModels`, `ModelPick`, `data-table.css`. Also using raw query breakpoints: `PlansPage.astro:836, 842, 864, 955, 1035, 1041` (mixing px and rem), `ModelsComparison.astro:2321`, `TextField.astro:112` (900px), `redesign.css:145` (768px), `layout.css`, `custom.css`, `SiteHeader.astro`. Rule: AGENTS §Before you commit 4.

**D8. Props drift between AGENTS and the components.**
`Selector`: AGENTS says `label` "(always)"; Props has `label?` and `hideLabel?`, `name?` (`Selector.astro`). `PlansPage`: `sectionTitle`, `modelsSectionTitle`, `legacy` unlisted. `InlineNotification`: `headingLevel`; `Logo`: `title`; `TextField`: `type`. AGENTS allows "or in the component's Props", so these are not invented, but the table is the agents' lookup and now under-describes. Rule: conformance-audit §4 (catalogue entries whose props no longer match).

---

## Undocumented

**U1. Plan tile and throughput meter.** `PlansPage.astro:507–577`: a new composite (tag heading, price, unit, blurb, 4-step meter, check list, CTA) on the main buyer surface. Not in AGENTS' list, not on `design-system.mdx` (0 hits for `plan-tile`, `plan-meter`), no tokens group named for it. Rule: AGENTS §Building something new 2–3.

**U2. `design-system.mdx` describes what was.**
- Table card (787ff.): "the two data tables (rate plans, model comparison)" and "Default … the rate plans table": the rate plans are tiles now (the table survives only in the never-taken `legacy` branch).
- Logos card (312ff.): "as shown in the model and plan tables" — the tables don't use `Logo` (W2).
- Model card (693ff.): `showHeading` described as the "Available Models (n)" heading; "every creator logo on the site" sits in a rounded square, which `Logo` doesn't draw.
- "Plan page" under Not yet sorted (988): no props table, no "Used in".
- No entry for the notice bar (`PreviewModelsBanner`), the hero badges, `ChoosingModels`, `ReasoningTable`; AGENTS calls them site parts, so a one-line pointer would do.
- Style guides and Task and flow patterns are empty (`EmptySection`), so there is no written point of view or flow to audit against; this report's Foundation is the first.
Rule: AGENTS §Before you build 1 (the page "shows every component … and where it is used").

**U3. Hero badges are Tag lookalikes.** `index.mdx:14–18` `<span class="hero-badge">` styled through `tag.css:16`. Recorded in `tag.css`'s comment, not in GAPS or design-system.mdx; the MDX could use `<Tag>`. Rule: gates "Component reuse gate" (low: same look, one place).

**U4. Composite notice bar.** `PreviewModelsBanner` is Scale's notification banner in role, built from Tag + Button; no GAPS row, no design-system entry.

**U5. No surface table.** There is no `product.md`, so nothing records which surfaces exist without any design (all of them, since there is no Figma) or which states were invented (filter panel, no-results row, success tooltip, plan meter). Rule: product-cookbook Step 1 ("record a 'none'").

---

## UX fit (from derived flows only)

There is **no record of use**. These findings come only from the flows above, read from code and fetched HTML; treat them as hypotheses to check with readers, not as observed problems.

- **F4 → plan page drops the summary and the order step.** From a tile's "View plan", `/plans/essential/` shows a sentence with the minimum, then "Our Models" and the rate-limit notes; no price block, no throughput, no "Order this plan" or contact action (the only mailto is in the rate-limit note, about workload commitments). Decision failed: D4/D5. Pattern: the tile's header could open the plan page; a secondary "Contact us to order" at the foot.
- **F5 order has no home.** Ordering is a `mailto:` mid-paragraph on the overview (`plans/index.mdx:11`) and a button on Enterprise only. Decision failed: D5.
- **Object named several ways (sdp step 3, object table).**
  - API key: "Get API key" (header), "Get Free API Key" (home card), "API Key Portal" (home step 2), "API Key self-serve portal" (plans); targets `/`, `/login`, `/#/login`, `/dashboard` (56× `/`, 8× `/login`, 3× `/#/login` across current pages).
  - Use-case pages: sidebar and cards "For coding", h1 "Coding Models"; "For images" vs "Image Generation"; "For chat & reasoning" vs "Chat & Reasoning (LLMs)".
  - Plans: "Plans & Pricing" (sidebar), "Our Rate Plans" (h2), "Plans" (home card), "rate plan page" (prefix-caching guide).
- **F1 base URL hand-over.** The Quickstart's base URL is the endpoint the API transition will switch and later discontinue; the only pointer is the dismissible notice bar. Not a design-system issue; a content decision for the owner.
- **F2 Choosing a model ends on a heading that promises more than it gives.** `ChoosingModels.astro:161` h2 "Migrating from GPT, Claude, or Gemini?" is followed by one sentence linking to Deprecations; the guide "Migrate from OpenAI" is not linked.
- **F3 works**: filter, sort, chips, Clear all, sticky header; only W12.

---

## Tracked, not counted

GAPS rows 1–16 were checked against the code: every referenced token and file exists, and the `TODO(token-gap)` markers sit where rows 9, 10 and 15 say. Not reported as findings: the tooltip z-index (`tooltip.css:24`), the select menu shadow (`select.css:334`), the lightbox scrim (`Footer.astro:188`), rem container queries in `AvailableModels`/`ModelPick`/`data-table.css`, multi-select filters, the side-panel dialog, sticky table parts, table outline and wrapping, magenta and plan tag colours, button success state, 8px tooltip distance, the 144px header selects, the system body font.

## What passed

- **Colour gate**: no hex/rgb outside `tokens.css` except the GAPS-listed shadows/scrim, one `#fff` fallback (`ChoosingModels.astro:252`, token exists) and `TokenOverview` (design page helper).
- Every `var(--aifs-*)` referenced in components and styles resolves in `tokens.css`, except `--aifs-toc-offset`, which `astro.config.mjs:209` sets at runtime.
- **Docs drift for the two recent removals**: no reference to `ModelsTable` remains anywhere (AGENTS, GAPS, design-system.mdx, code, data). "All models" links all point to `/models#all-models` (`/de/models#alle-modelle`); `/models/catalog` redirects there (`astro.config.mjs:95–96`); the Models page has the `#all-models` section (verified in served HTML).
- **Data-table contract**: `ModelsComparison` has `.aifs-data-table`, a `datatable` container (`:1958`), `floatingTableHead.ts` and `filterField.ts` (`:1322–1323`).
- **EN/DE parity of page structure**: the eight journey pages use the same components with the same props in both locales.
- No `tableOfContents: false` in current pages (AGENTS §Layout).
- Button, Tag, Icon, Flag, Selector, Tooltip are used through their components where used; no bare `<button>` outside `Button.astro` except the sort headers (`ModelsComparison.astro:1052`, a table-header pattern) and W4.

---

## Denominator

**Covered.** Conformance over all of `src/styles/*.css` (17 files) and `src/components/**/*.astro` (31 files) for colour, size, z-index, shadow and base-tier variables; inventory sweep in all three directions (substitution, bare elements, zero-use) for the 14 listed components; AGENTS ↔ design-system.mdx ↔ Props drift for every listed component; GAPS rows 1–16 checked against code. Judgment and UX fit on the journey pages: home, Choosing a model, Models, the six "For …" pages (coding read, others by shared structure), Plans & Pricing, Essential (Professional, Agentic by identical structure), Preview models; EN read in full, DE compared for structure and component strings only. Rendered HTML fetched for `/`, `/models/`, `/models/coding/`, `/getting-started/choosing-a-model/`, `/plans/`, `/plans/essential/`, `/v1-2-0/plans/basic/`.

**Not covered.** No browser look: no screenshots, no 375/1440px check, no dark mode, no sideways-scroll check, no keyboard walk-through, no contrast measurement (the plan-tag ratios in design-system.mdx were taken as stated). No `bun run build` or `bun run tokens` (both write files; AGENTS now says 227 pages, an earlier copy said 229 — unverified). Not judged: guides, integrations, API reference, Trust & SLA, FAQ, API transition (beyond the base URL), the design-system page itself as a surface, the archive beyond one plan page (frozen by rule). German copy quality and register were not reviewed beyond the English-only strings in W5. Scale's Storybook was not opened this session. `AGENTS.md` was modified by another session while this audit ran (component table and layout section changed between the session start and 15:16); findings are against the 15:16 text. No record of use exists, so every UX-fit finding is derived, not observed. The skill's deprecated-API healthcheck does not apply (no design-system package).
