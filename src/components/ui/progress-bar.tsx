'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  active: boolean;
  className?: string;
}

export function ProgressBar({ active, className }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!active) {
      setWidth(100);
      const t = setTimeout(() => setWidth(0), 400);
      return () => clearTimeout(t);
    }
    setWidth(15);
    const intervals = [
      setTimeout(() => setWidth(40), 500),
      setTimeout(() => setWidth(65), 1500),
      setTimeout(() => setWidth(80), 3000),
      setTimeout(() => setWidth(90), 6000),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [active]);

  if (!active && width === 0) return null;

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50 h-1 bg-transparent', className)}>
      <div
        className="h-full bg-mg-primary transition-all ease-out"
        style={{
          width: `${width}%`,
          transitionDuration: active ? '500ms' : '200ms',
        }}
      />
    </div>
  );
}
