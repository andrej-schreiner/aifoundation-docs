# Telekom icons (Scale)

- Source: https://github.com/telekom/scale, `packages/components/src/telekom/icons/`
- Commit: e90165a73ad4c2a0b439c513aa446fe8c83d0706 (icon set `assets_20230614`)
- Copied: 2026-10-30
- Licence: these are Telekom brand assets from Scale's `src/telekom/` folder, which Telekom reserves
  for Telekom products (not covered by Scale's MPL-2.0). See the Scale README.

Changes made when copying: `width`/`height` replaced by `viewBox="0 0 24 24"` so the icons scale,
and internal ids prefixed with the icon's name and variant, so several icons on one page do not
share an id. Paths are unchanged. `default.svg` is the outline icon, `selected.svg` the filled one.
