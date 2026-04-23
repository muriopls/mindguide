import Image from 'next/image';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <Image src="/icon.png" alt="" width={28} height={28} className="rounded-lg" />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))' }}
          >
            MindGuide
          </span>
        </a>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
