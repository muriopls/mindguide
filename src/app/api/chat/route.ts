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

  const nonEmptyMessages = messages.filter((m) => m.content.trim() !== '');

  try {
    const model = getModel(resolvedProvider, userKey);
    const system = systemPrompts[resolvedLocale];
    const result = streamText({ model, system, messages: nonEmptyMessages });
    return result.toTextStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
