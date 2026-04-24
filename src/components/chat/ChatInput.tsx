'use client';

import { useState, useRef, useEffect, useId, type KeyboardEvent } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onNewConversation?: () => void;
  hasMessages?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled, onNewConversation, hasMessages }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const t = useTranslations('chat');

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

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
    <div>
      {onNewConversation && hasMessages && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onNewConversation}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3" />
            {t('newConversation')}
          </button>
        </div>
      )}
      <label htmlFor={inputId} className="sr-only">{t('placeholder')}</label>
      <div className="flex gap-2 items-end px-3 py-3 rounded-2xl border border-border/60 bg-background/80 backdrop-blur-md shadow-lg">
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          disabled={isLoading || disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[36px] max-h-[160px] overflow-y-auto"
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isLoading || disabled}
          className="bg-mg-primary hover:bg-mg-primary/90 text-mg-primary-foreground h-10 w-10 p-0 rounded-xl shrink-0"
          aria-label={t('send')}
        >
          {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
