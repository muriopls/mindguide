'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Settings, LogOut } from 'lucide-react';

interface UserMenuProps {
  displayName: string;
}

export function UserMenu({ displayName }: UserMenuProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? 'de';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      <a
        href={`/${locale}/settings`}
        aria-label={t('settings')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Settings size={16} aria-hidden />
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
      </a>
      <button
        onClick={handleLogout}
        aria-label={t('logout')}
        className="flex items-center px-2 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-mg-error hover:bg-mg-error/10 transition-colors"
      >
        <LogOut size={16} aria-hidden />
        <span className="sr-only">{t('logout')}</span>
      </button>
    </div>
  );
}
