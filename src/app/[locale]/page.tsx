import { getTranslations } from 'next-intl/server';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Footer } from '@/components/layout/Footer';

export default async function HomePage() {
  const t = await getTranslations('hero');

  return (
    <>
      <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center px-3 sm:px-4">
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

        {/* Chat — natural height, no flex-1 */}
        <div
          className="w-full max-w-4xl flex flex-col rounded-2xl border border-white/60 dark:border-white/8 bg-white/35 dark:bg-white/[0.04] backdrop-blur-sm shadow-lg shadow-black/5 dark:shadow-black/25"
          style={{ maxHeight: 'calc(100dvh - 9rem)' }}
        >
          <ChatWindow />
        </div>

        {/* Lower flex space — mirrors upper to keep chat centered */}
        <div className="flex-1" />
      </div>
      <Footer />
    </>
  );
}
