// Models dropped from the catalog tables. Pricing exports have used both
// `gpt-5-codex` and `GPT-5-Codex` (and the same for Mistral Medium 3), so the
// match is case-insensitive.
const HIDDEN_MODELS = [
  'gpt-4.1-nano',
  'gpt-4o-mini',
  'gpt-5-codex',
  'gpt-5-nano',
  'mistral-large-2411',
  'mistral-medium-3',
  'o1',
];

const hidden = new Set(HIDDEN_MODELS.map((name) => name.toLowerCase()));

export function isHiddenModel(exactModelName: string | undefined): boolean {
  return hidden.has((exactModelName ?? '').toLowerCase());
}
