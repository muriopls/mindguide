'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConversationViewer } from '@/components/dashboard/ConversationViewer';
import type { ConversationSummary } from '@/types';

export function ConversationSidebar() {
  const t = useTranslations('chat');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selected, setSelected] = useState<ConversationSummary | null>(null);

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json() as Promise<{ conversations: ConversationSummary[] }>)
      .then(({ conversations: convs }) => setConversations(convs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const list = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('historyTitle')}
        </p>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('historyClose')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center px-4 py-8">
            {t('historyEmpty')}
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelected(conv); setMobileOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-foreground/5 transition-colors group"
            >
              <p className="text-xs font-medium truncate text-foreground/80 group-hover:text-foreground transition-colors">
                {conv.title ?? `${t('historyConversationAt')} ${new Date(conv.createdAt).toLocaleDateString()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(conv.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                {' · '}
                {conv.messageCount} {t('historyMessages')}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-background border-r border-border/60 shadow-2xl flex flex-col">
            {list}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 border-r border-border/40 bg-background/40 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-hidden">
        {list}
      </aside>

      {selected && (
        <ConversationViewer
          conversation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
