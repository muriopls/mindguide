import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { systemPrompts } from '@/lib/ai/system-prompts';
import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/crypto/keys';
import type { AIProvider } from '@/types';

type ErrorCode = 'no_key' | 'auth' | 'rate_limit' | 'server_error' | 'network' | 'generic';

function getErrorCode(err: unknown): ErrorCode {
  const status = (err as { statusCode?: number; status?: number }).statusCode
    ?? (err as { statusCode?: number; status?: number }).status;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (status === 401) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status !== undefined && status >= 500) return 'server_error';

  if (msg.includes('api key') || msg.includes('api_key') || msg.includes('api-key') || msg.includes('no api')) return 'no_key';
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('authentication')) return 'auth';
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit')) return 'rate_limit';
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('overloaded')) return 'server_error';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout')) return 'network';
  return 'generic';
}

async function getUserKey(provider: AIProvider): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (!data) return undefined;
    return decryptApiKey(data.encrypted_key);
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const { messages, provider, locale } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    provider?: AIProvider;
    locale?: string;
  };

  const resolvedProvider: AIProvider = provider === 'openai' ? 'openai' : 'claude';
  const resolvedLocale = locale === 'en' ? 'en' : 'de';
  const nonEmptyMessages = messages.filter((m) => m.content.trim() !== '');

  const userKey = await getUserKey(resolvedProvider);
  const operatorKey = resolvedProvider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;

  if (!userKey && !operatorKey) {
    return new Response(JSON.stringify({ code: 'no_key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let result;
  try {
    const model = getModel(resolvedProvider, userKey);
    const system = systemPrompts[resolvedLocale];
    result = streamText({ model, system, messages: nonEmptyMessages });
  } catch (err) {
    const code = getErrorCode(err);
    return new Response(JSON.stringify({ code }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const code = getErrorCode(err);
        controller.enqueue(encoder.encode(`\x00${code}`));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
