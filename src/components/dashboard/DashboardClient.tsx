'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConversationViewer } from './ConversationViewer';
import { FlagRow } from './FlagRow';
import type { ChildAccount, ConversationSummary, MisuseFlag, UsageStat } from '@/types';

interface DashboardClientProps {
  initialChildren: ChildAccount[];
}

type Period = 'day' | 'week' | 'month' | 'custom';

interface DateRange { from: string; to: string }

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardClient({ initialChildren }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [children] = useState<ChildAccount[]>(initialChildren);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialChildren[0]?.id ?? null,
  );
  const [period, setPeriod] = useState<Period>('week');
  const [dateRange, setDateRange] = useState<DateRange>({ from: today(), to: today() });
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [flags, setFlags] = useState<MisuseFlag[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [openConversation, setOpenConversation] = useState<ConversationSummary | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingFlags, setIsLoadingFlags] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [flagsExpanded, setFlagsExpanded] = useState(false);

  const buildStatsUrl = useCallback((childId: string, p: Period, range: DateRange) => {
    if (p === 'custom') {
      return `/api/dashboard/stats?childId=${childId}&period=custom&from=${range.from}&to=${range.to}`;
    }
    return `/api/dashboard/stats?childId=${childId}&period=${p}`;
  }, []);

  const fetchStats = useCallback(async (childId: string, p: Period, range: DateRange) => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(buildStatsUrl(childId, p, range));
      const data = await res.json() as { stats: UsageStat[] };
      setStats(data.stats ?? []);
    } finally {
      setIsLoadingStats(false);
    }
  }, [buildStatsUrl]);

  const fetchFlagsAndConvs = useCallback(async (childId: string) => {
    setIsLoadingFlags(true);
    setIsLoadingConvs(true);
    try {
      const [flagsRes, convRes] = await Promise.all([
        fetch('/api/dashboard/flags'),
        fetch(`/api/conversations?childId=${childId}`),
      ]);
      const [flagsData, convData] = await Promise.all([
        flagsRes.json() as Promise<{ flags: MisuseFlag[] }>,
        convRes.json() as Promise<{ conversations: ConversationSummary[] }>,
      ]);
      setFlags((flagsData.flags ?? []).filter((f: MisuseFlag) => f.childId === childId));
      setConversations(convData.conversations ?? []);
    } finally {
      setIsLoadingFlags(false);
      setIsLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchStats(selectedChildId, period, dateRange);
    }
  }, [selectedChildId, period, dateRange, fetchStats]);

  useEffect(() => {
    if (selectedChildId) {
      fetchFlagsAndConvs(selectedChildId);
    }
  }, [selectedChildId, fetchFlagsAndConvs]);

  const handleMarkReviewed = async (flagId: string) => {
    await fetch(`/api/dashboard/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed: true }),
    });
    setFlags((prev) => prev.map((f) => f.id === flagId ? { ...f, reviewed: true } : f));
  };

  const maxCount = Math.max(...stats.map((s) => s.conversationCount), 1);
  const periods: Exclude<Period, 'custom'>[] = ['day', 'week', 'month'];
  const periodLabel: Record<Exclude<Period, 'custom'>, string> = {
    day: t('periodDay'),
    week: t('periodWeek'),
    month: t('periodMonth'),
  };

  // Flag severity counts
  const highCount = flags.filter((f) => f.severity === 'high').length;
  const mediumCount = flags.filter((f) => f.severity === 'medium').length;
  const lowCount = flags.filter((f) => f.severity === 'low').length;
  const totalFlags = flags.length;

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="text-muted-foreground text-sm max-w-sm">{t('noChildren')}</p>
        <Link href={`/${locale}/settings`} className="text-sm text-mg-primary hover:underline">
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

      {/* Usage stats */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-medium">{t('usageTitle')}</h2>
          <div className="flex gap-1 flex-wrap">
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
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                period === 'custom'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('periodCustom')}
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-muted-foreground">{t('periodFrom')}</label>
            <input
              type="date"
              value={dateRange.from}
              max={dateRange.to}
              onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
              className="text-xs rounded-lg border border-border/60 bg-background px-2 py-1"
            />
            <label className="text-xs text-muted-foreground">{t('periodTo')}</label>
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from}
              max={today()}
              onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
              className="text-xs rounded-lg border border-border/60 bg-background px-2 py-1"
            />
          </div>
        )}

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

      {/* Misuse flags + conversations — spinner placeholder while stats load */}
      {isLoadingStats ? (
        <div className="flex justify-center py-16 min-h-[20rem]">
          <LoadingSpinner size="md" />
        </div>
      ) : (<>

      {/* Misuse flags */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">{t('flagsTitle')}</h2>
          {isLoadingFlags ? (
            <LoadingSpinner size="sm" />
          ) : totalFlags > 0 ? (
            <button
              onClick={() => setFlagsExpanded((p) => !p)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {flagsExpanded ? t('hideFlags') : t('showFlags')}
              {flagsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : null}
        </div>

        {!isLoadingFlags && (
          <>
            {totalFlags === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noFlags')}</p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {highCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mg-error">
                    <span className="w-2 h-2 rounded-full bg-mg-error inline-block" />
                    {highCount} {t('flagsHigh')}
                  </span>
                )}
                {mediumCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mg-warning">
                    <span className="w-2 h-2 rounded-full bg-mg-warning inline-block" />
                    {mediumCount} {t('flagsMedium')}
                  </span>
                )}
                {lowCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                    {lowCount} {t('flagsLow')}
                  </span>
                )}
              </div>
            )}
            {flagsExpanded && totalFlags > 0 && (
              <div className="space-y-2 mt-2">
                {flags.map((flag) => (
                  <FlagRow key={flag.id} flag={flag} onMarkReviewed={handleMarkReviewed} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Conversation list */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">{t('conversationsTitle')}</h2>
        {isLoadingConvs ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="sm" />
          </div>
        ) : conversations.length === 0 ? (
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

      </>)}

      {openConversation && (
        <ConversationViewer
          conversation={openConversation}
          onClose={() => setOpenConversation(null)}
        />
      )}
    </div>
  );
}
