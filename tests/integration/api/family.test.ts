import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

function makeBuilder(resolvedValue: unknown) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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

function makeServiceClient(options: {
  profilesData?: unknown;
  createUserResult?: { data: { user: { id: string } | null }; error: null | { message: string } };
  deleteUserResult?: { error: null | { message: string } };
  getUserById?: { data: { user: { email: string } | null } };
} = {}) {
  const profilesData = options.profilesData ?? [];
  let fromCall = 0;
  const fromResults = [
    { data: profilesData, error: null },
    { data: null, error: null }, // insert profile
  ];

  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(
          options.createUserResult ?? { data: { user: { id: 'child-new' } }, error: null },
        ),
        deleteUser: vi.fn().mockResolvedValue(
          options.deleteUserResult ?? { error: null },
        ),
        getUserById: vi.fn().mockResolvedValue(
          options.getUserById ?? { data: { user: { email: 'child@test.com' } } },
        ),
      },
    },
    from: vi.fn(() => makeBuilder(fromResults[fromCall++] ?? fromResults[fromResults.length - 1])),
  };
}

// ─── GET /api/family/children ─────────────────────────────────────────────────

describe('GET /api/family/children', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { GET } = await import('@/app/api/family/children/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'u1' }, [{ data: { account_type: 'standalone' }, error: null }]) as never,
    );

    const { GET } = await import('@/app/api/family/children/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns children list for parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { createServiceClient } = await import('@/lib/supabase/service');

    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: { account_type: 'parent' }, error: null }]) as never,
    );
    const childProfiles = [{ id: 'child-1', display_name: 'Alice', created_at: '2026-04-01' }];
    vi.mocked(createServiceClient).mockReturnValue(
      makeServiceClient({ profilesData: childProfiles }) as never,
    );

    const { GET } = await import('@/app/api/family/children/route');
    const res = await GET();
    const body = await res.json() as { children: { id: string; email: string }[] };
    expect(res.status).toBe(200);
    expect(body.children).toHaveLength(1);
    expect(body.children[0].id).toBe('child-1');
    expect(body.children[0].email).toBe('child@test.com');
  });
});

// ─── POST /api/family/children ────────────────────────────────────────────────

describe('POST /api/family/children', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { POST } = await import('@/app/api/family/children/route');
    const req = new Request('http://localhost/api/family/children', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Alice', email: 'alice@test.com', password: 'secret123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when password is too short', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'parent-1' }) as never);

    const { POST } = await import('@/app/api/family/children/route');
    const req = new Request('http://localhost/api/family/children', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Alice', email: 'alice@test.com', password: 'short' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when displayName is missing', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ id: 'parent-1' }) as never);

    const { POST } = await import('@/app/api/family/children/route');
    const req = new Request('http://localhost/api/family/children', {
      method: 'POST',
      body: JSON.stringify({ displayName: '', email: 'alice@test.com', password: 'validpass' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates child and returns childId', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { createServiceClient } = await import('@/lib/supabase/service');

    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: null, error: null }]) as never,
    );
    vi.mocked(createServiceClient).mockReturnValue(makeServiceClient() as never);

    const { POST } = await import('@/app/api/family/children/route');
    const req = new Request('http://localhost/api/family/children', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Alice', email: 'alice@test.com', password: 'validpass' }),
    });
    const res = await POST(req);
    const body = await res.json() as { childId: string };
    expect(res.status).toBe(200);
    expect(body.childId).toBe('child-new');
  });

  it('rolls back auth user when profile insert fails', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { createServiceClient } = await import('@/lib/supabase/service');

    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: null, error: null }]) as never,
    );

    const serviceClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'child-new' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
      from: vi.fn(() => makeBuilder({ data: null, error: { message: 'DB error' } })),
    };
    vi.mocked(createServiceClient).mockReturnValue(serviceClient as never);

    const { POST } = await import('@/app/api/family/children/route');
    const req = new Request('http://localhost/api/family/children', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Alice', email: 'alice@test.com', password: 'validpass' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(serviceClient.auth.admin.deleteUser).toHaveBeenCalledWith('child-new');
  });
});

// ─── DELETE /api/family/children/[childId] ────────────────────────────────────

describe('DELETE /api/family/children/[childId]', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it('returns 401 when no session', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(makeSupabase(null) as never);

    const { DELETE } = await import('@/app/api/family/children/[childId]/route');
    const req = new Request('http://localhost/api/family/children/child-1');
    const res = await DELETE(req, { params: Promise.resolve({ childId: 'child-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when child belongs to different parent', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: { parent_id: 'other-parent' }, error: null }]) as never,
    );

    const { DELETE } = await import('@/app/api/family/children/[childId]/route');
    const req = new Request('http://localhost/api/family/children/child-1');
    const res = await DELETE(req, { params: Promise.resolve({ childId: 'child-1' }) });
    expect(res.status).toBe(403);
  });

  it('deletes auth user and returns ok', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { createServiceClient } = await import('@/lib/supabase/service');

    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ id: 'parent-1' }, [{ data: { parent_id: 'parent-1' }, error: null }]) as never,
    );
    const svc = makeServiceClient();
    vi.mocked(createServiceClient).mockReturnValue(svc as never);

    const { DELETE } = await import('@/app/api/family/children/[childId]/route');
    const req = new Request('http://localhost/api/family/children/child-1');
    const res = await DELETE(req, { params: Promise.resolve({ childId: 'child-1' }) });
    const body = await res.json() as { ok: boolean };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(svc.auth.admin.deleteUser).toHaveBeenCalledWith('child-1');
  });
});
