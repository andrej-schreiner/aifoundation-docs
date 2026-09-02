// Cached input tokens — prompt tokens served from the prefix cache — are billed
// at a fraction of the model's normal input token price. See the Prefix Caching
// guide (/guides/prefix-caching) for how caching is enabled per request.
//
// The discount applies to T-Cloud-hosted models only. Cached-token pricing for
// models served from external providers (Azure, GCP) has not been published yet,
// so those rows deliberately render as "not available" rather than as a price.
export const CACHED_INPUT_PRICE_FACTOR = 0.15;

/** Percentage form for user-facing copy — "15%". */
export const CACHED_INPUT_PRICE_PERCENT = Math.round(CACHED_INPUT_PRICE_FACTOR * 100);

/**
 * Whether cached-token pricing is published for a model, derived from its
 * deployment region. `otc-*` is T-Cloud Public; everything else is external.
 */
export function hasCachedTokenPricing(deploymentRegion: string | null | undefined): boolean {
  return (deploymentRegion ?? '').toLowerCase().startsWith('otc');
}

/**
 * Cached input token price per million tokens, or `null` when no price can be
 * derived — either the model is externally hosted or its input price is a
 * placeholder.
 */
export function cachedInputPrice(
  inputPricePerMillionTokens: number | null | undefined,
  deploymentRegion: string | null | undefined,
): number | null {
  if (!hasCachedTokenPricing(deploymentRegion)) return null;
  if (inputPricePerMillionTokens == null) return null;
  return inputPricePerMillionTokens * CACHED_INPUT_PRICE_FACTOR;
}
