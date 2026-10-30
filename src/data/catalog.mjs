/**
 * Catalog counts and lifecycle labels.
 * Retirement rows come from src/data/model-retirement.json, regenerated from
 * scheduled-for-retirement.mdx by scripts/sync-model-retirement.mjs.
 * Counts come from the current pricing export. Offline IDs match
 * AvailableModels.astro. Models deprecated on or before 2026-10-31 are
 * excluded from the available counts (finding 3).
 */
import pricingData from '../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import retirementEntries from './model-retirement.json';

/** Kept in sync with AvailableModels.astro / ModelsComparison.astro. */
export const OFFLINE_MODELS = new Set([
  'gpt-4.1-nano',
  'gpt-4o-mini',
  'GPT-5-Codex',
  'gpt-5-nano',
  'Mistral-Large-2411',
  'Mistral-Medium-3',
  'o1',
]);

const PLAN_NAMES = ['Essential', 'Professional', 'Agentic'];

const retirementByDisplayName = new Map(retirementEntries.map((entry) => [entry.displayName, entry]));

export function lifecycleFor(displayName) {
  return retirementByDisplayName.get(displayName) ?? null;
}

export function formatRetirementDate(iso, isDE) {
  if (!iso) return '';
  if (!isDE) return iso;
  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}

export function formatLifecycle(displayName, isDE) {
  const item = lifecycleFor(displayName);
  if (!item) return '';
  const date = formatRetirementDate(item.date, isDE);
  if (item.status === 'deprecated') {
    return isDE
      ? `Veraltet · Stilllegung ${date} → ${item.replacement}`
      : `Deprecated · retires ${date} → ${item.replacement}`;
  }
  return isDE
    ? `Stilllegung ${date} → ${item.replacement}`
    : `Retires ${date} → ${item.replacement}`;
}

function isDeprecatedName(name) {
  return lifecycleFor(name)?.status === 'deprecated';
}

export const planModelCounts = {};
for (const plan of pricingData) {
  if (!PLAN_NAMES.includes(plan.packageName)) continue;
  const ids = new Set();
  for (const config of plan.modelQuotaConfigs) {
    if (OFFLINE_MODELS.has(config.exactModelName)) continue;
    if (isDeprecatedName(config.displayModelName)) continue;
    ids.add(config.exactModelName);
  }
  planModelCounts[plan.packageName] = ids.size;
}

// Same slice AvailableModels uses: the last two packages (Agentic + Test).
const exposedPlans = [pricingData.at(-2), pricingData.at(-1)];
const featuredNames = new Set();
for (const plan of exposedPlans) {
  for (const config of plan.modelQuotaConfigs) {
    if (OFFLINE_MODELS.has(config.exactModelName)) continue;
    featuredNames.add(config.displayModelName);
  }
}

export const catalogModelCount = featuredNames.size;
export const deprecatedModelCount = [...featuredNames].filter(isDeprecatedName).length;
export const availableModelCount = catalogModelCount - deprecatedModelCount;
