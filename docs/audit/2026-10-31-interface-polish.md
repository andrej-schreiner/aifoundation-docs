# Interface polish audit — 2026-10-31

Read-only review with `make-interfaces-feel-better`, **full** mode. No source file changed; this report is the only new file.

## Scope and coverage

- **Mode:** full (cap 15 findings; systemic issues consolidated).
- **Scope:** `src/styles/*.css` (layout, data-table, table, select, button, tag, tooltip, sidebar-nav, icons, custom, redesign); `src/components/*.astro` (ModelsComparison, PlansPage, AvailableModels, ModelPick, Button, Tooltip, Icon, Flag, Logo, SiteHeader, Footer, PreviewModelsBanner); pages `index.mdx`, `models/index.mdx`, `plans/index.mdx`.
- **Framework / styling:** Astro 6 + Starlight, plain CSS, role-tier `--aifs-*` tokens generated from `tokens/aifs.docs.tokens.json`. Every fix below is written in that system. Where no token fits, it says so (`TODO(token-gap)` + GAPS row).
- **Boundary:** anything in `GAPS.md` (rows 1–16) is not a finding. The breakout band covering the sticky On this page column is an open decision; no concrete defect was found in it, so it is not reported. Archived `v1-2-0` pages were out of scope.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | `redesign.css` (text-wrap, weights), `table.css` (tabular-nums), ModelsComparison status/count markup, AvailableModels heading count, card/plan-tile title styles; Starlight `reset.css` for font smoothing | 2 findings |
| Surfaces | Radii tokens in `tokens.css`; nested radii in PreviewModelsBanner, ModelsComparison mobile panel, cards; hit areas in `button.css`, applied-filter chips, footer, lightbox; focus rings in `redesign.css`, `sidebar-nav.css`, `table.css`, Footer; logo/flag/content-image outlines; optical alignment in ModelsComparison phone list and PlansPage | 7 findings |
| Animations | Every `transition`/`animation`/`@keyframes` in scope (grep), tooltip `@starting-style`, Button success swap, notice entrance, sort/chevron rotations, reduced-motion guards; one runtime keyboard check | 3 findings, plus 1 interaction finding (Escape) reported under "Scoped interactions" |
| Icons | `icons.css` mask technique, `Icon.astro`, `Flag.astro`, `Logo.astro`, `.fi-globe`, Footer lightbox close, copy/check swap | 1 finding (plus icon parts of rows above) |
| Performance | `transition: all` (none), `will-change` (none), animated properties, unused global CSS in `custom.css` and unused header components | 1 finding |

## Findings

### Scoped interactions (keyboard)

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `src/components/PreviewModelsBanner.astro:289-297` | A document-level `keydown` listener dismisses the topmost notice on **any** Escape: `if (e.key !== 'Escape') return; … dismiss(el)`. **Reproduced:** on `/models/`, open "All filters", press Escape: the dialog closes **and** the API transition notice is dismissed and stored in `sessionStorage`. The search dialog and any other Escape use do the same. | Bind Escape to the notice only: listen on each `.qp-bar` (`bar.addEventListener('keydown', …)`), so Escape dismisses a notice only while focus is inside it; or at least bail out with `if (e.defaultPrevented \|\| document.querySelector('dialog[open]') \|\| !e.target.closest?.('.qp-bar')) return;`. | A destructive side effect on the most common "go back" key: the user closes a panel and silently loses a site announcement for the session, with no feedback. Misleading and not undoable. |

### Tabular numbers

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/components/ModelsComparison.astro:1024-1028` + style `:2113-2117`; `:978` (`data-filter-count`); `:1020` (Show results `{n}`); `src/components/AvailableModels.astro:280-285` (`.models-count`) | Counts that change with every filter click ("Showing 38 of 38 models", the filter badge, "Show 12 results") use proportional digits. Runtime check: `.models-comparison__status` computes `font-variant-numeric: normal`. `table.css:47-49` only covers table cells. | Add `font-variant-numeric: tabular-nums;` to `.models-comparison__status`, `.mc-open-panel [data-filter-count]`, `.mc-panel__foot [data-show-results]` and `.models-count`. While there, replace the status's raw `font-size: 0.875rem` and `color: var(--sl-color-gray-3)` with `var(--aifs-text-small-font-size)` and `var(--aifs-color-text-muted)`. | Digits change width as the count changes, so the line and the button label shift sideways on each filter change. The fallback system font has proportional digits (the table.css comment says so itself). |

### Text wrapping

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles/redesign.css:53-61` (rules), missing on `redesign.css:189` `.card .title`, `:233` `.sl-link-card .title`, `:241` `.description`; `AvailableModels.astro:374` `.model-card__name`; `PlansPage.astro:744` `.plan-tile__for`; `PreviewModelsBanner.astro:133` `.qp-msg`; `ModelsComparison.astro:2048` `.mc-panel__title` | `text-wrap: balance / pretty` only applies to `h1–h4` and `p, li` that are direct Markdown content. Component titles and descriptions (cards, link cards, plan tiles, notices) wrap greedily. | Add `text-wrap: balance` to the card, link-card, model-card and panel titles, and `text-wrap: pretty` to `.sl-link-card .description`, `.plan-tile__for` and `.qp-msg`. No tokens needed. | Two-column card grids at 768px often leave a single word on a card title's second line; the notice text leaves orphans at phone width. The site already decided this for prose; components should match. |

### Focus rings (surfaces, state)

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/styles/sidebar-nav.css:71-74`, `:199-202`; `src/styles/table.css:190-197` | Focus is drawn as `outline: none; box-shadow: inset 0 0 0 … var(--aifs-sidebar-nav-focus)` (and `inset 0 0 0 2px var(--aifs-table-focus)` on sortable headers, with the button's own outline also removed). In Windows forced-colours mode box-shadows are dropped, so these controls have **no** focus indicator. | Keep the shadow, and replace `outline: none` with a transparent outline that forced colours repaint: `outline: var(--aifs-sidebar-nav-focus-width) solid transparent; outline-offset: calc(-1 * var(--aifs-sidebar-nav-focus-width));` (table: `var(--aifs-button-focus-width)`). Also replace the table's raw `2px` with `var(--aifs-button-focus-width)`. | The current-page bar was already made a border for high-contrast mode (`sidebar-nav.css:117-118`); the focus ring was not. Keyboard users in forced colours lose their place in the site navigation, On this page and the table headers. |
| LOW | `src/components/Footer.astro:171-175`; `src/components/PreviewModelsBanner.astro:161-165` | Footer links focus with `outline: 2px solid var(--sl-color-accent)`, offset `3px`, radius `2px`; the notice focuses with radius `6px`. The global ring is `var(--aifs-color-focus)` at offset `2px` (`redesign.css:112-115`). | Delete both local focus rules and let the global `:focus-visible` rule apply, or use `var(--aifs-button-focus-width) solid var(--aifs-button-focus)` / `var(--aifs-button-focus-offset)` and `var(--aifs-radius-control)`. | Two ring colours and three offsets on one page; the footer's magenta ring reads as a brand accent, not focus. |

### Minimum hit area

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/components/ModelsComparison.astro:1982-1988` with `src/styles/button.css:79-86` | Applied-filter chips and "Clear all" are small buttons whose `::before` reaches 6px above and below (`(32 − 44) / 2`). The row wraps with `gap: var(--aifs-filter-panel-option-gap)` (8px), so wrapped rows' hit areas overlap by 4px. `button.css` itself assumes "neighbours sit at least 8px apart", which only holds horizontally. | Give the chip row a row gap that clears the extension: `row-gap: calc(var(--aifs-button-min-height) - var(--aifs-button-min-height-small));` (12px, all tokens), keeping `column-gap: var(--aifs-filter-panel-option-gap)`. | Each chip removes a filter. With overlapping hit areas, a tap near a chip's edge removes the chip on the other row. |
| LOW | `src/components/Footer.astro:145-164` (legal links); `:93`, `:198-207` (lightbox close) | Footer links are 14px text with no padding (about 20px tall), rows `0.5rem` apart. The plugin lightbox close is a bare `×` character, `font-size: 1.5rem`, no padding, no hover or focus style, English `aria-label="Close"` on German pages too. | Footer links: `display: inline-block; padding-block: var(--aifs-sidebar-nav-condensed-padding-y);` or a pseudo-element extension to 44px on touch. Lightbox close: render the Button component (`variant="ghost" iconOnly ariaLabel=…`) with `<Icon name="action-close" />`, localised label. | Legal links are hard to hit on phones. The `×` glyph is not from the Telekom icon set (AGENTS.md: Telekom icons only), sits off-centre in its line box, and has a ~24px target with no states. |

### Concentric border radius

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/components/PreviewModelsBanner.astro:102`, `:176` | The notice is `border-radius: 8px` (raw) with phone padding `4px 6px`; its ghost close button (`--aifs-button-radius`, 8px) sits in the corner, so the hover fill's corner is as round as the notice's, 4–6px inside it. | Notice: `border-radius: var(--aifs-notification-radius)`. Close button inside it: `border-radius: var(--aifs-radius-control)` (4px ≈ 8 − 4). Replace the off-grid paddings (`0.45rem 0.75rem`, `4px 6px`, `gap: 0.625rem`, `column-gap: 6px`) with `--aifs-*` spacing tokens; if none fits, `TODO(token-gap)` + GAPS row. | Equal radii on a surface and a near-flush child make the inner corner look pinched on hover. The raw values are also outside the token gate. |

### Optical alignment

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/components/ModelsComparison.astro:2496`, `:2516-2518`; `src/components/PlansPage.astro:792-797` | Phone list: the meta line is indented `26px`, the expanded details panel `22px` (padding `8px 10px`, radius `var(--aifs-radius-control, 8px)`), so the panel's text starts 4px left of the meta text above it. Plan tiles: `.plan-tile__list li { align-items: center }`, so when a feature wraps to two lines the tick or cross centres between them. | Phone list: one indent for both, derived from the logo (`calc(var(--aifs-table-logo-size) + <gap token>)`) or a new `aifs.models-list.indent` token; panel padding `var(--aifs-select-icon-gap)` on both axes; drop the misleading `8px` fallback. Plan tiles: `align-items: flex-start` and centre the mark on the first line (`margin-block-start` from the line-height token). | Two raw indents for one column make the expanded panel look misplaced; leading icons should sit on the first line, as in the model cards. |

### Image outlines

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | No rule for `.sl-markdown-content img` (screenshots on plugin pages, diagrams); `src/styles/data-table.css:144`; `src/components/AvailableModels.astro:352`; `src/components/ModelPick.astro:213` | Content screenshots have no edge. Creator logos get three different edges: `Logo.astro` uses `--aifs-color-media-outline` (pure black/white, low alpha), the table tile `--aifs-color-border-subtle` and the cards `--aifs-model-card-logo-border` (tinted greys, `#dfdfe1` / `#39393c`). | Add `.sl-markdown-content img:not(.not-content *) { outline: 1px solid var(--aifs-color-media-outline); outline-offset: -1px; border-radius: var(--aifs-radius-media); }` (1px is the existing pattern in `Flag.astro`/`Logo.astro`; tokenise as a border width if wanted). Use `--aifs-color-media-outline` for the table and card logo tiles too. | A tinted grey ring around a white logo tile on a black sheet reads as dirt; one outline token for all media keeps depth consistent. |

### Motion restraint / skip animation on page load

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/components/PreviewModelsBanner.astro:107`, `:199-208` | `animation: gaSlideIn 0.32s cubic-bezier(0.2, 0.9, 0.25, 1.1)` runs every time the notices are unhidden, so on **every page view** (screenshot of `/` at 1440px caught both notices mid-fade). The `1.1` control point overshoots (a bounce), and the notices now live in a sticky band, so they slide up out from under the header on each navigation. | Drop the entrance for routine page views: animate only the first appearance in a session (set a `data-entered` flag in `sessionStorage` and add an `.qp-bar--enter` class only then), or remove the animation. If kept, use opacity only with `var(--aifs-tooltip-easing)` and a duration token, no overshoot. | Repeated motion on the highest-frequency event in a docs site (page load) costs attention every time; the overshoot adds bounce the rest of the site does not have. The reduced-motion guard exists and stays. |

### Contextual icon animation

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles/button.css:193-208`; copy buttons in `src/components/AvailableModels.astro:213-218` and `src/components/ModelPick.astro:106-111` | Copy → check swaps with `display: none` / `inline-flex`: the icon jumps. The same buttons also carry a native `title` next to `successTooltip`, so the browser's title box and the Scale tooltip can show together. | Keep both icons in the DOM, stack them (`.aifs-button__success { position: absolute; }`), and cross-fade: `opacity`, `scale` 0.25 → 1, `filter: blur(4px)` → 0, `transition-property: opacity, scale, filter; transition-duration: var(--aifs-button-transition-duration); transition-timing-function: cubic-bezier(0.2, 0, 0, 1)` (no Telekom token for this curve: `TODO(token-gap)` + GAPS row); keep the reduced-motion block. Drop `title` (the `aria-label` names the action) or use the Tooltip component for the hover text. | The skill's contextual-icon pattern: a short cross-fade confirms the change without a jump; the tooltip and live region give the non-motion cues. Mixed native and custom tooltips look unfinished and can overlap (double tooltip not observed on screen). |

### Interruptible animations / motion tokens

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles/data-table.css:107-109`; `src/components/ModelsComparison.astro:2477-2484`; `src/styles/redesign.css:225`, `:251-253`, `:316`, `:330-332` | Sort arrow and phone-list chevron rotate with raw `160ms ease`; the phone chevron has **no** reduced-motion guard. Link-card and pagination transitions use the duration token with a raw `ease`. | Use `var(--aifs-button-transition-duration)` / `var(--aifs-button-transition-easing)` (or the card tokens) everywhere, and add `.mc-m__chevron` to a `@media (prefers-reduced-motion: reduce) { transition: none; }` block. | One motion vocabulary; the missing guard means the chevron still rotates for users who asked for less motion (AGENTS.md: reduced motion is part of done). |

### Icons in forced colours

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/styles/icons.css:19-21`, `:113`, `:124`; `src/styles/custom.css:289-301` (`.fi-globe`) | Icons are painted as `background: currentColor` through a `mask`. In forced-colours mode the browser replaces background colours with the system Canvas colour, so these icons (search, header select icons, sidebar chevrons, menu button, link-card and pagination arrows, external-link marks) disappear. Inline `Icon.astro` SVGs (`fill="currentColor"`) are not affected. | `@media (forced-colors: active) { /* the same selector list */ { forced-color-adjust: none; } }`: the element then keeps `currentColor`, which it inherits already forced to the system text colour. | The menu button and sidebar chevrons are the only visible affordance for those controls; without them, high-contrast users see empty buttons. Not verified at runtime (no forced-colours emulation run). |

### Performance (and dead global CSS)

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles/custom.css:28-52`, `:54-126`, `:128-226`; `src/components/HeaderApiKeyLink.astro`, `src/components/MobileApiKeyLink.astro` (both say "Not used") | Every page loads unused global rules: `.hover-card` (animates `box-shadow` and `transform: scale(1.03)` on hover), `.my-*` utilities with raw px, `.plans-dialog`, `.extended-filter-*`, `.pricing-tooltip`, `.available-models-card`, `.copy-icon`, `.filter-border`. A repo-wide search finds none of these classes outside `custom.css`. | Delete them (and the two unused components). Keep `.hero-badges`, `.sort-icon`, `.commitment-note` (all still referenced) and `.fi-globe`. | Animating `box-shadow` is paint-heavy and the raw scale/shadow values break the token gate if anyone reuses a class. Dead CSS also makes reviews like this one slower. Live code has no `transition: all` and no `will-change`: clear. |

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| `src/styles/button.css` | `scale(0.96)` press feedback on buttons | Scale's button has no press scale; the design system wins (user rules). Adding it would need a GAPS row and Scale-level agreement. |
| `tokens.css` `--aifs-color-media-outline` (0.14 light / 0.21 dark) | Lower to the skill's 0.1 | Already pure black/white as the skill requires; the higher alpha is a deliberate token so white flag areas hold an edge on the white sheet. |
| Cards, tables, filter fields | Swap borders for layered shadows | These borders are structural (Scale's card and field frames, GAPS row 2); shadow tokens are not converted yet (GAPS row 10). |
| `--aifs-*-transition-easing` `cubic-bezier(0.4, 0, 0.6, 1)` | Switch state transitions to ease-out | It is Telekom's standard motion curve from the token tier; changing it is a design-system decision, not polish. |
| Root font smoothing | Add `-webkit-font-smoothing: antialiased` | Starlight's `reset.css:26` already sets it. |
| `layout.css:206-215` breakout over On this page | Report as a defect | Open decision; no concrete visual or interaction defect found in code or at 1440px. |

## Verification and verdict

**Run:**
- `grep` across `src/styles` and `src/components` for `transition`, `animation`, `@keyframes`, `will-change`, `scale(`, `tabular-nums`, `text-wrap`, `font-smoothing`, `prefers-reduced-motion`, `forced-colors`, `box-shadow`: results are the basis of the animation, performance and typography rows.
- Class-usage search for every `custom.css` legacy class: no references outside the stylesheet.
- Browser (dev server `localhost:4322`, Chromium pane):
  - `/models/`: opened "All filters", pressed **Escape** with a real key event → dialog closed **and** `apiTransitionBannerDismissed=1` was written; one notice disappeared. **Confirms the HIGH finding.** (The key was removed from `sessionStorage` afterwards.)
  - `/models/`: `getComputedStyle(.models-comparison__status).fontVariantNumeric` → `normal` ("Showing 38 of 38 models").
  - `/` at 1440×900, light mode: screenshot shows both notices mid-entrance on an ordinary page load.
  - Viewport reset to desktop afterwards.

**Not verified:**
- Forced-colours mode (focus rings, mask icons): code reasoning only.
- Dark mode, 375px, German pages: not walked in the browser this pass.
- Motion at 10% speed in DevTools' Animations panel: not run (no DevTools panel access); timings read from code.
- Applied-chip hit-area overlap: from the token arithmetic (8px gap vs 6px extensions), not measured with wrapped chips.
- Double tooltip on copy buttons: seen in markup, not observed on screen.
- Sort-header focus ring at runtime: programmatic focus did not reach `:focus-visible`; read from code.

**Verdict: Block.** One HIGH finding remains (Escape dismisses the site notice from anywhere). Also 5 MEDIUM and 9 LOW (15 findings in all). Unverified checks are listed above.
