// Tooltip content for the brand logo on the plans and comparison pages.
// Minimal: just the maker's company name. Keys must match the `creator`
// strings used by logos (src/shared/lib/logos.ts) (so the same dictionary works for any
// component that already has a creator string).

export type CreatorKey =
  | 'OpenAI'
  | 'Anthropic'
  | 'Google'
  | 'Google Gemini'
  | 'Google Gemma'
  | 'Meta'
  | 'Mistral'
  | 'Alibaba Cloud'
  | 'NVIDIA'
  | 'Zhipu AI'
  | 'BAAI'
  | 'Jina AI'
  | 'T-Systems'
  | 'DeepSeek'
  | 'Other';

const PROVIDER_NAMES: Record<CreatorKey, string> = {
  OpenAI: 'OpenAI',
  Anthropic: 'Anthropic',
  Google: 'Google',
  'Google Gemini': 'Google',
  'Google Gemma': 'Google',
  Meta: 'Meta',
  Mistral: 'Mistral AI',
  'Alibaba Cloud': 'Alibaba',
  NVIDIA: 'NVIDIA',
  'Zhipu AI': 'Zhipu AI',
  BAAI: 'BAAI',
  'Jina AI': 'Jina AI',
  'T-Systems': 'T-Systems',
  DeepSeek: 'DeepSeek',
  Other: 'Independent maker',
};

// Locale parameter kept on the API for forward-compat; company names are the
// same in EN and DE today.
export function getProviderTooltips(_isDE: boolean): Record<CreatorKey, string> {
  return PROVIDER_NAMES;
}

export function getProviderTooltip(creator: string, isDE: boolean): string {
  const map = getProviderTooltips(isDE);
  return map[creator as CreatorKey] ?? creator;
}
