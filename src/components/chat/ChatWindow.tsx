'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { AIProvider } from '@/types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWindow() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const welcomeContent = `${t('welcomeTitle')}\n\n${t('welcomeMessage')}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.content.trim() !== '')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, provider, locale }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Network error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: t('errorSending') } : m)),
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, provider, locale, t]);

  return (
    <div className="flex flex-col h-full">
      <ProgressBar active={isLoading} />

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2 space-y-4">
        {/* Welcome message */}
        <div className="flex gap-2.5 max-w-[85%] mr-auto">
          <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 overflow-hidden">
            <Image src="/icon.png" alt="MindGuide" width={28} height={28} />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-xl bg-white/45 dark:bg-white/8 border border-white/70 dark:border-white/12 text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.07)]">
            {welcomeContent}
          </div>
        </div>

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isLoading && messages.at(-1)?.content === '' && (
          <div className="flex gap-2.5 items-center mr-auto">
            <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
              <Image src="/icon.png" alt="MindGuide" width={28} height={28} />
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

      <div className="px-4 pb-5 pt-2 space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs text-muted-foreground">{t('providerLabel')}:</span>
          {(['claude', 'openai'] as AIProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                provider === p
                  ? 'bg-mg-primary/15 border-mg-primary/40 text-mg-primary font-medium'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {t(p === 'claude' ? 'providerClaude' : 'providerOpenAI')}
            </button>
          ))}
        </div>
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
