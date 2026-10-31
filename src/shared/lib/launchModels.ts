// Models announced for 2026-11-02.
// TODO(andrej): confirm the exact id GLM-5.3. It follows the GLM-5.2 spelling.
// TODO(andrej): confirm the exact id DeepSeek-V4.1-Flash.
// TODO(andrej): confirm where DeepSeek 4.1 Flash is hosted. Andrej did not say.
// The cloud tag is omitted until then. Do not guess T-Cloud.

export const GLM_53_ID = 'GLM-5.3';
export const DEEPSEEK_41_FLASH_ID = 'DeepSeek-V4.1-Flash';

const HOSTING_UNCONFIRMED = new Set([DEEPSEEK_41_FLASH_ID]);

export function hostingUnconfirmed(exactModelName: string | undefined): boolean {
  return HOSTING_UNCONFIRMED.has(exactModelName ?? '');
}
