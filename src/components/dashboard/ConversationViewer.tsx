'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ConversationSummary, SavedMessage } from '@/types';

interface ConversationViewerProps {
  conversation: ConversationSummary;
  onClose: () => void;
}

export function ConversationViewer({ conversation, onClose }: ConversationViewerProps) {
  const t = useTranslations('dashboard');
  const [messages, setMessages] = useState<SavedMessage[] | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversation.id}`)
      .then((r) => r.json() as Promise<{ messages: SavedMessage[] }>)
      .then(({ messages: msgs }) => setMessages(msgs))
      .catch(() => setMessages([]));
  }, [conversation.id]);

  const date = new Date(conversation.createdAt).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[80dvh] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div>
            <p className="text-sm font-medium">
              {conversation.title ?? `${t('conversationAt')} ${date}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={t('closeViewer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto flex-1 px-4 py-5 space-y-4">
          {messages === null ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">{t('noConversations')}</p>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={{ id: msg.id, role: msg.role, content: msg.content }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
