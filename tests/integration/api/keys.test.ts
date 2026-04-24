import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/crypto/keys', () => ({
  encryptApiKey: vi.fn((k: string) => `enc:${k}`),
  decryptApiKey: vi.fn((k: string) => k.replace('enc:', '')),
}));

function makeBuilder(resolvedValue: unknown) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then(onFulfilled: (v: unknown) => void, onRejected?: (e: unknown) => void) {
      return Promise.resolve(resolvedValue).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

function makeSupabase(user: { id: string } | null, dbResult: unknown = { data: [], error: null }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => makeBuilder(dbResult)),
  };
}

describe('GET /api/keys', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/keys/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns active providers list for authenticated user', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'user-1' }, { data: [{ provider: 'claude' }, { provider: 'openai' }], error: null }) as never,
    );

    const { GET } = await import('@/app/api/keys/route');
    const res = await GET();
    const body = await res.json() as { active: string[] };
    expect(res.status).toBe(200);
    expect(body.active).toEqual(['claude', 'openai']);
  });

  it('returns empty list when user has no saved keys', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'user-1' }, { data: [], error: null }) as never,
    );

    const { GET } = await import('@/app/api/keys/route');
    const res = await GET();
    const body = await res.json() as { active: string[] };
    expect(body.active).toEqual([]);
  });
});

describe('POST /api/keys', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { POST } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'claude', key: 'sk-test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid provider', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'user-1' }) as never);

    const { POST } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'gemini', key: 'sk-test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when key is empty string', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'user-1' }) as never);

    const { POST } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'claude', key: '   ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('encrypts and upserts key for valid input', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { encryptApiKey } = await import('@/lib/crypto/keys');
    const supabase = makeSupabase({ id: 'user-1' }, { error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const { POST } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'claude', key: 'sk-ant-real-key' }),
    });
    const res = await POST(req);
    const body = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(encryptApiKey).toHaveBeenCalledWith('sk-ant-real-key');
    expect(supabase.from).toHaveBeenCalledWith('user_api_keys');
  });

  it('returns 500 when upsert fails', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'user-1' }, { error: { message: 'DB error' } }) as never,
    );

    const { POST } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ provider: 'openai', key: 'sk-proj-test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/keys', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { DELETE } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'DELETE',
      body: JSON.stringify({ provider: 'claude' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid provider', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'user-1' }) as never);

    const { DELETE } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'DELETE',
      body: JSON.stringify({ provider: 'unknown' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('deletes key and returns ok for valid provider', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = makeSupabase({ id: 'user-1' }, { error: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const { DELETE } = await import('@/app/api/keys/route');
    const req = new Request('http://localhost/api/keys', {
      method: 'DELETE',
      body: JSON.stringify({ provider: 'openai' }),
    });
    const res = await DELETE(req);
    const body = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('user_api_keys');
  });
});
