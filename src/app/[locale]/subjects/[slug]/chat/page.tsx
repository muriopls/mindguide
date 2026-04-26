import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isValidSubjectSlug, getSubjectLabel } from '@/lib/subjects';
import { ChatSection } from '@/components/chat/ChatSection';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SubjectChatPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('subjects');

  if (!isValidSubjectSlug(slug)) redirect(`/${locale}/subjects`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  // Verify the student has this subject assigned
  const { data: assignment } = await supabase
    .from('student_subjects')
    .select('subject_slug')
    .eq('student_id', user.id)
    .eq('subject_slug', slug)
    .maybeSingle();

  if (!assignment) redirect(`/${locale}/subjects`);

  const label = getSubjectLabel(slug, locale);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <ConversationSidebar subject={slug} />

      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 min-w-0">
        {/* Subject header bar */}
        <div className="flex items-center gap-2 w-full max-w-4xl pt-4 pb-2 shrink-0">
          <a
            href={`/${locale}/subjects/${slug}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title={t('backToSubjects')}
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col items-center w-full">
          <ChatSection subject={slug} />
        </div>

        <div className="flex-1" />
      </main>
    </div>
  );
}
