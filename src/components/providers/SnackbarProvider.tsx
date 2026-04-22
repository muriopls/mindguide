'use client';

import { createContext, useCallback, useState, type ReactNode } from 'react';
import type { SnackbarMessage, SnackbarVariant } from '@/types';
import { Snackbar } from '@/components/ui/snackbar';

interface SnackbarContextValue {
  show: (message: string, variant?: SnackbarVariant) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const show = useCallback((message: string, variant: SnackbarVariant = 'info') => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {messages.map((msg) => (
          <Snackbar key={msg.id} message={msg.message} variant={msg.variant} onDismiss={() => dismiss(msg.id)} />
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}
