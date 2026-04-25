import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ChatSection } from '@/components/chat/ChatSection';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { Footer } from '@/components/layout/Footer';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type === 'parent') {
      const locale = await getLocale();
      redirect(`/${locale}/dashboard`);
    }
  }

  const t = await getTranslations('hero');

  return (
    <>
      <div className="flex min-h-[calc(100dvh-3.5rem)]">
        <ConversationSidebar />

        <main className="flex-1 flex flex-col items-center px-3 sm:px-4 min-w-0">
          {/* Upper flex space — tagline centered within it */}
          <div className="flex-1 flex items-center justify-center w-full">
            <p
              className="text-2xl sm:text-3xl font-extralight tracking-wide text-center select-none bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))',
                opacity: 0.6,
              }}
            >
              {t('tagline')}
            </p>
          </div>

          {/* Chat + model selector */}
          <ChatSection />

          {/* Lower flex space */}
          <div className="flex-1" />
        </main>
      </div>
      <Footer />
    </>
  );
}
