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
   - If the release is **already published** (an archived snapshot exists under `src/content/docs/vX-Y-Z/`), do **not** edit it — create a new version section above it (see "Cutting a new version" below).
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

### Cutting a new version (snapshot the docs)

When a release ships and the changelog/docs should be frozen as `vX.Y.Z`:

1. Copy the current docs tree into a new versioned folder, e.g.:
   ```text
   cp -R src/content/docs/* src/content/docs/v1-2-0/   # adjust as needed; do NOT copy /de or /vN folders into the snapshot
   ```
   In practice: snapshot the **unversioned** top-level files and folders (`changelog.mdx`, `getting-started/`, `guides/`, `models/`, etc.) into `vX-Y-Z/`. Skip `de/` and any existing `vN/` folders.
2. Add a sidebar config at [`src/content/versions/vX-Y-Z.json`](src/content/versions/) mirroring the structure of the existing `v1-1-0.json`.
3. Register the new version in [`astro.config.mjs`](astro.config.mjs) under `starlightVersions({ versions: [...] })`:
   ```js
   { slug: 'v1-2-0', label: 'v1.2.0' },
   ```
4. In the **current** (unversioned) `changelog.mdx` and `de/changelog.mdx`, add a fresh `## vX.Y.Z — YYYY-MM` heading at the top — this becomes the "in-flight" section for the next release.

The current changelog stays a living document; each `vN-N-N/changelog.mdx` is a frozen point-in-time snapshot.
