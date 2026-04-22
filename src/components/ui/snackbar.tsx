'use client';

import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { SnackbarVariant } from '@/types';

const variantStyles: Record<SnackbarVariant, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-mg-success text-mg-success-foreground',
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  },
  error: {
    bg: 'bg-mg-error text-mg-error-foreground',
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
  },
  warning: {
    bg: 'bg-mg-warning text-mg-warning-foreground',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
  },
  info: {
    bg: 'bg-mg-info text-mg-info-foreground',
    icon: <Info className="w-4 h-4 shrink-0" />,
  },
};

interface SnackbarProps {
  message: string;
  variant: SnackbarVariant;
  onDismiss: () => void;
}

export function Snackbar({ message, variant, onDismiss }: SnackbarProps) {
  const { bg, icon } = variantStyles[variant];
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right-4 fade-in duration-200 ${bg}`}
    >
      {icon}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} aria-label="Schließen" className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
