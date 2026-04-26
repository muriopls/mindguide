'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Check, X as XIcon } from 'lucide-react';
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

  const inputClass = "w-full px-3 py-2 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-3">
      <p className="text-sm font-medium">{t('addChild')}</p>
      <div className="space-y-1">
        <label htmlFor="child-name" className="text-xs text-muted-foreground">{t('childName')}</label>
        <input
          id="child-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('childNamePlaceholder')}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="child-email" className="text-xs text-muted-foreground">{t('childEmail')}</label>
        <input
          id="child-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('childEmailPlaceholder')}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="child-password" className="text-xs text-muted-foreground">{t('childPassword')}</label>
        <input
          id="child-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('childPasswordPlaceholder')}
          minLength={8}
          className={inputClass}
        />
      </div>
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

interface ChildRowProps {
  child: ChildAccount;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  isDeleting: boolean;
}

function ChildRow({ child, onDelete, onRename, isDeleting }: ChildRowProps) {
  const t = useTranslations('settings');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(child.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setValue(child.displayName ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => setEditing(false);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === child.displayName) { setEditing(false); return; }
    setSaving(true);
    try {
      await onRename(child.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void save(); if (e.key === 'Escape') cancelEdit(); }}
            className="w-full text-sm font-medium bg-transparent border-b border-mg-primary/60 focus:outline-none pb-0.5"
          />
        ) : (
          <p className="text-sm font-medium truncate">{child.displayName ?? child.email}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{child.email}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="p-1.5 rounded-lg text-mg-success hover:bg-mg-success/10 transition-colors"
              aria-label={t('saveChildName')}
            >
              {saving ? <LoadingSpinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/5 transition-colors"
              aria-label={t('common.cancel') as string}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label={t('editChildName')}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting || editing}
          className="rounded-xl text-mg-error border-mg-error/40 hover:bg-mg-error/10"
          onClick={() => void onDelete(child.id)}
        >
          {isDeleting ? <LoadingSpinner size="sm" /> : t('deleteChild')}
        </Button>
      </div>
    </div>
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

  const handleRenameChild = async (childId: string, displayName: string) => {
    try {
      const res = await fetch(`/api/family/children/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error();
      setChildren((prev) =>
        prev.map((c) => (c.id === childId ? { ...c, displayName } : c)),
      );
      show(t('childNameSaved'), 'success');
    } catch {
      show(t('childNameError'), 'error');
      throw new Error(); // re-throw so ChildRow resets saving state
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
                <ChildRow
                  key={child.id}
                  child={child}
                  onDelete={handleDeleteChild}
                  onRename={handleRenameChild}
                  isDeleting={deletingChildId === child.id}
                />
              ))}
            </div>
          )}

          <AddChildForm onAdd={handleAddChild} isBusy={isAddingChild} />
        </section>
      )}
    </div>
  );
}
