// Models dropped from the catalog tables. Pricing exports have used both
// `gpt-5-codex` and `GPT-5-Codex`, so the match is case-insensitive. A model
// SD v1.25 does not list is hidden here even if retirements.ts gives it a
// later date; /models/deprecations keeps its row.
const HIDDEN_MODELS = [
  // Not in service description v1.25 (no price, limit or model list entry)
  // and no retirement date (Andrej, 2026-11-03).
  'gemini-3-pro-image',
  'gpt-4.1-nano',
  'gpt-4o-mini',
  'gpt-5-codex',
  'gpt-5-nano',
  'mistral-large-2411',
  'o1',
  // Not in service description v1.25, though /models/deprecations retires
  // them on 2026-11-30: the current catalog lists only SD models (Andrej,
  // 2026-11-03).
  'glm-5.2',
  'mistral-medium-3',
  'gpt-5.6-luna',
  'claude-sonnet-5',
  'claude-opus-5',
  'claude-fable-5',
  'gemini-3.1-pro',
  'gemini-3.1-pro-long-context',
];

const hidden = new Set(HIDDEN_MODELS.map((name) => name.toLowerCase()));

export function isHiddenModel(exactModelName: string | undefined): boolean {
  return hidden.has((exactModelName ?? '').toLowerCase());
}
