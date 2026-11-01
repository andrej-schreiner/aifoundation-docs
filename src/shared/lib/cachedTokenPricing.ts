import type { ModelCategory } from './modelCategories';

// Cached input tokens — prompt tokens served from the prefix cache — are billed
// at a fraction of the model's normal input token price. See the Prefix Caching
// guide (/guides/prefix-caching) for how caching is enabled per request.
//
// The discount applies to T-Cloud-hosted language models (chat / text
// generation, including coding models) only. Prefix caching reuses prompt
// prefixes in text generation, so embedding, speech-to-text and
// image-generation models get no cached price. Those rows, like rows for
// models served from external providers (Azure, GCP), deliberately render as
// "not available" rather than as a price.
export const CACHED_INPUT_PRICE_FACTOR = 0.15;

/** Percentage form for user-facing copy — "15%". */
export const CACHED_INPUT_PRICE_PERCENT = Math.round(CACHED_INPUT_PRICE_FACTOR * 100);

/** Primary categories that are language models (see shared/lib/modelCategories). */
const LANGUAGE_MODEL_CATEGORIES: ReadonlySet<ModelCategory> = new Set(['llms', 'coding']);

/**
 * Whether cached-token pricing is published for a model, derived from its
 * deployment region and primary category. `otc-*` is T-Cloud Public;
 * everything else is external. Pass `null` as the category only for archived
 * pages, which keep their original region-only output.
 */
export function hasCachedTokenPricing(
  deploymentRegion: string | null | undefined,
  modelCategory: ModelCategory | null,
): boolean {
  if (modelCategory !== null && !LANGUAGE_MODEL_CATEGORIES.has(modelCategory)) return false;
  return (deploymentRegion ?? '').toLowerCase().startsWith('otc');
}

/**
 * Cached input token price per million tokens, or `null` when no price can be
 * derived — the model is externally hosted, not a language model, or its
 * input price is a placeholder.
 */
export function cachedInputPrice(
  inputPricePerMillionTokens: number | null | undefined,
  deploymentRegion: string | null | undefined,
  modelCategory: ModelCategory | null,
): number | null {
  if (!hasCachedTokenPricing(deploymentRegion, modelCategory)) return null;
  if (inputPricePerMillionTokens == null) return null;
  return inputPricePerMillionTokens * CACHED_INPUT_PRICE_FACTOR;
}
