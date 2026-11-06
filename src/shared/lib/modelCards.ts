import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cachedInputPrice } from './cachedTokenPricing';
import { DEEPSEEK_41_FLASH_ID, GLM_53_ID } from './launchModels';
import { resolvePrimaryCategory } from './modelCategories';

/**
 * The featured model cards on /models/ and the overview, in order: new
 * models, then the top pick per category (CHOICE_ROWS in choosingModels).
 * The order is explicit (Andrej, 2026-10-31): GLM 5.3 first, DeepSeek V4.1
 * Flash second; GPT-OSS 120B is never first. Nothing here is sorted.
 */
export const FEATURED_MODEL_IDS: readonly string[] = [
  GLM_53_ID,
  DEEPSEEK_41_FLASH_ID,
  'GLM-5.3-Flash',
  'gpt-oss-120b',
  'Qwen-3.6-35B-FP8',
  'LightOnOCR-3-4B',
];

interface Quota {
  exactModelName: string;
  deploymentRegion: string;
  inputPricePerMillionTokens: number | null;
  outputPricePerMillionTokens: number | null;
}

interface Package {
  packageName: string;
  modelQuotaConfigs: Quota[];
}

export interface ModelPrices {
  /** Null when the data has no such price (cached: not T-Cloud or not a language model; output: embeddings). */
  cached: number | null;
  input: number | null;
  output: number | null;
}

/** The model's entry in a paid plan (anything but Test), if it has one. */
function paidQuota(id: string): Quota | undefined {
  for (const pkg of pricingData as Package[]) {
    if (pkg.packageName === 'Test') continue;
    const q = (pkg.modelQuotaConfigs ?? []).find((c) => c.exactModelName === id);
    if (q) return q;
  }
  return undefined;
}

/** Free in preview: the model has no paid-plan pricing entry (only the Test plan lists it). */
export function isPreviewOnly(id: string): boolean {
  return paidQuota(id) === undefined;
}

/** Per-1M token prices from the model's first paid-plan entry; preview-only models have none (see isPreviewOnly). */
export function modelPrices(id: string): ModelPrices {
  const found = paidQuota(id);
  if (!found) throw new Error(`modelCards: ${id} has no paid-plan entry in the pricing data`);
  const primary = resolvePrimaryCategory(id);
  return {
    cached: cachedInputPrice(found.inputPricePerMillionTokens, found.deploymentRegion, primary),
    input: found.inputPricePerMillionTokens,
    output: primary === 'embeddings' ? null : found.outputPricePerMillionTokens,
  };
}
