import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { systemPrompts } from '@/lib/ai/system-prompts';
import type { AIProvider } from '@/types';

type ErrorCode = 'no_key' | 'auth' | 'rate_limit' | 'network' | 'generic';

function getErrorCode(err: unknown): ErrorCode {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('api key') || msg.includes('api_key') || msg.includes('no api')) return 'no_key';
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid_api_key')) return 'auth';
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit')) return 'rate_limit';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) return 'network';
  return 'generic';
}

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
    const code = getErrorCode(err);
    return new Response(JSON.stringify({ code }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
