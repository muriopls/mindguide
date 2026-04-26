'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';

interface DesktopUserMenuProps {
  displayName: string;
  isChild?: boolean;
}

export function DesktopUserMenu({ displayName, isChild = false }: DesktopUserMenuProps) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const localeParam = (params.locale as string) ?? 'de';
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${localeParam}/auth/login`);
    router.refresh();
  };

  const toggleLocale = () => {
    const next = locale === 'de' ? 'en' : 'de';
    router.push(pathname.replace(`/${locale}`, `/${next}`));
  };

  return (
    <div className="relative group">
      {/* Trigger — avatar circle */}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
        style={{ background: 'linear-gradient(135deg, var(--logo-color-a), var(--logo-color-b))' }}
        aria-label={displayName}
      >
        {displayName[0]?.toUpperCase() ?? '?'}
      </button>

      {/* Outer wrapper starts at top-full (no gap) — pt-2 creates the visual gap while
          keeping hover continuous across the full panel width */}
      <div className="absolute right-0 top-full pt-2 w-52 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 z-50">
      <div
        className="translate-y-1 group-hover:translate-y-0 transition-transform duration-150 rounded-2xl border border-border/60 shadow-xl shadow-black/10 dark:shadow-black/30 p-1.5"
        style={{ backgroundColor: 'var(--background)', backgroundImage: 'none' }}
      >
        <div className="px-3 py-2 mb-1 border-b border-border/40">
          <p className="text-xs font-medium truncate text-foreground">{displayName}</p>
        </div>

        <button
          onClick={toggleLocale}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <span className="w-4 text-center text-xs font-bold shrink-0">
            {locale === 'de' ? 'EN' : 'DE'}
          </span>
          {locale === 'de' ? 'English' : 'Deutsch'}
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          {isDark
            ? <Sun className="w-4 h-4 shrink-0" />
            : <Moon className="w-4 h-4 shrink-0" />}
          {isDark ? tCommon('lightMode') : tCommon('darkMode')}
        </button>

        {!isChild && (
          <a
            href={`/${localeParam}/settings`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {tNav('settings')}
          </a>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-mg-error hover:bg-mg-error/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {tNav('logout')}
        </button>
      </div>
      </div>
    </div>
  );
}
