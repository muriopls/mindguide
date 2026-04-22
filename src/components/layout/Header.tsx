import { Sparkles } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold text-lg text-mg-primary tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-mg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-mg-primary-foreground" />
          </div>
          MindGuide
        </a>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
