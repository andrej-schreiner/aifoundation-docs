// Models launched on 2026-11-02.
// TODO(andrej): confirm the exact id GLM-5.3. It follows the GLM-5.2 spelling.
// DeepSeek 4.1 Flash is a preview model hosted on T-Cloud in Germany (Andrej, 2026-10-31).

export const GLM_53_ID = 'GLM-5.3';
export const DEEPSEEK_41_FLASH_ID = 'DeepSeek-V4.1-Flash-preview';

// Models listed in service description v1.25 (prices and limits, §7.2) that
// have no published API model id yet. Their key in the pricing data starts
// with `sd:` and is a placeholder, not an id: it is never shown or copied.
// Replace the key with the real id once it is published.
const UNPUBLISHED_ID_PREFIX = 'sd:';
export const SD_V125_MODEL_KEYS = [
  'sd:qwen3-reranker-4b',
  'sd:gpt-6-astra',
  'sd:gpt-6-astra-long-context',
  'sd:mistral-medium-3.5',
  'sd:claude-haiku-5.5',
  'sd:claude-haiku-5.5-long-context',
  'sd:claude-fable-5.1',
  'sd:gemini-4-argon',
] as const;

/** False while the model's key is a placeholder: show no id and no copy button. */
export function apiIdPublished(exactModelName: string | undefined): boolean {
  return !(exactModelName ?? '').startsWith(UNPUBLISHED_ID_PREFIX);
}

// Models whose hosting is not confirmed yet: no cloud tag or location is shown.
const HOSTING_UNCONFIRMED = new Set<string>();

export function hostingUnconfirmed(exactModelName: string | undefined): boolean {
  return HOSTING_UNCONFIRMED.has(exactModelName ?? '');
}

// The one place that decides which models carry the "New" tag (catalog,
// featured cards, plans list, category pages). Empty the set to remove them.
const NEW_MODELS = new Set<string>([GLM_53_ID, DEEPSEEK_41_FLASH_ID, ...SD_V125_MODEL_KEYS]);

export function isNewModel(exactModelName: string | undefined): boolean {
  return NEW_MODELS.has(exactModelName ?? '');
}
