'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="relative mt-auto">
      {/* Gradient top border */}
      <div
        className="h-px w-full"
        style={{ backgroundImage: 'linear-gradient(to right, transparent, var(--logo-color-a), var(--logo-color-b), transparent)' }}
      />

      <div className="bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">

            {/* Brand */}
            <div className="flex flex-col gap-3 max-w-[220px]">
              <a href={`/${locale}`} className="flex items-center gap-2">
                <Image src="/icon.png" alt="" width={24} height={24} className="rounded-md" />
                <span
                  className="font-semibold text-sm bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))' }}
                >
                  MindGuide
                </span>
              </a>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('tagline')}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t('legal')}
              </span>
              <nav className="flex flex-col gap-2">
                <a
                  href={`/${locale}/impressum`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  {t('impressum')}
                </a>
                <a
                  href={`/${locale}/datenschutz`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  {t('datenschutz')}
                </a>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-5 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground/60">{t('copyright')}</p>
            <p className="text-xs text-muted-foreground/60">{t('madeWith')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
