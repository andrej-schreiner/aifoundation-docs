/**
 * Default model order for the home "Available models" grid, the models index,
 * and the plans table before a visitor picks a column.
 *
 * One list, matched on display name. Names missing from the list sort after
 * it, A to Z, so a newly added model still appears.
 *
 * Rank comes from the catalog itself: T-Cloud (`otc-`) before hyperscalers,
 * then generation and size tokens in the provider's name, the premium tier,
 * published token price only as a tie-break inside one family, and the
 * successor column on /models/scheduled-for-retirement and /models/retired.
 * No benchmark scores.
 *
 * Rows marked "unsure" are the ones where two of those signals disagree.
 */

export const MODEL_CATALOG_ORDER = [
  // --- T-Cloud: chat, newest generation first, then larger older models ---
  'GLM 5.3', // Full GLM 5.3, launching 2026-11-02. Newer than 5.3 Flash and 5.2.
  'GLM 5.3 Flash', // GLM 5.3 Flash stays. Smaller sibling of the full 5.3 model.
  'GLM 5.2', // Previous GLM, 1M context, higher token price than 5.3 Flash.
  'Mistral Small 4', // Generation 4, 119B in the model id (2603). Larger than Gemma 4.
  'Gemma 4', // Generation 4, 31B in the model id.
  'Qwen 3.8 27B FP8', // Newer Qwen (3.8 > 3.6). Unsure vs 3.6: that one is 35B.
  'Qwen 3.6 35B FP8', // Previous Qwen generation, 35B.
  'NVIDIA Nemotron 3 Super 120B FP8', // Generation 3, Super tier, 120B, 1M context. Unsure: size could place it above the 27B/31B models.
  'GPT-OSS 120B', // 120B open model, 128K context. Documented replacement for retired Llama 3.3 70B.
  'DiffusionGemma 26B A4B', // Preview, 26B diffusion/decision model (changelog 2026-10). Specialized, so after the GA chat models.
  'd3', // Preview 27B decision model (changelog 2026-10). Same placement call as DiffusionGemma.
  'DeepSeek 4.1 Flash', // Preview, launching 2026-11-02. Hosting is unconfirmed, so it is not ranked as a T-Cloud GA model.

  // --- T-Cloud: embeddings, then OCR, then audio ---
  'Qwen3 Embedding 8B', // Newest embedding (changelog 2026-10), 8B, 32K.
  'BGE-M3', // Embedding, no newer generation token than Qwen3 Embedding.
  'Jina Embeddings v2 Base DE', // Embedding v2, Base size, 8K context.
  'LightOnOCR-3-4B', // OCR preview, generation 3, 4B. Added the same day as PaddleOCR — order is the generation number only.
  'PaddleOCR-VL-1.6', // OCR preview, version 1.6. Same changelog entry as LightOnOCR.
  'Whisper Large v3', // Audio, Large v3.
  'Whisper Large v3 Turbo', // Same generation, Turbo variant, so after the full Large.

  // --- Hyperscalers: flagship (Opus / Pro / Sol / full GPT), newest first ---
  'GPT-6.1 Sol (≤272k)', // Newest OpenAI flagship. Retirement table: replaces GPT-5 through GPT 5.5.
  'GPT-6.1 Sol (>272k)', // Same model, long-context price.
  'Claude Opus 5.5', // Newest Opus. Retirement table: replaces Opus 4.6 and Opus 4.8. Premium tier.
  'Claude Fable 5', // Premium, generation 5, highest token price in the catalog. Unsure: the name is not Opus/Sonnet/Haiku, and it is not the documented Opus successor.
  'Claude Opus 5', // Previous Opus. Retirement table: replaces retired Claude 4.5 Opus.
  'GPT-5.6 Sol', // Generation 5.6, Sol — the same name as the GPT-6.1 flagship. Highest price of the three 5.6 names.
  'Gemini 3.1 Pro (≤200k)', // Newer Pro (3.1). Retirement table: replaces Gemini 3 Pro.
  'Gemini 3.1 Pro (>200k)', // Same model, long-context price.

  // --- Hyperscalers: mid (Sonnet, Terra, Medium, coding, image) ---
  'Claude Sonnet 5.5', // Newest Sonnet. Retirement table: replaces Claude 4.6 Sonnet and Claude 4.5 Haiku.
  'Claude Sonnet 5', // Previous Sonnet. Retirement table: replaces retired Claude 4.5 Sonnet.
  'GPT-5.6 Terra', // Price sits between 5.6 Sol and 5.6 Luna. Unsure: the name has no size token.
  'Gemini 3 Pro Image', // Pro image model. Unsure: placed after chat mids because it is a different task, not a smaller Gemini.
  'GPT Image 2', // Image model. Retirement table: replaces GPT Image 1.

  // --- Hyperscalers: mini, nano, Haiku, Flash ---
  'GPT-6 Luna (≤272k)', // Newest small GPT. Retirement table: replaces GPT-5 nano, GPT-5 mini, and GPT 5.4 mini.
  'GPT-6 Luna (>272k)', // Same model, long-context price.
  'GPT-5.6 Luna', // 5.6 small name. Lowest token price of the three 5.6 names.
  'Gemini 3.8 Flash', // Newest Flash. Retirement table: replaces Gemini 3 Flash.
  'Gemini 3.5 Flash', // Previous Flash generation.

  // --- Hyperscalers: embeddings last in the group ---
  'Ada Text Embedding', // Azure embedding.
] as const;

const catalogIndex = new Map<string, number>(MODEL_CATALOG_ORDER.map((name, index) => [name, index]));

/** Lower comes first. Unknown names sort after the list, then A to Z. */
export function compareCatalogName(a: string, b: string): number {
  const ai = catalogIndex.get(a);
  const bi = catalogIndex.get(b);
  if (ai != null && bi != null) return ai - bi;
  if (ai != null) return -1;
  if (bi != null) return 1;
  return a.localeCompare(b);
}
