# Design: Remove Fine-Tuning, Add Changelog, Scaffold Model Cards

**Date:** 2026-05-13
**Author:** Ashwin Nair Anilil
**Status:** Draft — awaiting user review

## Context

The AI Foundation Services docs site needs three coordinated content changes:

1. **Remove** the Fine-Tuning API documentation — the feature is no longer offered.
2. **Add** an Updates & Changelog page to track major model releases and feature updates going forward.
3. **Scaffold** a new top-level Models section with one card per hosted model, organized in the style of IONOS AI Model Hub but preserving T-Systems' product-specific subtleties (data residency, plan availability, per-contract rate limits, etc.).

All three are doc-only and ship in a single PR off the freshly-pulled `main` branch.

## Goals

- Eliminate every reference to the Fine-Tuning API across English, German, and unversioned current docs. The `v1/` snapshot stays untouched (frozen historical version per `CLAUDE.md`).
- Establish a reverse-chronological changelog that the team can edit going forward, seeded with the changes shipping in this PR.
- Stand up the Models section IA and scaffolding such that every currently-hosted model has a card stub, the deterministic parts are pre-filled from the existing pricing JSON, and the narrative parts are marked TODO.
- Preserve T-Systems' product differentiators (sovereignty, EU data processing, per-contract rate limits, no training on customer data, plan-tier availability).

## Non-goals (YAGNI)

- Backfilling narrative content (strengths, limitations, version history) for any model. Per-team follow-up.
- Benchmark/eval scores, latency numbers, prompt-engineering tips.
- Running the model-card generator automatically at build time.
- Migrating `AvailableModels.astro` to consume a new data layer. Existing component stays; it already reads the pricing JSON.
- Touching `src/content/docs/v1/` in any way — it is a frozen snapshot.
- Pulling models from the live `/v2/models` API (auth-gated, would require build-time secret).

## Branch & PR strategy

- Pull `origin/main` into local `main`.
- Create branch `ashwin/remove-finetuning-add-changelog-and-model-cards` off `main`.
- One PR, three logical commits matching the deliverables, in this order:
  1. Remove Fine-Tuning (deletion)
  2. Add Changelog page (single page + sidebar entry)
  3. Add Models section scaffolding (generator script + stubs + index + sidebar)

## Deliverable 1: Fine-Tuning removal

### Files deleted

- `src/content/docs/guides/fine-tuning.mdx`
- `src/content/docs/de/guides/fine-tuning.mdx`

### Files edited

- `astro.config.mjs` — remove the `Fine-Tuning` sidebar item (currently line 65). Add a redirect entry `'/guides/fine-tuning': '/changelog'` so external links surface the deprecation announcement rather than 404.
- `src/content/docs/reference/api-endpoints.mdx` — drop the 4 `/fine_tuning/jobs*` rows (currently lines 29–32) and remove "fine-tuning" from the page `description` frontmatter (line 3).
- `src/content/docs/de/reference/api-endpoints.mdx` — mirror.
- `src/content/docs/guides/index.mdx` — remove the Fine-Tuning card (lines 66–68) and trim "fine-tuning" from the page `description` frontmatter (line 3).
- `src/content/docs/de/guides/index.mdx` — mirror.
- `src/content/docs/faq.mdx` — edit lines 8 and 24: drop the "fine-tuning" mentions from the overall product summary and the components/pricing description.
- `src/content/docs/de/faq.mdx` — mirror.

### Left untouched

- `src/content/docs/v1/guides/fine-tuning.mdx` and `src/content/docs/v1/reference/api-endpoints.mdx` — v1 is a frozen historical version per the project's `CLAUDE.md`.

## Deliverable 2: Updates & Changelog page

### Files created

- `src/content/docs/changelog.mdx`
- `src/content/docs/de/changelog.mdx`

### Sidebar

Add a top-level entry in `astro.config.mjs` placed immediately before the existing `FAQ` entry:

```js
{ label: 'Changelog', translations: { de: 'Änderungsprotokoll' }, slug: 'changelog' },
```

### Format

Keep-a-Changelog style, reverse-chronological, grouped by month under `## YYYY-MM` headings. Each entry is tagged with one of: `[Added]`, `[Changed]`, `[Deprecated]`, `[Removed]`, `[Fixed]`. German equivalents: `[Hinzugefügt]`, `[Geändert]`, `[Veraltet]`, `[Entfernt]`, `[Behoben]`.

### Seed entry (2026-05)

Captures the changes shipping in this PR:

```markdown
## 2026-05

- **[Added]** New Models section with individual cards for every hosted model — context, pricing, sovereignty, plan availability, and OpenAI-compatible endpoint reference per model.
- **[Added]** Updates & Changelog page (you are reading it).
- **[Removed]** Fine-Tuning API documentation. The feature is no longer offered.
```

### Frontmatter

```yaml
---
title: "Updates & Changelog"
description: "Major model releases, feature updates, and deprecations for AI Foundation Services."
---
```

## Deliverable 3: Models section scaffolding

### Source of truth

The existing pricing JSON at `src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json` is the canonical source for:

- `exactModelName` → the API model id (and slug source)
- `displayModelName` → human-readable display name
- `contextWindow` → context window size
- `deploymentRegion` → mapped to hosting provider and sovereignty rating
- `termsOfUseUrl` → license link
- `inputPricePerMillionTokens`, `outputPricePerMillionTokens` → pricing
- `requestPerMinuteLimit`, `inputTokenPerMinuteLimit`, `outputTokenPerMinuteLimit` → rate limits
- Presence-across-packages → `Available in plans: Essential | Professional | Agentic | Test`

Fields the pricing JSON does NOT carry are left as TODO placeholders in the MDX body: parameter count, quantization, multilingual flag, modalities (default by category if unambiguous), feature flags (streaming, tool calling, reasoning, structured outputs), capability ratings for Intelligence and Speed (Sovereignty is autogenerated), provider/origin, base-model release date, added-to-hub date, version history.

### IA — sidebar structure

New top-level `Models` section, IONOS-inspired lifecycle-first layout:

```
Models
├─ Overview                          ← was getting-started/models.mdx
├─ Active Models
│   ├─ Chat & Reasoning (LLMs)       ← autogenerate: { directory: 'models/llms' }
│   ├─ Coding                        ← autogenerate: { directory: 'models/coding' }
│   ├─ Vision                        ← autogenerate: { directory: 'models/vision' }
│   ├─ Embeddings                    ← autogenerate: { directory: 'models/embeddings' }
│   ├─ Audio (STT)                   ← autogenerate: { directory: 'models/audio' }
│   └─ Image Generation              ← autogenerate: { directory: 'models/image-generation' }
├─ Scheduled for Retirement          ← models/scheduled-for-retirement.mdx
└─ Retired Models                    ← models/retired.mdx
```

Using Starlight's `autogenerate: { directory: ... }` for the leaves means new model files appear in the sidebar without touching `astro.config.mjs`.

### File layout

```
src/content/docs/models/
├─ index.mdx                                   ← moved from getting-started/models.mdx
├─ scheduled-for-retirement.mdx                ← seeded empty
├─ retired.mdx                                 ← seeded empty
├─ llms/
│   ├─ llama-3-3-70b-instruct.mdx
│   ├─ mistral-small-3.mdx
│   ├─ gpt-5-2.mdx, gpt-5.mdx, gpt-5-mini.mdx
│   ├─ gpt-4-1.mdx, gpt-4-1-mini.mdx, gpt-4o.mdx
│   ├─ o3.mdx, o3-mini.mdx, o4-mini.mdx, o1-mini.mdx
│   ├─ claude-4-6-opus.mdx, claude-4-6-sonnet.mdx (… all active Claude variants)
│   ├─ gemini-3-pro.mdx, gemini-3-flash.mdx, gemini-2-5-pro.mdx, gemini-2-5-flash.mdx
│   ├─ qwen3-next-80b.mdx, gemma-4.mdx, gpt-oss-120b.mdx
├─ coding/
│   └─ qwen3-coder-30b-a3b-instruct-fp8.mdx
├─ vision/
│   ├─ qwen3-vl-30b-a3b-instruct-fp8.mdx
│   └─ gemini-2-5-flash-image.mdx
├─ embeddings/
│   ├─ text-embedding-bge-m3.mdx
│   └─ jina-embeddings-v2-base-de.mdx
├─ audio/
│   ├─ whisper-large-v3.mdx
│   └─ whisper-large-v3-turbo.mdx
└─ image-generation/
    └─ gpt-image-1.mdx
```

Plus the full German mirror at `src/content/docs/de/models/...`.

### Existing `getting-started/models.mdx`

Moved to `src/content/docs/models/index.mdx`. Updated to:

- Add intro that the Models section now has per-model cards.
- Keep the `<AvailableModels />` browse table.
- Keep "List Models via API", "Model Categories", "Hosting & Compliance".
- The `Models` item is removed from the Getting Started sidebar group; Quickstart + Authentication remain.
- Redirect added in `astro.config.mjs`: `'/getting-started/models': '/models'`.

### Per-card structure

Each card is an MDX file with this layout:

```markdown
---
title: "Llama 3.3 70B"
description: "Meta's 70B-parameter open-weights LLM, hosted on T-Cloud Germany with EU data processing."
sidebar:
  label: "Llama 3.3 70B"
modelId: "Meta-Llama-3.3-70B-Instruct"
---

<one-paragraph summary — TODO>

## Central parameters

| Capability | Rating |
| Intelligence | TODO |
| Speed | TODO |
| Sovereignty | **High** |   ← autogenerated from deploymentRegion

| Field | Value |
| Model identifier | `Meta-Llama-3.3-70B-Instruct` |   ← autogen
| Context window | 128K |                                  ← autogen
| Parameters | TODO |
| Quantization | TODO |
| Multilingual | TODO |

## Lifecycle & alternatives

- **Stage:** Stable
- **Added to AI Foundation Services:** TODO
- **Scheduled retirement:** None
- **Suggested alternative if retired:** N/A

## Origin

- **Provider:** TODO
- **Country of origin:** TODO
- **Base model release:** TODO
- **License:** [link from termsOfUseUrl](https://...)   ← autogen

## T-Systems hosting & data handling

- **Hosting provider:** T-Cloud                          ← autogen
- **Server location:** Germany                           ← autogen
- **Data processing:** EU/EEA                            ← autogen
- **Data handling category:** Open-source on T-Cloud — data is processed inside the EU, is not stored, and is not viewable by Telekom or third parties.   ← autogen for T-Cloud models; alternative wording autogenerated for Azure/Google forwarded models
- **Customer data is never used for training.**          ← always present (global commitment)

## Modalities

- Input: TODO
- Output: TODO

## Endpoints

- `POST /chat/completions`                               ← autogenerated by category

## Features

- Streaming: TODO
- Tool / function calling: TODO
- Reasoning: TODO
- Structured outputs: TODO
- Asynchronous requests: TODO

## Pricing

- Input: €0.50 / million tokens                          ← autogen
- Output: €0.50 / million tokens                         ← autogen
- Available in plans: Essential, Professional, Agentic   ← autogen from package membership
- See [Plans & Pricing](/plans) for full context.

## Usage example

```python
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="Meta-Llama-3.3-70B-Instruct",
    messages=[{"role": "user", "content": "Hello!"}],
)
```
                                                         ← autogen, parameterized by modelId and category

## Rate limits

- Requests per minute: 300                               ← autogen
- Input tokens per minute: 300,000                       ← autogen
- Output tokens per minute: 150,000                      ← autogen
- Limits are scoped per contract.
- See [Rate Limits](/reference/rate-limits) for full details.

## Version history

- TODO
```

### Autogen vs TODO split

**Autogenerated by the script from pricing JSON:**

- Frontmatter `title`, `description`, `sidebar.label`, `modelId`
- "Model identifier" and "Context window" rows
- Sovereignty rating
- License URL in Origin
- Entire "T-Systems hosting & data handling" block
- Endpoints (by category mapping in the script)
- Entire Pricing block
- Usage-example code block (parameterized by `modelId`)
- Entire Rate limits block

**Left as TODO for humans:**

- Summary paragraph
- Intelligence and Speed capability ratings
- Parameters, Quantization, Multilingual
- Provider, Country of origin, Base model release
- Added-to-hub date
- Modalities
- Feature flags (streaming/tools/reasoning/structured outputs/async)
- Version history

### Sovereignty mapping (autogen rule)

- `deploymentRegion == 'otc-germany'` → **High** (T-Cloud Germany, open-source)
- Provider `Azure` with hosting `Sweden` or any EU region → **Medium** (third-party EU sub-processors)
- Anything that may route outside EU (e.g., upstream Anthropic / Google with non-EU sub-processors) → **Low**

The generator maintains a small `SOVEREIGNTY_OVERRIDES` map for cases the rule doesn't cover correctly.

### Data-handling boilerplate (autogen rule)

- T-Cloud (`otc-germany`) → "Open-source on T-Cloud — data is processed inside the EU, is not stored, and is not viewable by Telekom or third parties."
- Azure / Google forwarded → "Proprietary model forwarded to the upstream provider (Microsoft Azure / Google Cloud), who may use sub-processors. Selecting this model accepts the third-party provider's terms."
- Global "Customer data is never used for training" line is always appended.

### Lifecycle table seeds

- `models/scheduled-for-retirement.mdx` — empty seeded table with a "no models currently scheduled for retirement" placeholder.
- `models/retired.mdx` — empty seeded table with a placeholder. The deprecated `Fine-Tuning API` could be listed as the first historical entry, but it's a feature, not a model, so it stays out — Fine-Tuning's removal lives only in the Changelog.

## Generator script

### Location and invocation

- `scripts/generate-model-cards.ts` — Bun TypeScript script.
- Run manually: `bun run scripts/generate-model-cards.ts`.
- Document this in `package.json` `scripts` as `generate:model-cards`.

### Behavior

1. Read pricing JSON from a hard-coded path constant (with a comment noting where to update when pricing JSON version bumps).
2. Iterate all packages, accumulate per-`exactModelName`: first occurrence wins for static fields; package membership accumulates into `plansAvailability` (e.g., `["Essential", "Professional"]`).
3. For each unique model, look up `CATEGORY_MAP[exactModelName]` → category (`llm` / `coding` / `vision` / `embedding` / `audio` / `image-generation`). Default `llm` if missing, with a stderr warning.
4. Render the EN MDX from a template string using model data; write to `src/content/docs/models/<category>/<slug>.mdx`. Same for DE under `src/content/docs/de/models/`, with German section headers.
5. **Refuse to overwrite** existing files (one-time seed in practice). Print a summary of files created and files skipped.

### `CATEGORY_MAP`

In-script `Record<string, ModelCategory>` keyed by `exactModelName`. Initial population covers every model in the current pricing JSON. Unknown models log a warning and default to `llm`.

### `SOVEREIGNTY_OVERRIDES` and `DATA_HANDLING_OVERRIDES`

Empty initially. Maps `exactModelName → override` for edge cases the auto-rule doesn't get right.

### Slug rule

`kebab-case(exactModelName.toLowerCase())`. Example: `Meta-Llama-3.3-70B-Instruct` → `meta-llama-3-3-70b-instruct`.

### Endpoint mapping

Hard-coded per category:

- `llm`, `coding` → `POST /chat/completions`
- `embedding` → `POST /embeddings`
- `audio` → `POST /audio/transcriptions`
- `image-generation` → `POST /images/generations`
- `vision` → `POST /chat/completions` (multimodal input)

## Localization strategy

- Cards and changelog ship in both EN and DE simultaneously.
- DE section headers translated (`Stärken`, `Einschränkungen`, `Geeignet für`, etc.); narrative TODOs stay English until human-translated.
- Autogenerated boilerplate (hosting data handling, customer-data-never-used-for-training) is German-translated in the generator's DE template.
- Sidebar labels translated in `astro.config.mjs`.

## Risks & open questions

1. **Pricing JSON version drift.** When the JSON file moves to v1.20.3 or later, the generator path constant breaks. Mitigation: comment in the script + a one-line `package.json` note about updating the path when bumping pricing data.
2. **AvailableModels.astro stays on pricing JSON.** The browse table on `models/index.mdx` does not link rows to individual cards in this PR. That's a follow-up — out of scope per Non-goals.
3. **Models in `AvailableModels.astro` `EXTRA_MODELS` / `OFFLINE_MODELS`.** These are hand-curated overrides on top of the pricing JSON. The generator mirrors the component's behavior:
   - `OFFLINE_MODELS` — filtered out (they are hidden from the browse table, treated as not currently active). Not generated as active cards. If any of them needs to be surfaced as retired/scheduled-for-retirement, that's per-team follow-up content edit.
   - `EXTRA_MODELS` — included (they are hand-added on top of pricing JSON). Generator treats each as a synthetic pricing-JSON entry with the fields the literal carries (`modelId`, `name`, `provider`, `hosted`, `countryCode`, `dataProcessing`) and TODO placeholders for the fields it doesn't (pricing, context window, rate limits).
   - The generator imports these sets/lists from `src/components/AvailableModels.astro` to keep one source of truth. Failing that, it inlines the same lists with a comment to re-sync if `AvailableModels.astro` changes.
4. **DE translation of categories.** "Embeddings", "Vision", "Coding" stay English (common usage). "Image Generation" → "Bildgenerierung". "Audio (STT)" → "Audio (STT)". This is editorial; revise if the team prefers different translations.
5. **No tests.** The site has no test suite (per `CLAUDE.md`). Validation is `bun run build` succeeding + manual spot-check of one card per category in `bun run dev`.

## Out of scope (for clarity)

- Updating `AvailableModels.astro` to link to individual cards.
- Backfilling any TODO content in any card.
- Migrating away from pricing JSON to a synthesized models data file.
- Adding benchmarks/eval data, latency numbers, prompt tips.
- Touching `v1/` content.
- Adding pre-build hooks or CI generation.

## Acceptance criteria

- `bun run build` succeeds.
- `bun run dev` renders without console errors and:
  - `/guides/fine-tuning` redirects to `/changelog` (both locales).
  - `/changelog` exists in both locales and shows the seed May 2026 entry.
  - `/models` exists, shows the moved browse content, has the new sidebar tree.
  - At least one card per category (e.g., `/models/llms/llama-3-3-70b-instruct`) renders with autogenerated structured sections and TODO markers in narrative sections.
  - DE equivalents render at `/de/...`.
- `/getting-started/models` redirects to `/models`.
- No references to "fine-tuning" or "fine_tuning" remain in `src/content/docs/` (excluding `src/content/docs/v1/`).
- Sidebar does not show a "Fine-Tuning" entry; does show "Models" (top-level), "Changelog", and the lifecycle sub-sections.

## Implementation order

1. Pull `main`, branch off, sanity-check `bun run dev`.
2. **Commit 1 (Fine-Tuning removal):** delete files, update sidebar, update cross-refs across EN+DE, add redirect. Verify build.
3. **Commit 2 (Changelog):** create EN+DE pages, add sidebar entry. Verify build.
4. **Commit 3 (Models scaffolding):** write generator, run it, move `getting-started/models.mdx` to `models/index.mdx`, create seeded `scheduled-for-retirement.mdx` and `retired.mdx`, update sidebar, add `/getting-started/models` redirect. Verify build and dev render.
5. Push branch. Open PR.

Each commit is pushed to origin per the user's "push after each task" preference.
