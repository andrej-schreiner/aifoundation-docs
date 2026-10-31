import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cachedInputPrice } from './cachedTokenPricing';
import { modelFact } from './choosingModels';
import { DEEPSEEK_41_FLASH_ID, GLM_53_ID, isNewModel } from './launchModels';
import { creatorNameFor, getLogo } from './logos';
import { resolvePrimaryCategory } from './modelCategories';

/** Category label on a model card. Shown in capitals. */
export type CardCategory = 'chat' | 'coding' | 'vision' | 'ocr' | 'embeddings' | 'audio' | 'routing' | 'image';

const CATEGORY_LABEL: Record<CardCategory, { en: string; de: string }> = {
  chat: { en: 'Chat', de: 'Chat' },
  coding: { en: 'Coding', de: 'Coding' },
  vision: { en: 'Vision', de: 'Vision' },
  ocr: { en: 'OCR', de: 'OCR' },
  embeddings: { en: 'Embeddings', de: 'Embeddings' },
  audio: { en: 'Audio', de: 'Audio' },
  routing: { en: 'Routing', de: 'Routing' },
  image: { en: 'Image', de: 'Bild' },
};

/** Where a card links: the category page, or the guide for categories without one. */
const CATEGORY_HREF: Record<CardCategory, string> = {
  chat: '/models/llms/',
  coding: '/models/coding/',
  vision: '/guides/multimodal/',
  ocr: '/guides/ocr/',
  embeddings: '/models/embeddings/',
  audio: '/models/audio/',
  routing: '/guides/decisions/',
  image: '/models/image-generation/',
};

/**
 * The overview's model cards, in order: new models, then the top pick per
 * category (CHOICE_ROWS in choosingModels), then frontier partner models.
 * Ids only; every price, host and badge comes from the pricing data.
 * The order is explicit (Andrej, 2026-10-31): GLM 5.3 first, DeepSeek 4.1
 * Flash second; GPT-OSS 120B is never first. Nothing here is sorted.
 */
export const OVERVIEW_CARDS: { id: string; category: CardCategory }[] = [
  { id: GLM_53_ID, category: 'chat' },
  { id: DEEPSEEK_41_FLASH_ID, category: 'chat' },
  { id: 'GLM-5.3-Flash', category: 'coding' },
  { id: 'gpt-oss-120b', category: 'chat' },
  { id: 'Qwen-3.6-35B-FP8', category: 'vision' },
  { id: 'LightOnOCR-3-4B-Preview', category: 'ocr' },
  { id: 'text-embedding-bge-m3', category: 'embeddings' },
  { id: 'whisper-large-v3', category: 'audio' },
  { id: 'd3-preview', category: 'routing' },
  { id: 'gpt-image-2', category: 'image' },
  { id: 'claude-opus-5.5', category: 'chat' },
  { id: 'gpt-6.1-sol', category: 'chat' },
];

interface Quota {
  exactModelName: string;
  displayModelName: string;
  deploymentRegion: string;
  modelTier?: string;
  inputPricePerMillionTokens: number | null;
  outputPricePerMillionTokens: number | null;
}

interface Package {
  packageName: string;
  modelQuotaConfigs: Quota[];
}

export interface ModelCard {
  id: string;
  name: string;
  creator: string;
  logo: string;
  category: CardCategory;
  categoryLabel: string;
  href: string;
  isNew: boolean;
  preview: boolean;
  premium: boolean;
  tcloud: boolean;
  hosting: string;
  /** Null when the data has no such price (cached: not T-Cloud or not a language model; output: embeddings). */
  cached: number | null;
  input: number | null;
  output: number | null;
}

function quotaFor(id: string): { quota: Quota; preview: boolean } {
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
  return { quota: found, preview: !paid };
}

export function modelCard(id: string, category: CardCategory, isDE: boolean): ModelCard {
  const { quota, preview } = quotaFor(id);
  const fact = modelFact(id);
  const creator = creatorNameFor(id, quota.displayModelName);
  const primary = resolvePrimaryCategory(id);
  return {
    id,
    name: quota.displayModelName,
    creator,
    logo: getLogo(creator) || getLogo('Other'),
    category,
    categoryLabel: CATEGORY_LABEL[category][isDE ? 'de' : 'en'],
    href: `${isDE ? '/de' : ''}${preview ? '/models/preview/' : CATEGORY_HREF[category]}`,
    isNew: isNewModel(id),
    preview,
    premium: (quota.modelTier ?? '').toLowerCase() === 'premium',
    tcloud: fact.tcloud,
    hosting: fact.hosting,
    cached: preview ? null : cachedInputPrice(quota.inputPricePerMillionTokens, quota.deploymentRegion, primary),
    input: quota.inputPricePerMillionTokens,
    output: primary === 'embeddings' ? null : quota.outputPricePerMillionTokens,
  };
}

/** German place names, as on ModelHighlights. */
export function localPlace(hosting: string, isDE: boolean): string {
  if (!isDE) return hosting;
  return hosting
    .replaceAll('T-Cloud Germany', 'T-Cloud Deutschland')
    .replaceAll('Azure Sweden Central', 'Azure Schweden Mitte')
    .replaceAll('Azure France Central', 'Azure Frankreich Mitte')
    .replaceAll('Azure (worldwide)', 'Azure (Weltweit)')
    .replaceAll('GCP (worldwide)', 'GCP (Weltweit)');
}

/** The featured cards on /models/: the first six overview cards, same order. */
export const FEATURED_MODEL_IDS: readonly string[] = OVERVIEW_CARDS.slice(0, 6).map((c) => c.id);
