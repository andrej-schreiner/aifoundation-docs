# Docs prose review — 2026-10-31

Review mode (Clarity skill, `review` + medium guidance for documentation, reference and UI text).
Read-only: no page was changed. Paths are relative to `src/content/docs/` unless they start with
`src/`. Line numbers are from the working tree on branch `claude/repo-pull-6c194a` (uncommitted
changes included).

Labels: **material error** (wrong, contradictory, or broken for the reader), **likely improvement**
(the source already has what is needed for a better version), **taste** (defensible either way).

---

## 1. Piece-level diagnosis

```txt
Job:          Two readers. Developers need to get a key, set two variables, make a call, and
              pick a model ID that works. Buyers need to compare models, plans, limits and
              where data goes. The site is reference + guide, so predictable structure is a
              feature, and most of it already has it.
Substance:    Strong where it is concrete: the rate-limit "calendar minute" section
              (reference/rate-limits.mdx:57-69), the concepts glossary, the "ceilings, not
              guarantees" footnote, the deprecations tables. These read as written by someone
              who knows the system.
Trust:        This is the weak axis. The same fact is stated in several places and the copies
              have drifted: GPT-OSS 120B limits (FAQ vs rate limits vs data), model count
              (30+ / over 40 / 38), Azure regions (tooltip "EU regions" vs "worldwide"), TPM
              (input only vs input + output). Several examples use a model that is retired
              (Llama 3.3 in models/api.mdx) or not launched yet (GLM-5.3, from 2 Nov).
Development:  Journey pages are mostly lean. The plans area repeats one long legal footnote
              five times (fine for reference) but the intros above the tables pack 5–7 jobs
              into one paragraph (plans/index.mdx:11).
Voice:        Two registers collide. Newer pages are plain and exact ("Models leave the
              catalog on a published date."). Older pages and components still carry
              marketing register: "meet the highest requirements", "wide range", "without
              cutting corners", "free to test, ready to explore", "for maximum efficiency".
Surface:      Title Case is widespread in headings, page titles, link cards, hero badges and
              table/filter labels, against the sentence-case rule. Product naming is
              unstable: AI Foundation Services / AIFS / LLM Hub / LLM Serving / LLM-Serving /
              Shared LLM Serving Service.
German:       Sie is used consistently in pages; one rendered UI string uses du. German
              content mirrors English section-for-section (no missing sections found on the
              pages checked), but several sentences are calques and some terms flip between
              German and English within a page (API-Key / API-Schlüssel, Gemeinsame Tarife /
              Shared-Tarife, Mandanten / Tenants).
Top fixes:    1. Make each number and region claim come from one source (FAQ limits, model
                 count, Azure tooltip, TPM definition) — these are factual errors a buyer
                 will act on.
              2. Fix examples and dates tied to time: retired Llama example, GLM-5.3 before
                 launch, "as of 2 November", deprecations that are due today.
              3. One pass for sentence case and one naming sheet (product name, model-class
                 names, API key / portal names, the minimum-commitment term) in EN and DE.
```

---

## 2. Findings — material errors

### M1. FAQ rate-limit example contradicts the rate-limits page and the data
- **Passage:** `faq.mdx:32` "GPT-OSS 120B … lists 300 RPM and 300,000 input TPM on the Essential plan, scaling up to 1,000 RPM" (same in `de/faq.mdx:32`)
- **Verdict:** revise
- **Why:** `reference/rate-limits.mdx:29-31` and the pricing export (`all-pricing--2026-04-24.json`) give Essential 100 RPM / 400,000 TPM and Agentic 300 RPM / 2,000,000 TPM. The FAQ's 300 / 300,000 / 1,000 matches none of them. A buyer comparing plans gets wrong numbers.
- **Suggestion:** Use the figures from the rate-limits table, or drop the numbers from the FAQ and link to the table so only one page carries them.
- **Safety check:** Values taken from the repo's own data; no new facts.

### M2. TPM is defined two contradictory ways on one page
- **Passage:** `reference/rate-limits.mdx:50` "ceiling on input tokens processed per minute" vs `:53` "Both input and output tokens count toward TPM limits"; the tables (`:27`) and concepts page (`getting-started/concepts.mdx:12`) show separate Input TPM and Output TPM. Same in `de/reference/rate-limits.mdx`.
- **Verdict:** revise
- **Why:** A developer cannot tell whether output counts against the input ceiling. The minute-window section (`:61-63`) shows two separate counters, which makes `:53` the wrong one.
- **Suggestion:** Define TPM as two limits (input TPM, output TPM) in the bullet list and delete or reword `:53`.
- **Safety check:** Uses the page's own later explanation; ask the platform owner if unsure.

### M3. Azure tooltip says "EU regions"; the docs list Azure models as worldwide
- **Passage:** `src/components/ModelsComparison.astro:643,649` "Hosted on Microsoft Azure (EU regions)." / "Gehostet auf Microsoft Azure (EU-Regionen)."
- **Verdict:** revise / ask-author
- **Why:** `reference/rate-limits.mdx:33` lists GPT-6.1 Sol as "Azure, worldwide"; `concepts.mdx:28` and `ChoosingModels.astro:42` know "Azure (worldwide)" and "GCP (worldwide)". For a data-residency buyer this tooltip is the most consequential sentence in the table, and it overstates.
- **Suggestion:** Say "region depends on the model; see the Location column", or name the actual set of regions. Same check for the GCP tooltip.
- **Safety check:** Weakens a claim to what the docs support; does not invent regions.

### M4. Model count disagrees across pages
- **Passage:** `index.mdx:3,12` "30+ models"; `faq.mdx:10` "over 40 language models" (DE too); `reference/rate-limits.mdx:18` 30 / 33 / 33 per plan.
- **Verdict:** ask-author
- **Why:** Counting the visible catalog in the current pricing export (minus hidden and retiring models) gives 30 / 33 / 33 per plan and 38 in total including preview models — consistent with "30+", not with "over 40". The FAQ also says "language models" while the count includes embeddings, audio and image models.
- **Suggestion:** Pick one claim ("30+ models") and use it in EN and DE, or drop the count from the FAQ.
- **Safety check:** No new number proposed beyond what the site already says.

### M5. FAQ says the whole service runs on T-Cloud in Germany
- **Passage:** `faq.mdx:10` "Operated on the T-Cloud in Germany, they meet the highest requirements for data protection and sovereignty." (DE `:10`)
- **Verdict:** revise
- **Why:** Two answers later (`:18`) and on `models/index.mdx:29` the docs say proprietary models go to Azure or Google Cloud. The first FAQ answer, which many readers stop at, says otherwise. "Highest requirements" is an unsupported superlative.
- **Suggestion:** Scope the claim to open-source models and replace the superlative with the concrete facts the site already has (EU/EEA processing, no storage, no training; ISO 27001 per the home badge).
- **Safety check:** Narrows the claim; uses facts stated elsewhere on the site.

### M6. Quickstart uses a model that launches on 2 November and whose ID is unconfirmed
- **Passage:** `index.mdx:165,171` "Call a tool with `GLM-5.3`." (DE same)
- **Verdict:** ask-author
- **Why:** `src/shared/lib/launchModels.ts:1-2` says the model is announced for 2026-11-02 and "confirm the exact id GLM-5.3". The banner (`PreviewModelsBanner.astro:61`) says "from 2 Nov". Today is 31 Oct: if this ships before launch, the home-page function-calling example fails. Same dependency: "Recommendations as of 2 November 2026" (`getting-started/choosing-a-model.mdx:12`, `index.mdx:300`, DE same), while `choosingModels.ts:6` says `LAST_REVIEWED = '2026-10-30'`.
- **Suggestion:** Confirm the release date of this branch. If it can ship before 2 Nov, use `gpt-oss-120b` in the example and the review date from `LAST_REVIEWED`.
- **Safety check:** No claim changed without the author's answer.

### M7. Models API example shows a retired model
- **Passage:** `models/api.mdx:62-63` `"license": "https://www.llama.com/llama3_3/license/"`, `"display_name": "Meta LLama 3.3 70B"` (DE same)
- **Verdict:** revise
- **Why:** `models/deprecations.mdx:32` retired Llama 3.3 70B on 2026-09-01. A reader copying the ID gets an error. "LLama" casing is also wrong.
- **Suggestion:** Replace the sample with the real response for a current model (for example `gpt-oss-120b`); keep the field list.
- **Safety check:** Needs a real response sample; do not hand-write metadata values.

### M8. Deprecations are due today, and the "Upcoming" table will be wrong tomorrow
- **Passage:** `models/deprecations.mdx:12-23` six rows dated 2026-10-31 and the caution "migrate … before **2026-10-31**" (DE same).
- **Verdict:** revise (timing)
- **Why:** On 1 Nov these rows are in the wrong table and the caution asks for an action in the past. Also, the caution title "Important" (`:22`) names a type instead of the point.
- **Suggestion:** Plan the move of those rows to "Retired" with the release. Give the caution a heading that states the point, e.g. "GPT-5, Claude 4.x and Gemini 3 Pro retire on 31 October".
- **Safety check:** Dates unchanged.

### M9. German UI string uses "du" on a Sie site
- **Passage:** `src/components/PlansPage.astro:82` "Wähle ein Modell aus, probiere es in deinem Arbeitsablauf aus und finde heraus, was am besten passt." Rendered on `/de/models/preview/` through `modelsSubtitleList`. The sentence before it (`:81`) uses Sie.
- **Verdict:** revise
- **Why:** AGENTS.md: German uses Sie. Mixing within one block is the case the rule exists for.
- **Suggestion:** Sie form, e.g. "Wählen Sie ein Modell, testen Sie es in Ihrem Workflow und prüfen Sie, was passt."
- **Safety check:** Meaning unchanged.

### M10. "Enterprise" plan appears without being defined
- **Passage:** `getting-started/shared-vs-dedicated.mdx:21` LinkCard "Essential, Professional, Agentic, and Enterprise." while `:12` names three plans; `faq.mdx:46` "To order an Essential, Professional, Agentic, or Enterprise plan"; the plan table renders an Enterprise row (`PlansPage.astro:253`, blurb `:120-122`). No page explains Enterprise or how it differs from Dedicated.
- **Verdict:** ask-author
- **Why:** A buyer sees four shared plans in one place, three in another, and cannot tell whether Enterprise is a shared plan with custom limits or the Dedicated offer.
- **Suggestion:** One sentence on `plans/index.mdx` that defines Enterprise (custom commitment and limits on the shared service, per the blurb), and the same list of plans on every page.
- **Safety check:** Needs the author to confirm what Enterprise is.

### M11. PowerShell instructions differ between Quickstart and Authentication
- **Passage:** `index.mdx:61-62` sets persistent user variables (`SetEnvironmentVariable … 'User'`); `getting-started/authentication.mdx:42-43` sets session-only `$env:` variables. Neither says that the persistent and `setx` versions only apply to a new terminal.
- **Verdict:** revise
- **Why:** A Windows user following the quickstart and then running the next command in the same window gets a 401 with no explanation.
- **Suggestion:** Use one approach on both pages and add one line: "Open a new terminal before the next step."
- **Safety check:** Technical behaviour of `setx`/`SetEnvironmentVariable` is standard; no product claim changed.

---

## 3. Findings — likely improvements

### Journey pages (EN)

**L1. Hero line promises "one line of code", the quickstart needs two variables.** `index.mdx:12` "Switch from OpenAI with one line of code." The quickstart sets `OPENAI_API_KEY` and `OPENAI_BASE_URL` (`:55-56`). Suggest "by changing the base URL and key" — accurate and still short.

**L2. Quickstart heading hierarchy.** `index.mdx:25-73` "## Quickstart" followed by "## 1. Install…", "## 2. …" at the same level, so the steps are siblings of their own section. Use `<Steps>` (listed in AGENTS.md) or make the steps H3. Also `:117` "The same client and base URL." is a fragment that reads as a stray note; one sentence would do ("These examples reuse the client and base URL from above.").

**L3. Sources named only as "the datasheet" and "confirmed".** `index.mdx:196` "The Responses API is confirmed on `gpt-oss-120b`" and `:225` "The datasheet lists…"; also `concepts.mdx:36`. The reader cannot open "the datasheet". Name it and link it, or say "Supported values for `gpt-oss-120b`: …". "Confirmed" invites "and on others?" — state the scope plainly ("Supported on `gpt-oss-120b`; other models: see Structured outputs").

**L4. "Looking for pricing?" points to the old home of the full list.** `index.mdx:308-309` "See the Plans & Pricing page for the complete model list with pricing details." The complete list with prices is now `/models#all-models`. Point there and keep Plans for per-plan prices.

**L5. Authentication page.**
- `getting-started/authentication.mdx:3` description says "LLM Hub API" (see naming, L14).
- `:18-20` step 3 "Your trial key gives you access to all available models" is a statement, not a step, and is contradicted by the plan table (Premium models only on Professional/Agentic). Ask the author which models a trial key reaches; move it out of the numbered list.
- `:98` "API Reference" links to an external Redoc while the sidebar's "API reference" is the internal Endpoints page. Name the link "OpenAPI specification (Redoc)".
- `:104` "Use environment variables in production rather than hardcoding keys" repeats `:29`. Cut one.
- `:106` "Monitor usage through the API Key Portal to track token consumption and costs" — confirm the portal shows costs.

**L6. Models page intro is generic.** `models/index.mdx:9` "provides access to a wide range of … LLMs, embedding models, vision models, and audio models" omits image generation and OCR/decision models and says nothing a reader can use. The next sentence (`:11`) already does the job; the first could be cut or replaced by the count and the hosting split.

**L7. Three names for one model class; four in UI.** "Proprietary models" (`models/index.mdx:29`, `index.mdx:12`), "closed-source" (`faq.mdx:14,18`), "Partner models" (`concepts.mdx:26`), "Hyperscaler models" (`PlansPage.astro:70`), "External" (plan table host). The glossary defines "Partner models"; nothing else uses it. Pick one term, use it everywhere, and keep the glossary as the definition.

**L8. Coding page claims benchmark superiority without a source.** `models/coding.mdx:9` "Stronger on programming benchmarks than general LLMs of similar parameter count" (DE same). ask-author: which benchmark, which models — or cut the sentence.

**L9. Use-case page titles don't match their nav labels or each other.** Titles: "Chat & Reasoning (LLMs)", "Coding Models", "Vision Models", "Embedding Models", "Audio (Speech-to-Text)", "Image Generation". Sidebar and cards: "For chat & reasoning", "For coding", … "For images". Title Case and the "(LLMs)" / "(Speech-to-Text)" asides are inconsistent. Sentence case and one pattern ("Models for coding", or the sidebar wording).

**L10. Preview page: tip title doesn't cover its content, and "free" vs "pricing to be announced".**
- `models/preview.mdx:18-25` the tip "New in preview: d3" also introduces DiffusionGemma. Split it or retitle ("New in preview: two decision models").
- `:3,46` "Free on any active plan" next to "DeepSeek 4.1 Flash: pricing to be announced", and the component disclaimer says "Test models are provided free of charge" (`PlansPage.astro:89`). Say explicitly that DeepSeek 4.1 Flash is the exception, once.
- `:39` heading "Service note on Test / Preview models" and `reference/rate-limits.mdx:42` "(the Test catalog)": "Test" is the internal package name (`selectedPlanId="Test"`). Readers only see "Preview". Drop "Test".
- `:33` `modelsSectionTitle="Our Models"` — Title Case.

**L11. Plans intro paragraph does seven jobs.** `plans/index.mdx:11` defines two service models, the commitment, throughput differences, where to create a key, how to order, and when to go Dedicated — in one paragraph above the table. Split into: what the plans are (two sentences), then a short list "Create a key / Order a plan / Need guarantees → Dedicated". DE `:11` has the same shape.

**L12. Four names for the monthly minimum.** "monthly minimum token commitment" (plan pages `:8`), "Minimum token commitment" (`PlansPage.astro:45`), "per month, minimum spend" (`:64`), "Min. Consumption" (`:49`), DE "Mindestumsatz", "Mindest-Tokenumsatz", "Mindestverbrauch". Pick one EN and one DE term.

**L13. Dedicated page overpromises and gives three contact routes.**
- `plans/dedicated.mdx:45` "Performance is deterministic and reproducible — the same prompt produces the same latency profile run after run." contradicts `:39` "Performance may degrade if you push the hardware near its limit". In a commercial page this is the sentence a customer will quote back. Scope it ("not affected by other tenants' traffic") — that is what the source supports.
- Contact: "contact the AIFS team" (`:71`, `:112`), "your Telekom account representative" (`:57`), "your Telekom sales contact" (`:101`). Use one route, or say when to use which.
- Table row `:25` "Best for" puts "bursty workloads" under Dedicated and "Steady production traffic" under Shared, while `:86` says Shared is "cheaper at low to moderate volume". Consistent, but "exploration, prototyping" in the Shared cell duplicates `getting-started/shared-vs-dedicated.mdx:14`. Fine as reference; keep.

**L14. Product name drifts.** "LLM Hub" in meta descriptions (`plans/index.mdx:3`, `plans/essential.mdx:3`, `professional.mdx:3`, `agentic.mdx:3`, `reference/rate-limits.mdx:3`, `getting-started/authentication.mdx:3`, `reference/api-endpoints.mdx:3`, `guides/function-calling.mdx:3`, DE same). "LLM-Serving" (`faq.mdx:44`), "LLM Serving" (`plans/index.mdx:11`), "Shared LLM Serving Service" vs "shared service" vs "shared rate plans". Meta descriptions show in search results, so the reader sees "LLM Hub" before arriving. Decide the public name per layer (product, shared offer, dedicated offer) and apply it.

**L15. Rate-limits page.**
- `reference/rate-limits.mdx:52` "Limits apply at the project level" — "project" is not defined anywhere on the journey (not in Concepts, not in Authentication). Add it to the glossary or say how a reader creates/sees a project.
- `:62` "cached prompt tokens are refunded to the window at a 75% discount" — "refunded at a discount" is two metaphors pulling apart; the example after it is clear. Lead with the example's meaning: "cached prompt tokens count at 25%".
- `:179` the embeddings-row footnote ends with an unrelated sentence about Premium-tier models; "Standard catalog" and "Premium-tier" are not defined on this page. Move the plan-tier sentence to its own bullet or to the plans page.
- `:79` a TODO says the headers are unconfirmed on `gpt-6.1-sol`, which the sample now calls. Until confirmed, the page asserts behaviour nobody has checked. ask-author.
- `:147` "Use the Queue API" — the guide is "Queued requests". One name.
- `:185` "significantly higher" — say "higher" or point at the table. `:187` "**Contact:** [Contact us]" says the same word twice; "Ask for higher limits: ai@t-systems.com".
- `:9` "Rate limits protect the service and ensure fair usage." is boilerplate; the page's real first point is in the next sentence. Cut or merge.

**L16. FAQ register and labels.**
- `faq.mdx:14` "[Available Models](/models)" — old label; the page is "Models" and the list is "All models" (`/models#all-models`). Same stale label in `guides/function-calling.mdx:14`, `guides/multimodal.mdx:14`, `plugins/cline.mdx:46`, `plugins/continue-vscode.mdx:25`, `plugins/continue-jetbrains.mdx:28`, `plugins/roo-code.mdx:50`, DE equivalents ("Verfügbare Modelle").
- `api-transition/index.mdx:132` "[Model Comparison](/models)" — stale name, and both links in the sentence go to `/models`. Use "All models" → `/models#all-models`.
- `reference/error-codes.mdx:73` "List Models API" → "Models API" (sidebar name), DE "Modelle-API" vs sidebar "Modelle per API".
- `faq.mdx:24` "Yes!" and a portal URL with `#/login` unlike every other link to the portal. `:28` "various tariffs" (the site says "plans"), "LLM component". `:54` "for maximum efficiency" adds nothing.

**L17. Date formats.** "August 1, 2026" (plan notes), "2 November 2026" (choosing), "2026-10-31" (deprecations), "2 Nov" (banner). DE deprecations mixes "31.10.2026" (upcoming, `de/models/deprecations.mdx:16-25`) with "2026-08-01" (retired, `:36-49`) in one page. One format per language; ISO is fine for tables if used throughout.

**L18. Model name spelling within tables.** `models/deprecations.mdx:14-15` "GPT 5.4 mini", "GPT 5.4", "GPT 5.5" next to "GPT-5 mini" and, in the retired table, "GPT-5.4 mini". `:16-17` "Claude 4.6 Sonnet" next to "Claude Sonnet 5.5". Vendor naming changed between generations, but the hyphen should be consistent within OpenAI rows.

### Headings (sentence case and point)

**L19. Title Case headings against AGENTS.md "sentence case".** Most affected:
- `getting-started/authentication.mdx:12-78` "Get an API Key", "Free Trial Key", "Production Key", "Set Up Environment Variables", "Using the API Key", "With HTTP Requests".
- `reference/rate-limits.mdx` title "Rate Limits", `:12` "Limits by Plan", `:48` "How Rate Limits Work", `:72` "Rate Limit Response Headers", `:91` "Reading Headers", `:139` "Handling Rate Limits", `:183` "Need Higher Limits?".
- `plans/dedicated.mdx:33-121` "Why Choose Dedicated LLM Serving", "Commercial Structure", "When to Move to…", "Hybrid Deployments", "Optional Services", "How to Order", "Related Resources"; LinkCard "Request a Quote" (`:29`).
- `models/index.mdx:26` "Hosting & Compliance"; `models/api.mdx:44` "Model Metadata".
- `plans/index.mdx` title "Plans & Pricing", LinkCard "Service Description (PDF)" (`:16`); sidebar "Migrate to New API", "Plans & Pricing" (`astro.config.mjs`).
- Home: hero badges "EU Data Sovereignty", "ISO 27001 Certified", "OpenAI Compatible" (`index.mdx:15-17`); LinkCard "Get Free API Key" (`:21`).
- Link text "Rate Limits" on plan pages (`plans/*.mdx:8`, `plans/index.mdx:11`), "Plans & Pricing" in many places.

**L20. Headings that name a type, not the point.** Most headings are fine for reference. The ones worth changing:
- `models/deprecations.mdx:22` caution "[Important]" (see M8).
- `plans/dedicated.mdx:33` "Why Choose Dedicated LLM Serving" → the five H3s already carry the points; the H2 could be "What you get".
- `plans/dedicated.mdx:121` "Related Resources" vs "Next steps" elsewhere — pick one.
- Keep: "Rate limits are ceilings, not guarantees" — a heading that states its point; a model for the others.

**L21. Duplicated heading/anchor names.** The concept "Rate limits are ceilings, not guarantees" appears on five pages with different anchors (`#rpm-tpm-notes`, `#about-these-rpm-and-tpm-values`, DE `#hinweise-zu-den-rpm--und-tpm-werten`). Reference repetition is fine; unify the anchor so cross-links (FAQ → rate limits) can't break.

### German (spot check)

Sie is consistent on every page checked; no sections exist in one language only on the journey pages. Drift and calques:

**L22. Content drift EN/DE.**
- `de/plans/essential.mdx:3` adds "— geeignet für wachsende API-Workloads"; EN `plans/essential.mdx:3` has no such claim.
- `PlansPage.astro:53` DE column "Beispiel RPM" vs EN "RPM".
- `PlansPage.astro:92` "Gewählter Tarif" vs EN "Rate Plan".
- `PlansPage.astro:85,89` EN "Disclaimer" vs DE "Hinweis" (DE is better; "Disclaimer" reads as legal boilerplate).

**L23. Terms flip between German and English within the DE site.**
- "API-Key" (`de/plans/index.mdx:11`, header CTA `HeaderApiKeyLink.astro:7` "API-Key generieren", `SiteHeader.astro:12` "API-Key") vs "API-Schlüssel" (`de/getting-started/authentication.mdx`, `de/index.mdx:21`). Portal: "API-Schlüssel-Portal" vs "API-Key Self-Service-Portal".
- "Gemeinsame Tarife" (`de/getting-started/shared-vs-dedicated.mdx:10`) vs "Shared-Tarife" (`de/index.mdx:303`, `de/plans/dedicated.mdx:28`) vs "Shared-Dienst" / "Shared Service".
- "Mandanten" (`de/getting-started/shared-vs-dedicated.mdx:12,18`) vs "Tenants" (`de/reference/rate-limits.mdx:55`, `de/plans/dedicated.mdx:10,43`).
- "Rate-Limits" vs "Rate Limits" (`de/faq.mdx:30-36`).
- "Tokens pro Minute" (`de/getting-started/concepts.mdx:12`) vs "Token pro Minute" (plans, rate limits).
- "Reasoning Effort" (`de/index.mdx:223`) vs "Reasoning effort" (`de/getting-started/concepts.mdx:34`).

**L24. Calques / non-native phrasing (suggest native rewording, not word-for-word).**
- `de/index.mdx:12` "Wechseln Sie von OpenAI mit nur einer Zeile Code" — English word order.
- `de/getting-started/authentication.mdx:111` "hilft bei einem aktuellen Modell" — says nothing (EN: "picks a live model").
- `de/getting-started/shared-vs-dedicated.mdx:14` "Last, die in einen veröffentlichten Tarif passt"; `:18` "Dort stehen Mandantentrennung, Modellauswahl und die Angebotsanfrage."
- `de/plans/dedicated.mdx:10` "keine geteilte Konkurrenz", "vorhersagbare Funktionen Ihres Modells"; `:37` "soviel wie" (→ "so viel, wie"); `:81` "Shared-Contention-Risiko", "bursty Traffic" (also `de/reference/rate-limits.mdx:186`).
- `de/plans/index.mdx:11` "Der monatliche Mindestumsatz ist ein Token-Umsatz" — circular.
- `PlansPage.astro:176` "Zu Tarife und Preise" — case error ("Zu Tarifen und Preisen" or "Tarife und Preise ansehen").
- `ChoosingModels.astro:40-41`, `ModelPick.astro:70-71` translate Azure region names: "Azure Schweden Mitte", "Azure Frankreich Mitte". Azure region names are product identifiers ("Sweden Central"); translating them makes them unsearchable. Keep the English region name.
- `de/reference/rate-limits.mdx:59` „Minute" — closing straight quote; `:179` "T-Cloud-Embedding-Modelle (RPM)" with straight quotes. Use „…".
- `de/index.mdx:27` "das LLM Playground" — taste; "der Playground" is the common gender.

### UI strings in components

**L25. Title Case labels.** `AvailableModels.astro:25-30` "Cloud Provider", "Server Location", "Data Processing", "Show More ({count} more)", "Show Less", "Available Models"; `PlansPage.astro:40-50,75` "Our Rate Plans", "Rate Plan", "Model Host", "Model Tier", "Min. Consumption", "Input / Output Token Price", "Our Models"; `:148-150,166,169-170` "Input Token Price", "Cached Input Token Price", "Context Window", "Terms of Use", "Data Protection"; `ModelsComparison.astro:551` "Models Comparison"; `CATEGORY_LABELS` "Image Generation" (`:660`). ModelsComparison already has sentence-case versions of the same labels ("Terms of use", "Data protection") — the two tables disagree with each other.

**L26. API-key call to action has five forms.** "Get Free API Key" (home card), "Get API key" (`SiteHeader.astro:12`), "Get API Key" (`HeaderApiKeyLink.astro:7`), "API Key" (`MobileApiKeyLink.astro:7`, no verb), DE "API-Key generieren" / "API-Key" / "Kostenlosen API-Schlüssel erhalten". One verb + noun per language ("Get API key" / "API-Schlüssel erhalten").

**L27. Buttons and filters.**
- `PlansPage.astro:68` "View plan {plan}" → "View plan Essential" reads backwards; "View {plan} plan" / "Tarif {plan} ansehen" (DE is fine).
- `ModelsComparison.astro:634` "Clear all" next to "Reset filters" (`:584`) — two labels for the same action family; verb + noun ("Clear all filters", as DE already says).
- `ModelsComparison.astro:580-581` price cells "In" / "Out", DE "Ein" / "Aus" — "Aus" reads as "off". Use "Eingabe" / "Ausgabe" as the column headers already do.
- Price buckets: `PlansPage.astro:101-103` "Under €2/MTok", "€2-5/MTok" vs `ModelsComparison.astro:626-628` "Up to €2", "€2 to €5". "MTok" is jargon. One set.
- `ModelsComparison.astro:585-587` "Showing" + n + "of" + m + "models" assembled from fragments; German grammar ("Zeige … von … Modellen") survives here by luck. A single template string per language is safer.

**L28. Empty / error states.** `ModelsComparison.astro:589` "No models match the current filters." has a reset action nearby — good; add the action to the text ("Reset filters to see all models."). `PlansPage.astro:174-175` "This plan has no models in the current catalog." explains why and links on — good.

**L29. Stale names inside tooltips.** `ModelsComparison.astro:602` "See the Reasoning Control guide." — the guide is "Reasoning". The same tooltip describes the empty marker as `"-"` while the cell renders "—" (`:603`).

**L30. Marketing register in component copy.** `PlansPage.astro:78` "capable and built for speed - reliable across most use cases, without cutting corners. Premium models go further"; `:87` "Get hands-on with the latest AI models: free to test, ready to explore. Our preview catalog is your sandbox…". The preview copy sits directly above a disclaimer that says no SLA and may be switched off without notice. Replace with what a Standard vs Premium model is (the plan table already says which plans include Premium) and what a preview model is for.

**L31. Dead strings that carry stale wording.** Several keys in `PlansPage.astro`'s `t` object are defined but never referenced (e.g. `thHostingPlatform`, `thInputTokenLimit`, `thOutputTokenLimit` — English-only in the DE branch — `dynamicQuota` "Dynamic Shared Quota", `noModels`, `thMinConsumption`). Not reader-facing today; a cleanup would stop them being copied back in. (Usage checked by grep only; verify before deleting.)

---

## 4. Taste

- `index.mdx:27` "Prefer to click rather than curl?" — playful, works; keep.
- `index.mdx:161` "Full streaming notes: [Streaming]." — a full sentence would match the other "See …" links.
- Plan pages repeat the full ceilings footnote five times (`plans/*.mdx`, `reference/rate-limits.mdx`). For reference pages that are opened directly, repetition is defensible; a shared partial would keep them identical.
- `plans/dedicated.mdx:57,66` "uniquely" twice; once is enough.
- `models/index.mdx:31` the bold sentence on training is earned (it is the claim buyers look for); keep.
- `getting-started/concepts.mdx` — plain, defined, linked. Good model for the rest of the site; no findings beyond "project" (L15) and "Partner models" (L7).

---

## 5. Not covered

- Guides (`guides/*`), integrations and plugin pages, API transition pages, `reference/enterprise-trust.mdx`, `reference/service-levels.mdx`, `reference/api-endpoints.mdx`, `reference/error-codes.mdx`, `changelog.mdx`, `aie/overview.mdx` — only grepped for stale terms (L16), not read.
- German: spot-checked index, authentication, concepts, shared-vs-dedicated, choosing-a-model, models index, deprecations, preview, coding/llms, plans index/essential/agentic, dedicated (partial), rate limits, FAQ. Other DE pages not read.
- Component copy that is generated from data (`ChoosingModels` rows and notes in `src/shared/lib/choosingModels.ts`, provider tooltips in `providerTooltips`, `ModelPick` notes) was not read row by row.
- Rendered pages were not opened in the browser; findings are from source. Whether some strings render (L31) was checked by grep only.
- Facts were checked against the repo's own data (pricing export, `choosingModels.ts`, `launchModels.ts`, `hiddenModels.ts`), not against the live API or the Service Description PDF.
