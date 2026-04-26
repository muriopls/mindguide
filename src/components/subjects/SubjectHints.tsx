'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SubjectHintsProps {
  slug: string;
  hasConversations: boolean;
}

export function SubjectHints({ slug, hasConversations }: SubjectHintsProps) {
  const t = useTranslations('subjects');
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasConversations) return;
    setLoading(true);
    fetch(`/api/student/subjects/${slug}/hints`)
      .then((r) => r.json() as Promise<{ hints: string[] }>)
      .then(({ hints: h }) => setHints(h ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, hasConversations]);

  return (
    <section className="rounded-2xl border border-border/60 bg-background/60 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-mg-secondary shrink-0" />
        <h2 className="text-sm font-medium">{t('hints')}</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span>{t('hintsLoading')}</span>
        </div>
      ) : !hasConversations || hints.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('hintsEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {hints.map((hint, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-mg-secondary mt-0.5 shrink-0">→</span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Placeholder for future: materials & example tests */}
      <div className="pt-2 border-t border-border/40 flex gap-4">
        <span className="text-xs text-muted-foreground/50 italic">Lernmaterialien — demnächst</span>
        <span className="text-xs text-muted-foreground/50 italic">Übungstests — demnächst</span>
      </div>
    </section>
  );
}
