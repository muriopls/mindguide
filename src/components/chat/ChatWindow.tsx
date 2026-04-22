'use client';

import { useEffect, useRef, useState } from 'react';
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {allMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3 items-center mr-auto">
            <div className="w-8 h-8 rounded-full bg-mg-secondary text-mg-secondary-foreground flex items-center justify-center text-sm font-bold">
              🧠
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted text-muted-foreground text-sm animate-pulse">
              {t('thinking')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
