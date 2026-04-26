'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { SubjectCard } from '@/components/subjects/SubjectCard';
import { AddSubjectSheet } from '@/components/subjects/AddSubjectSheet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSnackbar } from '@/hooks/useSnackbar';
import type { StudentSubject } from '@/types';

export default function SubjectsPage() {
  const t = useTranslations('subjects');
  const locale = useLocale();
  const { show } = useSnackbar();

  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);

  const fetchSubjects = () =>
    fetch('/api/student/subjects')
      .then((r) => r.json() as Promise<{ subjects: StudentSubject[] }>)
      .then(({ subjects: s }) => setSubjects(s ?? []))
      .catch(() => {});

  useEffect(() => {
    fetchSubjects().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (slug: string) => {
    const res = await fetch('/api/student/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) { show(t('addError'), 'error'); return; }
    show(t('added'), 'success');
    await fetchSubjects();
  };

  const handleRemove = async (slug: string) => {
    setRemovingSlug(slug);
    try {
      const res = await fetch(`/api/student/subjects/${slug}`, { method: 'DELETE' });
      if (!res.ok) { show(t('removeError'), 'error'); return; }
      show(t('removed'), 'success');
      setSubjects((prev) => prev.filter((s) => s.slug !== slug));
    } finally {
      setRemovingSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-mg-primary text-mg-primary-foreground hover:bg-mg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('add')}
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">{t('empty')}</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-mg-primary text-mg-primary-foreground hover:bg-mg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('add')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.slug}
              subject={subject}
              locale={locale}
              onRemove={(slug) => void handleRemove(slug)}
              isRemoving={removingSlug === subject.slug}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddSubjectSheet
          existing={subjects}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
