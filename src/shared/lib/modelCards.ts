import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cachedInputPrice } from './cachedTokenPricing';
import { DEEPSEEK_41_FLASH_ID, GLM_53_ID } from './launchModels';
import { resolvePrimaryCategory } from './modelCategories';

/**
 * The featured model cards on /models/ and the overview, in order: new
 * models, then the top pick per category (CHOICE_ROWS in choosingModels).
 * The order is explicit (Andrej, 2026-10-31): GLM 5.3 first, DeepSeek 4.1
 * Flash second; GPT-OSS 120B is never first. Nothing here is sorted.
 */
export const FEATURED_MODEL_IDS: readonly string[] = [
  GLM_53_ID,
  DEEPSEEK_41_FLASH_ID,
  'GLM-5.3-Flash',
  'gpt-oss-120b',
  'Qwen-3.6-35B-FP8',
  'LightOnOCR-3-4B-Preview',
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

/** Per-1M token prices from the pricing data; a paid plan's entry wins over the Test plan's. */
export function modelPrices(id: string): ModelPrices {
  let found: Quota | undefined;
  let paid = false;
  for (const pkg of pricingData as Package[]) {
    for (const q of pkg.modelQuotaConfigs ?? []) {
      if (q.exactModelName !== id) continue;
      if (pkg.packageName !== 'Test') {
        if (!paid) found = q;
        paid = true;
      } else if (!found) {
        found = q;
      }
    }
  }
  if (!found) throw new Error(`modelCards: ${id} is not in the pricing data`);
  const primary = resolvePrimaryCategory(id);
  return {
    cached: cachedInputPrice(found.inputPricePerMillionTokens, found.deploymentRegion, primary),
    input: found.inputPricePerMillionTokens,
    output: primary === 'embeddings' ? null : found.outputPricePerMillionTokens,
  };
}
