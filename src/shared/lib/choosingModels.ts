import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cloudLabelFor } from './cloudLabelOverrides';
import { isHiddenModel } from './hiddenModels';

/** Shown on the choosing page. Bump when the draft picks are reviewed. */
export const LAST_REVIEWED = '2026-10-30';

/**
 * exact ids whose display names are on /models/deprecations for 2026-10-31
 * or 2026-11-30. They stay out of every recommendation.
 */
export const RETIRING_MODEL_IDS = new Set(
  [
    'gpt-5-nano',
    'gpt-5-mini',
    'gpt-5.4-mini',
    'gpt-5',
    'gpt-5-codex',
    'gpt-5.4',
    'gpt-5.5',
    'claude-haiku-4.5',
    'claude-sonnet-4.6',
    'claude-opus-4.6',
    'claude-opus-4.8',
    'gemini-3-pro',
    'gemini-3-pro-long-context',
    'gemini-3-flash',
  ].map((id) => id.toLowerCase()),
);

/** Models retiring on 2026-10-31 or 2026-11-30. They stay on the deprecations page only. */
export function isRetiringModel(exactModelName: string | undefined): boolean {
  return RETIRING_MODEL_IDS.has((exactModelName ?? '').toLowerCase());
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
  /** T-Cloud Germany, an Azure region, or a GCP region. */
  hosting: string;
  tcloud: boolean;
  preview: boolean;
}

const byId = new Map<string, ModelFact>();

for (const pkg of pricingData as Package[]) {
  for (const entry of pkg.modelQuotaConfigs ?? []) {
    const id = entry.exactModelName;
    if (isHiddenModel(id) || isRetiringModel(id)) continue;
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
  return text;
}

function hostingFor(id: string, region: string): string {
  const normalized = (region ?? '').toLowerCase();
  if (cloudLabelFor(id, '') === 'GCP / Azure') {
    if (normalized.startsWith('gcp-europe-west')) return 'GCP europe-west1 / Azure';
    return 'GCP / Azure';
  }
  if (normalized === 'otc-germany' || normalized.startsWith('otc')) return 'T-Cloud Germany';
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
    throw new Error(`choosingModels: ${id} is missing, hidden, or scheduled to retire`);
  }
  return fact;
}

export interface ChoiceRow {
  id: string;
  useCase: { en: string; de: string };
  recommended: string;
  alternative: string;
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
    recommended: 'gpt-oss-120b',
    alternative: 'Mistral-Small-4-119B-2603',
    also: 'GLM-5.3-Flash',
    notes: {
      en: 'GPT-OSS 120B and Mistral Small 4 run on T-Cloud. Mistral Small 4 also accepts images. GLM 5.3 Flash is a smaller chat model on the same cloud.',
      de: 'GPT-OSS 120B und Mistral Small 4 laufen auf T-Cloud. Mistral Small 4 akzeptiert zusätzlich Bilder. GLM 5.3 Flash ist ein kleineres Chat-Modell auf derselben Cloud.',
    },
    guide: '/guides/chat-completions',
  },
  {
    id: 'reasoning',
    useCase: { en: 'Reasoning and complex tasks', de: 'Reasoning und komplexe Aufgaben' },
    recommended: 'GLM-5.3',
    alternative: 'GLM-5.2',
    notes: {
      en: 'GLM 5.3 and GLM 5.2 run on T-Cloud with a 1M context window. reasoning_effort accepts none, high, and max.',
      de: 'GLM 5.3 und GLM 5.2 laufen auf T-Cloud mit einem Kontextfenster von 1M. reasoning_effort akzeptiert none, high und max.',
    },
    guide: '/guides/reasoning',
  },
  {
    id: 'coding',
    useCase: { en: 'Coding and agents', de: 'Coding und Agents' },
    recommended: 'GLM-5.3',
    alternative: 'GLM-5.3-Flash',
    also: 'Qwen3.8-27B-FP8',
    notes: {
      en: 'Z.ai positions GLM 5.3 for coding agents and long-horizon tasks. GLM 5.3 Flash and Qwen 3.8 27B also run on T-Cloud. Tool calls use the chat API.',
      de: 'Z.ai positioniert GLM 5.3 für Coding-Agents und lange Agentenaufgaben. GLM 5.3 Flash und Qwen 3.8 27B laufen ebenfalls auf T-Cloud. Tool Calls nutzen die Chat-API.',
    },
    guide: '/guides/function-calling',
  },
  {
    id: 'vision',
    useCase: { en: 'Vision and document understanding', de: 'Vision und Dokumentverständnis' },
    recommended: 'Qwen-3.6-35B-FP8',
    alternative: 'gemma-4-31B-it-FP8',
    also: 'Mistral-Small-4-119B-2603',
    notes: {
      en: 'All three accept text and image on T-Cloud. For scanned pages and handwriting, use the OCR models.',
      de: 'Alle drei akzeptieren Text und Bild auf T-Cloud. Für Scans und Handschrift die OCR-Modelle verwenden.',
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
      en: 'Speech to text on T-Cloud. Each model has a context window of 448.',
      de: 'Sprache zu Text auf T-Cloud. Das Kontextfenster ist jeweils 448.',
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
    recommended: 'gpt-image-2',
    alternative: 'gemini-3-pro-image',
    notes: {
      en: 'GPT Image 2 runs on Azure Sweden. Gemini 3 Pro Image runs on Google Cloud worldwide. No image-generation model runs on T-Cloud.',
      de: 'GPT Image 2 läuft auf Azure Schweden. Gemini 3 Pro Image läuft auf Google Cloud weltweit. Kein Bildgenerierungsmodell läuft auf T-Cloud.',
    },
    guide: '/guides/image-generation',
  },
];

for (const row of CHOICE_ROWS) {
  const recommended = modelFact(row.recommended);
  const alternative = modelFact(row.alternative);
  if (row.also) modelFact(row.also);
  if (!recommended.tcloud && row.id !== 'image') {
    throw new Error(`choosingModels: ${row.id} recommended model is not on T-Cloud`);
  }
  if (row.id === 'image' && (recommended.tcloud || alternative.tcloud)) {
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
