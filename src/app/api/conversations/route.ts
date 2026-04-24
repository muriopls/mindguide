import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AIProvider, Locale } from '@/types';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');

  // If childId provided, verify caller is the parent
  if (childId) {
    const { data: child } = await supabase
      .from('profiles')
      .select('parent_id')
      .eq('id', childId)
      .single();
    if (!child || child.parent_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const targetUserId = childId ?? user.id;
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, provider, locale, created_at, ended_at, message_count')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const conversations = (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    provider: c.provider,
    locale: c.locale,
    createdAt: c.created_at,
    endedAt: c.ended_at,
    messageCount: c.message_count,
  }));
  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { provider?: unknown; locale?: unknown };
  const provider = (body.provider === 'openai' ? 'openai' : 'claude') as AIProvider;
  const locale = (body.locale === 'en' ? 'en' : 'de') as Locale;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, provider, locale })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
