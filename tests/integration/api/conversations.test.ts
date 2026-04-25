import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Builder that chains and resolves at .single() or .then()
function makeBuilder(resolvedValue: unknown) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then(onFulfilled: (v: unknown) => void, onRejected?: (e: unknown) => void) {
      return Promise.resolve(resolvedValue).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

function makeSupabase(
  user: { id: string } | null,
  results: unknown[] = [{ data: null, error: null }],
) {
  let call = 0;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => makeBuilder(results[call++] ?? results[results.length - 1])),
    rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
  };
}

// ─── GET /api/conversations ───────────────────────────────────────────────────

describe('GET /api/conversations', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns own conversations when no childId', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const convs = [{ id: 'c1', title: 'Maths', provider: 'claude', locale: 'de', created_at: '2026-04-01', ended_at: null, message_count: 4 }];
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: convs, error: null }]) as never,
    );

    const { GET } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations');
    const res = await GET(req);
    const body = await res.json() as { conversations: unknown[] };
    expect(res.status).toBe(200);
    expect(body.conversations).toHaveLength(1);
  });

  it('returns 403 when childId belongs to different parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { parent_id: 'other-parent' }, error: null }, // child profile lookup
      ]) as never,
    );

    const { GET } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations?childId=child-1');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns child conversations when parent provides valid childId', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const convs = [{ id: 'c2', title: null, provider: 'claude', locale: 'de', created_at: '2026-04-02', ended_at: null, message_count: 2 }];
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { parent_id: 'parent-1' }, error: null }, // child profile: parent_id matches
        { data: convs, error: null },                      // conversations
      ]) as never,
    );

    const { GET } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations?childId=child-1');
    const res = await GET(req);
    const body = await res.json() as { conversations: unknown[] };
    expect(res.status).toBe(200);
    expect(body.conversations).toHaveLength(1);
  });
});

// ─── POST /api/conversations ──────────────────────────────────────────────────

describe('POST /api/conversations', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { POST } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ provider: 'claude', locale: 'de' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates conversation and returns id', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: { id: 'conv-new' }, error: null }]) as never,
    );

    const { POST } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ provider: 'claude', locale: 'en' }),
    });
    const res = await POST(req);
    const body = await res.json() as { id: string };
    expect(res.status).toBe(200);
    expect(body.id).toBe('conv-new');
  });

  it('defaults to claude provider when unknown provider given', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = makeSupabase({ id: 'u1' }, [{ data: { id: 'conv-x' }, error: null }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const { POST } = await import('@/app/api/conversations/route');
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ provider: 'gemini', locale: 'de' }),
    });
    await POST(req);
    expect(supabase.from).toHaveBeenCalledWith('conversations');
  });
});

// ─── GET /api/conversations/[id] ─────────────────────────────────────────────

describe('GET /api/conversations/[id]', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/c1');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when conversation not found', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: null, error: { message: 'not found' } }]) as never,
    );

    const { GET } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/missing');
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('returns conversation + messages for owner', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const conv = { id: 'c1', title: 'T', provider: 'claude', locale: 'de', created_at: '2026-04-01', ended_at: null, message_count: 2, user_id: 'u1' };
    const msgs = [{ id: 'm1', role: 'user', content: 'hi', created_at: '2026-04-01' }];
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [
        { data: conv, error: null },                          // conversation
        { data: { account_type: 'standalone' }, error: null }, // profile
        { data: msgs, error: null },                          // messages
      ]) as never,
    );

    const { GET } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/c1');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) });
    const body = await res.json() as { messages: unknown[] };
    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
  });

  it('returns 403 when non-owner and non-parent tries to access', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const conv = { id: 'c1', title: null, provider: 'claude', locale: 'de', created_at: '2026-04-01', ended_at: null, message_count: 0, user_id: 'other-user' };
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [
        { data: conv, error: null },
        { data: { account_type: 'standalone' }, error: null },
      ]) as never,
    );

    const { GET } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/c1');
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/conversations/[id] ───────────────────────────────────────────

describe('PATCH /api/conversations/[id]', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { PATCH } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/c1', {
      method: 'PATCH',
      body: JSON.stringify({ ended_at: new Date().toISOString() }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('updates conversation and returns ok', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ error: null }]) as never,
    );

    const { PATCH } = await import('@/app/api/conversations/[id]/route');
    const req = new Request('http://localhost/api/conversations/c1', {
      method: 'PATCH',
      body: JSON.stringify({ ended_at: '2026-04-01T12:00:00Z', title: 'My session' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'c1' }) });
    const body = await res.json() as { ok: boolean };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});

// ─── POST /api/conversations/[id]/messages ────────────────────────────────────

describe('POST /api/conversations/[id]/messages', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { POST } = await import('@/app/api/conversations/[id]/messages/route');
    const req = new Request('http://localhost/api/conversations/c1/messages', {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content: 'hello' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid role', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'u1' }) as never);

    const { POST } = await import('@/app/api/conversations/[id]/messages/route');
    const req = new Request('http://localhost/api/conversations/c1/messages', {
      method: 'POST',
      body: JSON.stringify({ role: 'system', content: 'hello' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty content', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'u1' }) as never);

    const { POST } = await import('@/app/api/conversations/[id]/messages/route');
    const req = new Request('http://localhost/api/conversations/c1/messages', {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content: '   ' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('inserts message and returns id', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [
        { data: { id: 'msg-1' }, error: null }, // messages insert
        { data: { message_count: 3 }, error: null }, // conversations select (fire-and-forget)
      ]) as never,
    );

    const { POST } = await import('@/app/api/conversations/[id]/messages/route');
    const req = new Request('http://localhost/api/conversations/c1/messages', {
      method: 'POST',
      body: JSON.stringify({ role: 'assistant', content: 'Great question!' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'c1' }) });
    const body = await res.json() as { id: string };
    expect(res.status).toBe(200);
    expect(body.id).toBe('msg-1');
  });
});
