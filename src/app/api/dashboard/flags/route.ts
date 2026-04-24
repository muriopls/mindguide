import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

  const { data, error } = await supabase
    .from('misuse_flags')
    .select(`
      id, conversation_id, child_id, parent_id,
      reason, severity, reviewed, created_at,
      profiles!misuse_flags_child_id_fkey(display_name)
    `)
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flags = (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    childId: row.child_id,
    childName: (row.profiles as unknown as { display_name: string | null } | null)?.display_name ?? null,
    parentId: row.parent_id,
    reason: row.reason,
    severity: row.severity,
    reviewed: row.reviewed,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ flags });
}
