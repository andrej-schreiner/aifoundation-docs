import pricingData from '../../components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json';
import { cloudLabelFor } from './cloudLabelOverrides';
import { isHiddenModel } from './hiddenModels';

/** Shown on the choosing page. Bump when the draft picks are reviewed. */
export const LAST_REVIEWED = '2026-10-30';

/**
 * exact ids whose display names are on /models/deprecations for 2026-10-31
 * or 2026-11-30. They stay out of every recommendation.
 */
const RETIRING = new Set(
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
    if (isHiddenModel(id) || RETIRING.has(id.toLowerCase())) continue;
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
      en: 'GPT-OSS 120B is the model id the quickstart already uses. Both run on T-Cloud. Mistral Small 4 also accepts image input.',
      de: 'GPT-OSS 120B ist die Modell-ID aus dem Quickstart. Beide laufen auf T-Cloud. Mistral Small 4 akzeptiert zusätzlich Bildeingabe.',
    },
    guide: '/guides/chat-completions',
  },
  {
    id: 'reasoning',
    useCase: { en: 'Reasoning and complex tasks', de: 'Reasoning und komplexe Aufgaben' },
    recommended: 'GLM-5.2',
    alternative: 'Qwen-3.6-35B-FP8',
    notes: {
      en: 'The datasheet lists reasoning_effort for GLM 5.2 as none, high, max, and for Qwen 3.6 35B as none, low, medium, high. Context is 1M and 256K.',
      de: 'Das Datenblatt listet reasoning_effort für GLM 5.2 als none, high, max und für Qwen 3.6 35B als none, low, medium, high. Kontext ist 1M und 256K.',
    },
    guide: '/guides/reasoning',
  },
  {
    id: 'coding',
    useCase: { en: 'Coding and agents', de: 'Coding und Agents' },
    recommended: 'GLM-5.3-Flash',
    alternative: 'Qwen3.8-27B-FP8',
    notes: {
      en: 'These are the coding-tagged models still in the catalog. Tool calling follows the chat API. No benchmark scores are published here.',
      de: 'Das sind die noch gelisteten Modelle mit Coding-Kategorie. Tool Calling läuft über die Chat-API. Benchmark-Werte stehen hier nicht.',
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
      en: 'Both are on the preview catalog and run on T-Cloud. Context windows in the catalog are 32K and 128K.',
      de: 'Beide stehen im Vorschau-Katalog und laufen auf T-Cloud. Die Kontextfenster im Katalog sind 32K und 128K.',
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
      en: 'BGE-M3, Jina Embeddings v2 Base DE, and Qwen3 Embedding 8B all run on T-Cloud. Catalog context is 8K, 8K, and 32K.',
      de: 'BGE-M3, Jina Embeddings v2 Base DE und Qwen3 Embedding 8B laufen auf T-Cloud. Katalog-Kontext ist 8K, 8K und 32K.',
    },
    guide: '/guides/embeddings',
  },
  {
    id: 'audio',
    useCase: { en: 'Audio', de: 'Audio' },
    recommended: 'whisper-large-v3',
    alternative: 'whisper-large-v3-turbo',
    notes: {
      en: 'Speech-to-text. Both run on T-Cloud. The catalog context window for each is 448.',
      de: 'Sprache zu Text. Beide laufen auf T-Cloud. Das Katalog-Kontextfenster ist jeweils 448.',
    },
    guide: '/guides/audio',
  },
  {
    id: 'decisions',
    useCase: { en: 'Routing and decisions', de: 'Routing und Decisions' },
    recommended: 'd3-preview',
    alternative: 'diffusiongemma-26B-A4B-it-Preview',
    notes: {
      en: 'Both are on the preview catalog and run on T-Cloud. d3 has no context window in the catalog. DiffusionGemma accepts text and image; its context window is 256K.',
      de: 'Beide stehen im Vorschau-Katalog und laufen auf T-Cloud. Für d3 ist kein Kontextfenster im Katalog hinterlegt. DiffusionGemma akzeptiert Text und Bild; das Kontextfenster ist 256K.',
    },
    guide: '/guides/decisions',
  },
  {
    id: 'image',
    useCase: { en: 'Image generation', de: 'Bildgenerierung' },
    recommended: 'gpt-image-2',
    alternative: 'gemini-3-pro-image',
    notes: {
      en: 'No image-generation model in the catalog runs on T-Cloud. GPT Image 2 is the id the image guide already uses.',
      de: 'Kein Bildgenerierungsmodell im Katalog läuft auf T-Cloud. GPT Image 2 ist die ID aus der Bildgenerierungs-Anleitung.',
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

export interface MigrationRow {
  from: { en: string; de: string };
  replacement: string;
  note: { en: string; de: string };
}

/** Replacements named on the deprecations page. Not a compatibility claim. */
export const MIGRATION_ROWS: MigrationRow[] = [
  {
    from: {
      en: 'GPT-5, GPT-5 mini, GPT-5 nano, GPT-5 Codex, GPT 5.4, GPT 5.4 mini, GPT 5.5',
      de: 'GPT-5, GPT-5 mini, GPT-5 nano, GPT-5 Codex, GPT 5.4, GPT 5.4 mini, GPT 5.5',
    },
    replacement: 'gpt-6.1-sol',
    note: {
      en: 'The deprecations page also names GPT-6 Luna for the mini models. Retirement date 2026-10-31.',
      de: 'Die Abkündigungsseite nennt für die Mini-Modelle auch GPT-6 Luna. Stilllegung am 31.10.2026.',
    },
  },
  {
    from: {
      en: 'Claude 4.5 Haiku, Claude 4.6 Sonnet',
      de: 'Claude 4.5 Haiku, Claude 4.6 Sonnet',
    },
    replacement: 'claude-sonnet-5.5',
    note: {
      en: 'Retirement date 2026-10-31. Context window for Sonnet 5.5 is not in the catalog.',
      de: 'Stilllegung am 31.10.2026. Das Kontextfenster für Sonnet 5.5 steht nicht im Katalog.',
    },
  },
  {
    from: {
      en: 'Claude 4.6 Opus, Claude Opus 4.8',
      de: 'Claude 4.6 Opus, Claude Opus 4.8',
    },
    replacement: 'claude-opus-5.5',
    note: {
      en: 'Retirement date 2026-10-31. Context window for Opus 5.5 is not in the catalog.',
      de: 'Stilllegung am 31.10.2026. Das Kontextfenster für Opus 5.5 steht nicht im Katalog.',
    },
  },
  {
    from: {
      en: 'Gemini 3 Pro (≤200k and >200k)',
      de: 'Gemini 3 Pro (≤200k und >200k)',
    },
    replacement: 'gemini-3.1-pro',
    note: {
      en: 'The deprecations page maps each context band to the matching Gemini 3.1 Pro entry. Retirement date 2026-10-31.',
      de: 'Die Abkündigungsseite ordnet jede Kontextstufe dem passenden Gemini 3.1 Pro zu. Stilllegung am 31.10.2026.',
    },
  },
  {
    from: {
      en: 'Gemini 3 Flash',
      de: 'Gemini 3 Flash',
    },
    replacement: 'gemini-3.8-flash',
    note: {
      en: 'Retirement date 2026-11-30. Context window for Gemini 3.8 Flash is not in the catalog.',
      de: 'Stilllegung am 30.11.2026. Das Kontextfenster für Gemini 3.8 Flash steht nicht im Katalog.',
    },
  },
];

for (const row of MIGRATION_ROWS) modelFact(row.replacement);

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
