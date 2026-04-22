import { useTranslations } from 'next-intl';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-lg text-mg-primary">
          <span className="text-2xl">🧠</span>
          <span>MindGuide</span>
        </a>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
