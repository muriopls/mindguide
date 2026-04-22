import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
          isUser ? 'bg-mg-primary text-mg-primary-foreground' : 'bg-mg-secondary text-mg-secondary-foreground',
        )}
      >
        {isUser ? 'Du' : '🧠'}
      </div>
      <div
        className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-mg-primary text-mg-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
