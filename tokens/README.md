# Design tokens (draft)

Telekom design tokens for the AI Foundation Services docs, in the
[DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/),
with light and dark mode through a
[DTCG resolver](https://www.designtokens.org/tr/2025.10/resolver/).

They are the single source for the site's colours, fonts, type sizes,
radii and border widths. `bun run tokens` (`scripts/build-tokens.mjs`)
resolves them for light and dark and writes `src/styles/tokens.css`, which
sets the `--aifs-*` variables the stylesheets and components use and fills
Starlight's `--sl-*` variables. Change a token file, run `bun run tokens`,
and commit both.

## Files

| File | Layer | Contents |
|---|---|---|
| `telekom.core.tokens.json` | Primitives | Colour palette incl. brand magenta, dimension scale, type scale, radius, line weight, motion, opacity |
| `telekom.semantic.tokens.json` | Semantic, both modes | Typography, text styles, spacing, radius, line weight, motion, opacity, size |
| `telekom.color.light.tokens.json` | Semantic, light | Text, background, primary, UI, functional and additional colours |
| `telekom.color.dark.tokens.json` | Semantic, dark | The same names with dark values |
| `aifs.docs.tokens.json` | Docs roles | What the docs need (link, action, table head, asides, current page, headings), each an alias of a Telekom semantic token |
| `aifs.resolver.json` | Resolver | Loads the Telekom set, picks light or dark, then applies the docs layer |

Resolve with `{ "theme": "light" }` or `{ "theme": "dark" }`. The theme
names match Starlight's `data-theme` attribute.

## Source

The four `telekom.*` files are generated from
[telekom/design-tokens](https://github.com/telekom/design-tokens) at commit
`882d939`, the token source behind Scale. The npm package
`@telekom/design-tokens` ships only the neutral open-source theme (violet
primary), so the Telekom brand layer (`src/telekom/core/color.tokens.json5`:
magenta `#e20074`, `#f61488` in dark mode) is applied on top.

Telekom reserves all rights to its brand. These values may only be used for
Telekom products; see the licence in the source repository.

Conversion notes:

- Every Telekom colour except the brand-derived ones was checked against
  Telekom's own built output: 185 of 185 match in each mode.
- Colours Telekom defines as "alias with alpha" (for example additional text,
  black at 65%) have no DTCG equivalent. They are written as resolved values,
  and the source alias is kept in `$extensions["com.telekom.design-tokens"].alphaOf`.
- Not converted yet: shadows (Telekom's multi-layer format) and the two
  percentage radii (`core.radius.500`, `radius.circle`), which DTCG `dimension`
  cannot express.
- Telekom's Sketch library IDs in `extensions` were dropped.

## Docs layer

`aifs.docs.tokens.json` only contains aliases, so it never holds a raw value.
Each token's `$extensions["net.t-systems.aifs"].css` names the Starlight
variable it should fill, for example `aifs.color.link.standard` →
`--sl-color-text-accent`. For typography tokens, `property` says which part of
the composite goes into the variable.

Decisions made in the draft:

- **Links are blue, actions are magenta.** Telekom's semantic link colour is
  blue (`#2238df` light, `#7d94f9` dark). Magenta is kept for primary actions
  and the current-page bar.
- **Table heads are grey**: `background.surface-subtle` with standard text.
- **Asides use the functional colours**: note = informational (blue), tip =
  success (green), caution = warning (orange), danger = danger (red).
- **Headings are one step below Telekom's marketing scale**: h1 = 42px,
  h2 = 32px, h3 = 24px, h4 = 20px, all extra-bold.
- **Nothing is smaller than 14px**: the smallest docs text uses `text-style.caption`.
- **Buttons are `#e20074` in both modes.** Telekom's dark-mode primary
  (`#f61488`) gives white text 3.9:1, below AA; `#e20074` gives 4.7:1.
  Small magenta text and icons (`aifs.color.brand-text`) keep Telekom's
  lighter dark-mode value, which stays readable on black.
- **Fonts fall back to the system stacks.** Body text starts with
  TeleNeoWeb, then the system UI fonts. Code uses the system monospace stack,
  because Telekom's `monospace` renders as Courier and widens code blocks.
- **Running text uses line height 1.5** (`typography.line-spacing.loose`),
  not the 1.4 of Telekom's body style.
- **Model logos sit on white in both modes** (`aifs.color.logo-background`).

## Open points

1. **Links must stay underlined.** Blue links against black body text reach
   2.7:1 (light) and 2.8:1 (dark), below the 3:1 needed to tell links apart by
   colour alone (WCAG 1.4.1). The underline is the non-colour cue.
2. **TeleNeo needs a licensed webfont.** Without the font files served by the
   site, every reader sees the system font.
3. **Shadows and spacing are not tokenised yet.** Shadows are marked
   `TODO(token-gap)` where they are used; paddings and gaps are still literal
   values.

## Checks run

- All six files validate against the official DTCG 2025.10 JSON schemas
  (`format.json`, `resolver.json`).
- All aliases resolve in both modes (658 tokens each), with no cycles and no
  type mismatches.
- Contrast for the docs pairs (text, links, action, table head, current page,
  focus, borders, all four asides) in both modes: everything passes except
  open point 1, which the underline covers.
- axe-core on the home, plans, model comparison, chat completions and design
  system pages, light and dark: no contrast failures.
