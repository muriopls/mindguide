import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ChatSection } from '@/components/chat/ChatSection';
import { Footer } from '@/components/layout/Footer';

export default async function TestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'parent') redirect(`/${locale}`);

  return (
    <>
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center px-3 sm:px-4">
        <div className="flex-1 flex items-center justify-center w-full">
          <p
            className="text-2xl sm:text-3xl font-extralight tracking-wide text-center select-none bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))',
              opacity: 0.6,
            }}
          >
            AI Nachhilfelehrer testen
          </p>
        </div>

        <ChatSection persist={false} />

        <div className="flex-1" />
      </div>
      <Footer />
    </>
  );
}
