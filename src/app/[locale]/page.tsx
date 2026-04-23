import { ChatWindow } from '@/components/chat/ChatWindow';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
        <div
          className="w-full max-w-4xl flex flex-col rounded-2xl border border-white/60 dark:border-white/8 bg-white/35 dark:bg-white/[0.04] backdrop-blur-sm shadow-lg shadow-black/5 dark:shadow-black/25"
          style={{ maxHeight: 'calc(100dvh - 7rem)' }}
        >
          <ChatWindow />
        </div>
      </div>
      <Footer />
    </>
  );
}
