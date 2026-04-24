'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { AIProvider, ChatErrorCode } from '@/types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ProgressBar } from '@/components/ui/progress-bar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  errorCode?: ChatErrorCode;
}

interface ChatWindowProps {
  provider: AIProvider;
}

function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content }),
  }).catch(() => {});
}

export function ChatWindow({ provider }: ChatWindowProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Persistent across renders — no re-render needed
  const conversationIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef<string>('');
  // Track first user message for conversation title
  const firstUserMessageRef = useRef<string | null>(null);

  const welcomeContent = t('welcomeMessage');

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const startNewConversation = useCallback(async () => {
    const currentId = conversationIdRef.current;
    if (currentId && messages.some((m) => m.role === 'user')) {
      // End the current conversation
      const title = firstUserMessageRef.current?.slice(0, 80) ?? null;
      fetch(`/api/conversations/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_at: new Date().toISOString(), title }),
      })
        .then(() => {
          // Trigger misuse analysis (fire-and-forget)
          fetch(`/api/conversations/${currentId}/analyze`, { method: 'POST' }).catch(() => {});
        })
        .catch(() => {});
    }

    conversationIdRef.current = null;
    streamBufferRef.current = '';
    firstUserMessageRef.current = null;
    setMessages([]);
  }, [messages]);

  const sendMessage = useCallback(async (content: string, retryAssistantId?: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const assistantId = retryAssistantId ?? crypto.randomUUID();

    setMessages((prev) => {
      const withoutRetried = retryAssistantId
        ? prev.filter((m) => m.id !== retryAssistantId)
        : prev;
      return [...withoutRetried, userMsg, { id: assistantId, role: 'assistant', content: '' }];
    });
    setIsLoading(true);
    streamBufferRef.current = '';

    try {
      // Create conversation record on first message
      if (!conversationIdRef.current) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, locale }),
        });
        if (res.ok) {
          const body = await res.json() as { id: string };
          conversationIdRef.current = body.id;
          firstUserMessageRef.current = content;
        }
      }

      const history = [...messages.filter((m) => !m.error), userMsg]
        .filter((m) => m.content.trim() !== '')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, provider, locale }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({})) as { code?: ChatErrorCode };
        throw { code: body.code ?? 'generic' };
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamBufferRef.current += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }

      // Check for sentinel error token or empty response
      const SENTINEL = '\nMINDGUIDE_ERR:';
      let isError = false;
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === assistantId);
        if (!msg) return prev;
        if (msg.content.includes(SENTINEL)) {
          isError = true;
          const errorCode = (msg.content.split(SENTINEL)[1]?.trim() as ChatErrorCode) || 'generic';
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: '', error: true, errorCode } : m,
          );
        }
        if (msg.content === '') {
          isError = true;
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: '', error: true, errorCode: 'generic' } : m,
          );
        }
        return prev;
      });

      // Persist messages to DB (fire-and-forget, only on success)
      if (!isError && conversationIdRef.current) {
        const convId = conversationIdRef.current;
        const assistantContent = streamBufferRef.current
          .split(SENTINEL)[0]
          .trimEnd();
        if (!retryAssistantId) {
          saveMessage(convId, 'user', content);
        }
        if (assistantContent) {
          saveMessage(convId, 'assistant', assistantContent);
        }
      }
    } catch (err) {
      const code: ChatErrorCode =
        err !== null && typeof err === 'object' && 'code' in err
          ? (err as { code: ChatErrorCode }).code
          : 'generic';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: '', error: true, errorCode: code } : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, provider, locale]);

  const handleSend = useCallback((content: string) => {
    sendMessage(content);
  }, [sendMessage]);

  return (
    <div className="flex flex-col">
      <div className="rounded-t-2xl overflow-hidden">
        <ProgressBar active={isLoading} />
      </div>

      <div ref={scrollContainerRef} className="overflow-y-auto min-h-[240px] px-4 pt-6 pb-6 space-y-4">
        <div className="flex gap-2.5 max-w-[85%] mr-auto">
          <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 overflow-hidden">
            <Image src="/icon.png" alt="" width={28} height={28} />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-xl bg-mg-primary/7 dark:bg-mg-primary/12 border border-mg-primary/18 dark:border-mg-primary/22 text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]">
            {welcomeContent}
          </div>
        </div>

        {messages.filter((m) => m.content !== '' || m.error).map((msg) => {
          const prevUserMsg = msg.role === 'assistant' && msg.error
            ? [...messages].reverse().find(
                (m, i, arr) => arr[i - 1]?.id === msg.id && m.role === 'user',
              ) ?? messages[messages.indexOf(msg) - 1]
            : undefined;

          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              onRetry={
                msg.error && prevUserMsg
                  ? () => sendMessage(prevUserMsg.content, msg.id)
                  : undefined
              }
            />
          );
        })}

        {isLoading && messages.at(-1)?.content === '' && !messages.at(-1)?.error && (
          <div className="flex gap-2.5 items-center mr-auto">
            <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
              <Image src="/icon.png" alt="" width={28} height={28} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-xl bg-mg-primary/7 dark:bg-mg-primary/12 border border-mg-primary/18 dark:border-mg-primary/22 text-muted-foreground text-sm shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="inline-flex gap-1" aria-hidden="true">
                <span className="animate-bounce [animation-delay:0ms]">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </span>
              <span className="sr-only">{t('thinking')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          onNewConversation={startNewConversation}
          hasMessages={messages.some((m) => m.role === 'user')}
        />
      </div>
    </div>
  );
}
