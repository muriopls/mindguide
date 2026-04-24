import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { role?: unknown; content?: unknown };
  if (body.role !== 'user' && body.role !== 'assistant') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  if (typeof body.content !== 'string' || !body.content.trim()) {
    return NextResponse.json({ error: 'Empty content' }, { status: 400 });
  }

  // Insert message (RLS ensures user owns the conversation)
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: body.role, content: body.content })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment message_count atomically via RPC (fire-and-forget, non-critical)
  void supabase.rpc('increment_message_count', { conv_id: conversationId }).then(() => {});

  return NextResponse.json({ id: data.id });
}
