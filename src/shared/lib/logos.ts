// Model creator logos, keyed by the creator names that PlansPage
// (parseModelCreator) and ModelsComparison (inferCreator) produce.
// The PNGs are 320×320px and drawn for a white background (Logo.astro puts
// one behind them, as NVIDIA's and Z.ai's are transparent).
import AnthropicLogo from '../../assets/logos/anthropic.png?url';
import BaaiLogo from '../../assets/logos/baai.png?url';
import DeepSeekLogo from '../../assets/logos/deepseek.png?url';
import GoogleLogo from '../../assets/logos/google.png?url';
import JinaAiLogo from '../../assets/logos/jina-ai.png?url';
import MetaLogo from '../../assets/logos/meta.png?url';
import MistralLogo from '../../assets/logos/mistral.png?url';
import OpenAiLogo from '../../assets/logos/openai.png?url';
import QwenLogo from '../../assets/logos/qwen.png?url';
import TelekomLogo from '../../assets/logos/telekom.png?url';
import NvidiaLogo from '../../assets/logos/nvidia.png?url';
// Zhipu AI publishes its models as Z.ai.
import ZaiLogo from '../../assets/logos/zai.png?url';
// Square marks published by the labs: LightOn's GitHub org avatar, PaddlePaddle's
// GitHub org avatar, and the compact mark from vllm-project/media-kit.
import LightOnLogo from '../../assets/logos/lighton.png?url';
import PaddleLogo from '../../assets/logos/paddle.png?url';
import VllmLogo from '../../assets/logos/vllm.svg?url';
import OtherLogo from '../../assets/logos/other.svg?url';

export const logos: Record<string, string> = {
  Anthropic: AnthropicLogo,
  BAAI: BaaiLogo,
  DeepSeek: DeepSeekLogo,
  Google: GoogleLogo,
  'Google Gemini': GoogleLogo,
  'Google Gemma': GoogleLogo,
  'Jina AI': JinaAiLogo,
  Meta: MetaLogo,
  Mistral: MistralLogo,
  OpenAI: OpenAiLogo,
  'Alibaba Cloud': QwenLogo,
  'T-Systems': TelekomLogo,
  NVIDIA: NvidiaLogo,
  'Zhipu AI': ZaiLogo,
  LightOn: LightOnLogo,
  PaddlePaddle: PaddleLogo,
  vLLM: VllmLogo,
  Other: OtherLogo,
};

export function getLogo(name: string): string {
  return logos[name] || '';
}

/** Same creator names as PlansPage.parseModelCreator. Unknown labs return Other. */
export function creatorNameFor(exactModelName: string | undefined, displayModelName: string): string {
  const source = `${exactModelName || ''} ${displayModelName}`.toLowerCase();
  const isOpenAIOSeries = /\bo\d+(?:[.-]|\b)/.test(source);
  const isOpenAIAdaSeries = /\b(?:embedding\s+ada|text-embedding-ada|ada(?:[-\s]?\d+)?)\b/.test(source);

  if (source.includes('claude')) return 'Anthropic';
  if (source.includes('gemma')) return 'Google Gemma';
  if (source.includes('gemini')) return 'Google Gemini';
  if (
    source.includes('gpt') ||
    isOpenAIOSeries ||
    isOpenAIAdaSeries ||
    source.includes('codex') ||
    source.includes('whisper')
  )
    return 'OpenAI';
  if (source.includes('llama') || source.includes('meta')) return 'Meta';
  if (source.includes('mistral')) return 'Mistral';
  if (source.includes('qwen')) return 'Alibaba Cloud';
  if (source.includes('nemotron') || source.includes('nvidia')) return 'NVIDIA';
  if (source.includes('glm') || source.includes('zhipu') || source.includes('z.ai')) return 'Zhipu AI';
  if (source.includes('deepseek')) return 'DeepSeek';
  if (source.includes('jina')) return 'Jina AI';
  if (source.includes('bge')) return 'BAAI';
  if (source.includes('teuken') || source.includes('tsi') || source.includes('col qwen')) return 'T-Systems';
  if (source.includes('lighton')) return 'LightOn';
  if (source.includes('paddle')) return 'PaddlePaddle';
  if (/\bd3\b/.test(source)) return 'vLLM';

  return 'Other';
}

/** A real image URL. Missing labs get the neutral mark, never an empty src. */
export function creatorLogoFor(exactModelName: string | undefined, displayModelName: string): string {
  return getLogo(creatorNameFor(exactModelName, displayModelName)) || logos.Other;
}
