import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

function makeBuilder(resolvedValue: unknown) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
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
  };
}

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats?childId=c1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: { account_type: 'standalone' }, error: null }]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats?childId=c1');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when childId is missing', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: { account_type: 'parent' }, error: null }]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when child belongs to different parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { account_type: 'parent' }, error: null },
        { data: { parent_id: 'other-parent' }, error: null }, // child lookup
      ]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats?childId=child-1');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('aggregates conversations by date', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const conversations = [
      { created_at: '2026-04-20T10:00:00Z', message_count: 4 },
      { created_at: '2026-04-20T14:00:00Z', message_count: 2 },
      { created_at: '2026-04-21T09:00:00Z', message_count: 6 },
    ];
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { account_type: 'parent' }, error: null },
        { data: { parent_id: 'parent-1' }, error: null },  // child lookup
        { data: conversations, error: null },               // conversations
      ]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats?childId=child-1&period=week');
    const res = await GET(req);
    const body = await res.json() as { stats: { date: string; conversationCount: number; messageCount: number }[] };

    expect(res.status).toBe(200);
    expect(body.stats).toHaveLength(2);
    const apr20 = body.stats.find((s) => s.date === '2026-04-20');
    expect(apr20?.conversationCount).toBe(2);
    expect(apr20?.messageCount).toBe(6);
    const apr21 = body.stats.find((s) => s.date === '2026-04-21');
    expect(apr21?.conversationCount).toBe(1);
  });

  it('returns empty stats when no conversations', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { account_type: 'parent' }, error: null },
        { data: { parent_id: 'parent-1' }, error: null },
        { data: [], error: null },
      ]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/stats/route');
    const req = new Request('http://localhost/api/dashboard/stats?childId=child-1&period=month');
    const res = await GET(req);
    const body = await res.json() as { stats: unknown[] };
    expect(body.stats).toHaveLength(0);
  });
});

// ─── GET /api/dashboard/flags ─────────────────────────────────────────────────

describe('GET /api/dashboard/flags', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/dashboard/flags/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: { account_type: 'child' }, error: null }]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/flags/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns flags for parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const flagRows = [
      {
        id: 'f1',
        conversation_id: 'c1',
        child_id: 'child-1',
        parent_id: 'parent-1',
        reason: 'Asked for direct answer',
        severity: 'low',
        reviewed: false,
        created_at: '2026-04-20T10:00:00Z',
        profiles: { display_name: 'Alice' },
      },
    ];
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [
        { data: { account_type: 'parent' }, error: null },
        { data: flagRows, error: null },
      ]) as never,
    );

    const { GET } = await import('@/app/api/dashboard/flags/route');
    const res = await GET();
    const body = await res.json() as { flags: { id: string; childName: string | null; severity: string }[] };
    expect(res.status).toBe(200);
    expect(body.flags).toHaveLength(1);
    expect(body.flags[0].childName).toBe('Alice');
    expect(body.flags[0].severity).toBe('low');
  });
});

// ─── PATCH /api/dashboard/flags/[id] ─────────────────────────────────────────

describe('PATCH /api/dashboard/flags/[id]', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { PATCH } = await import('@/app/api/dashboard/flags/[id]/route');
    const req = new Request('http://localhost/api/dashboard/flags/f1', {
      method: 'PATCH',
      body: JSON.stringify({ reviewed: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 when reviewed is not a boolean', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'parent-1' }) as never);

    const { PATCH } = await import('@/app/api/dashboard/flags/[id]/route');
    const req = new Request('http://localhost/api/dashboard/flags/f1', {
      method: 'PATCH',
      body: JSON.stringify({ reviewed: 'yes' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(400);
  });

  it('marks flag as reviewed and returns ok', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ error: null }]) as never,
    );

    const { PATCH } = await import('@/app/api/dashboard/flags/[id]/route');
    const req = new Request('http://localhost/api/dashboard/flags/f1', {
      method: 'PATCH',
      body: JSON.stringify({ reviewed: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'f1' }) });
    const body = await res.json() as { ok: boolean };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
