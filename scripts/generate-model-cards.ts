#!/usr/bin/env bun
/**
 * Generate model card MDX stubs (EN + DE) from the pricing JSON.
 *
 * Source of truth:
 *   src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json
 *
 * Update PRICING_JSON_PATH when the pricing JSON version bumps.
 *
 * Usage:
 *   bun run scripts/generate-model-cards.ts            # write files (skip existing)
 *   bun run scripts/generate-model-cards.ts --dry-run  # print summary, no writes
 *
 * Re-running is safe: existing MDX files are NOT overwritten.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------- Configuration ----------------

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRICING_JSON_PATH = join(
  REPO_ROOT,
  'src/components/PlansPageFeatures/PlansData/PlansModelData/v1.20.2/all-pricing--2026-04-24.json',
);
const EN_MODELS_DIR = join(REPO_ROOT, 'src/content/docs/models');
const DE_MODELS_DIR = join(REPO_ROOT, 'src/content/docs/de/models');

// ---------------- Types ----------------

type Category = 'llms' | 'coding' | 'vision' | 'embeddings' | 'audio' | 'image-generation';

type Plan = 'Essential' | 'Professional' | 'Agentic' | 'Test';

type Sovereignty = 'High' | 'Medium' | 'Low';

interface PricingEntry {
  exactModelName: string;
  displayModelName: string;
  modelLabel: string;
  contextWindow: string;
  termsOfUseUrl: string;
  dataProtectionUrl: string;
  deploymentRegion: string;
  modelTier: string;
  inputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
  requestPerMinuteLimit: number;
  inputTokenPerMinuteLimit: number;
  outputTokenPerMinuteLimit: number;
}

interface PricingPackage {
  packageName: Plan;
  modelQuotaConfigs: PricingEntry[];
}

interface CompiledModel {
  exactModelName: string;
  displayModelName: string;
  modelLabel: string;
  contextWindow: string;
  termsOfUseUrl: string;
  deploymentRegion: string;
  inputPricePerMillionTokens: number;
  outputPricePerMillionTokens: number;
  requestPerMinuteLimit: number;
  inputTokenPerMinuteLimit: number;
  outputTokenPerMinuteLimit: number;
  category: Category;
  plans: Plan[];
  sovereignty: Sovereignty;
  hostingProvider: string;
  serverLocation: string;
  dataProcessing: string;
}

// ---------------- Maps ----------------

/**
 * Category mapping by exactModelName.
 * Default for unknown models: 'llms' (with a stderr warning).
 */
const CATEGORY_MAP: Record<string, Category> = {
  // LLMs
  'Llama-3.3-70B-Instruct': 'llms',
  'Mistral-Small-3': 'llms',
  'Qwen3-Next-80B-A3B-Instruct': 'llms',
  'claude-3-7-sonnet': 'llms',
  'claude-haiku-4.5': 'llms',
  'claude-opus-4.5': 'llms',
  'claude-opus-4.6': 'llms',
  'claude-sonnet-4': 'llms',
  'claude-sonnet-4.5': 'llms',
  'claude-sonnet-4.5-long-context': 'llms',
  'claude-sonnet-4.6': 'llms',
  'gemini-2.5-flash': 'llms',
  'gemini-2.5-pro': 'llms',
  'gemini-2.5-pro-long-context': 'llms',
  'gemini-3-flash': 'llms',
  'gemini-3-pro': 'llms',
  'gemini-3-pro-long-context': 'llms',
  'gemma-4-31B': 'llms',
  'gpt-4.1-2025-04-14': 'llms',
  'gpt-4.1-mini-2025-04-14': 'llms',
  'gpt-4.1-nano-2025-04-14': 'llms',
  'gpt-4o-2024-11-20': 'llms',
  'gpt-4o-mini-2024-07-18': 'llms',
  'gpt-5': 'llms',
  'gpt-5-mini': 'llms',
  'gpt-5-nano': 'llms',
  'gpt-5.2': 'llms',
  'gpt-oss-120b': 'llms',
  'mistral-medium-3': 'llms',
  'o1-2024-12-17': 'llms',
  'o1-mini-2024-09-12': 'llms',
  'o3-2025-04-16': 'llms',
  'o3-mini-2025-01-31': 'llms',
  'o4-mini-2025-04-16': 'llms',
  // Coding
  'Qwen3-Coder-30B-A3B-Instruct': 'coding',
  'gpt-5-codex': 'coding',
  // Vision (multimodal image-as-input)
  'Qwen3-VL-30B-A3B-Instruct-FP8': 'vision',
  'gemini-2.5-flash-image': 'vision',
  // Embeddings
  'jina-embeddings-v2-base-de': 'embeddings',
  'text-embedding-ada-002': 'embeddings',
  'text-embedding-bge-m3': 'embeddings',
  // Audio
  'whisper-large-v3': 'audio',
  'whisper-large-v3-turbo': 'audio',
  // Image generation
  'gpt-image-1-image-input': 'image-generation',
  'gpt-image-1-text-input': 'image-generation',
};

/**
 * Override the deterministic sovereignty rule for individual models.
 * The default rule (region -> sovereignty) is in resolveSovereignty().
 */
const SOVEREIGNTY_OVERRIDES: Record<string, Sovereignty> = {};

// ---------------- Helpers ----------------

function kebabCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[._]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveCategory(exactModelName: string): Category {
  const mapped = CATEGORY_MAP[exactModelName];
  if (mapped) return mapped;
  process.stderr.write(`[warn] No CATEGORY_MAP entry for ${exactModelName} — defaulting to 'llms'\n`);
  return 'llms';
}

function resolveSovereignty(deploymentRegion: string, exactModelName: string): Sovereignty {
  const override = SOVEREIGNTY_OVERRIDES[exactModelName];
  if (override) return override;
  const region = deploymentRegion.toLowerCase();
  if (region === 'otc-germany') return 'High';
  if (region.startsWith('azure-sweden') || region.startsWith('azure-eu')) return 'Medium';
  return 'Low';
}

function resolveHosting(deploymentRegion: string): {
  hostingProvider: string;
  serverLocation: string;
  dataProcessing: string;
} {
  const region = deploymentRegion.toLowerCase();
  if (region === 'otc-germany') {
    return { hostingProvider: 'T-Cloud', serverLocation: 'Germany', dataProcessing: 'EU/EEA' };
  }
  if (region.startsWith('azure-sweden')) {
    return { hostingProvider: 'Azure', serverLocation: 'Sweden', dataProcessing: 'EU' };
  }
  if (region.startsWith('azure')) {
    return { hostingProvider: 'Azure', serverLocation: 'EU region', dataProcessing: 'EU' };
  }
  if (region.startsWith('google')) {
    return { hostingProvider: 'Google Cloud', serverLocation: 'EU region', dataProcessing: 'EU' };
  }
  return { hostingProvider: 'Upstream provider', serverLocation: 'Unknown', dataProcessing: 'Unknown' };
}

// ---------------- Main (skeleton) ----------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  process.stdout.write(`Generator scaffold loaded. Dry-run: ${dryRun}. (Implementation pending in next tasks.)\n`);
  process.stdout.write(`Pricing JSON path: ${PRICING_JSON_PATH}\n`);
  process.stdout.write(`EN output dir: ${EN_MODELS_DIR}\n`);
  process.stdout.write(`DE output dir: ${DE_MODELS_DIR}\n`);
  process.stdout.write(`CATEGORY_MAP has ${Object.keys(CATEGORY_MAP).length} entries.\n`);
}

main().catch((err) => {
  process.stderr.write(`Generator error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
