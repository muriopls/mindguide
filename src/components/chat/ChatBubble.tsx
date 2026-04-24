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
    server_error: t('errorServerError'),
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
            ? 'bg-foreground/80 text-background text-xs font-semibold'
            : 'overflow-hidden',
        )}
      >
        {isUser ? 'Du' : <Image src="/icon.png" alt="" width={28} height={28} />}
      </div>
      <div
        className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-xl',
          isUser
            ? 'bg-foreground/8 dark:bg-foreground/10 text-foreground border border-foreground/12 dark:border-foreground/15 rounded-tr-sm shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'bg-mg-primary/7 dark:bg-mg-primary/12 border border-mg-primary/18 dark:border-mg-primary/22 text-foreground rounded-tl-sm shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
