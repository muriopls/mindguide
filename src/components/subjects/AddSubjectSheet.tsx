'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { SUBJECTS } from '@/lib/subjects';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { StudentSubject } from '@/types';

interface AddSubjectSheetProps {
  existing: StudentSubject[];
  onAdd: (slug: string) => Promise<void>;
  onClose: () => void;
}

export function AddSubjectSheet({ existing, onAdd, onClose }: AddSubjectSheetProps) {
  const t = useTranslations('subjects');
  const [adding, setAdding] = useState<string | null>(null);
  const existingSlugs = new Set(existing.map((s) => s.slug));

  const handleAdd = async (slug: string) => {
    setAdding(slug);
    try {
      await onAdd(slug);
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border/60 shadow-2xl p-4 pb-8 max-h-[70dvh] flex flex-col sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md"
        style={{ backgroundColor: 'var(--background)', backgroundImage: 'none' }}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <p className="text-sm font-medium">{t('addTitle')}</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-1.5">
          {SUBJECTS.map((subject) => {
            const isAdded = existingSlugs.has(subject.slug);
            const isLoading = adding === subject.slug;
            return (
              <button
                key={subject.slug}
                onClick={() => !isAdded && !isLoading && void handleAdd(subject.slug)}
                disabled={isAdded || isLoading}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                  isAdded
                    ? 'text-muted-foreground bg-foreground/3 cursor-default'
                    : 'hover:bg-foreground/5 text-foreground'
                }`}
              >
                <span>{t(subject.slug as Parameters<typeof t>[0])}</span>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : isAdded ? (
                  <span className="text-xs text-muted-foreground">{t('alreadyAdded')}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
