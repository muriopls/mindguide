'use client';

import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AIProvider } from '@/types';

const PROVIDERS: AIProvider[] = ['claude', 'openai'];

interface ModelSelectorProps {
  provider: AIProvider;
  onChange: (p: AIProvider) => void;
}

export function ModelSelector({ provider, onChange }: ModelSelectorProps) {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = provider === 'claude' ? t('providerClaude') : t('providerOpenAI');
  const others = PROVIDERS.filter((p) => p !== provider);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-muted-foreground/60">{t('providerLabel')}:</span>
        <span className="font-medium text-foreground">{label}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 py-1 rounded-xl border border-border/60 bg-background/95 backdrop-blur-md shadow-lg min-w-[120px] z-10">
          {others.map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors rounded-lg"
            >
              {p === 'claude' ? t('providerClaude') : t('providerOpenAI')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
