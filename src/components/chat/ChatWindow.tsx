'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ChatMessage } from '@/types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ProgressBar } from '@/components/ui/progress-bar';

const DUMMY_RESPONSES = [
  'Das ist eine gute Frage! Was denkst du, welche Information du zuerst brauchst, um das Problem zu lösen?',
  'Interessant! Hast du schon versucht, das Problem in kleinere Teile aufzuteilen? Was wäre der erste Schritt?',
  'Bevor ich dir helfe: Was weißt du schon darüber? Das hilft mir, dir besser zu erklären.',
  'Lass uns das gemeinsam durchdenken. Wenn du dir ähnliche Aufgaben anschaust, welches Muster erkennst du?',
  'Gut gemacht, dass du fragst! Stell dir vor, du erklärst das Problem einem Freund — wie würdest du anfangen?',
];

function getRandomDummyResponse() {
  return DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
}

export function ChatWindow() {
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `${t('welcomeTitle')}\n\n${t('welcomeMessage')}`,
    timestamp: new Date(),
  };

  const allMessages = messages.length === 0 ? [welcomeMessage] : messages.length > 0 && messages[0].role === 'user' ? [welcomeMessage, ...messages] : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSend = async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    await new Promise((res) => setTimeout(res, 1200 + Math.random() * 800));

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: getRandomDummyResponse(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ProgressBar active={isLoading} />
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2 space-y-4">
        {allMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5 items-center mr-auto">
            <div className="w-7 h-7 rounded-full bg-mg-primary/10 text-mg-primary border border-mg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-xl bg-white/45 dark:bg-white/8 border border-white/70 dark:border-white/12 text-muted-foreground text-sm shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.07)]">
              <span className="inline-flex gap-1">
                <span className="animate-bounce [animation-delay:0ms]">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
