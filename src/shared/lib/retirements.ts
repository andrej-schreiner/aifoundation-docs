// Retirement dates by exact model id, as /models/deprecations lists them.
// Until its date a model is an upcoming retirement and stays in the catalog;
// from that date (build day, UTC) it is retired and every list of models
// (catalog, plans tables, recommendations, reasoning table) drops it.
// A date passes only when the site is rebuilt. Match is case-insensitive.
const RETIREMENTS: Record<string, string> = {
  // Retired 2026-10-31.
  'gpt-5-nano': '2026-10-31',
  'gpt-5-mini': '2026-10-31',
  'gpt-5.4-mini': '2026-10-31',
  'gpt-5': '2026-10-31',
  'gpt-5-codex': '2026-10-31',
  'gpt-5.4': '2026-10-31',
  'gpt-5.5': '2026-10-31',
  'claude-haiku-4.5': '2026-10-31',
  'claude-sonnet-4.6': '2026-10-31',
  'claude-opus-4.6': '2026-10-31',
  'claude-opus-4.8': '2026-10-31',
  'gemini-3-pro': '2026-10-31',
  'gemini-3-pro-long-context': '2026-10-31',
  // Upcoming 2026-11-30.
  'glm-5.2': '2026-11-30',
  'gpt-5.6-luna': '2026-11-30',
  'claude-sonnet-5': '2026-11-30',
  'claude-opus-5': '2026-11-30',
  'claude-fable-5': '2026-11-30',
  'gemini-3.1-pro': '2026-11-30',
  'gemini-3.1-pro-long-context': '2026-11-30',
  'mistral-medium-3': '2026-11-30',
  'gemini-3-flash': '2026-11-30',
};

const BUILD_DAY = new Date().toISOString().slice(0, 10);

/** The model's retirement date (YYYY-MM-DD), if one is published. */
export function retirementDate(exactModelName: string | undefined): string | undefined {
  return RETIREMENTS[(exactModelName ?? '').toLowerCase()];
}

/** True once the model's retirement date has come (build day by default). */
export function isRetiredModel(exactModelName: string | undefined, today: string = BUILD_DAY): boolean {
  const date = retirementDate(exactModelName);
  return Boolean(date && date <= today);
}
