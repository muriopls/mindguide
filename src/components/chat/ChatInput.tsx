'use client';

import { useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const t = useTranslations('chat');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end p-4 border-t border-border bg-background">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('placeholder')}
        disabled={isLoading || disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mg-primary disabled:opacity-50 min-h-[48px] max-h-[160px]"
        style={{ overflowY: 'auto' }}
      />
      <Button
        onClick={handleSend}
        disabled={!value.trim() || isLoading || disabled}
        className="bg-mg-primary hover:bg-mg-primary/90 text-mg-primary-foreground h-12 w-12 p-0 rounded-xl shrink-0"
        aria-label={t('send')}
      >
        {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}
