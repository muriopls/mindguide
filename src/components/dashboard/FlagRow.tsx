'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationViewer } from './ConversationViewer';
import type { MisuseFlag, ConversationSummary } from '@/types';

interface FlagRowProps {
  flag: MisuseFlag;
  onMarkReviewed: (id: string) => Promise<void>;
}

const severityStyle: Record<MisuseFlag['severity'], string> = {
  low: 'bg-mg-warning/15 text-mg-warning border-mg-warning/30',
  medium: 'bg-mg-error/12 text-mg-error border-mg-error/30',
  high: 'bg-mg-error/20 text-mg-error border-mg-error/50',
};

export function FlagRow({ flag, onMarkReviewed }: FlagRowProps) {
  const t = useTranslations('dashboard');
  const [expanded, setExpanded] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [viewConversation, setViewConversation] = useState(false);

  const date = new Date(flag.createdAt).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const severityLabel: Record<MisuseFlag['severity'], string> = {
    low: t('severityLow'),
    medium: t('severityMedium'),
    high: t('severityHigh'),
  };

  const handleMarkReviewed = async () => {
    setIsMarking(true);
    try {
      await onMarkReviewed(flag.id);
    } finally {
      setIsMarking(false);
    }
  };

  const mockConversation: ConversationSummary = {
    id: flag.conversationId,
    title: null,
    provider: 'claude',
    locale: 'de',
    createdAt: flag.createdAt,
    endedAt: null,
    messageCount: 0,
    subjectSlug: null,
  };

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-opacity ${flag.reviewed ? 'opacity-50' : ''} ${!flag.reviewed ? 'border-l-4 border-l-mg-error/60' : 'border-border/60'} border-border/60 bg-background/60`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${severityStyle[flag.severity]}`}>
                {severityLabel[flag.severity]}
              </span>
              <span className="text-xs text-muted-foreground">{flag.childName ?? '—'}</span>
              <span className="text-xs text-muted-foreground">{date}</span>
              {flag.reviewed && (
                <span className="text-xs text-muted-foreground">{t('reviewed')}</span>
              )}
            </div>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="mt-2 text-left flex items-start gap-1 w-full group"
            >
              <p className="text-sm text-foreground/80 flex-1 line-clamp-2">{flag.reason}</p>
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                : <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />}
            </button>
            {expanded && (
              <p className="mt-1 text-sm text-foreground/80">{flag.reason}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setViewConversation(true)}
            className="text-xs text-mg-primary hover:underline"
          >
            {t('conversationsTitle')}
          </button>
          {!flag.reviewed && (
            <Button
              size="sm"
              variant="outline"
              disabled={isMarking}
              className="rounded-xl text-xs h-7 px-3 border-border/60 text-muted-foreground hover:text-foreground ml-auto"
              onClick={handleMarkReviewed}
            >
              {t('markReviewed')}
            </Button>
          )}
        </div>
      </div>

      {viewConversation && (
        <ConversationViewer
          conversation={mockConversation}
          onClose={() => setViewConversation(false)}
        />
      )}
    </>
  );
}
