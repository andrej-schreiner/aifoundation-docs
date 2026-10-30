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
  Other: OtherLogo,
};

export function getLogo(name: string): string {
  return logos[name] || '';
}
