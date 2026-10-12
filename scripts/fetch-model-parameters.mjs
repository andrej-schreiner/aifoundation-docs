#!/usr/bin/env node
// Refreshes src/data/reasoning-effort.json from the platform's public model
// datasheet. Runs before every site build (hourly, see .github/workflows/static.yml)
// and locally with `bun run datasheet` or `node scripts/fetch-model-parameters.mjs`.
//
// portal-api serves the datasheet in the shape of Bifrost's model-parameters
// sheet. Each entry is a model's manifest from gitops.serving
// (feature-flags/model-manifests.yaml) plus its request parameters; a
// `reasoning_effort` item in `model_parameters` carries the values the model
// accepts and its default. Only that item is kept here, keyed by the model
// name used in requests (the datasheet key without its provider prefix), so the
// file changes only when a model's reasoning_effort values change.
//
// The file is merged, not replaced: a model the datasheet has values for is
// overwritten with them; every other entry (researched by hand from model
// cards and vendor docs, marked by a `source` field) is kept as it is. Once the
// gitops manifests carry reasoning_effort for a model, the datasheet wins.
//
// Any failure (network, HTTP status, malformed body) leaves the file as it is
// and exits 0: the site then keeps showing the values of the last successful
// run. The workflow commits the refreshed file back after a successful deploy.
//
// Dev serves the only datasheet so far. Once portal-api runs in prod, change
// the URL and nothing else.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// DATASHEET_URL overrides the source, e.g. to test the failure path locally.
const MODEL_PARAMETERS_URL =
  process.env.DATASHEET_URL || 'https://portal-api.dev.ai.t-systems.net/v1/datasheet/model-parameters';
const FETCH_TIMEOUT_MS = 30_000;

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(here, '../src/data/reasoning-effort.json');

function warn(message) {
  console.warn(`[datasheet] ${message}; keeping ${OUTPUT} unchanged`);
}

/** The model's name as used in requests: the datasheet key without its provider prefix. */
function modelNameOf(datasheetId) {
  const slash = datasheetId.indexOf('/');
  return slash === -1 ? datasheetId : datasheetId.slice(slash + 1);
}

/** Reduces the sheet to { modelName: { values, default } } for models with a reasoning_effort parameter. */
export function extractReasoningEffort(sheet) {
  const out = {};
  // The sheet may list a model under several providers (our manifest and a
  // Bifrost upstream row). Our own `t-systems/*` entries win.
  const ids = Object.keys(sheet).sort((a, b) => Number(b.startsWith('t-systems')) - Number(a.startsWith('t-systems')));
  for (const id of ids) {
    const model = sheet[id];
    const params = Array.isArray(model?.model_parameters) ? model.model_parameters : [];
    const effort = params.find((p) => p && p.id === 'reasoning_effort');
    if (!effort) continue;
    const values = Array.isArray(effort.options)
      ? effort.options.map((o) => (o && typeof o === 'object' ? o.value : o)).filter((v) => typeof v === 'string')
      : [];
    if (values.length === 0) continue;
    const name = modelNameOf(id);
    if (name in out) continue;
    out[name] = {
      values,
      ...(effort.default != null ? { default: String(effort.default) } : {}),
    };
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  let response;
  try {
    response = await fetch(MODEL_PARAMETERS_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    return warn(`datasheet unreachable at ${MODEL_PARAMETERS_URL}: ${error}`);
  }
  if (!response.ok) return warn(`datasheet returned HTTP ${response.status}`);

  let sheet;
  try {
    sheet = await response.json();
  } catch (error) {
    return warn(`datasheet is not valid JSON: ${error}`);
  }
  if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet) || Object.keys(sheet).length === 0) {
    return warn('datasheet is not a non-empty object');
  }

  const fromDatasheet = extractReasoningEffort(sheet);
  if (Object.keys(fromDatasheet).length === 0) return warn('datasheet lists no model with a reasoning_effort parameter');

  const previous = await readFile(OUTPUT, 'utf8').catch(() => '');
  let previousModels = {};
  if (previous) {
    try {
      previousModels = JSON.parse(previous).models ?? {};
    } catch (error) {
      return warn(`existing ${OUTPUT} is not valid JSON: ${error}`);
    }
  }

  const models = mergeModels(previousModels, fromDatasheet);
  const next = JSON.stringify({ source: MODEL_PARAMETERS_URL, models }, null, 2) + '\n';
  if (next === previous) {
    console.log(`[datasheet] ${Object.keys(fromDatasheet).length} models in datasheet, file unchanged`);
    return;
  }
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, next);
  console.log(`[datasheet] ${Object.keys(fromDatasheet).length} models in datasheet, updated ${OUTPUT}`);
}

/**
 * Datasheet entries replace the matching hand-researched ones (matched on the
 * model name, case-insensitively); all other entries are kept. The datasheet's
 * entry carries no `source`, which marks it as datasheet-backed.
 */
export function mergeModels(previousModels, fromDatasheet) {
  const merged = { ...previousModels };
  const byLower = new Map(Object.keys(merged).map((name) => [name.toLowerCase(), name]));
  for (const [name, entry] of Object.entries(fromDatasheet)) {
    const existingName = byLower.get(name.toLowerCase());
    if (existingName && existingName !== name) delete merged[existingName];
    merged[name] = entry;
  }
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
