'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Trash2, MessageSquare, Clock } from 'lucide-react';
import { getSubjectLabel } from '@/lib/subjects';
import type { StudentSubject } from '@/types';

interface SubjectCardProps {
  subject: StudentSubject;
  locale: string;
  onRemove: (slug: string) => void;
  isRemoving: boolean;
}

export function SubjectCard({ subject, locale, onRemove, isRemoving }: SubjectCardProps) {
  const t = useTranslations('subjects');
  const label = getSubjectLabel(subject.slug as Parameters<typeof getSubjectLabel>[0], locale);
  const hasConversations = subject.conversationCount > 0;

  const lastActive = subject.lastActiveAt
    ? new Date(subject.lastActiveAt).toLocaleDateString(locale === 'en' ? 'en' : 'de', {
        day: 'numeric', month: 'short',
      })
    : null;

  return (
    <a
      href={`/${locale}/subjects/${subject.slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/60 hover:bg-background/80 hover:border-border/80 p-5 transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold group-hover:text-mg-primary transition-colors">
          {label}
        </h2>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hasConversations && !isRemoving) onRemove(subject.slug);
          }}
          disabled={hasConversations || isRemoving}
          title={hasConversations ? t('removeSubjectDisabled') : t('removeSubject')}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            hasConversations
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-mg-error hover:bg-mg-error/10'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {subject.conversationCount} {t('conversations')}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lastActive ? `${t('lastActive')} ${lastActive}` : t('neverActive')}
        </span>
      </div>
    </a>
  );
}
