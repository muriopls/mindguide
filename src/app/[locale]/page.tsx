import { ChatWindow } from '@/components/chat/ChatWindow';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <div className="h-[calc(100dvh-3.5rem)] flex flex-col max-w-4xl w-full mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-white/60 dark:border-white/8 bg-white/35 dark:bg-white/[0.04] backdrop-blur-sm shadow-lg shadow-black/5 dark:shadow-black/25 overflow-hidden">
          <ChatWindow />
        </div>
      </div>
      <Footer />
    </>
  );
}
