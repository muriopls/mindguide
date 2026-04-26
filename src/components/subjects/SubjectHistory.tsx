'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ConversationSummary } from '@/types';

interface SubjectHistoryProps {
  slug: string;
}

export function SubjectHistory({ slug }: SubjectHistoryProps) {
  const t = useTranslations('subjects');
  const locale = useLocale();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/conversations?subject=${encodeURIComponent(slug)}&limit=10`)
      .then((r) => r.json() as Promise<{ conversations: ConversationSummary[] }>)
      .then(({ conversations: c }) => setConversations(c ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleResume = (id: string) => {
    window.dispatchEvent(
      new CustomEvent('mindguide:load-conversation', { detail: { id } }),
    );
    // Navigate to the chat page for this subject
    window.location.href = `/${locale}/subjects/${slug}/chat`;
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-background/60 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-mg-primary shrink-0" />
        <h2 className="text-sm font-medium">{t('history')}</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span>{t('historyLoading')}</span>
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {conversations.map((conv) => {
            const date = new Date(conv.createdAt).toLocaleDateString(
              locale === 'en' ? 'en' : 'de',
              { day: 'numeric', month: 'short', year: 'numeric' },
            );
            return (
              <li key={conv.id}>
                <button
                  onClick={() => handleResume(conv.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-left"
                >
                  <span className="text-sm truncate">
                    {conv.title ?? t('historyUntitled')}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{date}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
