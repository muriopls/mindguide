import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, title, provider, locale, created_at, ended_at, message_count, user_id')
    .eq('id', id)
    .single();

  if (error || !conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Access check: own conversation or parent of the conversation owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  const isOwner = conversation.user_id === user.id;
  const isParent = profile?.account_type === 'parent';
  if (!isOwner && !isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ conversation, messages: messages ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { ended_at?: string; title?: string };

  const { error } = await supabase
    .from('conversations')
    .update({
      ...(body.ended_at ? { ended_at: body.ended_at } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
