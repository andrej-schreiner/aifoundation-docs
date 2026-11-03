import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cloudLabelFor } from './cloudLabelOverrides';
import { isHiddenModel } from './hiddenModels';
import { isRetiredModel } from './retirements';
import { apiIdPublished } from './launchModels';

/** Shown on the choosing page. Bump when the draft picks are reviewed. */
export const LAST_REVIEWED = '2026-11-03';

const REVIEWED_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const REVIEWED_MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function reviewedLabel(isDE: boolean): string {
  const [year, month, day] = LAST_REVIEWED.split('-').map(Number);
  const name = (isDE ? REVIEWED_MONTHS_DE : REVIEWED_MONTHS_EN)[month - 1];
  return isDE ? `${day}. ${name} ${year}` : `${day} ${name} ${year}`;
}

interface Quota {
  exactModelName: string;
  displayModelName: string;
  deploymentRegion: string;
  contextWindow: string | null;
}

interface Package {
  packageName: string;
  modelQuotaConfigs: Quota[];
}

export interface ModelFact {
  id: string;
  name: string;
  /** Catalog context string, or a "not published" label when the field is empty. */
  context: string;
  /** T-Cloud Germany (EU), an Azure region, or a GCP region. */
  hosting: string;
  tcloud: boolean;
  preview: boolean;
}

const byId = new Map<string, ModelFact>();

for (const pkg of pricingData as Package[]) {
  for (const entry of pkg.modelQuotaConfigs ?? []) {
    const id = entry.exactModelName;
    if (isHiddenModel(id) || isRetiredModel(id)) continue;
    const existing = byId.get(id);
    if (existing) {
      if (pkg.packageName === 'Test' && existing.preview === false) {
        // A model on a paid plan and Test is not preview-only.
      }
      if (pkg.packageName !== 'Test') existing.preview = false;
      continue;
    }
    byId.set(id, {
      id,
      name: entry.displayModelName,
      context: publishedContext(entry.contextWindow),
      hosting: hostingFor(id, entry.deploymentRegion),
      tcloud: (entry.deploymentRegion ?? '').toLowerCase().startsWith('otc'),
      preview: pkg.packageName === 'Test',
    });
  }
}

function publishedContext(value: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text || text === 'None' || text === 'null') return '';
  const compact = text.replace(/,/g, '');
  if (compact === '102400') return '102.4K';
  if (/^1050k$/i.test(compact)) return '1.05M';
  return text;
}

function hostingFor(id: string, region: string): string {
  const normalized = (region ?? '').toLowerCase();
  if (cloudLabelFor(id, '') === 'GCP / Azure') {
    if (normalized.startsWith('gcp-europe-west')) return 'GCP europe-west1 / Azure';
    return 'GCP / Azure';
  }
  if (normalized === 'otc-germany' || normalized.startsWith('otc')) return 'T-Cloud Germany\u00a0(EU)';
  if (normalized === 'azure-sweden-central') return 'Azure Sweden Central';
  if (normalized === 'azure-france-central') return 'Azure France Central';
  if (normalized === 'azure-worldwide') return 'Azure (worldwide)';
  if (normalized === 'gcp-europe-west1') return 'GCP europe-west1';
  if (normalized === 'gcp-worldwide') return 'GCP (worldwide)';
  return region;
}

export function modelFact(id: string): ModelFact {
  const fact = byId.get(id);
  if (!fact) {
    throw new Error(`choosingModels: ${id} is missing, hidden, or retired`);
  }
  // A pick shows its id with a copy button, so it needs a published one.
  if (!apiIdPublished(id)) {
    throw new Error(`choosingModels: ${id} has no published model id`);
  }
  return fact;
}

export interface ChoiceRow {
  id: string;
  useCase: { en: string; de: string };
  recommended: string;
  /** Second model; absent when the catalog has only one model for the use case. */
  alternative?: string;
  /** Third model for the compact block on a category page. */
  also?: string;
  notes: { en: string; de: string };
  /** Guide path without a locale prefix. */
  guide: string;
  /** Chat snippet model id already used in the docs. Falls back to the recommended id. */
  snippetModel?: string;
}

export const CHOICE_ROWS: ChoiceRow[] = [
  {
    id: 'chat',
    useCase: { en: 'General chat and assistants', de: 'Allgemeiner Chat und Assistenten' },
    // GLM 5.3 leads (Andrej, 2026-10-31); GPT-OSS 120B is never first.
    recommended: 'GLM-5.3',
    alternative: 'gpt-oss-120b',
    also: 'Mistral-Small-4-119B-2603',
    notes: {
      en: 'GLM 5.3, GPT-OSS 120B and Mistral Small 4 run on T-Cloud. GLM 5.3 has a 1M context window. Mistral Small 4 also accepts images.',
      de: 'GLM 5.3, GPT-OSS 120B und Mistral Small 4 laufen auf T-Cloud. GLM 5.3 hat ein Kontextfenster von 1M. Mistral Small 4 akzeptiert zusätzlich Bilder.',
    },
    // Code samples keep the model they already use.
    snippetModel: 'gpt-oss-120b',
    guide: '/guides/chat-completions',
  },
  {
    id: 'reasoning',
    useCase: { en: 'Reasoning and complex tasks', de: 'Komplexe Aufgaben' },
    // GLM 5.3 replaces GLM 5.2, which retires on 2026-11-30 (Andrej, 2026-11-03).
    recommended: 'GLM-5.3',
    alternative: 'GLM-5.3-Flash',
    notes: {
      en: 'GLM 5.3 and GLM 5.3 Flash run on T-Cloud with a 1M context window. `reasoning_effort` accepts none, high, and max on GLM 5.3, and low, high, and max on GLM 5.3 Flash.',
      de: 'GLM 5.3 und GLM 5.3 Flash laufen auf T-Cloud mit einem Kontextfenster von 1M. `reasoning_effort` akzeptiert none, high und max bei GLM 5.3 und low, high und max bei GLM 5.3 Flash.',
    },
    guide: '/guides/reasoning',
  },
  {
    id: 'coding',
    useCase: { en: 'Coding and agents', de: 'Coding und Agenten' },
    recommended: 'GLM-5.3',
    alternative: 'GLM-5.3-Flash',
    also: 'Qwen3.8-27B-FP8',
    notes: {
      en: 'GLM 5.3 has the catalog\'s coding tag and a 1M context window.',
      de: 'GLM 5.3 hat das Coding-Tag im Katalog und ein Kontextfenster von 1M.',
    },
    guide: '/guides/function-calling',
  },
  {
    id: 'vision',
    useCase: { en: 'Image and document understanding', de: 'Bilder und Dokumente verstehen' },
    recommended: 'Qwen-3.6-35B-FP8',
    alternative: 'gemma-4-31B-it-FP8',
    also: 'Mistral-Small-4-119B-2603',
    notes: {
      en: 'Both accept text and image on T-Cloud. Mistral Small 4 does too.',
      de: 'Beide akzeptieren Text und Bild auf T-Cloud. Mistral Small 4 ebenfalls.',
    },
    guide: '/guides/multimodal',
  },
  {
    id: 'ocr',
    useCase: { en: 'OCR', de: 'OCR' },
    recommended: 'LightOnOCR-3-4B-Preview',
    alternative: 'PaddleOCR-VL-1.6-Preview',
    notes: {
      en: 'Both are preview models on T-Cloud. Context windows are 32K and 128K.',
      de: 'Beide sind Vorschau-Modelle auf T-Cloud. Die Kontextfenster sind 32K und 128K.',
    },
    guide: '/guides/ocr',
  },
  {
    id: 'embeddings',
    useCase: { en: 'Embeddings and RAG', de: 'Embeddings und RAG' },
    recommended: 'text-embedding-bge-m3',
    alternative: 'jina-embeddings-v2-base-de',
    also: 'qwen3-embedding-8b',
    notes: {
      en: 'BGE-M3, Jina Embeddings v2 Base DE, and Qwen3 Embedding 8B run on T-Cloud. Context windows are 8K, 8K, and 32K.',
      de: 'BGE-M3, Jina Embeddings v2 Base DE und Qwen3 Embedding 8B laufen auf T-Cloud. Die Kontextfenster sind 8K, 8K und 32K.',
    },
    guide: '/guides/embeddings',
  },
  {
    id: 'audio',
    useCase: { en: 'Audio', de: 'Audio' },
    recommended: 'whisper-large-v3',
    alternative: 'whisper-large-v3-turbo',
    notes: {
      en: 'Speech to text on T-Cloud. Each model has a context window of 448 tokens.',
      de: 'Sprache zu Text auf T-Cloud. Das Kontextfenster ist jeweils 448 Tokens.',
    },
    guide: '/guides/audio',
  },
  {
    id: 'decisions',
    useCase: { en: 'Routing and decisions', de: 'Routing und Decisions' },
    recommended: 'd3-preview',
    alternative: 'diffusiongemma-26B-A4B-it-Preview',
    notes: {
      en: 'Both are preview models on T-Cloud. DiffusionGemma accepts text and image and has a 256K context window.',
      de: 'Beide sind Vorschau-Modelle auf T-Cloud. DiffusionGemma akzeptiert Text und Bild und hat ein Kontextfenster von 256K.',
    },
    guide: '/guides/decisions',
  },
  {
    id: 'image',
    useCase: { en: 'Image generation', de: 'Bildgenerierung' },
    // Gemini 3 Pro Image left the catalog: SD v1.25 does not list it (hiddenModels.ts).
    recommended: 'gpt-image-2',
    notes: {
      en: 'GPT Image 2 runs on Azure Sweden. It is the only image-generation model in the catalog; none runs on T-Cloud.',
      de: 'GPT Image 2 läuft auf Azure Schweden. Es ist das einzige Modell für Bildgenerierung im Katalog; keines läuft auf T-Cloud.',
    },
    guide: '/guides/image-generation',
  },
];

for (const row of CHOICE_ROWS) {
  const recommended = modelFact(row.recommended);
  const alternative = row.alternative ? modelFact(row.alternative) : undefined;
  if (row.also) modelFact(row.also);
  if (!recommended.tcloud && row.id !== 'image') {
    throw new Error(`choosingModels: ${row.id} recommended model is not on T-Cloud`);
  }
  if (row.id === 'image' && (recommended.tcloud || alternative?.tcloud)) {
    throw new Error('choosingModels: an image model is marked T-Cloud');
  }
}

export function choiceById(id: string): ChoiceRow {
  const row = CHOICE_ROWS.find((item) => item.id === id);
  if (!row) throw new Error(`choosingModels: unknown use case ${id}`);
  return row;
}

export function picksFor(id: string): ModelFact[] {
  const row = choiceById(id);
  const ids = [row.recommended, row.alternative, row.also].filter((value): value is string => Boolean(value));
  return ids.map((modelId) => modelFact(modelId));
}
