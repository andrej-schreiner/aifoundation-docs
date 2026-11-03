# Access the Docs

[https://docs.llmhub.t-systems.net/](https://docs.llmhub.t-systems.net/)

## Website

This website is built using [Astro Starlight](https://starlight.astro.build/), a documentation framework built on [Astro](https://astro.build/).

## Installation

### Requirements

- **Bun** - A fast JavaScript runtime and package manager. Install from [bun.sh](https://bun.sh).

```text
bun install
```

### Local Development

```text
bun run dev
```

This command starts a local development server. Most changes are reflected live without having to restart the server.

### Build

```text
bun run build
```

This command generates static content into the `dist` directory and can be served using any static contents hosting service.

```text
bun run preview
```

This command is used to preview the production build locally.

With the preview running, `bun run check:urls http://localhost:4321` checks that every production URL (`scripts/prod-sitemap.txt`) returns 200 or redirects to an existing page and anchor.

### Deployment

The deployment to GitHub Pages is automated using GitHub Actions.

## Updating the Changelog

The public changelog lives in two files that must stay in sync:

- English: [`src/content/docs/changelog.mdx`](src/content/docs/changelog.mdx)
- German: [`src/content/docs/de/changelog.mdx`](src/content/docs/de/changelog.mdx)

Add user-visible changes only — new models, feature launches, deprecations, and removals. Internal refactors and copy edits do not belong here.

### Adding an entry

1. Open both files.
2. Find the top `## vX.Y.Z — YYYY-MM` heading.
   - If the release is **already published** (an archived snapshot exists under `archive/vX-Y-Z/`), do **not** edit it — create a new version section above it (see "Archived versions" below).
   - If the release is **still in flight** (no snapshot yet), add your bullet under the appropriate subsection.
3. Use these subsection labels (mirror the headings across EN/DE):

   | English   | German       |
   |-----------|--------------|
   | `### Added`      | `### Hinzugefügt` |
   | `### Changed`    | `### Geändert`    |
   | `### Removed`    | `### Entfernt`    |
   | `### Deprecated` | `### Veraltet`    |

4. Write the bullet from the **reader's** perspective — link to the new/changed page, name the model or feature, and call out anything they need to migrate. Example:

   ```markdown
   - New **GPT-5.2** model — see [Models · Comparison](/models/comparison).
   ```

5. If you reference an in-product link, prefix `/de/...` in the German file and leave the root path in the English one — the locale prefix is **not** automatic for hard-coded links inside MDX.

### Archived versions (static snapshots)

The archived versions (v1.0.0, v1.1.0, v1.2.0 at `/v1/`, `/v1-1-0/`, `/v1-2-0/`
and their `/de/` paths) are not built from content. They are static copies of
production in [`archive/`](archive/README.md), made by
[`scripts/snapshot-archives.mjs`](scripts/snapshot-archives.mjs) and copied
verbatim into `dist/` at the end of the build (the `archive-snapshots`
integration in `astro.config.mjs`). The version select in the header lists them
([`src/archivedVersions.mjs`](src/archivedVersions.mjs)).

- Do not edit `archive/` by hand. `node scripts/snapshot-archives.mjs` fetches
  the archived pages listed in `scripts/prod-sitemap.txt` from production again
  and replaces the directory; run it only while production still serves the
  archives as they should stay. The archived pages' search uses production's
  Pagefind index, stored with them in `archive/_archive/pagefind/`;
  `node scripts/snapshot-archives.mjs --pagefind-only` refreshes only that.
- To freeze a new version, follow "How to archive a new version" in
  [`AGENTS.md`](AGENTS.md): `node scripts/snapshot-archives.mjs --version <slug>`
  snapshots one version that its source serves under a version path.

The current changelog stays a living document; each archived version's changelog
is part of its snapshot.

## Rate limits: the Service Description is the source of truth

Every TPM and RPM value in the docs comes from the Service Description (SD), the
"Leistungsbeschreibung LLM-Serving-Service", section 7.2 (one table per rate plan).
The German SD prevails over the English translation. If the docs and the SD differ,
the SD is right; if the SD has no value for a model and plan, the docs show none.

When a new SD version is published, check the docs against it in the same change:

1. Replace both PDFs in `public/files/` (same file names):
   `Leistungsbeschreibung-LLM-Serving-Service.pdf` (DE) and
   `Leistungsbeschreibung_LLM_Serving-Service_EN.pdf` (EN).
2. Compare every `inputTokenPerMinuteLimit`, `outputTokenPerMinuteLimit` and
   `requestPerMinuteLimit` in the current pricing JSON,
   `src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json`
   (it feeds `PlansPage.astro` and `ModelsComparison.astro`; it is the rate plans
   export of the AIFS Serving UI's Plans page). A value the SD does not list is
   `null`, which the tables show as "—".
3. Check the figures written into the pages, EN and DE together:
   `reference/rate-limits.mdx` (plan table and per-model examples), `faq.mdx`
   ("What are the rate limits?"), and the wording in `plans/index.mdx`,
   `plans/dedicated.mdx`, `models/preview.mdx`, `getting-started/concepts.mdx`
   and `public/llms.txt`.
4. Models that the SD adds or drops, and retirements, go through
   `src/shared/lib/retirements.ts` and the changelog as usual.

Archived versions are static snapshots (`archive/`) and are not updated.
