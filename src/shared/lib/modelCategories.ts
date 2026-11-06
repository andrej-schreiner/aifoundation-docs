export type ModelCategory = 'llms' | 'coding' | 'embeddings' | 'reranking' | 'audio' | 'image-generation';

// PRIMARY_CATEGORY = each model's *home* category. Sparse on purpose: only
// models whose primary purpose is NOT general-purpose LLM appear here.
// Everything else defaults to 'llms'.
//
// Additional category membership is *derived* from modalities — see
// deriveCategories() in ModelsComparison.astro. So Qwen 3.6 35B (Text+Image in)
// is primary 'llms' and gains 'vision' via derivation, surfacing on both
// /models/llms and /models/vision. Gemini-class multimodal LLMs gain 'vision'
// AND 'audio' the same way.
//
// Why some models need explicit non-llms primaries:
//   - 'coding': no modality signals coding-specialisation; must be tagged.
//   - 'audio': Whisper accepts Audio AND outputs Text — without an explicit
//     primary it would be added to /models/llms (text-out default). Same
//     logic for embeddings (text-in) and image-generation (image-out).
const PRIMARY_CATEGORY: Record<string, ModelCategory> = {
  // Coding-specialised (per OpenAI/Alibaba positioning).
  'Qwen3-Coder-30B-A3B-Instruct': 'coding',
  'gpt-5-codex': 'coding',
  // Audio: speech-to-text. Primary 'audio' so they don't pollute /models/llms.
  'whisper-large-v3': 'audio',
  'whisper-large-v3-turbo': 'audio',
  // Embeddings: Text → Vector. Primary 'embeddings' keeps them off /models/llms.
  'jina-embeddings-v2-base-de': 'embeddings',
  'qwen3-embedding-8b': 'embeddings',
  'Nemotron-3.5-Embed-8B': 'embeddings',
  // OCR (document parsing): Image -> Text, served on chat completions.
  'LightOnOCR-3-4B': 'llms',
  'PaddleOCR-VL-1.6': 'llms',
  'text-embedding-ada-002': 'embeddings',
  'text-embedding-bge-m3': 'embeddings',
  // Reranker: SD v1.25 model type "Reranker". Not an LLM, so not on /models/llms.
  'Qwen3-Reranker-4B': 'reranking',
  // Image generation: outputs Image. Primary 'image-generation' keeps them off
  // /models/llms.
  'gemini-3-pro-image': 'image-generation',
  'gpt-image-2': 'image-generation',
};

export function resolvePrimaryCategory(exactModelName: string): ModelCategory {
  return PRIMARY_CATEGORY[exactModelName] ?? 'llms';
}
