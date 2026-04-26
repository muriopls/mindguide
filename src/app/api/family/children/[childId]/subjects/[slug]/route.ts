import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidSubjectSlug } from '@/lib/subjects';

interface Params { params: Promise<{ childId: string; slug: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { childId, slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: child } = await supabase
    .from('profiles')
    .select('parent_id')
    .eq('id', childId)
    .single();

  if (!child || child.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isValidSubjectSlug(slug)) {
    return NextResponse.json({ error: 'Invalid subject slug' }, { status: 400 });
  }

  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', childId)
    .eq('subject_slug', slug);

  if (count && count > 0) {
    return NextResponse.json({ error: 'subject_has_conversations' }, { status: 409 });
  }

  const { error } = await supabase
    .from('student_subjects')
    .delete()
    .eq('student_id', childId)
    .eq('subject_slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
