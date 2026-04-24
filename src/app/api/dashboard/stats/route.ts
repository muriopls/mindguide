import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UsageStat } from '@/types';

type Period = 'day' | 'week' | 'month' | 'custom';

function periodDays(period: Period): number {
  if (period === 'day') return 1;
  if (period === 'week') return 7;
  return 30;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'parent') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const period = (searchParams.get('period') ?? 'week') as Period;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let since: string;
  let until: string | undefined;
  if (period === 'custom' && fromParam && toParam) {
    since = new Date(fromParam).toISOString();
    until = new Date(toParam + 'T23:59:59.999Z').toISOString();
  } else {
    const days = periodDays(period);
    since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });

  // Verify caller is the parent of this child
  const { data: child } = await supabase
    .from('profiles')
    .select('parent_id')
    .eq('id', childId)
    .single();

  if (!child || child.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = supabase
    .from('conversations')
    .select('created_at, message_count')
    .eq('user_id', childId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (until) query = query.lte('created_at', until);

  const { data: conversations } = await query;

  // Group by date (YYYY-MM-DD)
  const byDate = new Map<string, UsageStat>();
  for (const conv of conversations ?? []) {
    const date = conv.created_at.slice(0, 10);
    const existing = byDate.get(date) ?? { date, conversationCount: 0, messageCount: 0 };
    existing.conversationCount += 1;
    existing.messageCount += conv.message_count ?? 0;
    byDate.set(date, existing);
  }

  return NextResponse.json({ stats: Array.from(byDate.values()) });
}
