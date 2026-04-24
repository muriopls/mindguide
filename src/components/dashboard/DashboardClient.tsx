'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConversationViewer } from './ConversationViewer';
import { FlagRow } from './FlagRow';
import type { ChildAccount, ConversationSummary, MisuseFlag, UsageStat } from '@/types';

interface DashboardClientProps {
  initialChildren: ChildAccount[];
}

type Period = 'day' | 'week' | 'month';

export function DashboardClient({ initialChildren }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [children] = useState<ChildAccount[]>(initialChildren);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialChildren[0]?.id ?? null,
  );
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [flags, setFlags] = useState<MisuseFlag[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [openConversation, setOpenConversation] = useState<ConversationSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchChildData = useCallback(async (childId: string, p: Period) => {
    setIsLoadingData(true);
    try {
      const [statsRes, flagsRes, convRes] = await Promise.all([
        fetch(`/api/dashboard/stats?childId=${childId}&period=${p}`),
        fetch('/api/dashboard/flags'),
        fetch(`/api/conversations?childId=${childId}`),
      ]);
      const [statsData, flagsData, convData] = await Promise.all([
        statsRes.json() as Promise<{ stats: UsageStat[] }>,
        flagsRes.json() as Promise<{ flags: MisuseFlag[] }>,
        convRes.json() as Promise<{ conversations: ConversationSummary[] }>,
      ]);
      setStats(statsData.stats ?? []);
      setFlags((flagsData.flags ?? []).filter((f: MisuseFlag) => f.childId === childId));
      setConversations(convData.conversations ?? []);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchChildData(selectedChildId, period);
  }, [selectedChildId, period, fetchChildData]);

  const handleMarkReviewed = async (flagId: string) => {
    await fetch(`/api/dashboard/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed: true }),
    });
    setFlags((prev) => prev.map((f) => f.id === flagId ? { ...f, reviewed: true } : f));
  };

  const maxCount = Math.max(...stats.map((s) => s.conversationCount), 1);
  const periods: Period[] = ['day', 'week', 'month'];
  const periodLabel: Record<Period, string> = {
    day: t('periodDay'),
    week: t('periodWeek'),
    month: t('periodMonth'),
  };

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="text-muted-foreground text-sm max-w-sm">{t('noChildren')}</p>
        <Link
          href={`/${locale}/settings`}
          className="text-sm text-mg-primary hover:underline"
        >
          {t('goToSettings')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Child tabs */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedChildId === child.id
                  ? 'bg-mg-primary text-mg-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {child.displayName ?? child.email}
            </button>
          ))}
        </div>
      )}

      {isLoadingData ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <>
          {/* Usage stats */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">{t('usageTitle')}</h2>
              <div className="flex gap-1">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      period === p
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
            </div>

            {stats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
            ) : (
              <div className="space-y-2">
                {stats.map((stat) => (
                  <div key={stat.date} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {new Date(stat.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-mg-primary h-full rounded-full transition-all"
                        style={{ width: `${(stat.conversationCount / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {stat.conversationCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Misuse flags */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">{t('flagsTitle')}</h2>
            {flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noFlags')}</p>
            ) : (
              <div className="space-y-2">
                {flags.map((flag) => (
                  <FlagRow
                    key={flag.id}
                    flag={flag}
                    onMarkReviewed={handleMarkReviewed}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Conversation list */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">{t('conversationsTitle')}</h2>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noConversations')}</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setOpenConversation(conv)}
                    className="w-full text-left rounded-2xl border border-border/60 bg-background/60 px-4 py-3 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {conv.title ?? `${t('conversationAt')} ${new Date(conv.createdAt).toLocaleDateString()}`}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {conv.messageCount} {t('messages')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(conv.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {openConversation && (
        <ConversationViewer
          conversation={openConversation}
          onClose={() => setOpenConversation(null)}
        />
      )}
    </div>
  );
}
