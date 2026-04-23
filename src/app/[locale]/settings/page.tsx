'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSnackbar } from '@/hooks/useSnackbar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { AIProvider } from '@/types';

interface KeyRowProps {
  label: string;
  provider: AIProvider;
  isActive: boolean;
  onSave: (provider: AIProvider, key: string) => Promise<void>;
  onDelete: (provider: AIProvider) => Promise<void>;
  isBusy: boolean;
}

function KeyRow({ label, provider, isActive, onSave, onDelete, isBusy }: KeyRowProps) {
  const t = useTranslations('settings');
  const [value, setValue] = useState('');

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isActive
            ? 'bg-mg-success/15 text-mg-success'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isActive ? t('keyActive') : t('keyNotSet')}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('keyPlaceholder')}
          className="flex-1 px-3 py-2 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow"
        />
        <Button
          size="sm"
          disabled={isBusy || !value.trim()}
          className="rounded-xl bg-mg-primary hover:bg-mg-primary/90 text-mg-primary-foreground shrink-0"
          onClick={async () => {
            await onSave(provider, value);
            setValue('');
          }}
        >
          {isBusy ? <LoadingSpinner size="sm" className="text-white" /> : t('saveKey')}
        </Button>
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            className="rounded-xl text-mg-error border-mg-error/40 hover:bg-mg-error/10 shrink-0"
            onClick={() => onDelete(provider)}
          >
            {t('deleteKey')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { show } = useSnackbar();
  const [activeKeys, setActiveKeys] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<AIProvider | null>(null);

  useEffect(() => {
    fetch('/api/keys')
      .then((r) => r.json() as Promise<{ active: AIProvider[] }>)
      .then(({ active }) => setActiveKeys(active))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (provider: AIProvider, key: string) => {
    setBusyProvider(provider);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      if (!res.ok) throw new Error();
      setActiveKeys((prev) => prev.includes(provider) ? prev : [...prev, provider]);
      show(t('keySaved'), 'success');
    } catch {
      show(t('keyError'), 'error');
    } finally {
      setBusyProvider(null);
    }
  };

  const handleDelete = async (provider: AIProvider) => {
    setBusyProvider(provider);
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error();
      setActiveKeys((prev) => prev.filter((p) => p !== provider));
      show(t('keyDeleted'), 'success');
    } catch {
      show(t('keyError'), 'error');
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium">{t('apiKeysSection')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('apiKeysDescription')}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            <KeyRow
              label={t('claudeKey')}
              provider="claude"
              isActive={activeKeys.includes('claude')}
              onSave={handleSave}
              onDelete={handleDelete}
              isBusy={busyProvider === 'claude'}
            />
            <KeyRow
              label={t('openaiKey')}
              provider="openai"
              isActive={activeKeys.includes('openai')}
              onSave={handleSave}
              onDelete={handleDelete}
              isBusy={busyProvider === 'openai'}
            />
          </>
        )}
      </section>
    </div>
  );
}
