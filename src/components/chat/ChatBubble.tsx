import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2.5 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-mg-primary text-mg-primary-foreground text-xs font-semibold'
            : 'bg-mg-primary/10 text-mg-primary border border-mg-primary/20',
        )}
      >
        {isUser ? 'Du' : <Sparkles className="w-3.5 h-3.5" />}
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
