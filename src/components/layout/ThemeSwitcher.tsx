'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('common');
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('lightMode') : t('darkMode')}
      className="[&_svg]:w-5 [&_svg]:h-5"
      style={{ color: 'var(--logo-color-a)' }}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
