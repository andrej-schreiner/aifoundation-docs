// Which API endpoints a model serves, where that differs from the catalog's
// default (chat completions, embeddings, audio or images by category).
// Sparse on purpose: only the models whose endpoints the docs state. Source:
// the Decisions guide and the Preview models page (both 2026-10).
//
// /models/decisions lists every model that serves /decisions
// (ModelsComparison capabilityFilter="serves-decisions").
export type ModelEndpoint = 'chat' | 'decisions';

const MODEL_ENDPOINTS: Record<string, ModelEndpoint[]> = {
  // d3 is a decision model: /decisions only; /chat/completions rejects it.
  'd3-preview': ['decisions'],
  // DiffusionGemma serves both endpoints with one model id.
  'diffusiongemma-26B-A4B-it-Preview': ['chat', 'decisions'],
};

/** The endpoints the docs state for a model; empty when only the category default applies. */
export function endpointsFor(exactModelName: string): ModelEndpoint[] {
  return MODEL_ENDPOINTS[exactModelName] ?? [];
}

/** True when the model serves POST /decisions. */
export function servesDecisions(exactModelName: string): boolean {
  return endpointsFor(exactModelName).includes('decisions');
}
