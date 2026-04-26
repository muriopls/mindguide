import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidSubjectSlug } from '@/lib/subjects';

interface Params { params: Promise<{ childId: string }> }

async function verifyParent(supabase: Awaited<ReturnType<typeof createClient>>, parentId: string, childId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('parent_id')
    .eq('id', childId)
    .single();
  return data?.parent_id === parentId;
}

export async function GET(_req: Request, { params }: Params) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!await verifyParent(supabase, user.id, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: assignments } = await supabase
    .from('student_subjects')
    .select('subject_slug, created_at')
    .eq('student_id', childId)
    .order('created_at', { ascending: true });

  const slugs = (assignments ?? []).map((a) => a.subject_slug);

  const { data: convStats } = await supabase
    .from('conversations')
    .select('subject_slug, created_at')
    .eq('user_id', childId)
    .in('subject_slug', slugs.length > 0 ? slugs : ['__none__']);

  const statsMap = new Map<string, { count: number; lastActive: string | null }>();
  for (const slug of slugs) statsMap.set(slug, { count: 0, lastActive: null });
  for (const conv of convStats ?? []) {
    if (!conv.subject_slug) continue;
    const entry = statsMap.get(conv.subject_slug) ?? { count: 0, lastActive: null };
    entry.count += 1;
    if (!entry.lastActive || conv.created_at > entry.lastActive) entry.lastActive = conv.created_at;
    statsMap.set(conv.subject_slug, entry);
  }

  const subjects = (assignments ?? []).map((a) => ({
    slug: a.subject_slug,
    conversationCount: statsMap.get(a.subject_slug)?.count ?? 0,
    lastActiveAt: statsMap.get(a.subject_slug)?.lastActive ?? null,
  }));

  return NextResponse.json({ subjects });
}

export async function POST(req: Request, { params }: Params) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!await verifyParent(supabase, user.id, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { slug?: string };
  if (!body.slug || !isValidSubjectSlug(body.slug)) {
    return NextResponse.json({ error: 'Invalid subject slug' }, { status: 400 });
  }

  const { error } = await supabase
    .from('student_subjects')
    .insert({ student_id: childId, subject_slug: body.slug });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already assigned' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
