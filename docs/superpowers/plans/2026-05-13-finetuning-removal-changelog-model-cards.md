# Fine-Tuning Removal, Changelog, and Model Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In one PR off the freshly-pulled `main`, remove the Fine-Tuning API docs, add a top-level Updates & Changelog page, and scaffold a new top-level Models section with one card per hosted model (IONOS-inspired IA, T-Systems differentiators preserved).

**Architecture:** Doc-only changes. Three logical chunks, each verifiable by `bun run build` succeeding and `bun run dev` rendering without console errors. A small Bun TypeScript generator script reads the canonical pricing JSON and emits EN+DE model-card MDX stubs with deterministic frontmatter and TODO narrative sections. Sidebar uses Starlight's `autogenerate: { directory: ... }` for the per-category leaves so new model files appear in navigation without editing `astro.config.mjs`.

**Tech Stack:** Astro 6 + Starlight 0.38 + starlight-versions + Bun (package manager and TS script runtime). No test suite; verification is build + manual spot-check.

**Branch:** `ashwin/remove-finetuning-add-changelog-and-model-cards` (already created off latest `main`, spec already committed at HEAD).

---

## File Structure

### Deleted
- `src/content/docs/guides/fine-tuning.mdx`
- `src/content/docs/de/guides/fine-tuning.mdx`
- `src/content/docs/getting-started/models.mdx` (moved → `src/content/docs/models/index.mdx`)
- `src/content/docs/de/getting-started/models.mdx` (moved → `src/content/docs/de/models/index.mdx`)

### Created
- `src/content/docs/changelog.mdx`
- `src/content/docs/de/changelog.mdx`
- `src/content/docs/models/index.mdx` (rewritten from `getting-started/models.mdx`)
- `src/content/docs/de/models/index.mdx`
- `src/content/docs/models/scheduled-for-retirement.mdx`
- `src/content/docs/de/models/scheduled-for-retirement.mdx`
- `src/content/docs/models/retired.mdx`
- `src/content/docs/de/models/retired.mdx`
- `src/content/docs/models/<category>/<slug>.mdx` × ~40 (generated, EN)
- `src/content/docs/de/models/<category>/<slug>.mdx` × ~40 (generated, DE)
- `scripts/generate-model-cards.ts`

### Modified
- `astro.config.mjs` (sidebar restructured, redirects added)
- `src/content/docs/reference/api-endpoints.mdx` + `de/` mirror (remove 4 rows, trim description)
- `src/content/docs/guides/index.mdx` + `de/` mirror (remove Fine-Tuning card, trim description)
- `src/content/docs/faq.mdx` + `de/` mirror (trim two mentions)
- `package.json` (add `generate:model-cards` script)

### Untouched
- `src/content/docs/v1/` — frozen historical snapshot per project `CLAUDE.md`.
- `src/components/AvailableModels.astro` — the browse table on `models/index.mdx` keeps working as-is. Linking its rows to individual cards is follow-up work, out of scope.

---

## Pre-flight

- [ ] **Step 0.1: Verify branch and clean tree**

Run:
```bash
git status
git branch --show-current
```

Expected: branch is `ashwin/remove-finetuning-add-changelog-and-model-cards`, working tree clean.

- [ ] **Step 0.2: Verify build is currently green**

Run:
```bash
bun install
bun run build
```

Expected: build succeeds with no errors. Note any pre-existing warnings; they should still be present (and no worse) after each task.

---

## Task 1: Delete Fine-Tuning pages, remove sidebar entry

**Files:**
- Delete: `src/content/docs/guides/fine-tuning.mdx`
- Delete: `src/content/docs/de/guides/fine-tuning.mdx`
- Modify: `astro.config.mjs` (remove the Fine-Tuning sidebar item)

- [ ] **Step 1.1: Confirm the files exist and the sidebar references them**

Run:
```bash
ls src/content/docs/guides/fine-tuning.mdx src/content/docs/de/guides/fine-tuning.mdx
grep -n "fine-tuning" astro.config.mjs
```

Expected: both files exist; `astro.config.mjs` line 65 contains:
```
{ label: 'Fine-Tuning', translations: { de: 'Fine-Tuning' }, slug: 'guides/fine-tuning' },
```

- [ ] **Step 1.2: Delete the two MDX files**

Run:
```bash
git rm src/content/docs/guides/fine-tuning.mdx src/content/docs/de/guides/fine-tuning.mdx
```

- [ ] **Step 1.3: Remove the Fine-Tuning sidebar item**

Edit `astro.config.mjs`: delete the line that currently reads
```js
{ label: 'Fine-Tuning', translations: { de: 'Fine-Tuning' }, slug: 'guides/fine-tuning' },
```
within the `Guides` items array (around line 65).

- [ ] **Step 1.4: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. Sidebar should no longer warn about missing `guides/fine-tuning` (it's been removed from both the filesystem and the sidebar).

- [ ] **Step 1.5: Commit and push**

Run:
```bash
git add -u astro.config.mjs
git status
git commit -m "Remove Fine-Tuning API page and sidebar entry"
git push
```

Expected: commit lands; push to `origin/ashwin/remove-finetuning-add-changelog-and-model-cards` succeeds.

---

## Task 2: Trim Fine-Tuning rows from api-endpoints.mdx (EN + DE)

**Files:**
- Modify: `src/content/docs/reference/api-endpoints.mdx:3,29-32`
- Modify: `src/content/docs/de/reference/api-endpoints.mdx:3,29-32`

- [ ] **Step 2.1: Edit EN api-endpoints.mdx description (line 3)**

Old (line 3):
```yaml
description: "Complete reference for all REST endpoints in the LLM Hub API — chat completions, embeddings, audio, images, fine-tuning, and more."
```

New:
```yaml
description: "Complete reference for all REST endpoints in the LLM Hub API — chat completions, embeddings, audio, images, and more."
```

- [ ] **Step 2.2: Remove the 4 fine-tuning rows from EN api-endpoints.mdx (lines 29-32)**

Delete these four exact lines from the Endpoints table:
```markdown
| `POST` | `/fine_tuning/jobs` | Create a fine-tuning job |
| `GET` | `/fine_tuning/jobs` | List fine-tuning jobs |
| `POST` | `/fine_tuning/jobs/{id}/cancel` | Cancel a fine-tuning job |
| `GET` | `/fine_tuning/jobs/{id}/events` | List fine-tuning events |
```

- [ ] **Step 2.3: Edit DE api-endpoints.mdx description (line 3)**

Old:
```yaml
description: "Vollständige Referenz aller REST-Endpunkte der LLM Hub API — Chat-Completions, Embeddings, Audio, Bilder, Fine-Tuning und mehr."
```

New:
```yaml
description: "Vollständige Referenz aller REST-Endpunkte der LLM Hub API — Chat-Completions, Embeddings, Audio, Bilder und mehr."
```

- [ ] **Step 2.4: Remove the 4 fine-tuning rows from DE api-endpoints.mdx (lines 29-32)**

Delete:
```markdown
| `POST` | `/fine_tuning/jobs` | Einen Fine-Tuning-Auftrag erstellen |
| `GET` | `/fine_tuning/jobs` | Fine-Tuning-Aufträge auflisten |
| `POST` | `/fine_tuning/jobs/{id}/cancel` | Einen Fine-Tuning-Auftrag abbrechen |
| `GET` | `/fine_tuning/jobs/{id}/events` | Fine-Tuning-Ereignisse auflisten |
```

- [ ] **Step 2.5: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds.

- [ ] **Step 2.6: Commit and push**

Run:
```bash
git add src/content/docs/reference/api-endpoints.mdx src/content/docs/de/reference/api-endpoints.mdx
git commit -m "Reference: drop /fine_tuning/* endpoints from API endpoint table"
git push
```

---

## Task 3: Trim Fine-Tuning card from guides/index.mdx (EN + DE)

**Files:**
- Modify: `src/content/docs/guides/index.mdx:3,65-69`
- Modify: `src/content/docs/de/guides/index.mdx:3,65-69`

- [ ] **Step 3.1: Edit EN guides/index.mdx description (line 3)**

Old:
```yaml
description: "Task-oriented guides for building with AI Foundation Services — chat completions, streaming, embeddings, multimodal, fine-tuning, and more."
```

New:
```yaml
description: "Task-oriented guides for building with AI Foundation Services — chat completions, streaming, embeddings, multimodal, and more."
```

- [ ] **Step 3.2: Remove the Fine-Tuning LinkCard from EN guides/index.mdx**

Delete this entire block (lines 65-69):
```jsx
  <LinkCard
    title="Fine-Tuning"
    href="/guides/fine-tuning/"
    description="Fine-tune Mistral and Llama models with your own data using LoRA or DPO via the AI Foundation Services Fine-Tuning API."
  />
```

- [ ] **Step 3.3: Edit DE guides/index.mdx description (line 3)**

Old:
```yaml
description: "Aufgabenorientierte Anleitungen für das Entwickeln mit AI Foundation Services — Chat Completions, Streaming, Embeddings, Multimodal, Fine-Tuning und mehr."
```

New:
```yaml
description: "Aufgabenorientierte Anleitungen für das Entwickeln mit AI Foundation Services — Chat Completions, Streaming, Embeddings, Multimodal und mehr."
```

- [ ] **Step 3.4: Remove the Fine-Tuning LinkCard from DE guides/index.mdx**

Delete this entire block (lines 65-69):
```jsx
  <LinkCard
    title="Fine-Tuning"
    href="/de/guides/fine-tuning/"
    description="Mistral- und Llama-Modelle mit eigenen Daten per LoRA oder DPO über die Fine-Tuning-API von AI Foundation Services anpassen."
  />
```

- [ ] **Step 3.5: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds.

- [ ] **Step 3.6: Commit and push**

Run:
```bash
git add src/content/docs/guides/index.mdx src/content/docs/de/guides/index.mdx
git commit -m "Guides index: drop Fine-Tuning card and description mention"
git push
```

---

## Task 4: Trim Fine-Tuning mentions from FAQ (EN + DE)

**Files:**
- Modify: `src/content/docs/faq.mdx:8,24`
- Modify: `src/content/docs/de/faq.mdx:8,24`

- [ ] **Step 4.1: Edit EN faq.mdx line 8**

Old:
```markdown
The AI Foundation Services by T-Systems offer companies a secure, GDPR-compliant platform for developing and scaling AI solutions with LLMs. They enable the use of over 40 language models — including open-source models like Llama, Mistral, Qwen, and Gemma — as well as ready-made services for RAG and fine-tuning. Operated on the T-Cloud in Germany, they meet the highest requirements for data protection and sovereignty.
```

New:
```markdown
The AI Foundation Services by T-Systems offer companies a secure, GDPR-compliant platform for developing and scaling AI solutions with LLMs. They enable the use of over 40 language models — including open-source models like Llama, Mistral, Qwen, and Gemma — as well as ready-made services for RAG. Operated on the T-Cloud in Germany, they meet the highest requirements for data protection and sovereignty.
```

- [ ] **Step 4.2: Edit EN faq.mdx line 24**

Old:
```markdown
There are components for LLM, RAG, and fine-tuning. The LLM component offers various tariffs with usage-based billing of consumed tokens. For RAG (SmartChat), a monthly flat rate is agreed based on users and storage. See the [Plans & Pricing](/plans) page for details.
```

New:
```markdown
There are components for LLM and RAG. The LLM component offers various tariffs with usage-based billing of consumed tokens. For RAG (SmartChat), a monthly flat rate is agreed based on users and storage. See the [Plans & Pricing](/plans) page for details.
```

- [ ] **Step 4.3: Edit DE faq.mdx line 8**

Old:
```markdown
Die AI Foundation Services von T-Systems bieten Unternehmen eine sichere, DSGVO-konforme Plattform für die Entwicklung und Skalierung von KI-Lösungen mit LLMs. Sie ermöglichen die Nutzung von über 40 Sprachmodellen — darunter Open-Source-Modelle wie Llama, Mistral, Qwen und Gemma — sowie fertige Dienste für RAG und Fine-Tuning. Betrieben auf der T-Cloud in Deutschland, erfüllen sie höchste Anforderungen an Datenschutz und Datensouveränität.
```

New:
```markdown
Die AI Foundation Services von T-Systems bieten Unternehmen eine sichere, DSGVO-konforme Plattform für die Entwicklung und Skalierung von KI-Lösungen mit LLMs. Sie ermöglichen die Nutzung von über 40 Sprachmodellen — darunter Open-Source-Modelle wie Llama, Mistral, Qwen und Gemma — sowie fertige Dienste für RAG. Betrieben auf der T-Cloud in Deutschland, erfüllen sie höchste Anforderungen an Datenschutz und Datensouveränität.
```

- [ ] **Step 4.4: Edit DE faq.mdx line 24**

Old:
```markdown
Es gibt Komponenten für LLM, RAG und Fine-Tuning. Die LLM-Komponente bietet verschiedene Tarife mit nutzungsbasierter Abrechnung der verbrauchten Tokens. Für RAG (SmartChat) wird eine monatliche Flatrate basierend auf Nutzern und Speicher vereinbart. Siehe die Seite [Tarife & Preise](/de/plans) für Details.
```

New:
```markdown
Es gibt Komponenten für LLM und RAG. Die LLM-Komponente bietet verschiedene Tarife mit nutzungsbasierter Abrechnung der verbrauchten Tokens. Für RAG (SmartChat) wird eine monatliche Flatrate basierend auf Nutzern und Speicher vereinbart. Siehe die Seite [Tarife & Preise](/de/plans) für Details.
```

- [ ] **Step 4.5: Verify no remaining Fine-Tuning references outside v1/**

Run:
```bash
grep -rn -i "fine.tun\|finetun" src/content/docs/ --include="*.mdx" | grep -v "/v1/"
```

Expected: NO output (empty result). If anything matches, fix it.

- [ ] **Step 4.6: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds.

- [ ] **Step 4.7: Commit and push**

Run:
```bash
git add src/content/docs/faq.mdx src/content/docs/de/faq.mdx
git commit -m "FAQ: drop Fine-Tuning mentions from product summary and pricing answer"
git push
```

---

## Task 5: Create Changelog pages (EN + DE)

**Files:**
- Create: `src/content/docs/changelog.mdx`
- Create: `src/content/docs/de/changelog.mdx`

- [ ] **Step 5.1: Create EN changelog page**

Create `src/content/docs/changelog.mdx` with this exact content:

```markdown
---
title: "Updates & Changelog"
description: "Major model releases, feature updates, and deprecations for AI Foundation Services."
---

Major changes to AI Foundation Services — new models, feature updates, and deprecations.

Entries follow [Keep a Changelog](https://keepachangelog.com/) conventions. Each entry is tagged `[Added]`, `[Changed]`, `[Deprecated]`, `[Removed]`, or `[Fixed]`.

## 2026-05

- **[Added]** New top-level **Models** section with individual cards for every hosted model — context window, pricing, sovereignty rating, plan availability, and OpenAI-compatible endpoint reference per model.
- **[Added]** **Updates & Changelog** page (you are reading it).
- **[Removed]** Fine-Tuning API documentation. The feature is no longer offered through AI Foundation Services.
```

- [ ] **Step 5.2: Create DE changelog page**

Create `src/content/docs/de/changelog.mdx` with this exact content:

```markdown
---
title: "Änderungsprotokoll"
description: "Wichtige Modellveröffentlichungen, Funktionsupdates und Deprecations für AI Foundation Services."
---

Wichtige Änderungen an AI Foundation Services — neue Modelle, Funktionsupdates und Deprecations.

Einträge folgen den Konventionen von [Keep a Changelog](https://keepachangelog.com/). Jeder Eintrag ist mit `[Hinzugefügt]`, `[Geändert]`, `[Veraltet]`, `[Entfernt]` oder `[Behoben]` gekennzeichnet.

## 2026-05

- **[Hinzugefügt]** Neuer Bereich **Modelle** auf oberster Ebene mit eigenen Karten für jedes gehostete Modell — Kontextfenster, Preise, Souveränitäts-Bewertung, Tarifverfügbarkeit und OpenAI-kompatible Endpunkt-Referenz pro Modell.
- **[Hinzugefügt]** Seite **Änderungsprotokoll** (die Sie gerade lesen).
- **[Entfernt]** Fine-Tuning-API-Dokumentation. Die Funktion wird über AI Foundation Services nicht mehr angeboten.
```

- [ ] **Step 5.3: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. Starlight may emit a warning that the new pages aren't linked from any sidebar — that's expected; we wire the sidebar in the next task.

- [ ] **Step 5.4: Commit and push**

Run:
```bash
git add src/content/docs/changelog.mdx src/content/docs/de/changelog.mdx
git commit -m "Add Updates & Changelog page (EN + DE) with seed May 2026 entry"
git push
```

---

## Task 6: Wire Changelog to sidebar + add Fine-Tuning redirect

**Files:**
- Modify: `astro.config.mjs` (sidebar `items` array; `redirects` object)

- [ ] **Step 6.1: Add the Changelog sidebar entry**

In `astro.config.mjs`, locate the line:
```js
{ label: 'FAQ', translations: { de: 'FAQ' }, slug: 'faq' },
```

Insert a new sidebar entry **immediately before** the FAQ line:
```js
{ label: 'Changelog', translations: { de: 'Änderungsprotokoll' }, slug: 'changelog' },
```

- [ ] **Step 6.2: Add the Fine-Tuning → Changelog redirect**

In `astro.config.mjs`, find the `redirects` object (currently around lines 10-15):
```js
redirects: {
  '/Quickstart': '/getting-started/quickstart',
  '/Introduction': '/',
  '/Model Serving/langchain': '/integrations/langchain',
  '/Services and Pricing': '/plans',
},
```

Add a new entry:
```js
redirects: {
  '/Quickstart': '/getting-started/quickstart',
  '/Introduction': '/',
  '/Model Serving/langchain': '/integrations/langchain',
  '/Services and Pricing': '/plans',
  '/guides/fine-tuning': '/changelog',
},
```

- [ ] **Step 6.3: Verify build and dev server**

Run:
```bash
bun run build
```

Expected: build succeeds, no more "page not referenced from sidebar" warning for changelog.

Then spot-check in dev:
```bash
bun run dev
```

In a browser, visit:
- `http://localhost:4321/changelog` — Changelog page renders with the May 2026 entry.
- `http://localhost:4321/de/changelog` — DE version renders.
- `http://localhost:4321/guides/fine-tuning` — redirects to `/changelog`.

Stop the dev server with Ctrl+C.

- [ ] **Step 6.4: Commit and push**

Run:
```bash
git add astro.config.mjs
git commit -m "Wire Changelog to sidebar and redirect /guides/fine-tuning -> /changelog"
git push
```

---

## Task 7: Move getting-started/models.mdx → models/index.mdx (EN + DE) and update content

**Files:**
- Delete: `src/content/docs/getting-started/models.mdx`
- Delete: `src/content/docs/de/getting-started/models.mdx`
- Create: `src/content/docs/models/index.mdx`
- Create: `src/content/docs/de/models/index.mdx`

The existing `getting-started/models.mdx` content stays mostly intact; we relocate it, retitle it, and add a short intro pointing at the per-model cards. The `<AvailableModels />` browse table keeps working as-is.

- [ ] **Step 7.1: Move EN models page**

Run:
```bash
mkdir -p src/content/docs/models
git mv src/content/docs/getting-started/models.mdx src/content/docs/models/index.mdx
```

- [ ] **Step 7.2: Verify the component import path in EN index.mdx**

The relative depth of `src/content/docs/models/` matches the old `src/content/docs/getting-started/`, so the existing import line stays unchanged. Open `src/content/docs/models/index.mdx` and confirm the top of the file still reads:

```jsx
import AvailableModels from '../../../components/AvailableModels.astro';
```

If you accidentally edit it during the next step, restore it. No change is required here.

- [ ] **Step 7.3: Add intro paragraph and section heading update to EN index.mdx**

In `src/content/docs/models/index.mdx`, after the title frontmatter and before the existing first paragraph, the content currently starts with:
```markdown
AI Foundation Services provides access to a wide range of open-source and proprietary LLMs, embedding models, vision models, and audio models — all through a single OpenAI-compatible API.


## Featured Models

<AvailableModels/>

For a complete list with pricing, see the [Plans & Pricing](/plans) page.
```

Replace those lines with:
```markdown
AI Foundation Services provides access to a wide range of open-source and proprietary LLMs, embedding models, vision models, and audio models — all through a single OpenAI-compatible API.

Every hosted model has an individual model card with capabilities, sovereignty rating, pricing, plan availability, and a usage example. Browse the categories in the sidebar or use the table below.


## Featured Models

<AvailableModels/>

For a complete list with pricing, see the [Plans & Pricing](/plans) page.
```

- [ ] **Step 7.4: Move DE models page and apply the same intro update**

Run:
```bash
mkdir -p src/content/docs/de/models
git mv src/content/docs/de/getting-started/models.mdx src/content/docs/de/models/index.mdx
```

Then edit `src/content/docs/de/models/index.mdx`.

The relative depth of `src/content/docs/de/models/` matches the old `src/content/docs/de/getting-started/`, so the existing import line stays unchanged. Confirm it still reads:
```jsx
import AvailableModels from '../../../../components/AvailableModels.astro';
```
(The DE file uses one more `../` than the EN file because of the locale subfolder.)

In the body, replace:
```markdown
AI Foundation Services bietet Zugang zu einer breiten Palette von Open-Source- und proprietären LLMs, Embedding-Modellen, Vision-Modellen und Audio-Modellen — alles über eine einzige OpenAI-kompatible API.


## Ausgewählte Modelle

<AvailableModels/>

Eine vollständige Liste mit Preisen finden Sie auf der Seite [Tarife & Preise](/de/plans).
```

With:
```markdown
AI Foundation Services bietet Zugang zu einer breiten Palette von Open-Source- und proprietären LLMs, Embedding-Modellen, Vision-Modellen und Audio-Modellen — alles über eine einzige OpenAI-kompatible API.

Jedes gehostete Modell hat eine eigene Modellkarte mit Fähigkeiten, Souveränitäts-Bewertung, Preisen, Tarifverfügbarkeit und einem Anwendungsbeispiel. Durchstöbern Sie die Kategorien in der Seitenleiste oder verwenden Sie die untenstehende Tabelle.


## Ausgewählte Modelle

<AvailableModels/>

Eine vollständige Liste mit Preisen finden Sie auf der Seite [Tarife & Preise](/de/plans).
```

- [ ] **Step 7.5: Remove the Models entry from the Getting Started sidebar group**

In `astro.config.mjs`, find the Getting Started section (around lines 44-51). Currently:
```js
{
  label: 'Getting Started',
  translations: { de: 'Erste Schritte' },
  items: [
    { label: 'Quickstart', translations: { de: 'Quickstart' }, slug: 'getting-started/quickstart' },
    { label: 'Authentication', translations: { de: 'Authentifizierung' }, slug: 'getting-started/authentication' },
    { label: 'Models', translations: { de: 'Verfügbare Modelle' }, slug: 'getting-started/models' },
  ],
},
```

Remove the Models line so the group becomes:
```js
{
  label: 'Getting Started',
  translations: { de: 'Erste Schritte' },
  items: [
    { label: 'Quickstart', translations: { de: 'Quickstart' }, slug: 'getting-started/quickstart' },
    { label: 'Authentication', translations: { de: 'Authentifizierung' }, slug: 'getting-started/authentication' },
  ],
},
```

- [ ] **Step 7.6: Add /getting-started/models → /models redirect**

In `astro.config.mjs`, add to the `redirects` object:
```js
'/getting-started/models': '/models',
```

The full block should now look like:
```js
redirects: {
  '/Quickstart': '/getting-started/quickstart',
  '/Introduction': '/',
  '/Model Serving/langchain': '/integrations/langchain',
  '/Services and Pricing': '/plans',
  '/guides/fine-tuning': '/changelog',
  '/getting-started/models': '/models',
},
```

- [ ] **Step 7.7: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. There will likely be a warning that `models/index.mdx` is not yet referenced by a sidebar — that's expected; we add the Models top-level sidebar entry in Task 14.

- [ ] **Step 7.8: Commit and push**

Run:
```bash
git add astro.config.mjs
git commit -m "Move getting-started/models -> /models index; add legacy redirect"
git push
```

---

## Task 8: Create lifecycle pages (Scheduled for Retirement, Retired)

**Files:**
- Create: `src/content/docs/models/scheduled-for-retirement.mdx`
- Create: `src/content/docs/de/models/scheduled-for-retirement.mdx`
- Create: `src/content/docs/models/retired.mdx`
- Create: `src/content/docs/de/models/retired.mdx`

- [ ] **Step 8.1: Create EN scheduled-for-retirement.mdx**

Content:
```markdown
---
title: "Scheduled for Retirement"
description: "Models scheduled to be retired from AI Foundation Services, with retirement dates and suggested replacements."
---

Models scheduled for retirement from AI Foundation Services. Customers should plan migration to the suggested replacement before the retirement date.

| Provider | Model | Retirement date | Suggested replacement |
|---|---|---|---|
| _No models currently scheduled for retirement._ | | | |

Major changes are also announced on the [Changelog](/changelog).
```

- [ ] **Step 8.2: Create DE scheduled-for-retirement.mdx**

Content:
```markdown
---
title: "Zur Stilllegung vorgesehen"
description: "Modelle, die aus AI Foundation Services entfernt werden, mit Stilllegungsdaten und empfohlenen Ersatzmodellen."
---

Modelle, deren Stilllegung aus AI Foundation Services geplant ist. Kunden sollten die Migration zum empfohlenen Ersatzmodell vor dem Stilllegungsdatum einplanen.

| Anbieter | Modell | Stilllegungsdatum | Empfohlener Ersatz |
|---|---|---|---|
| _Derzeit sind keine Modelle zur Stilllegung vorgesehen._ | | | |

Größere Änderungen werden auch im [Änderungsprotokoll](/de/changelog) angekündigt.
```

- [ ] **Step 8.3: Create EN retired.mdx**

Content:
```markdown
---
title: "Retired Models"
description: "Historical list of models retired from AI Foundation Services, with retirement dates and replacement recommendations."
---

Models that have been retired from AI Foundation Services. New requests targeting these model IDs will return an error.

| Provider | Model | Retired | Replacement |
|---|---|---|---|
| _No retired models yet._ | | | |

For a chronological view of all major changes, see the [Changelog](/changelog).
```

- [ ] **Step 8.4: Create DE retired.mdx**

Content:
```markdown
---
title: "Stillgelegte Modelle"
description: "Historische Liste der aus AI Foundation Services stillgelegten Modelle, mit Stilllegungsdaten und Ersatzempfehlungen."
---

Modelle, die aus AI Foundation Services entfernt wurden. Neue Anfragen mit diesen Modell-IDs liefern einen Fehler zurück.

| Anbieter | Modell | Stillgelegt | Ersatz |
|---|---|---|---|
| _Noch keine stillgelegten Modelle._ | | | |

Eine chronologische Übersicht aller wichtigen Änderungen finden Sie im [Änderungsprotokoll](/de/changelog).
```

- [ ] **Step 8.5: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. New pages will warn they're not in the sidebar yet — expected.

- [ ] **Step 8.6: Commit and push**

Run:
```bash
git add src/content/docs/models/scheduled-for-retirement.mdx src/content/docs/de/models/scheduled-for-retirement.mdx src/content/docs/models/retired.mdx src/content/docs/de/models/retired.mdx
git commit -m "Models: add Scheduled for Retirement and Retired lifecycle pages (EN + DE)"
git push
```

---

## Task 9: Create generator script — types, constants, helpers

**Files:**
- Create: `scripts/generate-model-cards.ts`

The generator is incremental; this task creates the scaffold (types, helpers, constants) and a minimal `main()` that prints what it would do. Subsequent tasks add JSON loading and template rendering.

- [ ] **Step 9.1: Create scripts directory and initial script file**

Run:
```bash
mkdir -p scripts
```

Create `scripts/generate-model-cards.ts` with this exact content:

```typescript
#!/usr/bin/env bun
/**
 * Generate model card MDX stubs (EN + DE) from the pricing JSON.
 *
 * Source of truth:
 *   src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json
 *
 * Update PRICING_JSON_PATH when the pricing JSON version bumps.
 *
 * Usage:
 *   bun run scripts/generate-model-cards.ts            # write files (skip existing)
 *   bun run scripts/generate-model-cards.ts --dry-run  # print summary, no writes
 *
 * Re-running is safe: existing MDX files are NOT overwritten.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------- Configuration ----------------

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRICING_JSON_PATH = join(
  REPO_ROOT,
  'src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json',
);
const EN_MODELS_DIR = join(REPO_ROOT, 'src/content/docs/models');
const DE_MODELS_DIR = join(REPO_ROOT, 'src/content/docs/de/models');

// ---------------- Types ----------------

type Category = 'llms' | 'coding' | 'vision' | 'embeddings' | 'audio' | 'image-generation';

type Plan = 'Essential' | 'Professional' | 'Agentic' | 'Test';

type Sovereignty = 'High' | 'Medium' | 'Low';

interface PricingEntry {
  exactModelName: string;
  displayModelName: string;
  modelLabel: string;
  contextWindow: string;
  termsOfUseUrl: string;
  dataProtectionUrl: string;
  deploymentRegion: string;
  modelTier: string;
  inputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
  requestPerMinuteLimit: number;
  inputTokenPerMinuteLimit: number;
  outputTokenPerMinuteLimit: number;
}

interface PricingPackage {
  packageName: Plan;
  modelQuotaConfigs: PricingEntry[];
}

interface CompiledModel {
  exactModelName: string;
  displayModelName: string;
  modelLabel: string;
  contextWindow: string;
  termsOfUseUrl: string;
  deploymentRegion: string;
  inputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
  requestPerMinuteLimit: number;
  inputTokenPerMinuteLimit: number;
  outputTokenPerMinuteLimit: number;
  category: Category;
  plans: Plan[];
  sovereignty: Sovereignty;
  hostingProvider: string;
  serverLocation: string;
  dataProcessing: string;
}

// ---------------- Maps ----------------

/**
 * Category mapping by exactModelName.
 * Default for unknown models: 'llms' (with a stderr warning).
 */
const CATEGORY_MAP: Record<string, Category> = {
  // LLMs
  'Llama-3.3-70B-Instruct': 'llms',
  'Mistral-Small-3': 'llms',
  'Qwen3-Next-80B-A3B-Instruct': 'llms',
  'claude-3-7-sonnet': 'llms',
  'claude-haiku-4.5': 'llms',
  'claude-opus-4.5': 'llms',
  'claude-opus-4.6': 'llms',
  'claude-sonnet-4': 'llms',
  'claude-sonnet-4.5': 'llms',
  'claude-sonnet-4.5-long-context': 'llms',
  'claude-sonnet-4.6': 'llms',
  'gemini-2.5-flash': 'llms',
  'gemini-2.5-pro': 'llms',
  'gemini-2.5-pro-long-context': 'llms',
  'gemini-3-flash': 'llms',
  'gemini-3-pro': 'llms',
  'gemini-3-pro-long-context': 'llms',
  'gemma-4-31B': 'llms',
  'gpt-4.1-2025-04-14': 'llms',
  'gpt-4.1-mini-2025-04-14': 'llms',
  'gpt-4.1-nano-2025-04-14': 'llms',
  'gpt-4o-2024-11-20': 'llms',
  'gpt-4o-mini-2024-07-18': 'llms',
  'gpt-5': 'llms',
  'gpt-5-mini': 'llms',
  'gpt-5-nano': 'llms',
  'gpt-5.2': 'llms',
  'gpt-oss-120b': 'llms',
  'mistral-medium-3': 'llms',
  'o1-2024-12-17': 'llms',
  'o1-mini-2024-09-12': 'llms',
  'o3-2025-04-16': 'llms',
  'o3-mini-2025-01-31': 'llms',
  'o4-mini-2025-04-16': 'llms',
  // Coding
  'Qwen3-Coder-30B-A3B-Instruct': 'coding',
  'gpt-5-codex': 'coding',
  // Vision (multimodal image-as-input)
  'Qwen3-VL-30B-A3B-Instruct-FP8': 'vision',
  'gemini-2.5-flash-image': 'vision',
  // Embeddings
  'jina-embeddings-v2-base-de': 'embeddings',
  'text-embedding-ada-002': 'embeddings',
  'text-embedding-bge-m3': 'embeddings',
  // Audio
  'whisper-large-v3': 'audio',
  'whisper-large-v3-turbo': 'audio',
  // Image generation
  'gpt-image-1-image-input': 'image-generation',
  'gpt-image-1-text-input': 'image-generation',
};

/**
 * Override the deterministic sovereignty rule for individual models.
 * The default rule (region -> sovereignty) is in resolveSovereignty().
 */
const SOVEREIGNTY_OVERRIDES: Record<string, Sovereignty> = {};

// ---------------- Helpers ----------------

function kebabCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[._]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveCategory(exactModelName: string): Category {
  const mapped = CATEGORY_MAP[exactModelName];
  if (mapped) return mapped;
  process.stderr.write(`[warn] No CATEGORY_MAP entry for ${exactModelName} — defaulting to 'llms'\n`);
  return 'llms';
}

function resolveSovereignty(deploymentRegion: string, exactModelName: string): Sovereignty {
  const override = SOVEREIGNTY_OVERRIDES[exactModelName];
  if (override) return override;
  const region = deploymentRegion.toLowerCase();
  if (region === 'otc-germany') return 'High';
  if (region.startsWith('azure-sweden') || region.startsWith('azure-eu')) return 'Medium';
  return 'Low';
}

function resolveHosting(deploymentRegion: string): {
  hostingProvider: string;
  serverLocation: string;
  dataProcessing: string;
} {
  const region = deploymentRegion.toLowerCase();
  if (region === 'otc-germany') {
    return { hostingProvider: 'T-Cloud', serverLocation: 'Germany', dataProcessing: 'EU/EEA' };
  }
  if (region.startsWith('azure-sweden')) {
    return { hostingProvider: 'Azure', serverLocation: 'Sweden', dataProcessing: 'EU' };
  }
  if (region.startsWith('azure')) {
    return { hostingProvider: 'Azure', serverLocation: 'EU region', dataProcessing: 'EU' };
  }
  if (region.startsWith('google')) {
    return { hostingProvider: 'Google Cloud', serverLocation: 'EU region', dataProcessing: 'EU' };
  }
  return { hostingProvider: 'Upstream provider', serverLocation: 'Unknown', dataProcessing: 'Unknown' };
}

// ---------------- Main (skeleton) ----------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  process.stdout.write(`Generator scaffold loaded. Dry-run: ${dryRun}. (Implementation pending in next tasks.)\n`);
  process.stdout.write(`Pricing JSON path: ${PRICING_JSON_PATH}\n`);
  process.stdout.write(`EN output dir: ${EN_MODELS_DIR}\n`);
  process.stdout.write(`DE output dir: ${DE_MODELS_DIR}\n`);
  process.stdout.write(`CATEGORY_MAP has ${Object.keys(CATEGORY_MAP).length} entries.\n`);
}

main().catch((err) => {
  process.stderr.write(`Generator error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
```

- [ ] **Step 9.2: Verify the script runs**

Run:
```bash
bun run scripts/generate-model-cards.ts
```

Expected output:
```
Generator scaffold loaded. Dry-run: false. (Implementation pending in next tasks.)
Pricing JSON path: /…/aifoundation-docs/src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json
EN output dir: /…/aifoundation-docs/src/content/docs/models
DE output dir: /…/aifoundation-docs/src/content/docs/de/models
CATEGORY_MAP has 45 entries.
```

(Exact count may differ if you've edited the map; the script should NOT throw.)

- [ ] **Step 9.3: Commit and push**

Run:
```bash
git add scripts/generate-model-cards.ts
git commit -m "Add model-card generator scaffold (types, category map, helpers)"
git push
```

---

## Task 10: Generator — load pricing JSON, dedupe models, compute plan availability

**Files:**
- Modify: `scripts/generate-model-cards.ts` (replace the `main()` function and add a `loadModels()` function)

- [ ] **Step 10.1: Add `loadModels()` and update `main()`**

In `scripts/generate-model-cards.ts`, replace the existing `main()` function (and add a new `loadModels()` function before it) so the bottom of the file reads:

```typescript
// ---------------- Loader ----------------

function loadModels(): CompiledModel[] {
  // Sync read avoids async plumbing in main().
  const fs = require('node:fs') as typeof import('node:fs');
  const json = JSON.parse(fs.readFileSync(PRICING_JSON_PATH, 'utf-8')) as PricingPackage[];

  // exactModelName -> compiled model; accumulates plans across packages.
  const byName = new Map<string, CompiledModel>();

  for (const pkg of json) {
    for (const entry of pkg.modelQuotaConfigs ?? []) {
      const existing = byName.get(entry.exactModelName);
      if (existing) {
        if (!existing.plans.includes(pkg.packageName)) {
          existing.plans.push(pkg.packageName);
        }
        continue;
      }
      const category = resolveCategory(entry.exactModelName);
      const sovereignty = resolveSovereignty(entry.deploymentRegion, entry.exactModelName);
      const hosting = resolveHosting(entry.deploymentRegion);
      byName.set(entry.exactModelName, {
        exactModelName: entry.exactModelName,
        displayModelName: entry.displayModelName,
        modelLabel: entry.modelLabel,
        contextWindow: entry.contextWindow,
        termsOfUseUrl: entry.termsOfUseUrl,
        deploymentRegion: entry.deploymentRegion,
        inputPricePerMillionTokens: entry.inputPricePerMillionTokens,
        outputPricePerMillionTokens: entry.outputPricePerMillionTokens,
        requestPerMinuteLimit: entry.requestPerMinuteLimit,
        inputTokenPerMinuteLimit: entry.inputTokenPerMinuteLimit,
        outputTokenPerMinuteLimit: entry.outputTokenPerMinuteLimit,
        category,
        plans: [pkg.packageName],
        sovereignty,
        ...hosting,
      });
    }
  }

  // Stable, plan-friendly order
  const planOrder: Record<Plan, number> = { Essential: 0, Professional: 1, Agentic: 2, Test: 3 };
  for (const m of byName.values()) {
    m.plans.sort((a, b) => planOrder[a] - planOrder[b]);
  }

  return [...byName.values()].sort((a, b) => a.exactModelName.localeCompare(b.exactModelName));
}

// ---------------- Main ----------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const models = loadModels();
  process.stdout.write(`Loaded ${models.length} unique models from pricing JSON.\n`);

  if (dryRun) {
    process.stdout.write('\nDry-run — listing models:\n');
    for (const m of models) {
      process.stdout.write(
        `  [${m.category.padEnd(16)}] ${m.exactModelName.padEnd(40)} ` +
          `"${m.displayModelName}" — ${m.sovereignty} — plans: ${m.plans.join(', ')}\n`,
      );
    }
    process.stdout.write(`\nDry-run complete. ${models.length} model(s).\n`);
    return;
  }

  process.stdout.write('Templates not yet implemented — re-run with --dry-run for now.\n');
}
```

(Also remove the now-stale `Bun.file(...).text()` line; the body above replaces it cleanly.)

- [ ] **Step 10.2: Run dry-run and verify**

Run:
```bash
bun run scripts/generate-model-cards.ts --dry-run
```

Expected: a list of ~45 unique models with their category, sovereignty rating, and plan availability. Spot-check a few:
- `Llama-3.3-70B-Instruct` should be `[llms]`, `High`, plans include `Essential, Professional, Agentic`.
- `claude-opus-4.6` should be `[llms]`, `Low` (Azure/Anthropic forwarded), plans include `Professional, Agentic`.
- `text-embedding-bge-m3` should be `[embeddings]`, `High`, plans include multiple.

If any model logs `[warn] No CATEGORY_MAP entry for X`, add it to `CATEGORY_MAP` in the script and re-run until no warnings.

- [ ] **Step 10.3: Commit and push**

Run:
```bash
git add scripts/generate-model-cards.ts
git commit -m "Generator: load pricing JSON, dedupe, compute plan availability"
git push
```

---

## Task 11: Generator — EN MDX template + file emission

**Files:**
- Modify: `scripts/generate-model-cards.ts` (add `renderEnMdx()` and a write helper; wire into `main()`)

- [ ] **Step 11.1: Add EN template renderer and write helper**

In `scripts/generate-model-cards.ts`, just before the `// ---------------- Main ----------------` line, add these two functions:

```typescript
// ---------------- EN template ----------------

function formatPrice(n: number): string {
  return n.toFixed(2);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)},000,000`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)},000`;
  return String(n);
}

function endpointForCategory(category: Category): string {
  switch (category) {
    case 'embeddings':
      return '`POST /embeddings`';
    case 'audio':
      return '`POST /audio/transcriptions`, `POST /audio/translations`';
    case 'image-generation':
      return '`POST /images/generations`';
    case 'vision':
      return '`POST /chat/completions` (multimodal input)';
    case 'coding':
    case 'llms':
    default:
      return '`POST /chat/completions`';
  }
}

function dataHandlingEn(m: CompiledModel): string {
  if (m.sovereignty === 'High') {
    return 'Open-source on T-Cloud — data is processed inside the EU, is not stored, and is not viewable by Telekom or third parties.';
  }
  return 'Proprietary model forwarded to the upstream provider (Microsoft Azure or Google Cloud), who may use sub-processors. Selecting this model accepts the third-party provider\'s terms.';
}

function renderEnMdx(m: CompiledModel): string {
  return `---
title: "${m.displayModelName}"
description: "${m.displayModelName} hosted on AI Foundation Services. ${m.modelLabel}."
sidebar:
  label: "${m.displayModelName}"
modelId: "${m.exactModelName}"
---

<!-- TODO: one-paragraph summary of what the model is and what it's good for. -->

## Central parameters

| Capability | Rating |
|---|---|
| Intelligence | TODO |
| Speed | TODO |
| Sovereignty | **${m.sovereignty}** |

| Field | Value |
|---|---|
| Model identifier | \`${m.exactModelName}\` |
| Context window | ${m.contextWindow} |
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
- **License:** [Terms of use](${m.termsOfUseUrl})

## T-Systems hosting & data handling

- **Hosting provider:** ${m.hostingProvider}
- **Server location:** ${m.serverLocation}
- **Data processing:** ${m.dataProcessing}
- **Data handling category:** ${dataHandlingEn(m)}
- **Customer data is never used for training.**

See [Enterprise Trust](/reference/enterprise-trust) for the full data-handling model.

## Modalities

- Input: TODO
- Output: TODO

## Endpoints

- ${endpointForCategory(m.category)}

## Features

- Streaming: TODO
- Tool / function calling: TODO
- Reasoning: TODO
- Structured outputs: TODO
- Asynchronous requests: TODO

## Pricing

- Input: €${formatPrice(m.inputPricePerMillionTokens)} / million tokens
- Output: €${formatPrice(m.outputPricePerMillionTokens)} / million tokens
- Available in plans: ${m.plans.join(', ')}

See [Plans & Pricing](/plans) for full context.

## Usage example

\`\`\`python
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="${m.exactModelName}",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
\`\`\`

## Rate limits

- Requests per minute: ${m.requestPerMinuteLimit}
- Input tokens per minute: ${formatTokens(m.inputTokenPerMinuteLimit)}
- Output tokens per minute: ${formatTokens(m.outputTokenPerMinuteLimit)}
- Limits are scoped per contract.

See [Rate Limits](/reference/rate-limits) for the full breakdown.

## Version history

- TODO
`;
}

// ---------------- Writer ----------------

interface WriteResult {
  created: string[];
  skipped: string[];
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function writeIfMissing(filePath: string, content: string, result: WriteResult): void {
  if (existsSync(filePath)) {
    result.skipped.push(filePath);
    return;
  }
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
  result.created.push(filePath);
}
```

- [ ] **Step 11.2: Wire the EN renderer into `main()`**

Replace the existing `main()` function body so it now reads:

```typescript
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const models = loadModels();
  process.stdout.write(`Loaded ${models.length} unique models from pricing JSON.\n`);

  if (dryRun) {
    process.stdout.write('\nDry-run — listing models:\n');
    for (const m of models) {
      process.stdout.write(
        `  [${m.category.padEnd(16)}] ${m.exactModelName.padEnd(40)} ` +
          `"${m.displayModelName}" — ${m.sovereignty} — plans: ${m.plans.join(', ')}\n`,
      );
    }
    process.stdout.write(`\nDry-run complete. ${models.length} model(s).\n`);
    return;
  }

  const enResult: WriteResult = { created: [], skipped: [] };
  for (const m of models) {
    const slug = kebabCase(m.exactModelName);
    const filePath = join(EN_MODELS_DIR, m.category, `${slug}.mdx`);
    writeIfMissing(filePath, renderEnMdx(m), enResult);
  }

  process.stdout.write(`\nEN: created ${enResult.created.length}, skipped ${enResult.skipped.length}\n`);
  for (const p of enResult.created) process.stdout.write(`  + ${p}\n`);
  for (const p of enResult.skipped) process.stdout.write(`  = ${p} (exists)\n`);

  process.stdout.write('\nDE templates not yet implemented — coming in next task.\n');
}
```

- [ ] **Step 11.3: Run the generator and inspect a sample**

Run:
```bash
bun run scripts/generate-model-cards.ts
```

Expected: ~45 files created under `src/content/docs/models/<category>/`.

Inspect a sample:
```bash
cat src/content/docs/models/llms/llama-3-3-70b-instruct.mdx
cat src/content/docs/models/embeddings/text-embedding-bge-m3.mdx
cat src/content/docs/models/audio/whisper-large-v3.mdx
```

Verify:
- Frontmatter has correct `title`, `modelId`.
- "Central parameters" table shows correct `Sovereignty` (High for Llama, High for BGE, High for Whisper).
- "Pricing" block shows non-zero €/M values for paid models.
- "Rate limits" shows real numbers.
- "Usage example" Python code uses the right `model="..."` value.

- [ ] **Step 11.4: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. New pages will warn they're not in any sidebar — expected; Task 14 wires them up.

- [ ] **Step 11.5: Commit and push**

Run:
```bash
git add scripts/generate-model-cards.ts src/content/docs/models/
git commit -m "Generate EN model cards from pricing JSON"
git push
```

---

## Task 12: Generator — DE MDX template + emission

**Files:**
- Modify: `scripts/generate-model-cards.ts` (add `renderDeMdx()`, helpers, wire into `main()`)

- [ ] **Step 12.1: Add DE template renderer**

In `scripts/generate-model-cards.ts`, immediately after `renderEnMdx()`, add:

```typescript
// ---------------- DE template ----------------

function dataHandlingDe(m: CompiledModel): string {
  if (m.sovereignty === 'High') {
    return 'Open Source auf T-Cloud — die Daten werden innerhalb der EU verarbeitet, nicht gespeichert und sind weder für die Telekom noch für Dritte einsehbar.';
  }
  return 'Proprietäres Modell, das an den Upstream-Anbieter (Microsoft Azure oder Google Cloud) weitergeleitet wird, der Subunternehmer einsetzen kann. Mit der Auswahl dieses Modells akzeptieren Sie die Bedingungen des Drittanbieters.';
}

function endpointForCategoryDe(category: Category): string {
  switch (category) {
    case 'embeddings':
      return '`POST /embeddings`';
    case 'audio':
      return '`POST /audio/transcriptions`, `POST /audio/translations`';
    case 'image-generation':
      return '`POST /images/generations`';
    case 'vision':
      return '`POST /chat/completions` (multimodaler Input)';
    case 'coding':
    case 'llms':
    default:
      return '`POST /chat/completions`';
  }
}

function sovereigntyDe(s: Sovereignty): string {
  switch (s) {
    case 'High':
      return 'Hoch';
    case 'Medium':
      return 'Mittel';
    case 'Low':
      return 'Niedrig';
  }
}

function renderDeMdx(m: CompiledModel): string {
  return `---
title: "${m.displayModelName}"
description: "${m.displayModelName}, gehostet auf AI Foundation Services. ${m.modelLabel}."
sidebar:
  label: "${m.displayModelName}"
modelId: "${m.exactModelName}"
---

<!-- TODO: Ein-Absatz-Zusammenfassung, was das Modell ist und wofür es geeignet ist. -->

## Zentrale Parameter

| Fähigkeit | Bewertung |
|---|---|
| Intelligenz | TODO |
| Geschwindigkeit | TODO |
| Souveränität | **${sovereigntyDe(m.sovereignty)}** |

| Feld | Wert |
|---|---|
| Modell-Identifier | \`${m.exactModelName}\` |
| Kontextfenster | ${m.contextWindow} |
| Parameter | TODO |
| Quantisierung | TODO |
| Mehrsprachig | TODO |

## Lebenszyklus & Alternativen

- **Status:** Stable
- **Eingeführt auf AI Foundation Services:** TODO
- **Geplante Stilllegung:** Keine
- **Empfohlene Alternative bei Stilllegung:** N/A

## Herkunft

- **Anbieter:** TODO
- **Herkunftsland:** TODO
- **Veröffentlichung des Basismodells:** TODO
- **Lizenz:** [Nutzungsbedingungen](${m.termsOfUseUrl})

## T-Systems Hosting & Datenverarbeitung

- **Hosting-Anbieter:** ${m.hostingProvider}
- **Serverstandort:** ${m.serverLocation === 'Germany' ? 'Deutschland' : m.serverLocation}
- **Datenverarbeitung:** ${m.dataProcessing}
- **Datenverarbeitungs-Kategorie:** ${dataHandlingDe(m)}
- **Kundendaten werden niemals zum Modelltraining genutzt.**

Siehe [Enterprise Trust](/de/reference/enterprise-trust) für das vollständige Datenverarbeitungs-Modell.

## Modalitäten

- Eingabe: TODO
- Ausgabe: TODO

## Endpunkte

- ${endpointForCategoryDe(m.category)}

## Funktionen

- Streaming: TODO
- Tool- / Function-Calling: TODO
- Reasoning: TODO
- Strukturierte Ausgaben: TODO
- Asynchrone Anfragen: TODO

## Preise

- Eingabe: €${formatPrice(m.inputPricePerMillionTokens)} / Million Token
- Ausgabe: €${formatPrice(m.outputPricePerMillionTokens)} / Million Token
- Verfügbar in Tarifen: ${m.plans.join(', ')}

Siehe [Tarife & Preise](/de/plans) für den vollständigen Kontext.

## Anwendungsbeispiel

\`\`\`python
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="${m.exactModelName}",
    messages=[{"role": "user", "content": "Hallo!"}],
)
print(response.choices[0].message.content)
\`\`\`

## Rate-Limits

- Anfragen pro Minute: ${m.requestPerMinuteLimit}
- Eingabe-Token pro Minute: ${formatTokens(m.inputTokenPerMinuteLimit)}
- Ausgabe-Token pro Minute: ${formatTokens(m.outputTokenPerMinuteLimit)}
- Limits gelten pro Vertrag.

Siehe [Rate-Limits](/de/reference/rate-limits) für die vollständige Aufschlüsselung.

## Versionsverlauf

- TODO
`;
}
```

- [ ] **Step 12.2: Wire the DE renderer into `main()`**

In `main()`, replace the line:
```typescript
  process.stdout.write('\nDE templates not yet implemented — coming in next task.\n');
```

With:
```typescript
  const deResult: WriteResult = { created: [], skipped: [] };
  for (const m of models) {
    const slug = kebabCase(m.exactModelName);
    const filePath = join(DE_MODELS_DIR, m.category, `${slug}.mdx`);
    writeIfMissing(filePath, renderDeMdx(m), deResult);
  }

  process.stdout.write(`\nDE: created ${deResult.created.length}, skipped ${deResult.skipped.length}\n`);
  for (const p of deResult.created) process.stdout.write(`  + ${p}\n`);
  for (const p of deResult.skipped) process.stdout.write(`  = ${p} (exists)\n`);
```

- [ ] **Step 12.3: Run the generator and inspect a sample**

Run:
```bash
bun run scripts/generate-model-cards.ts
```

Expected: ~45 DE files created; EN files all skipped (already exist from Task 11).

Inspect:
```bash
cat src/content/docs/de/models/llms/llama-3-3-70b-instruct.mdx
cat src/content/docs/de/models/audio/whisper-large-v3.mdx
```

Verify:
- Section headings are in German.
- Sovereignty rendered as `Hoch` / `Mittel` / `Niedrig`.
- "Kundendaten werden niemals zum Modelltraining genutzt." line present.

- [ ] **Step 12.4: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds.

- [ ] **Step 12.5: Commit and push**

Run:
```bash
git add scripts/generate-model-cards.ts src/content/docs/de/models/
git commit -m "Generate DE model cards from pricing JSON"
git push
```

---

## Task 13: Add `generate:model-cards` to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 13.1: Add the script entry**

Edit `package.json`. The current `scripts` block is:

```json
  "scripts": {
    "dev": "bunx --bun astro dev",
    "start": "bunx --bun astro dev",
    "build": "bunx --bun astro build",
    "preview": "bunx --bun astro preview",
    "astro": "bunx --bun astro"
  },
```

Replace with:

```json
  "scripts": {
    "dev": "bunx --bun astro dev",
    "start": "bunx --bun astro dev",
    "build": "bunx --bun astro build",
    "preview": "bunx --bun astro preview",
    "astro": "bunx --bun astro",
    "generate:model-cards": "bun run scripts/generate-model-cards.ts"
  },
```

- [ ] **Step 13.2: Verify the new script alias works**

Run:
```bash
bun run generate:model-cards
```

Expected: same output as before, all files now exist and are skipped. The summary should say `created 0, skipped 45` for both EN and DE.

- [ ] **Step 13.3: Commit and push**

Run:
```bash
git add package.json
git commit -m "Add generate:model-cards npm script"
git push
```

---

## Task 14: Wire Models top-level sidebar section

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 14.1: Add the Models top-level section**

In `astro.config.mjs`, find the sidebar array. After the `Plugins` group and before the `Reference` group, insert the new `Models` section. The relevant edit: after this block:

```js
{
  label: 'Plugins',
  translations: { de: 'Plugins' },
  items: [
    { label: 'Cline', translations: { de: 'Cline' }, slug: 'plugins/cline' },
    { label: 'Continue for VS Code', translations: { de: 'Continue für VS Code' }, slug: 'plugins/continue-vscode' },
    { label: 'Continue for JetBrains', translations: { de: 'Continue für JetBrains' }, slug: 'plugins/continue-jetbrains' },
    { label: 'OpenCode', translations: { de: 'OpenCode' }, slug: 'plugins/opencode' },
    { label: 'Roo Code', translations: { de: 'Roo Code' }, slug: 'plugins/roo-code' },
  ],
},
```

Insert this new block:

```js
{
  label: 'Models',
  translations: { de: 'Modelle' },
  items: [
    { label: 'Overview', translations: { de: 'Überblick' }, slug: 'models' },
    {
      label: 'Active Models',
      translations: { de: 'Aktive Modelle' },
      items: [
        { label: 'Chat & Reasoning (LLMs)', translations: { de: 'Chat & Reasoning (LLMs)' }, autogenerate: { directory: 'models/llms' } },
        { label: 'Coding', translations: { de: 'Coding' }, autogenerate: { directory: 'models/coding' } },
        { label: 'Vision', translations: { de: 'Vision' }, autogenerate: { directory: 'models/vision' } },
        { label: 'Embeddings', translations: { de: 'Embeddings' }, autogenerate: { directory: 'models/embeddings' } },
        { label: 'Audio (Speech-to-Text)', translations: { de: 'Audio (Sprache-zu-Text)' }, autogenerate: { directory: 'models/audio' } },
        { label: 'Image Generation', translations: { de: 'Bildgenerierung' }, autogenerate: { directory: 'models/image-generation' } },
      ],
    },
    { label: 'Scheduled for Retirement', translations: { de: 'Zur Stilllegung vorgesehen' }, slug: 'models/scheduled-for-retirement' },
    { label: 'Retired Models', translations: { de: 'Stillgelegte Modelle' }, slug: 'models/retired' },
  ],
},
```

- [ ] **Step 14.2: Verify build**

Run:
```bash
bun run build
```

Expected: build succeeds. No sidebar warnings about unreferenced model pages.

- [ ] **Step 14.3: Spot-check the dev server**

Run:
```bash
bun run dev
```

In a browser, verify:
- `http://localhost:4321/models` — index page renders with `<AvailableModels />` table.
- `http://localhost:4321/models/llms/llama-3-3-70b-instruct` — card renders with all sections, sovereignty High, pricing populated.
- `http://localhost:4321/models/embeddings/text-embedding-bge-m3` — embeddings card renders, endpoint is `POST /embeddings`.
- `http://localhost:4321/models/audio/whisper-large-v3` — audio card renders, endpoints include `/audio/transcriptions`.
- `http://localhost:4321/models/scheduled-for-retirement` — empty table page renders.
- `http://localhost:4321/models/retired` — empty table page renders.
- `http://localhost:4321/de/models/llms/llama-3-3-70b-instruct` — DE version with German headings.
- Sidebar shows the new Models section with sub-categories collapsing.
- `http://localhost:4321/getting-started/models` — redirects to `/models`.

Stop the dev server with Ctrl+C.

- [ ] **Step 14.4: Commit and push**

Run:
```bash
git add astro.config.mjs
git commit -m "Wire top-level Models sidebar section (Active / Scheduled / Retired)"
git push
```

---

## Task 15: Final verification and PR

**Files:** none modified; this task verifies acceptance criteria from the spec and opens the PR.

- [ ] **Step 15.1: Re-run a clean build**

Run:
```bash
bun run build
```

Expected: build succeeds with no error-level output. Any pre-existing warnings should still be the only warnings.

- [ ] **Step 15.2: Re-verify acceptance criteria from spec**

Confirm in your browser via `bun run dev`:

- [ ] `/guides/fine-tuning` redirects to `/changelog` (both `/` and `/de/...` paths).
- [ ] `/changelog` exists in both locales and shows the May 2026 seed entry.
- [ ] `/models` exists, shows the moved browse content, has the new sidebar tree.
- [ ] At least one card per category renders with autogenerated structured sections and TODO markers (sample: `/models/llms/llama-3-3-70b-instruct`, `/models/vision/qwen3-vl-30b-a3b-instruct-fp8`, `/models/embeddings/text-embedding-bge-m3`, `/models/audio/whisper-large-v3`, `/models/coding/qwen3-coder-30b-a3b-instruct`, `/models/image-generation/gpt-image-1-text-input`).
- [ ] DE equivalents render at `/de/...`.
- [ ] `/getting-started/models` redirects to `/models`.
- [ ] No console errors in the browser devtools.

Stop the dev server with Ctrl+C.

- [ ] **Step 15.3: Final grep for residual fine-tuning references**

Run:
```bash
grep -rn -i "fine.tun\|finetun" src/content/docs/ --include="*.mdx" | grep -v "/v1/"
```

Expected: empty.

- [ ] **Step 15.4: Confirm v1 snapshot is untouched**

Run:
```bash
git diff main -- src/content/docs/v1/
```

Expected: empty diff. `v1/` must remain a frozen historical snapshot.

- [ ] **Step 15.5: Open the PR**

Run:
```bash
gh pr create --title "Remove Fine-Tuning API; add Updates & Changelog and Models scaffolding" --body "$(cat <<'EOF'
## Summary

- Removes the **Fine-Tuning API** documentation across EN + DE (page deleted, sidebar entry removed, all cross-references trimmed in `api-endpoints`, `guides/index`, and FAQ). `v1/` snapshot is left untouched. Adds a redirect from `/guides/fine-tuning` → `/changelog`.
- Adds an **Updates & Changelog** page (Keep-a-Changelog format) as a top-level sidebar entry, seeded with a May 2026 entry summarizing this PR.
- Scaffolds a new top-level **Models** section: IONOS-inspired lifecycle IA (Active / Scheduled for Retirement / Retired). Per-card structure is Hugging-Face-style with T-Systems differentiators preserved (sovereignty rating, EU data-handling boilerplate, per-contract rate limits, plan availability, no-training commitment). Existing `getting-started/models.mdx` moves to `models/index.mdx` (with redirect).
- Adds `scripts/generate-model-cards.ts` (run via `bun run generate:model-cards`) — reads the existing pricing JSON, emits EN + DE MDX stubs per unique model. Deterministic fields autogenerated (frontmatter, pricing, rate limits, hosting block, usage example); narrative sections (parameters, modalities, features, version history) left as TODO for humans.

## Design / spec

See `docs/superpowers/specs/2026-05-13-finetuning-removal-changelog-model-cards-design.md` for the full design.

## Test plan

- [ ] `bun run build` succeeds
- [ ] `bun run dev` renders without console errors
- [ ] `/guides/fine-tuning` redirects to `/changelog` (EN + DE)
- [ ] `/getting-started/models` redirects to `/models`
- [ ] `/changelog` shows the May 2026 seed entry (EN + DE)
- [ ] `/models` shows the moved browse table
- [ ] At least one card per category renders correctly with structured sections (sovereignty, hosting, pricing, rate limits, usage example) and TODO markers in narrative sections
- [ ] DE equivalents render at `/de/...`
- [ ] No remaining `fine-tuning` references in `src/content/docs/` outside `v1/`
- [ ] `v1/` is untouched
EOF
)"
```

Expected: PR URL printed. Confirm in your browser that the PR opens with all commits in order.

- [ ] **Step 15.6: Mark all tasks complete**

The plan is done. The PR is open for human review.

---

## Self-Review Notes

**Spec coverage check:** Every section of the spec maps to at least one task in this plan:
- Branch & PR strategy → pre-flight + Task 15.
- Fine-Tuning removal (delete, sidebar, redirect, cross-refs in 4 file groups) → Tasks 1–4 + 6.
- Changelog page + sidebar + redirect → Tasks 5–6.
- Models IA + index move + redirect → Task 7.
- Lifecycle pages (scheduled-for-retirement, retired) → Task 8.
- Generator script (types, JSON loader, EN template, DE template, sovereignty rules) → Tasks 9–12.
- package.json script entry → Task 13.
- Models top-level sidebar with autogenerate → Task 14.
- Acceptance criteria → Task 15.

**Type/identifier consistency:** `kebabCase`, `Category`, `Plan`, `Sovereignty`, `CompiledModel`, `loadModels`, `renderEnMdx`, `renderDeMdx`, `writeIfMissing` all referenced consistently across tasks 9–13.

**Out-of-scope guarded:** `AvailableModels.astro` is not modified; v1/ is not modified; benchmarks/eval data are explicitly TODO; no pre-build hook.
