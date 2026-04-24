import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({ streamText: vi.fn() }));
vi.mock('@/lib/ai/providers', () => ({ getModel: vi.fn(() => 'mock-model') }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

async function* makeTextStream(chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

function mockStreamResult(chunks: string[] = ['ok']) {
  return { textStream: makeTextStream(chunks) } as unknown as ReturnType<typeof import('ai').streamText>;
}

function makeSupabase(user: { id: string } | null = null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })),
  };
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.ANTHROPIC_API_KEY = 'test-operator-key';
  });

  it('streams response text for claude by default', async () => {
    const { streamText } = await import('ai');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(streamText).mockReturnValue(mockStreamResult(['Hallo', ' Welt']));

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Was ist 2+2?' }] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await readStream(res)).toBe('Hallo Welt');
  });

  it('calls getModel with claude by default', async () => {
    const { streamText } = await import('ai');
    const { getModel } = await import('@/lib/ai/providers');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(streamText).mockReturnValue(mockStreamResult());

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
    });
    await POST(req);

    expect(getModel).toHaveBeenCalledWith('claude', undefined);
  });

  it('calls getModel with openai when provider is openai', async () => {
    const { streamText } = await import('ai');
    const { getModel } = await import('@/lib/ai/providers');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(streamText).mockReturnValue(mockStreamResult());
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], provider: 'openai', locale: 'en' }),
    });
    await POST(req);

    expect(getModel).toHaveBeenCalledWith('openai', undefined);
  });

  it('uses English system prompt when locale is en', async () => {
    const { streamText } = await import('ai');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(streamText).mockReturnValue(mockStreamResult());

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], locale: 'en' }),
    });
    await POST(req);

    const call = vi.mocked(streamText).mock.calls[0][0];
    expect(call.system).toContain('Socratic');
  });

  it('uses German system prompt by default', async () => {
    const { streamText } = await import('ai');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(streamText).mockReturnValue(mockStreamResult());

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hallo' }] }),
    });
    await POST(req);

    const call = vi.mocked(streamText).mock.calls[0][0];
    expect(call.system).toContain('sokratisch');
  });

  it('returns 500 with no_key code when no operator or user key exists', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    delete process.env.ANTHROPIC_API_KEY;

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
    });
    const res = await POST(req);
    const body = await res.json() as { code: string };

    expect(res.status).toBe(500);
    expect(body.code).toBe('no_key');
  });

  it('writes sentinel to stream when streamText throws during iteration', async () => {
    const { streamText } = await import('ai');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    async function* errorStream() {
      yield 'partial';
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }
    vi.mocked(streamText).mockReturnValue({ textStream: errorStream() } as never);

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
    });
    const res = await POST(req);
    const text = await readStream(res);

    expect(res.status).toBe(200);
    expect(text).toContain('\nMINDGUIDE_ERR:auth');
  });
});
