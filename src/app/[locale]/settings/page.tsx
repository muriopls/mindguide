'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSnackbar } from '@/hooks/useSnackbar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { AIProvider, AccountType, ChildAccount } from '@/types';

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
          onClick={async () => { await onSave(provider, value); setValue(''); }}
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

interface AddChildFormProps {
  onAdd: (data: { displayName: string; email: string; password: string }) => Promise<void>;
  isBusy: boolean;
}

function AddChildForm({ onAdd, isBusy }: AddChildFormProps) {
  const t = useTranslations('settings');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = name.trim() && email.trim() && password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isBusy) return;
    await onAdd({ displayName: name.trim(), email: email.trim(), password });
    setName(''); setEmail(''); setPassword('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-3">
      <p className="text-sm font-medium">{t('addChild')}</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('childNamePlaceholder')}
        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('childEmailPlaceholder')}
        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('childPasswordPlaceholder')}
        minLength={8}
        className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!canSubmit || isBusy}
        className="rounded-xl bg-mg-primary hover:bg-mg-primary/90 text-mg-primary-foreground"
      >
        {isBusy ? <LoadingSpinner size="sm" className="text-white" /> : t('addChildButton')}
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { show } = useSnackbar();

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [activeKeys, setActiveKeys] = useState<AIProvider[]>([]);
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<AIProvider | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json() as Promise<{ accountType: AccountType }>),
      fetch('/api/keys').then((r) => r.json() as Promise<{ active: AIProvider[] }>),
    ]).then(([profileData, keysData]) => {
      setAccountType(profileData.accountType);
      setActiveKeys(keysData.active);
      if (profileData.accountType === 'parent') {
        return fetch('/api/family/children')
          .then((r) => r.json() as Promise<{ children: ChildAccount[] }>)
          .then(({ children: c }) => setChildren(c));
      }
    }).finally(() => setIsLoading(false));
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

  const handleAddChild = async (data: { displayName: string; email: string; password: string }) => {
    setIsAddingChild(true);
    try {
      const res = await fetch('/api/family/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      // Refresh children list
      const listRes = await fetch('/api/family/children');
      const { children: c } = await listRes.json() as { children: ChildAccount[] };
      setChildren(c);
      setAccountType('parent');
      show(t('childAdded'), 'success');
    } catch {
      show(t('childError'), 'error');
    } finally {
      setIsAddingChild(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    setDeletingChildId(childId);
    try {
      const res = await fetch(`/api/family/children/${childId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      show(t('childDeleted'), 'success');
    } catch {
      show(t('keyError'), 'error');
    } finally {
      setDeletingChildId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {/* API Keys section — hidden for child accounts */}
      {accountType === 'child' ? (
        <section className="rounded-2xl border border-border/60 bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">{t('managedByParent')}</p>
        </section>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-medium">{t('apiKeysSection')}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t('apiKeysDescription')}</p>
          </div>
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
        </section>
      )}

      {/* Family section — shown for parent or standalone accounts */}
      {accountType !== 'child' && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-medium">{t('familySection')}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t('familyDescription')}</p>
          </div>

          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">{t('noChildren')}</p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{child.displayName ?? child.email}</p>
                    <p className="text-xs text-muted-foreground">{child.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deletingChildId === child.id}
                    className="rounded-xl text-mg-error border-mg-error/40 hover:bg-mg-error/10 shrink-0"
                    onClick={() => handleDeleteChild(child.id)}
                  >
                    {deletingChildId === child.id
                      ? <LoadingSpinner size="sm" />
                      : t('deleteChild')}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <AddChildForm onAdd={handleAddChild} isBusy={isAddingChild} />
        </section>
      )}
    </div>
  );
}
