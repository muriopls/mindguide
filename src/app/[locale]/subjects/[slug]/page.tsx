import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isValidSubjectSlug, getSubjectLabel } from '@/lib/subjects';
import { SubjectHints } from '@/components/subjects/SubjectHints';
import { SubjectHistory } from '@/components/subjects/SubjectHistory';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('subjects');

  // Validate slug
  if (!isValidSubjectSlug(slug)) redirect(`/${locale}/subjects`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  // Verify the student actually has this subject assigned
  const { data: assignment } = await supabase
    .from('student_subjects')
    .select('subject_slug')
    .eq('student_id', user.id)
    .eq('subject_slug', slug)
    .maybeSingle();

  if (!assignment) redirect(`/${locale}/subjects`);

  // Check conversation count so SubjectHints knows whether to fetch
  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('subject_slug', slug);

  const hasConversations = (count ?? 0) > 0;
  const label = getSubjectLabel(slug, locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}/subjects`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title={t('backToSubjects')}
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <h1 className="text-2xl font-semibold">{label}</h1>
        </div>

        <a
          href={`/${locale}/subjects/${slug}/chat`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-mg-primary text-mg-primary-foreground hover:bg-mg-primary/90 transition-colors"
        >
          <Play className="w-4 h-4" />
          {t('startChat')}
        </a>
      </div>

      {/* Hints */}
      <SubjectHints slug={slug} hasConversations={hasConversations} />

      {/* Conversation history for this subject */}
      <SubjectHistory slug={slug} />
    </div>
  );
}
