// Where a model runs, read from its deployment region ("otc-germany",
// "azure-sweden", "gcp-europe" …): the place name for the table and the code
// for its flag (Flag.astro; `globe` for worldwide).

const COUNTRY_CODES: Record<string, string> = {
  germany: 'de',
  sweden: 'se',
  france: 'fr',
  europe: 'eu',
  us: 'us',
  worldwide: 'globe',
};

const REGION_DE: Record<string, string> = {
  germany: 'Deutschland',
  sweden: 'Schweden',
  france: 'Frankreich',
  europe: 'Europa',
  worldwide: 'Weltweit',
  us: 'USA',
};

export function parseLocation(deploymentRegion: string | undefined | null, isDE: boolean): { name: string; code: string } {
  const region = deploymentRegion ?? '';
  const parts = region.toLowerCase().split('-');
  // A region that names only the cloud (`gcp`) has no published place.
  if (parts.length < 2) return { name: '', code: '' };
  const raw = parts[1];
  const english = raw.charAt(0).toUpperCase() + raw.slice(1);
  const name = isDE ? (REGION_DE[raw] ?? english) : english;
  // T-Cloud data stays in Germany, within the EU.
  if (parts[0] === 'otc' && raw === 'germany') return { name: `${name} (EU)`, code: COUNTRY_CODES[raw] };
  return { name, code: COUNTRY_CODES[raw] || '' };
}

// Models whose data is processed in the EU though their server location is
// worldwide (product owner, 2026-11-03).
const DATA_PROCESSING_EU = new Set(['claude-haiku-5.5', 'claude-haiku-5.5-long-context', 'claude-fable-5.1']);

// Where a model's data is processed, as the model cards show it beside the
// server location: T-Cloud in Germany (EU), a worldwide region worldwide (the
// provider may process data outside the EU/EEA, see
// /reference/enterprise-trust), any other region in the EU. Only worldwide
// carries a glyph; Germany and EU stay text-only.
export function parseDataProcessing(
  exactModelName: string | undefined,
  deploymentRegion: string | undefined | null,
  isDE: boolean,
): { name: string; code: string } {
  const parts = (deploymentRegion ?? '').toLowerCase().split('-');
  if (parts.length < 2) return { name: '', code: '' };
  if (parts[0] === 'otc') return { name: isDE ? 'Deutschland (EU)' : 'Germany (EU)', code: '' };
  if (parts[1] === 'worldwide' && !DATA_PROCESSING_EU.has((exactModelName ?? '').toLowerCase())) {
    return { name: isDE ? 'Weltweit' : 'Worldwide', code: 'globe' };
  }
  return { name: 'EU', code: '' };
}
