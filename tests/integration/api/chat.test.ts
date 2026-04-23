import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@/lib/ai/providers', () => ({
  getModel: vi.fn(() => 'mock-model'),
}));

function mockStreamResult(response: Response) {
  return { toTextStreamResponse: () => response } as unknown as ReturnType<typeof import('ai').streamText>;
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls getModel with claude by default and returns stream response', async () => {
    const { streamText } = await import('ai');
    const { getModel } = await import('@/lib/ai/providers');
    const mockResponse = new Response('ok');
    vi.mocked(streamText).mockReturnValue(mockStreamResult(mockResponse));

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Was ist 2+2?' }] }),
    });

    const res = await POST(req);

    expect(getModel).toHaveBeenCalledWith('claude', undefined);
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({ model: 'mock-model' }));
    expect(res).toBe(mockResponse);
  });

  it('uses openai model when provider is openai', async () => {
    const { streamText } = await import('ai');
    const { getModel } = await import('@/lib/ai/providers');
    vi.mocked(streamText).mockReturnValue(mockStreamResult(new Response('ok')));

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
    vi.mocked(streamText).mockReturnValue(mockStreamResult(new Response('ok')));

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
    vi.mocked(streamText).mockReturnValue(mockStreamResult(new Response('ok')));

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hallo' }] }),
    });

    await POST(req);

    const call = vi.mocked(streamText).mock.calls[0][0];
    expect(call.system).toContain('sokratisch');
  });

  it('passes userKey to getModel when provided', async () => {
    const { streamText } = await import('ai');
    const { getModel } = await import('@/lib/ai/providers');
    vi.mocked(streamText).mockReturnValue(mockStreamResult(new Response('ok')));

    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }], userKey: 'sk-user-key-123' }),
    });

    await POST(req);

    expect(getModel).toHaveBeenCalledWith('claude', 'sk-user-key-123');
  });
});
