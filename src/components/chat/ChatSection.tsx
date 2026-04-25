'use client';

import { useState } from 'react';
import { ChatWindow } from './ChatWindow';
import { ModelSelector } from './ModelSelector';
import type { AIProvider } from '@/types';

interface ChatSectionProps {
  persist?: boolean;
}

export function ChatSection({ persist = true }: ChatSectionProps) {
  const [provider, setProvider] = useState<AIProvider>('claude');

  return (
    <div className="w-full max-w-4xl flex flex-col gap-2">
      <div
        className="flex flex-col rounded-2xl border border-white/60 dark:border-white/8 bg-white/35 dark:bg-white/[0.04] backdrop-blur-sm shadow-lg shadow-black/5 dark:shadow-black/25"
        style={{ maxHeight: 'calc(100dvh - 9rem)' }}
      >
        <ChatWindow provider={provider} persist={persist} />
      </div>
      <div className="px-1">
        <ModelSelector provider={provider} onChange={setProvider} />
      </div>
    </div>
  );
}
