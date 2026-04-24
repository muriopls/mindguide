'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message.includes('Invalid') ? t('errorInvalidCredentials') : t('errorGeneric'));
          return;
        }
        router.push(`/${locale}`);
        router.refresh();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (err) {
          setError(err.message.includes('already') ? t('errorEmailTaken') : t('errorGeneric'));
          return;
        }
        router.push(`/${locale}`);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary/40 transition-shadow';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image src="/icon.png" alt="" width={56} height={56} className="rounded-2xl" />
          <div>
            <h1 className="text-center font-semibold text-xl">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))' }}
              >
                MindGuide
              </span>
            </h1>
            <p className="text-center text-muted-foreground text-sm mt-1">
              {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">{t('displayName')}</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                required
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">{t('password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-mg-error bg-mg-error/8 border border-mg-error/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-mg-primary hover:bg-mg-primary/90 text-mg-primary-foreground rounded-xl h-11"
          >
            {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : (
              mode === 'login' ? t('loginButton') : t('registerButton')
            )}
          </Button>
        </form>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <a
            href={`/${locale}/auth/${mode === 'login' ? 'register' : 'login'}`}
            className="text-mg-primary hover:underline"
          >
            {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
          </a>
        </p>
      </div>
    </div>
  );
}
