// Models launched on 2026-11-02.
// TODO(andrej): confirm the exact id GLM-5.3. It follows the GLM-5.2 spelling.
// DeepSeek 4.1 Flash is a preview model hosted on T-Cloud in Germany (Andrej, 2026-10-31).

export const GLM_53_ID = 'GLM-5.3';
export const DEEPSEEK_41_FLASH_ID = 'DeepSeek-V4.1-Flash-preview';

// Models whose hosting is not confirmed yet: no cloud tag or location is shown.
const HOSTING_UNCONFIRMED = new Set<string>();

export function hostingUnconfirmed(exactModelName: string | undefined): boolean {
  return HOSTING_UNCONFIRMED.has(exactModelName ?? '');
}

// The one place that decides which models carry the "New" tag (catalog,
// featured cards, plans list, category pages). Empty the set to remove them.
const NEW_MODELS = new Set<string>([GLM_53_ID, DEEPSEEK_41_FLASH_ID]);

export function isNewModel(exactModelName: string | undefined): boolean {
  return NEW_MODELS.has(exactModelName ?? '');
}
