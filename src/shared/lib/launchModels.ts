// Models launched on 2026-11-02.
// TODO(andrej): confirm the exact id GLM-5.3. It follows the GLM-5.2 spelling.
// DeepSeek 4.1 Flash is a preview model hosted on T-Cloud in Germany (Andrej, 2026-10-31).

export const GLM_53_ID = 'GLM-5.3';
export const DEEPSEEK_41_FLASH_ID = 'DeepSeek-V4.1-Flash-preview';

// Models listed in service description v1.25 (prices and limits, §7.2), new
// on 2026-11-03. Their specs come from the vendors' model pages (2026-11-03).
// TODO(andrej): confirm the ids. Claude, GPT, Gemini and Mistral follow the
// ids of the same vendor's models here (claude-sonnet-5.5, gpt-6-luna,
// gemini-3.8-flash, mistral-medium-3); Qwen3-Reranker-4B has the
// vendor's Hugging Face id.
export const SD_V125_MODEL_IDS = [
  'Qwen/Qwen3-Reranker-4B',
  'gpt-6-astra',
  'gpt-6-astra-long-context',
  'mistral-medium-3.5',
  'claude-haiku-5.5',
  'claude-haiku-5.5-long-context',
  'claude-fable-5.1',
  'gemini-4-argon',
] as const;

// A model listed before its API id is published gets a key starting with
// `sd:` in the pricing data: a placeholder, never shown or copied. None now.
const UNPUBLISHED_ID_PREFIX = 'sd:';

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
const NEW_MODELS = new Set<string>([GLM_53_ID, DEEPSEEK_41_FLASH_ID, ...SD_V125_MODEL_IDS]);

export function isNewModel(exactModelName: string | undefined): boolean {
  return NEW_MODELS.has(exactModelName ?? '');
}
