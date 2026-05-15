// Short, factual explanations of who each model creator is. Used as tooltip
// content when hovering the brand logo on the plans and comparison pages.
//
// Keys must match the `creator` strings used by modelBrandIcons (so the same
// dictionary works for any component that already has a creator string).

export type CreatorKey =
  | 'OpenAI'
  | 'Anthropic'
  | 'Google'
  | 'Google Gemini'
  | 'Google Gemma'
  | 'Meta'
  | 'Mistral'
  | 'Alibaba Cloud'
  | 'BAAI'
  | 'Jina AI'
  | 'T-Systems'
  | 'Other';

export function getProviderTooltips(isDE: boolean): Record<CreatorKey, string> {
  if (isDE) {
    return {
      OpenAI: 'OpenAI — US-amerikanisches KI-Labor; Hersteller der GPT-Reihe, der o-Serie (Reasoning) und von Whisper.',
      Anthropic: 'Anthropic — US-amerikanisches KI-Labor; Hersteller der Claude-Modellfamilie.',
      Google: 'Google — Hersteller der Gemini-Modellfamilie (geschlossene Gewichte, gehostet auf Vertex AI).',
      'Google Gemini': 'Google — Hersteller der Gemini-Modellfamilie (geschlossene Gewichte, gehostet auf Vertex AI).',
      'Google Gemma': 'Google — Open-Weight-Modellfamilie Gemma (eigenständig vom kommerziellen Gemini).',
      Meta: 'Meta — Hersteller der Llama-Modellfamilie (Open-Weight).',
      Mistral: 'Mistral AI — französisches KI-Labor; Hersteller der Mistral- und Mixtral-Modelle.',
      'Alibaba Cloud': 'Alibaba — chinesisches KI-Labor (DAMO Academy); Hersteller der Qwen-Modellfamilie (Open-Weight).',
      BAAI: 'Beijing Academy of Artificial Intelligence — gemeinnütziges chinesisches Forschungsinstitut; Hersteller der BGE-Embedding-Modellfamilie (Open-Weight).',
      'Jina AI': 'Jina AI — deutsches KI-Unternehmen; Hersteller mehrsprachiger Embedding-Modelle, u. a. der jina-embeddings-Familie.',
      'T-Systems': 'T-Systems — Hersteller intern entwickelter Modelle, gehostet auf der eigenen souveränen Infrastruktur.',
      Other: 'Unabhängiger Hersteller / Open-Source-Community-Modell. Details siehe Modell-Dokumentation.',
    };
  }
  return {
    OpenAI: 'OpenAI — US AI lab; maker of the GPT family, the o-series reasoning models, and Whisper.',
    Anthropic: 'Anthropic — US AI lab; maker of the Claude model family.',
    Google: 'Google — maker of the Gemini model family (closed weights, served via Vertex AI).',
    'Google Gemini': 'Google — maker of the Gemini model family (closed weights, served via Vertex AI).',
    'Google Gemma': 'Google — open-weight Gemma model family (separate from the commercial Gemini line).',
    Meta: 'Meta — maker of the Llama family (open weights).',
    Mistral: 'Mistral AI — French AI lab; maker of the Mistral and Mixtral model families.',
    'Alibaba Cloud': 'Alibaba — Chinese AI lab (DAMO Academy); maker of the Qwen model family (open weights).',
    BAAI: 'Beijing Academy of Artificial Intelligence — non-profit Chinese research institute; maker of the BGE family of open-weight embedding models.',
    'Jina AI': 'Jina AI — Berlin-based AI company; maker of multilingual embedding models including the jina-embeddings family.',
    'T-Systems': "T-Systems — maker of in-house models, hosted on Telekom's sovereign infrastructure.",
    Other: 'Independent maker / open-source community model. See the model docs for details.',
  };
}

// Convenience for callers that just need the lookup function.
export function getProviderTooltip(creator: string, isDE: boolean): string {
  const map = getProviderTooltips(isDE);
  return map[creator as CreatorKey] ?? map.Other;
}
