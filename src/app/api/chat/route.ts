import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { systemPrompts } from '@/lib/ai/system-prompts';
import type { AIProvider } from '@/types';

export async function POST(req: Request) {
  const { messages, provider, locale, userKey } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    provider?: AIProvider;
    locale?: string;
    userKey?: string;
  };

  const resolvedProvider: AIProvider = provider === 'openai' ? 'openai' : 'claude';
  const resolvedLocale = locale === 'en' ? 'en' : 'de';

  const model = getModel(resolvedProvider, userKey);
  const system = systemPrompts[resolvedLocale];

  const result = streamText({ model, system, messages });

  return result.toTextStreamResponse();
}
