import { getTranslations } from 'next-intl/server';
import { ChatSection } from '@/components/chat/ChatSection';
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

        {/* Chat + model selector */}
        <ChatSection />

        {/* Lower flex space — mirrors upper to keep chat centered */}
        <div className="flex-1" />
      </div>
      <Footer />
    </>
  );
}
