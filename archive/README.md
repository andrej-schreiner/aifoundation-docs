# Archived docs versions (static snapshot)

Frozen copies of the archived versions of the docs, exactly as production
(https://docs.llmhub.t-systems.net) served them on 2026-11-03. They are not generated from the current
content or components; the build copies this directory verbatim into dist/
(the `archive-snapshots` integration in `astro.config.mjs`).

- Versions: /v1/, /v1-1-0/, /v1-2-0/ and their /de/ equivalents
- Pages: 278 (24.5 MB), from `scripts/prod-sitemap.txt`
- Assets: 173 files (8.2 MB) in `_archive/`, at their production path under `/_archive`
- Source: https://docs.llmhub.t-systems.net, fetched 2026-11-03 by `scripts/snapshot-archives.mjs`

Changes made to the production files, and nothing else: asset URLs point to
`/_archive/…` instead of `/…` (so they never collide with the current
build's `/_astro/`), and each page has `<meta name="robots" content="noindex, nofollow">`.

Do not edit these files by hand. To refresh the snapshot (only while
production still serves the archives as they should be frozen), run:

    node scripts/snapshot-archives.mjs

It replaces this directory completely.
