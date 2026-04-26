import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isValidSubjectSlug, getSubjectLabel } from '@/lib/subjects';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai/providers';

interface Params { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isValidSubjectSlug(slug)) {
    return NextResponse.json({ error: 'Invalid subject slug' }, { status: 400 });
  }

  // Fetch last 5 conversation titles in this subject
  const { data: conversations } = await supabase
    .from('conversations')
    .select('title, message_count, created_at')
    .eq('user_id', user.id)
    .eq('subject_slug', slug)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!conversations || conversations.length === 0) {
    return NextResponse.json({ hints: [] });
  }

  // Resolve user's API key (or parent's)
  const { data: keyRow } = await supabase
    .from('user_api_keys')
    .select('provider, encrypted_key')
    .eq('provider', 'claude')
    .maybeSingle();

  const subjectLabel = getSubjectLabel(slug, 'de');
  const historyText = conversations
    .map((c, i) =>
      `${i + 1}. "${c.title ?? 'Ohne Titel'}" (${c.message_count} Nachrichten, ${new Date(c.created_at).toLocaleDateString('de')})`
    )
    .join('\n');

  const prompt = `Du bist ein Nachhilfelehrer für ${subjectLabel}.
Ein Schüler/eine Schülerin hat folgende vergangene Gespräche in diesem Fach geführt:

${historyText}

Gib 2-3 kurze, konkrete und motivierende Vorschläge auf Deutsch, was der/die Schüler*in als nächstes üben oder vertiefen könnte.
Antworte ausschließlich als JSON-Array mit Strings, ohne Markdown:
["Vorschlag 1", "Vorschlag 2", "Vorschlag 3"]`;

  try {
    const model = getModel('claude', keyRow?.encrypted_key ?? undefined);
    const { text } = await generateText({ model, prompt, maxOutputTokens: 200 });
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const hints = JSON.parse(cleaned) as string[];
    return NextResponse.json({ hints: Array.isArray(hints) ? hints.slice(0, 3) : [] });
  } catch {
    return NextResponse.json({ hints: [] });
  }
}
