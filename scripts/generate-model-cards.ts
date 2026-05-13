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

// ---------------- Loader ----------------

function loadModels(): CompiledModel[] {
  // Sync read avoids async plumbing in main().
  const fs = require('node:fs') as typeof import('node:fs');
  const json = JSON.parse(fs.readFileSync(PRICING_JSON_PATH, 'utf-8')) as PricingPackage[];

  // exactModelName -> compiled model; accumulates plans across packages.
  const byName = new Map<string, CompiledModel>();

  for (const pkg of json) {
    for (const entry of pkg.modelQuotaConfigs ?? []) {
      const existing = byName.get(entry.exactModelName);
      if (existing) {
        if (!existing.plans.includes(pkg.packageName)) {
          existing.plans.push(pkg.packageName);
        }
        continue;
      }
      const category = resolveCategory(entry.exactModelName);
      const sovereignty = resolveSovereignty(entry.deploymentRegion, entry.exactModelName);
      const hosting = resolveHosting(entry.deploymentRegion);
      byName.set(entry.exactModelName, {
        exactModelName: entry.exactModelName,
        displayModelName: entry.displayModelName,
        modelLabel: entry.modelLabel,
        contextWindow: entry.contextWindow,
        termsOfUseUrl: entry.termsOfUseUrl,
        deploymentRegion: entry.deploymentRegion,
        inputPricePerMillionTokens: entry.inputPricePerMillionTokens,
        outputPricePerMillionTokens: entry.outputPricePerMillionTokens,
        requestPerMinuteLimit: entry.requestPerMinuteLimit,
        inputTokenPerMinuteLimit: entry.inputTokenPerMinuteLimit,
        outputTokenPerMinuteLimit: entry.outputTokenPerMinuteLimit,
        category,
        plans: [pkg.packageName],
        sovereignty,
        ...hosting,
      });
    }
  }

  // Stable, plan-friendly order
  const planOrder: Record<Plan, number> = { Essential: 0, Professional: 1, Agentic: 2, Test: 3 };
  for (const m of byName.values()) {
    m.plans.sort((a, b) => planOrder[a] - planOrder[b]);
  }

  return [...byName.values()].sort((a, b) => a.exactModelName.localeCompare(b.exactModelName));
}

// ---------------- EN template ----------------

function formatPrice(n: number): string {
  return n.toFixed(2);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)},000,000`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)},000`;
  return String(n);
}

function endpointForCategory(category: Category): string {
  switch (category) {
    case 'embeddings':
      return '`POST /embeddings`';
    case 'audio':
      return '`POST /audio/transcriptions`, `POST /audio/translations`';
    case 'image-generation':
      return '`POST /images/generations`';
    case 'vision':
      return '`POST /chat/completions` (multimodal input)';
    case 'coding':
    case 'llms':
    default:
      return '`POST /chat/completions`';
  }
}

function dataHandlingEn(m: CompiledModel): string {
  if (m.sovereignty === 'High') {
    return 'Open-source on T-Cloud — data is processed inside the EU, is not stored, and is not viewable by Telekom or third parties.';
  }
  return 'Proprietary model forwarded to the upstream provider (Microsoft Azure or Google Cloud), who may use sub-processors. Selecting this model accepts the third-party provider\'s terms.';
}

function renderEnMdx(m: CompiledModel): string {
  return `---
title: "${m.displayModelName}"
description: "${m.displayModelName} hosted on AI Foundation Services. ${m.modelLabel}."
sidebar:
  label: "${m.displayModelName}"
modelId: "${m.exactModelName}"
---

{/* TODO: one-paragraph summary of what the model is and what it's good for. */}

## Central parameters

| Capability | Rating |
|---|---|
| Intelligence | TODO |
| Speed | TODO |
| Sovereignty | **${m.sovereignty}** |

| Field | Value |
|---|---|
| Model identifier | \`${m.exactModelName}\` |
| Context window | ${m.contextWindow} |
| Parameters | TODO |
| Quantization | TODO |
| Multilingual | TODO |

## Lifecycle & alternatives

- **Stage:** Stable
- **Added to AI Foundation Services:** TODO
- **Scheduled retirement:** None
- **Suggested alternative if retired:** N/A

## Origin

- **Provider:** TODO
- **Country of origin:** TODO
- **Base model release:** TODO
- **License:** [Terms of use](${m.termsOfUseUrl})

## T-Systems hosting & data handling

- **Hosting provider:** ${m.hostingProvider}
- **Server location:** ${m.serverLocation}
- **Data processing:** ${m.dataProcessing}
- **Data handling category:** ${dataHandlingEn(m)}
- **Customer data is never used for training.**

See [Enterprise Trust](/reference/enterprise-trust) for the full data-handling model.

## Modalities

- Input: TODO
- Output: TODO

## Endpoints

- ${endpointForCategory(m.category)}

## Features

- Streaming: TODO
- Tool / function calling: TODO
- Reasoning: TODO
- Structured outputs: TODO
- Asynchronous requests: TODO

## Pricing

- Input: €${formatPrice(m.inputPricePerMillionTokens)} / million tokens
- Output: €${formatPrice(m.outputPricePerMillionTokens)} / million tokens
- Available in plans: ${m.plans.join(', ')}

See [Plans & Pricing](/plans) for full context.

## Usage example

\`\`\`python
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="${m.exactModelName}",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
\`\`\`

## Rate limits

- Requests per minute: ${m.requestPerMinuteLimit}
- Input tokens per minute: ${formatTokens(m.inputTokenPerMinuteLimit)}
- Output tokens per minute: ${formatTokens(m.outputTokenPerMinuteLimit)}
- Limits are scoped per contract.

See [Rate Limits](/reference/rate-limits) for the full breakdown.

## Version history

- TODO
`;
}

// ---------------- Writer ----------------

interface WriteResult {
  created: string[];
  skipped: string[];
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function writeIfMissing(filePath: string, content: string, result: WriteResult): void {
  if (existsSync(filePath)) {
    result.skipped.push(filePath);
    return;
  }
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
  result.created.push(filePath);
}

// ---------------- Main ----------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const models = loadModels();
  process.stdout.write(`Loaded ${models.length} unique models from pricing JSON.\n`);

  if (dryRun) {
    process.stdout.write('\nDry-run — listing models:\n');
    for (const m of models) {
      process.stdout.write(
        `  [${m.category.padEnd(16)}] ${m.exactModelName.padEnd(40)} ` +
          `"${m.displayModelName}" — ${m.sovereignty} — plans: ${m.plans.join(', ')}\n`,
      );
    }
    process.stdout.write(`\nDry-run complete. ${models.length} model(s).\n`);
    return;
  }

  const enResult: WriteResult = { created: [], skipped: [] };
  for (const m of models) {
    const slug = kebabCase(m.exactModelName);
    const filePath = join(EN_MODELS_DIR, m.category, `${slug}.mdx`);
    writeIfMissing(filePath, renderEnMdx(m), enResult);
  }

  process.stdout.write(`\nEN: created ${enResult.created.length}, skipped ${enResult.skipped.length}\n`);
  for (const p of enResult.created) process.stdout.write(`  + ${p}\n`);
  for (const p of enResult.skipped) process.stdout.write(`  = ${p} (exists)\n`);

  process.stdout.write('\nDE templates not yet implemented — coming in next task.\n');
}

main().catch((err) => {
  process.stderr.write(`Generator error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
