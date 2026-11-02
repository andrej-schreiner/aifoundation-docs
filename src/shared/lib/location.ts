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
  if (parts.length < 2) return { name: region, code: '' };
  const raw = parts[1];
  const english = raw.charAt(0).toUpperCase() + raw.slice(1);
  const name = isDE ? (REGION_DE[raw] ?? english) : english;
  return { name, code: COUNTRY_CODES[raw] || '' };
}
