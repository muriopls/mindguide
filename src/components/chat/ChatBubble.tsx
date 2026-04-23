import Image from 'next/image';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ChatErrorCode } from '@/types';

interface BubbleMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  errorCode?: ChatErrorCode;
}

interface ChatBubbleProps {
  message: BubbleMessage;
  onRetry?: () => void;
}

export function ChatBubble({ message, onRetry }: ChatBubbleProps) {
  const t = useTranslations('chat');
  const isUser = message.role === 'user';

  const errorText: Record<ChatErrorCode, string> = {
    no_key: t('errorNoKey'),
    auth: t('errorAuth'),
    rate_limit: t('errorRateLimit'),
    network: t('errorNetwork'),
    generic: t('errorGeneric'),
  };

  if (message.error) {
    return (
      <div className="flex gap-2.5 max-w-[85%] mr-auto">
        <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 overflow-hidden">
          <Image src="/icon.png" alt="" width={28} height={28} />
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed backdrop-blur-xl border border-mg-error/30 bg-mg-error/8 dark:bg-mg-error/12 text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-mg-error shrink-0 mt-0.5" />
            <span>{errorText[message.errorCode ?? 'generic']}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2.5 flex items-center gap-1.5 text-xs text-mg-error/80 hover:text-mg-error transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2.5 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-mg-primary text-mg-primary-foreground text-xs font-semibold'
            : 'overflow-hidden',
        )}
      >
        {isUser ? 'Du' : <Image src="/icon.png" alt="" width={28} height={28} />}
      </div>
      <div
        className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-xl',
          isUser
            ? 'bg-mg-primary/60 text-mg-primary-foreground border border-mg-primary/30 rounded-tr-sm shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.25)]'
            : 'bg-white/45 dark:bg-white/8 border border-white/70 dark:border-white/12 text-foreground rounded-tl-sm shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.07)]',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
